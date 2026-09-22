// Public opt-in for "email me when we go live". Rate-limited and
// honeypotted like the other public forms.
import { NextRequest, NextResponse } from "next/server";
import { addLiveAlertSubscriber } from "@/lib/live-alerts";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const limiter = makeRateLimiter(5, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  if (limiter(requestIp(req.headers))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string; website?: string };
  if (body.website) return NextResponse.json({ ok: true, detail: "You're set!" }); // honeypot
  const email = String(body.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }
  const result = await addLiveAlertSubscriber(email);
  if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 503 });
  return NextResponse.json({ ok: true, detail: result.detail });
}
