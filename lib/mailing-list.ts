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

/**
 * Weekly sync: add anyone new from Planning Center (active adults with an
 * email) to the audience. Runs inside the Monday cron just before the
 * digest sends. Only ADDS people — it never re-subscribes someone who
 * unsubscribed (existing contacts are skipped entirely) and never removes
 * anyone. The initial bulk load is scripts/import-pco-contacts.mjs.
 */
export async function syncPcoContacts(): Promise<{ added: number; detail: string }> {
  if (!fullKey()) return { added: 0, detail: "no full-access key" };
  if (!process.env.PCO_APP_ID || !process.env.PCO_SECRET) {
    return { added: 0, detail: "no PCO credentials" };
  }
  const audienceId = await ensureAudience();
  if (!audienceId) return { added: 0, detail: "no audience" };

  // Emails already in the audience (any status — unsubscribed stays put)
  const existingRes = await resend(`/audiences/${audienceId}/contacts`);
  if (!existingRes.ok) return { added: 0, detail: `contact list failed: HTTP ${existingRes.status}` };
  const existing = new Set(
    (((await existingRes.json()) as { data?: { email: string }[] }).data ?? []).map((c) =>
      c.email.toLowerCase().trim()
    )
  );

  // Active adults with emails from Planning Center
  const pcoAuth =
    "Basic " +
    Buffer.from(`${process.env.PCO_APP_ID}:${process.env.PCO_SECRET}`).toString("base64");
  const people = new Map<string, { first: string; last: string; email: string | null }>();
  let url: string | null =
    "https://api.planningcenteronline.com/people/v2/people?where[status]=active&where[child]=false&include=emails&per_page=100";
  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: pcoAuth },
      cache: "no-store",
    });
    if (!res.ok) return { added: 0, detail: `PCO fetch failed: HTTP ${res.status}` };
    const d = (await res.json()) as {
      data: { id: string; attributes: { first_name?: string; last_name?: string } }[];
      included?: {
        type: string;
        attributes: { address: string; primary?: boolean };
        relationships: { person: { data: { id: string } } };
      }[];
      links: { next?: string };
    };
    for (const p of d.data) {
      people.set(p.id, {
        first: p.attributes.first_name ?? "",
        last: p.attributes.last_name ?? "",
        email: null,
      });
    }
    for (const inc of d.included ?? []) {
      if (inc.type !== "Email") continue;
      const person = people.get(inc.relationships.person.data.id);
      if (person && (!person.email || inc.attributes.primary)) person.email = inc.attributes.address;
    }
    url = d.links.next ?? null;
  }

  const fresh = [...people.values()].filter(
    (p) => p.email && !existing.has(p.email.toLowerCase().trim())
  );
  let added = 0;
  for (const p of fresh) {
    const res = await resend(`/audiences/${audienceId}/contacts`, {
      method: "POST",
      body: JSON.stringify({
        email: p.email,
        first_name: p.first,
        last_name: p.last,
        unsubscribed: false,
      }),
    });
    if (res.ok) added++;
    await new Promise((r) => setTimeout(r, 600)); // ~2 req/s rate limit
  }
  return { added, detail: `synced from Planning Center: ${added} new subscriber${added === 1 ? "" : "s"}` };
}

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
    return {
      sent: false,
      detail:
        "Congregation sending isn't switched on yet — it needs the fbcchelsea.org domain verified in Resend and the paid Resend plan. The review copies still work.",
    };
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
