// "Email me the moment we go live." Opt-in and separate from the weekly
// digest — nobody gets four emails a week they didn't ask for.
//
// Subscribers live in a PRIVATE Vercel Blob store (one small JSON file per
// address under live-alerts/subscribers/), not a Resend audience: the
// church's Resend plan allows three audiences and all three are in use.
// Sending is triggered by .github/workflows/live-alerts.yml, which polls
// /api/live every 5 minutes around service times and calls
// /api/live-alerts/send once per stream (Vercel's Hobby cron can only run
// daily, so the poll lives in GitHub Actions). Emails go out individually
// with the sending-only Resend key.
import "server-only";
import crypto from "node:crypto";
import { Resend } from "resend";
import { del, get, list, put } from "@vercel/blob";
import type { SubscribeResult } from "@/lib/mailing-list";

const PREFIX = "live-alerts/subscribers/";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

const normalize = (email: string) => email.toLowerCase().trim();
// Filenames are a hash of the address, not the address itself: addresses
// contain "@" (and sometimes "+"), which gets percent-encoded in a pathname
// and then double-encoded on lookup, so get/del by pathname silently missed.
// Hex is safe everywhere; the address lives inside the JSON body.
const pathFor = (email: string) =>
  `${PREFIX}${crypto.createHash("sha256").update(normalize(email)).digest("hex")}.json`;

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.LIVE_ALERT_SECRET);
}

/** Signed per-address token so an unsubscribe link can't be forged for someone else. */
export function unsubscribeToken(email: string): string | null {
  const s = process.env.LIVE_ALERT_SECRET;
  if (!s) return null;
  return crypto.createHmac("sha256", s).update(normalize(email)).digest("hex").slice(0, 32);
}

export async function addLiveAlertSubscriber(email: string): Promise<SubscribeResult> {
  if (!configured()) return { ok: false, detail: "Alerts aren't open quite yet — check back soon." };
  try {
    await put(pathFor(email), JSON.stringify({ email: normalize(email), since: new Date().toISOString() }), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true, // re-subscribing is idempotent
      contentType: "application/json",
    });
    return { ok: true, detail: "You're set — we'll email you the moment a service goes live." };
  } catch (err) {
    console.warn("[live-alerts] subscribe failed:", err instanceof Error ? err.message : err);
    return { ok: false, detail: "Something went wrong — try again in a minute." };
  }
}

/** Every subscriber's address (one small private read per record — the
 *  list is dozens, not thousands, and this runs a few times a week). */
export async function listLiveAlertSubscribers(): Promise<string[]> {
  const emails: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      try {
        const res = await get(b.url, { access: "private" });
        if (!res) continue;
        const { email } = JSON.parse(await new Response(res.stream).text()) as { email?: string };
        if (email) emails.push(email);
      } catch {
        /* skip anything unreadable */
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return emails;
}

export async function unsubscribeLiveAlerts(email: string, token: string): Promise<boolean> {
  const expected = unsubscribeToken(email);
  if (!expected || token.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return false;
  try {
    // Locate by prefix listing (never a pathname lookup), delete by URL.
    const { blobs } = await list({ prefix: pathFor(email), limit: 5 });
    if (blobs.length > 0) await del(blobs.map((b) => b.url));
    return true; // already gone counts as unsubscribed
  } catch (err) {
    console.warn("[live-alerts] unsubscribe failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Email everyone on the list that a stream just started. */
export async function sendLiveAlert(videoId: string | null, label: string): Promise<{ sent: number; detail: string }> {
  const sendKey = process.env.RESEND_API_KEY;
  if (!sendKey) return { sent: 0, detail: "RESEND_API_KEY not set" };
  if (!configured()) return { sent: 0, detail: "live alerts not configured" };
  const contacts = await listLiveAlertSubscribers();
  if (contacts.length === 0) return { sent: 0, detail: "no subscribers" };

  const watchUrl = `${SITE_URL}/live`;
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `${SITE_URL}/live`;
  const resend = new Resend(sendKey);
  let sent = 0;
  // Resend's batch endpoint takes up to 100 messages per call.
  for (let i = 0; i < contacts.length; i += 100) {
    const batch = contacts.slice(i, i + 100).map((email) => {
      const unsub = `${SITE_URL}/api/live-alerts/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
      return {
        from: "Faith Baptist Church <alerts@fbcchelsea.org>",
        to: [email],
        subject: `We're live now — ${label}`,
        text:
          `${label} just started streaming.\n\nWatch here: ${watchUrl}\nOr on YouTube: ${ytUrl}\n\n` +
          `You asked for an email whenever we go live. To stop these: ${unsub}`,
        html:
          `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#0f172a;"><strong>${label}</strong> just started streaming.</p>` +
          `<p style="margin:20px 0;"><a href="${watchUrl}" style="display:inline-block;padding:12px 24px;background:#007db0;color:#fff;font-family:Arial,Helvetica,sans-serif;font-weight:bold;text-decoration:none;border-radius:8px;">Watch live</a></p>` +
          `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#475569;">Or on YouTube: <a href="${ytUrl}">${ytUrl}</a></p>` +
          `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;margin-top:28px;">You asked for an email whenever we go live. <a href="${unsub}" style="color:#94a3b8;">Stop these emails</a>.</p>`,
      };
    });
    const { error } = await resend.batch.send(batch);
    if (error) {
      console.warn("[live-alerts] batch send failed:", error.message);
      continue;
    }
    sent += batch.length;
  }
  return { sent, detail: `emailed ${sent} of ${contacts.length} subscribers` };
}
