// "This Week at Faith" weekly digest.
// GET  — Vercel cron, Monday mornings (vercel.json). Sends ONLY for the
//        cron (CRON_SECRET, or Vercel's cron user-agent as a fallback).
//        ?resend=<signed token> — the "something's wrong" link in the
//        review email: emails staff a fresh review copy (rate-limited).
//        Every other GET — crawlers, email link-preview bots, a person
//        clicking the URL — gets the harmless browser preview instead.
// POST — manual send / approve-broadcast from /admin, admin password.
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { approveAndBroadcast, composeDigest, reviewResendToken, sendDigest } from "@/lib/digest";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// The Monday run also syncs new Planning Center contacts (rate-limited to
// ~2/s), so give it room beyond the usual 60s.
export const maxDuration = 300;

function isVercelCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
}

const resendLimiter = makeRateLimiter(4, 60 * 60 * 1000);

function tokenMatches(supplied: string): boolean {
  const expected = reviewResendToken();
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(supplied).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (isVercelCron(req) && !req.nextUrl.searchParams.has("preview")) {
    const result = await sendDigest({ sync: true });
    return NextResponse.json(result, { status: result.sent ? 200 : 500 });
  }
  // The "something's wrong → fresh review copy" link from the review email.
  const resend = req.nextUrl.searchParams.get("resend");
  if (resend && tokenMatches(resend)) {
    if (resendLimiter(requestIp(req.headers))) {
      return new NextResponse("Easy does it — a few copies were already sent this hour.", {
        status: 429,
      });
    }
    const result = await sendDigest();
    const ok = result.sent;
    return new NextResponse(
      `<!DOCTYPE html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#e2e8f0;">
      <div style="max-width:480px;margin:80px auto;background:#fff;border-radius:16px;padding:36px;text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#0f172a;">${ok ? "Fresh review copy sent ✔" : "Hmm, that didn't send"}</h1>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#334155;">${
          ok
            ? "Check the staff inbox — it was rebuilt just now from the website's current events. Still see a problem? Fix it on the admin page, then click the link in the email again."
            : "Try again in a minute, or use the buttons on the admin page."
        }</p>
        <p style="margin:20px 0 0;"><a href="/admin" style="color:#006d9a;font-weight:bold;">Go to the admin page →</a></p>
      </div></body></html>`,
      { status: ok ? 200 : 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  // Anyone else sees the preview — same public content as the website.
  const { html } = await composeDigest();
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not configured." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    password?: string;
    action?: string;
  };
  const a = crypto.createHash("sha256").update(String(body.password ?? "")).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  // "approve" = the human sign-off: recompose fresh and broadcast to the
  // mailing list. Anything else = send the staff review copy.
  const result =
    body.action === "approve" ? await approveAndBroadcast() : await sendDigest();
  return NextResponse.json(result, { status: result.sent ? 200 : 500 });
}
