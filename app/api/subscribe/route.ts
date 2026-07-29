// Public signup for the "This Week at Faith" weekly email.
// Rate-limited and honeypotted like the contact form.
import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/mailing-list";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const limiter = makeRateLimiter(5, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  if (limiter(requestIp(req.headers))) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    website?: string; // honeypot — real people never fill this
  };
  if (body.website) return NextResponse.json({ ok: true, detail: "You're on the list!" });
  const email = String(body.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }
  const [firstName, ...rest] = String(body.name ?? "").trim().split(/\s+/);
  const result = await addSubscriber(email, firstName, rest.join(" "));
  if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 503 });
  return NextResponse.json({ ok: true, detail: result.detail });
}
