// Sends the "we're live" email — at most once per stream.
//
// Called every minute by a Vercel cron (GET, Vercel's CRON_SECRET header),
// and still accepts a manual POST with LIVE_ALERT_SECRET. Either way the
// caller is trusted only for *when to ask*; this route decides *whether
// we're live* on its own:
//   1. the channel's /live page names a candidate video (free scrape),
//   2. YouTube's API must say that exact video is live right now, with a
//      real start time — scheduled placeholders and ended streams fail,
//   3. the stream must have started within the last MAX_AGE_MIN minutes,
//   4. and no alert may have gone out for that video before (Blob marker).
// A scheduled-but-not-started stream once got past the old check and
// emailed subscribers "we're live" on a quiet Wednesday night — step 2
// exists so that cannot recur.
import { NextRequest, NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { confirmLive, scrapeLiveNow } from "@/lib/youtube";
import { alertAlreadySent, liveAlertEmail, markAlertSent, sendLiveAlert, sendLiveAlertTest } from "@/lib/live-alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Don't alert for a stream that's been going a while (e.g. the poll was
// down and only now noticed) — an email 40 minutes into the service is
// worse than none.
const MAX_AGE_MIN = 45;

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const cron = process.env.CRON_SECRET;
  const manual = process.env.LIVE_ALERT_SECRET;
  if (cron && auth === `Bearer ${cron}`) return true;
  if (manual && auth === `Bearer ${manual}`) return true;
  // No CRON_SECRET configured: accept Vercel's cron user-agent (same rule
  // as /api/monitor) so a fresh environment still works.
  if (!cron && (req.headers.get("user-agent") ?? "").startsWith("vercel-cron")) return true;
  // Local dev server only (never set on Vercel): lets the preview open in a browser.
  if (process.env.NODE_ENV === "development" && !cron && !manual) return true;
  return false;
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Design checks, same auth: ?preview=1 renders the email as a page,
  // ?test=<address> emails one sample copy to that address. Neither one
  // touches the subscriber list.
  const preview = req.nextUrl.searchParams.get("preview");
  const test = req.nextUrl.searchParams.get("test");
  if (preview) {
    const { html } = liveAlertEmail("Sunday Morning Service (preview)", null, "#");
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (test && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test)) {
    return NextResponse.json(await sendLiveAlertTest(test));
  }

  const scraped = await scrapeLiveNow();
  if (scraped.live !== true || !scraped.videoId) {
    return NextResponse.json({ sent: 0, skipped: scraped.live === null ? "channel page unreadable" : "not live" });
  }
  const videoId = scraped.videoId;

  const confirmed = await confirmLive(videoId);
  if (confirmed.live !== true) {
    return NextResponse.json({
      sent: 0,
      videoId,
      skipped: confirmed.live === null ? "could not confirm with YouTube API" : "YouTube says this video is not live (scheduled or ended)",
    });
  }

  const ageMin = confirmed.startedAt ? (Date.now() - new Date(confirmed.startedAt).getTime()) / 60_000 : null;
  if (ageMin !== null && ageMin > MAX_AGE_MIN) {
    return NextResponse.json({ sent: 0, videoId, skipped: `stream started ${Math.round(ageMin)} min ago` });
  }

  if (await alertAlreadySent(videoId)) {
    return NextResponse.json({ sent: 0, videoId, skipped: "already alerted for this stream" });
  }

  const label = currentServiceWindow()?.label ?? "Special service";
  const result = await sendLiveAlert(videoId, label);
  if (result.sent > 0) await markAlertSent(videoId, { label, sent: result.sent });
  return NextResponse.json({ ...result, videoId, label });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
