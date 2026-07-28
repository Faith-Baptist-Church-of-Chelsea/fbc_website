// Server-side plumbing for the contact & prayer request forms.
//
// A submission does two things, both best-effort and independent:
//   1. Emails everyone in content/site.json → formRecipients
//      (editable in /keystatic without touching code).
//   2. Creates (or finds) the person in Planning Center People, so a
//      first-time contact becomes a real record the church can follow up.
// If one half fails, the other still happens; total failure is reported
// to the visitor honestly with a fallback email address.
import "server-only";
import { Resend } from "resend";
import site from "@/content/site.json";
import { pcoFetch } from "@/lib/pco";

export type Submission = {
  kind: "question" | "visit" | "prayer" | "music";
  name: string;
  email: string;
  phone?: string;
  message: string;
  confidential?: boolean;
};

const KIND_LABEL: Record<Submission["kind"], string> = {
  question: "Question from the website",
  visit: "Someone is planning a visit",
  prayer: "Prayer request",
  music: "Wants to join the choir/orchestra",
};

// ---------- Email ----------

/**
 * Sends the notification email. Returns true on success.
 * Until a sending domain is verified in Resend, the from address must be
 * onboarding@resend.dev (Resend's shared test sender). After verifying
 * fbcchelsea.org in Resend, change FROM below.
 */
export async function sendFormEmail(s: Submission): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[forms] RESEND_API_KEY not set — email not sent");
    return false;
  }
  const FROM = "Faith Baptist Website <onboarding@resend.dev>"; // TODO: switch to website@fbcchelsea.org once the domain is verified in Resend
  const confidentialNote = s.confidential
    ? "\n\n⚠ Marked CONFIDENTIAL — keep to the pastors.\n"
    : "";
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [...site.formRecipients],
      replyTo: s.email,
      subject: `[Website] ${KIND_LABEL[s.kind]} — ${s.name}`,
      text:
        `${KIND_LABEL[s.kind]}${confidentialNote}\n` +
        `Name: ${s.name}\nEmail: ${s.email}\nPhone: ${s.phone || "—"}\n\n` +
        `${s.message}\n\n— Sent from the website contact form. Reply goes to the sender.`,
    });
    if (error) {
      console.warn("[forms] Resend error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[forms] email failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------- Planning Center People ----------

type PcoPerson = { id: string };
type PcoSearch = { data: { id: string }[] };

/**
 * Finds a person by email or creates them (first+last name, email, phone).
 * Returns true if the person exists in People afterward.
 * Prayer requests marked confidential still create the person (name/contact
 * only) — the request itself goes only to email, never into People.
 */
export async function upsertPersonInPco(s: Submission): Promise<boolean> {
  try {
    // 1. Already there?
    const found = (await pcoFetch(
      `/people/v2/people?where[search_name_or_email]=${encodeURIComponent(s.email)}&per_page=1`,
      { revalidate: 0 }
    )) as PcoSearch | null;
    if (found === null) return false; // credentials/network problem
    if (found.data.length > 0) return true;

    // 2. Create the person.
    const [first, ...restName] = s.name.trim().split(/\s+/);
    const created = await pcoPost("/people/v2/people", {
      data: {
        type: "Person",
        attributes: { first_name: first || s.name, last_name: restName.join(" ") || "(from website)" },
      },
    });
    if (!created) return false;
    const personId = (created as { data: PcoPerson }).data.id;

    // 3. Attach contact info (best-effort).
    await pcoPost(`/people/v2/people/${personId}/emails`, {
      data: { type: "Email", attributes: { address: s.email, location: "Home" } },
    });
    if (s.phone) {
      await pcoPost(`/people/v2/people/${personId}/phone_numbers`, {
        data: { type: "PhoneNumber", attributes: { number: s.phone, location: "Mobile" } },
      });
    }
    return true;
  } catch (err) {
    console.warn("[forms] PCO upsert failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

async function pcoPost(path: string, body: unknown): Promise<unknown | null> {
  const id = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;
  if (!id || !secret) return null;
  try {
    const res = await fetch(`https://api.planningcenteronline.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[forms] POST ${path} HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[forms] POST ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------- Rate limiting ----------

// Simple in-memory limiter: 5 submissions per IP per hour. On Vercel each
// serverless instance has its own map, so the real ceiling is a bit higher
// — fine for our size. If spam ever becomes a problem, upgrade to Vercel KV.
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  if (recent.length >= 5) return true;
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing unbounded.
  if (hits.size > 5000) hits.clear();
  return false;
}
