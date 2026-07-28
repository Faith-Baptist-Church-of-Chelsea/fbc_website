// "This Week at Faith" weekly digest.
// GET  — Vercel cron, Monday mornings (vercel.json). Guarded by CRON_SECRET.
// POST — manual "send it now" from /admin, guarded by the admin password.
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await sendDigest();
  return NextResponse.json(result, { status: result.sent ? 200 : 500 });
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
