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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

type TeacherCard = {
  ageLabel: string;
  who: string;
  when: string;
  note: string;
  photo: string; // /images/teachers/… — only rendered if the file exists
};

// Maps a child's age to their classes and teachers. Update alongside the
// FBC Kids page if classes or teachers change. Photos: drop files with
// these names into public/images/teachers/ and they appear in the email.
function teachersForAge(age: number): TeacherCard[] {
  if (age <= 3) {
    return [
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Our nursery team",
        when: "Every service",
        note: "A clean, staffed nursery is open at every single service — drop in whenever you're ready, or keep your little one with you. Both are genuinely fine.",
        photo: "/images/teachers/nursery.jpg",
      },
    ];
  }
  if (age <= 4) {
    return [
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Ben & Amanda Bolen",
        when: "Sundays · 11:00 AM",
        note: "A couple with two kids of their own and a heart for helping young children understand God's Word.",
        photo: "/images/teachers/ben-amanda-bolen.jpg",
      },
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Scott & Heather Turnbow",
        when: "Wednesdays · 7:00 PM",
        note: "A lively, nurturing class for ages 3–7 with a joyful approach.",
        photo: "/images/teachers/scott-heather-turnbow.jpg",
      },
    ];
  }
  if (age <= 7) {
    return [
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Haley Sackmann",
        when: "Sundays · 11:00 AM",
        note: "Passionate about helping kids grow in their understanding of God's Word.",
        photo: "/images/teachers/haley-sackmann.jpg",
      },
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Scott & Heather Turnbow",
        when: "Wednesdays · 7:00 PM",
        note: "A joyful, nurturing class for ages 3–7.",
        photo: "/images/teachers/scott-heather-turnbow.jpg",
      },
    ];
  }
  if (age <= 12) {
    return [
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Abi Wireman",
        when: "Sundays · 11:00 AM",
        note: "Loves helping preteens grow in their faith during these formative years.",
        photo: "/images/teachers/abi-wireman.jpg",
      },
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Moriah Summers",
        when: "Wednesdays · 7:00 PM",
        note: "Intentional about making lessons practical and relatable.",
        photo: "/images/teachers/moriah-summers.jpg",
      },
    ];
  }
  if (age <= 18) {
    return [
      {
        ageLabel: `Your ${age}-year-old`,
        who: "Josiah & Ashley Jaworski",
        when: "Wednesdays · 7:00 PM",
        note: "Youth group for ages 12–18 — they're passionate about investing in teens.",
        photo: "/images/teachers/josiah-ashley-jaworski.jpg",
      },
    ];
  }
  return [];
}

// A photo URL is only put in the email if the file actually exists,
// so the email never shows broken images while photos are being gathered.
function photoUrlIfExists(publicPath: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- avoid top-level fs in a file also used by route bundles
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.existsSync(`${process.cwd()}/public${publicPath}`) ? `${SITE_URL}${publicPath}` : null;
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Branded HTML version of the visitor welcome email (email-client-safe tables). */
function welcomeEmailHtml(firstName: string, cards: TeacherCard[]): string {
  const cardHtml = cards
    .map((c) => {
      const url = photoUrlIfExists(c.photo);
      const img = url
        ? `<td width="88" valign="top" style="padding:16px 0 16px 16px;"><img src="${url}" width="72" height="72" alt="${esc(c.who)}" style="border-radius:50%;display:block;object-fit:cover;" /></td>`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-top:12px;"><tr>${img}
        <td valign="top" style="padding:16px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#006389;font-weight:bold;">${esc(c.ageLabel)} · ${esc(c.when)}</p>
          <p style="margin:4px 0 0;font-size:17px;font-weight:bold;color:#0f172a;">${esc(c.who)}</p>
          <p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#475569;">${esc(c.note)}</p>
        </td></tr></table>`;
    })
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;padding:24px 8px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0f172a;padding:28px 24px;" align="center">
    <img src="${SITE_URL}/images/logo-horizontal-light.png" width="280" alt="Faith Baptist Church of Chelsea" style="display:block;max-width:280px;height:auto;" />
  </td></tr>
  <tr><td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
    <h1 style="margin:0;font-size:24px;color:#0f172a;">We saved you a seat, ${esc(firstName)}.</h1>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#334155;">We're so glad you're planning to visit — we'll be watching for you. Here's everything that makes the first visit easy:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.9;color:#334155;">
      🅿️ &nbsp;Park in the marked <strong>visitor parking</strong> — those spots are saved for you.<br/>
      🎁 &nbsp;Come in the main entrance and stop at the <strong>welcome desk</strong> first — there's a free gift waiting, and every question gets answered there.<br/>
      👕 &nbsp;Wear whatever you're comfortable in. Nobody will single you out.
    </td></tr></table>
  </td></tr>
  ${
    cards.length > 0
      ? `<tr><td style="padding:20px 28px 4px;font-family:Arial,Helvetica,sans-serif;">
    <h2 style="margin:0;font-size:18px;color:#0f172a;">Who'll be loving on your kids</h2>${cardHtml}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Check-in is simple: your child gets a name tag and you get a matching pickup tag — the welcome desk will walk you right to it.</p>
  </td></tr>`
      : ""
  }
  <tr><td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;"><tr><td style="padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#334155;">
      <strong style="color:#0f172a;">Service times</strong><br/>
      ${site.services.map((sv) => `${sv.day} ${sv.time} — ${sv.name}`).join("<br/>")}<br/><br/>
      <strong style="color:#0f172a;">Where</strong><br/>
      ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip} (${site.address.directionsNote})
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:22px auto 0;"><tr><td style="border-radius:10px;background:#0093ce;" align="center">
      <a href="${SITE_URL}/plan-your-visit" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Everything about your first visit →</a>
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b;" align="center">Questions before you come? Just reply to this email or call ${site.phone}.<br/>See you soon!</p>
  </td></tr>
</table></td></tr></table></body></html>`;
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
  // One card per class; de-dup when siblings share a teacher.
  const cards: TeacherCard[] = [];
  for (const age of ages) {
    for (const card of teachersForAge(age)) {
      const existing = cards.find((c) => c.who === card.who && c.when === card.when);
      if (existing) existing.ageLabel = "Your kids";
      else cards.push({ ...card });
    }
  }
  const firstName = s.name.trim().split(/\s+/)[0];

  // Plain-text fallback for email clients that don't render HTML.
  const text =
    `Hi ${firstName},\n\n` +
    `We're so glad you're planning to visit Faith Baptist Church — we'll be watching for you!\n\n` +
    `- Park in the marked visitor parking; those spots are saved for you.\n` +
    `- Come in the main entrance and stop at the WELCOME DESK first — free gift, and every question answered.\n` +
    `- Wear whatever you're comfortable in. Nobody will single you out.\n\n` +
    (cards.length > 0
      ? `Who'll be loving on your kids:\n` +
        cards.map((c) => `- ${c.ageLabel} · ${c.when}: ${c.who} — ${c.note}`).join("\n") +
        `\n\nCheck-in is simple: your child gets a name tag and you get a matching pickup tag.\n\n`
      : "") +
    `Service times:\n${site.services.map((sv) => `- ${sv.day} ${sv.time} — ${sv.name}`).join("\n")}\n\n` +
    `We're at ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip} (${site.address.directionsNote}).\n\n` +
    `Questions? Reply to this email or call ${site.phone}.\n\nSee you soon,\nFaith Baptist Church of Chelsea`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: "Faith Baptist Church <onboarding@resend.dev>", // TODO: switch to welcome@fbcchelsea.org once the domain is verified in Resend
      to: [s.email],
      replyTo: site.emails.assistantPastor,
      subject: "We can't wait to meet you — your visit to Faith Baptist",
      text,
      html: welcomeEmailHtml(firstName, cards),
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
