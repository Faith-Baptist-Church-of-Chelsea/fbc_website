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
  kidsAges?: string;
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
        `Name: ${s.name}\nEmail: ${s.email}\nPhone: ${s.phone || "—"}\n` +
        (s.kidsAges ? `Kids' ages: ${s.kidsAges} (they were sent the teacher-introduction email)\n` : "") +
        `\n${s.message}\n\n— Sent from the website contact form. Reply goes to the sender.`,
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

// ---------- Visitor welcome email (sent when someone plans a visit) ----------

// Maps a child's age to their Sunday/Wednesday classes and teachers.
// Update alongside the FBC Kids page if classes or teachers change.
function classesForAge(age: number): string | null {
  if (age <= 3) {
    return `age ${age}: our staffed nursery is open at every single service — drop in whenever you're ready, or keep your little one with you. Both are genuinely fine.`;
  }
  if (age <= 4) {
    return `age ${age}: Sundays at 11:00, Ben & Amanda Bolen's class — a couple with two kids of their own and a heart for helping young children understand God's Word. Wednesdays at 7:00 they'd join Scott & Heather Turnbow's lively class for ages 3–7.`;
  }
  if (age <= 7) {
    return `age ${age}: Sundays at 11:00 with Haley Sackmann, who is passionate about helping kids grow in their understanding of God's Word. Wednesdays at 7:00 with Scott & Heather Turnbow — a joyful, nurturing class.`;
  }
  if (age <= 12) {
    return `age ${age}: Sundays at 11:00 with Abi Wireman, who loves helping preteens grow in their faith. Wednesdays at 7:00 with Moriah Summers, who makes lessons practical and relatable.`;
  }
  if (age <= 18) {
    return `age ${age}: our youth group (ages 12–18) meets Wednesdays at 7:00 PM with Josiah & Ashley Jaworski — they're passionate about investing in teens.`;
  }
  return null;
}

/**
 * Sends the "we can't wait to meet you" email to someone who said they're
 * coming — including introductions to their kids' teachers when ages were
 * given. Deterministic (no AI). Returns true on success.
 * NOTE: delivers to arbitrary visitor addresses only after fbcchelsea.org
 * is verified in Resend; until then Resend rejects it (logged, harmless).
 */
export async function sendVisitorWelcomeEmail(s: Submission): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const ages = [...new Set((s.kidsAges ?? "").match(/\d{1,2}/g)?.map(Number) ?? [])]
    .filter((n) => n >= 0 && n <= 18)
    .sort((a, b) => a - b);
  const kidLines = ages.map(classesForAge).filter(Boolean) as string[];
  const firstName = s.name.trim().split(/\s+/)[0];

  const text =
    `Hi ${firstName},\n\n` +
    `We're so glad you're planning to visit Faith Baptist Church — we'll be watching for you!\n\n` +
    `A few things that make the first visit easy:\n` +
    `- Look for the visitor parking signs; those spots are saved for you.\n` +
    `- Come in the main entrance and stop at the WELCOME DESK first — there's a free gift waiting for you, and it's the place where every question gets answered.\n` +
    `- Wear whatever you're comfortable in. Nobody will single you out or ask you to stand.\n\n` +
    (kidLines.length > 0
      ? `Since you mentioned your kids' ages, here's who will be loving on them:\n` +
        kidLines.map((l) => `- For your child ${l}`).join("\n") +
        `\n\nCheck-in is simple: your child gets a name tag and you get a matching pickup tag at the check-in station — the welcome desk will walk you right to it.\n\n`
      : "") +
    `Service times:\n${site.services.map((sv) => `- ${sv.day} ${sv.time} — ${sv.name}`).join("\n")}\n\n` +
    `We're at ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip} (${site.address.directionsNote}).\n\n` +
    `Any questions before you come, just reply to this email or call ${site.phone}.\n\n` +
    `See you soon,\nFaith Baptist Church of Chelsea\n${site.links.churchCenter}`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: "Faith Baptist Church <onboarding@resend.dev>", // TODO: switch to welcome@fbcchelsea.org once the domain is verified in Resend
      to: [s.email],
      replyTo: site.emails.assistantPastor,
      subject: "We can't wait to meet you — your visit to Faith Baptist",
      text,
    });
    if (error) {
      console.warn("[forms] visitor welcome email failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[forms] visitor welcome email failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Notifies staff that the website's question assistant couldn't answer
 * something. Best-effort — a failure here never affects the visitor.
 */
export async function sendUnansweredQuestionEmail(question: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: "Faith Baptist Website <onboarding@resend.dev>", // TODO: switch to website@fbcchelsea.org once the domain is verified in Resend
      to: [...site.formRecipients],
      subject: "[Website] The assistant couldn't answer a visitor's question",
      text:
        `A visitor asked the website's question bubble:\n\n` +
        `  "${question}"\n\n` +
        `The assistant didn't have this in its church info, so it pointed them to the office.\n\n` +
        `To teach it the answer: go to /admin on the website and type, for example:\n` +
        `  Add to the chat facts: <the answer>\n\n` +
        `— Automated notice from the website.`,
    });
  } catch (err) {
    console.warn("[ask] unanswered-question email failed:", err instanceof Error ? err.message : err);
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
