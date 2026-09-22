// One-click unsubscribe from live alerts (link in every alert email).
import { NextRequest, NextResponse } from "next/server";
import { unsubscribeLiveAlerts } from "@/lib/live-alerts";

export const dynamic = "force-dynamic";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>` +
      `<body style="font-family:Arial,Helvetica,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#0f172a;line-height:1.5;">` +
      `<h1 style="font-size:1.5rem;">${title}</h1><p>${body}</p><p><a href="/" style="color:#006389;">Back to the website</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!email || !token) return page("That link isn't complete", "Please use the link from the bottom of the email.", 400);
  const ok = await unsubscribeLiveAlerts(email, token);
  return ok
    ? page("You're unsubscribed", "You won't get any more live-stream emails. You can sign up again any time on the Watch Live page.")
    : page("Couldn't unsubscribe", "That link didn't check out. Please use the exact link from the bottom of the email, or contact the church office.", 400);
}
