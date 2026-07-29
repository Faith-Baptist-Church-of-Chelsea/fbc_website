// "This Week at Faith" mailing list, backed by a Resend Audience.
//
// Requires RESEND_FULL_API_KEY (a full-access key — the regular
// RESEND_API_KEY is sending-only and cannot manage contacts). Everything
// here fails soft until that key exists.
//
// Congregation-wide sending additionally waits on (1) the fbcchelsea.org
// domain being verified in Resend and (2) a plan that allows ~265
// contacts in one send (free tier caps at 100 emails/day). Flip it on by
// setting DIGEST_BROADCAST=1 — until then the Monday cron only sends the
// staff copy.
import "server-only";

const AUDIENCE_NAME = "This Week at Faith";

function fullKey(): string | null {
  return process.env.RESEND_FULL_API_KEY ?? null;
}

async function resend(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${fullKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}

/** Find-or-create the digest audience. Returns its id, or null without a key. */
export async function ensureAudience(): Promise<string | null> {
  if (!fullKey()) return null;
  const list = await resend("/audiences");
  if (list.ok) {
    const json = (await list.json()) as { data?: { id: string; name: string }[] };
    const existing = json.data?.find((a) => a.name === AUDIENCE_NAME);
    if (existing) return existing.id;
  }
  const created = await resend("/audiences", {
    method: "POST",
    body: JSON.stringify({ name: AUDIENCE_NAME }),
  });
  if (!created.ok) {
    console.warn(`[mailing-list] audience create failed: HTTP ${created.status}`);
    return null;
  }
  return ((await created.json()) as { id: string }).id;
}

export type SubscribeResult = { ok: boolean; detail: string };

/** Add one contact to the digest audience (idempotent for repeat emails). */
export async function addSubscriber(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<SubscribeResult> {
  if (!fullKey()) {
    return { ok: false, detail: "Signups aren't open quite yet — check back soon." };
  }
  const audienceId = await ensureAudience();
  if (!audienceId) return { ok: false, detail: "Signups aren't open quite yet — check back soon." };
  const res = await resend(`/audiences/${audienceId}/contacts`, {
    method: "POST",
    body: JSON.stringify({
      email,
      first_name: firstName ?? "",
      last_name: lastName ?? "",
      unsubscribed: false,
    }),
  });
  if (!res.ok) {
    console.warn(`[mailing-list] contact create failed: HTTP ${res.status}`);
    return { ok: false, detail: "Something went wrong — try again in a minute." };
  }
  return { ok: true, detail: "You're on the list! See you Monday morning." };
}

/**
 * Send the digest to the whole audience as a Resend Broadcast (which adds
 * per-recipient one-click unsubscribe handling). Only runs when
 * DIGEST_BROADCAST=1 — see the header comment for what must be true first.
 */
export async function sendDigestBroadcast(
  subject: string,
  html: string
): Promise<{ sent: boolean; detail: string }> {
  if (process.env.DIGEST_BROADCAST !== "1") {
    return { sent: false, detail: "broadcast disabled (DIGEST_BROADCAST unset)" };
  }
  if (!fullKey()) return { sent: false, detail: "RESEND_FULL_API_KEY not set" };
  const audienceId = await ensureAudience();
  if (!audienceId) return { sent: false, detail: "no audience" };

  const create = await resend("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: audienceId,
      // TODO after domain verification: switch to digest@fbcchelsea.org
      from: "Faith Baptist Church <onboarding@resend.dev>",
      subject,
      html:
        html.replace(
          "</body>",
          `<p style="margin:8px 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;" align="center"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#94a3b8;">Unsubscribe</a> from this weekly email.</p></body>`
        ),
    }),
  });
  if (!create.ok) {
    return { sent: false, detail: `broadcast create failed: HTTP ${create.status}` };
  }
  const { id } = (await create.json()) as { id: string };
  const send = await resend(`/broadcasts/${id}/send`, { method: "POST", body: "{}" });
  if (!send.ok) return { sent: false, detail: `broadcast send failed: HTTP ${send.status}` };
  return { sent: true, detail: "broadcast sent to the mailing list" };
}
