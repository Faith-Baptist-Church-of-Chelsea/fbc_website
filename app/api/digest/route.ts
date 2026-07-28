// "This Week at Faith" weekly digest.
// GET  — Vercel cron, Monday mornings (vercel.json). Sends ONLY for the
//        cron (CRON_SECRET, or Vercel's cron user-agent as a fallback).
//        Every other GET — crawlers, email link-preview bots, a person
//        clicking the URL — gets the harmless browser preview instead.
// POST — manual "send it now" from /admin, guarded by the admin password.
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { composeDigest, sendDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isVercelCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
}

export async function GET(req: NextRequest) {
  if (isVercelCron(req) && !req.nextUrl.searchParams.has("preview")) {
    const result = await sendDigest();
    return NextResponse.json(result, { status: result.sent ? 200 : 500 });
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
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const a = crypto.createHash("sha256").update(String(body.password ?? "")).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const result = await sendDigest();
  return NextResponse.json(result, { status: result.sent ? 200 : 500 });
}
