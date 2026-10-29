// "Email me the moment we go live." Opt-in and separate from the weekly
// digest — nobody gets four emails a week they didn't ask for.
//
// Subscribers live in a PRIVATE Vercel Blob store (one small JSON file per
// address under live-alerts/subscribers/), not a Resend audience: the
// church's Resend plan allows three audiences and all three are in use.
// Sending is triggered by a Vercel cron that calls /api/live-alerts/send
// every minute (vercel.json). That route confirms a stream is genuinely
// live and recently started, and the sent-marker below guarantees one
// email per stream no matter how many times the cron fires. (This used to
// be a GitHub Actions poll; GitHub ran it hours late, so services came
// and went with no email.) Emails go out with the sending-only Resend key.
import "server-only";
import crypto from "node:crypto";
import { Resend } from "resend";
import { del, get, list, put } from "@vercel/blob";
import site from "@/content/site.json";
import type { SubscribeResult } from "@/lib/mailing-list";
import { recordEvent } from "@/lib/metrics";

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
    recordEvent("subscribe.live");
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
const SENT_PREFIX = "live-alerts/sent/";

/** Has an alert already gone out for this stream? One email per videoId. */
export async function alertAlreadySent(videoId: string): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  const { blobs } = await list({ prefix: `${SENT_PREFIX}${videoId}.json`, limit: 1 });
  return blobs.length > 0;
}

export async function markAlertSent(videoId: string, detail: Record<string, unknown>): Promise<void> {
  await put(`${SENT_PREFIX}${videoId}.json`, JSON.stringify({ videoId, at: new Date().toISOString(), ...detail }), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The alert email, in the same branded layout as the weekly digest and the
 *  visitor welcome email: navy logo header, one clear headline, one button,
 *  and a footer that says who we are and why the reader got it. */
export function liveAlertEmail(label: string, videoId: string | null, unsub: string): { subject: string; text: string; html: string } {
  const watchUrl = `${SITE_URL}/live`;
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  const when = new Date().toLocaleString("en-US", {
    timeZone: "America/Detroit",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const address = `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`;

  const text =
    `Faith Baptist Church of Chelsea is live now.\n\n` +
    `${label}\n${when}\n\n` +
    `Watch on our website: ${watchUrl}\n` +
    (ytUrl ? `Watch on YouTube: ${ytUrl}\n` : "") +
    `\n` +
    `Faith Baptist Church of Chelsea · ${address} · ${site.phone}\n` +
    `You're receiving this because you signed up for live-stream alerts at fbcchelsea.org. ` +
    `To stop them: ${unsub}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:24px 8px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0f172a;padding:28px 24px;" align="center">
    <img src="${SITE_URL}/images/logo-horizontal-light.png" width="280" alt="Faith Baptist Church of Chelsea" style="display:block;max-width:280px;height:auto;" />
  </td></tr>
  <tr><td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;" align="center">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b91c1c;font-weight:bold;">&#9679; Live now</p>
    <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;color:#0f172a;">${esc(label)}</h1>
    <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#475569;">${esc(when)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 0;"><tr><td style="border-radius:10px;background:#0093ce;" align="center">
      <a href="${watchUrl}" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Watch the live stream</a>
    </td></tr></table>
    ${ytUrl ? `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Prefer YouTube? <a href="${ytUrl}" style="color:#006389;">Watch there instead</a>.</p>` : ""}
  </td></tr>
  <tr><td style="padding:28px 28px 24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;"><tr><td style="padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#334155;">
      <strong style="color:#0f172a;">Regular service times</strong><br/>
      ${site.services.map((sv) => `${esc(sv.day)} ${esc(sv.time)} — ${esc(sv.name)}`).join("<br/>")}
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;" align="center">
      Faith Baptist Church of Chelsea · ${esc(address)} · ${esc(site.phone)}<br/>
      You&rsquo;re receiving this because you signed up for live-stream alerts at fbcchelsea.org.
      <a href="${unsub}" style="color:#94a3b8;">Unsubscribe</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;

  return { subject: `Faith Baptist is live now: ${label}`, text, html };
}

/** Sends one sample alert to one address — for checking the design. */
export async function sendLiveAlertTest(email: string): Promise<{ sent: number; detail: string }> {
  const sendKey = process.env.RESEND_API_KEY;
  if (!sendKey) return { sent: 0, detail: "RESEND_API_KEY not set" };
  const unsub = `${SITE_URL}/api/live-alerts/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
  const msg = liveAlertEmail("Sunday Morning Service (test)", null, unsub);
  const { error } = await new Resend(sendKey).emails.send({
    from: "Faith Baptist Church of Chelsea <alerts@fbcchelsea.org>",
    to: [email],
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
    headers: { "List-Unsubscribe": `<${unsub}>` },
  });
  return error ? { sent: 0, detail: error.message } : { sent: 1, detail: `test alert sent to ${email}` };
}

export async function sendLiveAlert(videoId: string | null, label: string): Promise<{ sent: number; detail: string }> {
  const sendKey = process.env.RESEND_API_KEY;
  if (!sendKey) return { sent: 0, detail: "RESEND_API_KEY not set" };
  if (!configured()) return { sent: 0, detail: "live alerts not configured" };
  const contacts = await listLiveAlertSubscribers();
  if (contacts.length === 0) return { sent: 0, detail: "no subscribers" };

  const resend = new Resend(sendKey);
  let sent = 0;
  // Resend's batch endpoint takes up to 100 messages per call.
  for (let i = 0; i < contacts.length; i += 100) {
    const batch = contacts.slice(i, i + 100).map((email) => {
      const unsub = `${SITE_URL}/api/live-alerts/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
      const msg = liveAlertEmail(label, videoId, unsub);
      return {
        from: "Faith Baptist Church of Chelsea <alerts@fbcchelsea.org>",
        to: [email],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        headers: { "List-Unsubscribe": `<${unsub}>` },
      };
    });
    const { error } = await resend.batch.send(batch);
    if (error) {
      console.warn("[live-alerts] batch send failed:", error.message);
      continue;
    }
    sent += batch.length;
  }
  if (sent > 0) recordEvent("livealert.sent", { sent, label, videoId });
  return { sent, detail: `emailed ${sent} of ${contacts.length} subscribers` };
}
