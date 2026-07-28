// Receives contact / prayer / visit / music form submissions.
// Spam defenses (in order): honeypot field (bots fill it, humans never see
// it — we answer "ok" and do nothing), then per-IP rate limiting. No
// CAPTCHA, per the design brief: never punish real people.
import { NextRequest, NextResponse } from "next/server";
import site from "@/content/site.json";
import {
  rateLimited,
  sendFormEmail,
  sendVisitorWelcomeEmail,
  upsertPersonInPco,
  type Submission,
} from "@/lib/forms";

export const dynamic = "force-dynamic";

const KINDS = ["question", "visit", "prayer", "music"] as const;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: the hidden "website" field. Bots fill it; pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many messages from this connection — please try again in an hour, or just call us." },
      { status: 429 }
    );
  }

  const kind = KINDS.includes(body.kind as (typeof KINDS)[number])
    ? (body.kind as Submission["kind"])
    : "question";
  const name = String(body.name ?? "").trim().slice(0, 200);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const phone = String(body.phone ?? "").trim().slice(0, 50);
  const message = String(body.message ?? "").trim().slice(0, 5000);
  const confidential = Boolean(body.confidential);
  const kidsAges = String(body.kidsAges ?? "").trim().slice(0, 100);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, a valid email, and a message." },
      { status: 400 }
    );
  }

  const submission: Submission = { kind, name, email, phone, message, confidential, kidsAges };

  const [emailed, inPco] = await Promise.all([
    sendFormEmail(submission),
    upsertPersonInPco(submission),
    // Visit heads-ups get a warm welcome email back (teacher intros when
    // kids' ages were shared). Best-effort; never blocks the submission.
    kind === "visit" ? sendVisitorWelcomeEmail(submission) : Promise.resolve(false),
  ]);

  if (!emailed && !inPco) {
    // Both halves failed — tell the visitor honestly and give a way out.
    return NextResponse.json(
      {
        ok: false,
        error: `Something went wrong on our end. Please email us directly at ${site.emails.office} — sorry about that.`,
      },
      { status: 502 }
    );
  }
  if (!emailed) {
    // Person was recorded in Planning Center but staff won't see an email.
    console.error("[forms] submission stored in PCO but EMAIL FAILED — check RESEND_API_KEY / recipients");
  }
  return NextResponse.json({ ok: true });
}
