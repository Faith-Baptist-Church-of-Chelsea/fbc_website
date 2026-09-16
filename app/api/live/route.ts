// Tells the live banner what to show. YouTube-driven so special services
// work automatically, in three layers:
//   1. Free scrape of the channel's /live page (cached 1 min, no quota) —
//      runs around the clock. Says definitively live / not live.
//   2. The Data API (quota-costing, cached 5 min) plays a supporting role:
//      it supplies the videoId when the scrape says LIVE, and it gets the
//      final say only when the scrape says NOT live during a scheduled
//      service window (guarding against a scrape false negative). It never
//      overrides a positive scrape — its live search lags real streams.
//   3. If the scrape itself fails (layer 1 unreadable), fall back to the
//      service-time schedule + API check, so Sundays still work.
import { NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { checkLiveNow, scrapeLiveNow } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const window = currentServiceWindow();
  const label = window?.label ?? "Special service";
  const scraped = await scrapeLiveNow();

  if (scraped.live === true) {
    // The scrape reads YouTube's own "isLive" flag off the channel page —
    // strong evidence. The Data API's eventType=live search is only
    // eventually consistent and can come back empty for minutes after a
    // stream starts; letting that veto the scrape hid the banner mid-service
    // for 5 min at a time (its cache window). So the API only enriches
    // (videoId) here — it never overrides a positive scrape.
    const api = await checkLiveNow();
    return NextResponse.json({
      show: true,
      verified: true,
      label,
      videoId: api.videoId ?? scraped.videoId,
    });
  }

  if (scraped.live === false) {
    // YouTube says nothing is live. Outside a scheduled window, trust it —
    // that's what lets special services work with no schedule. INSIDE a
    // window, a single bad scrape (YouTube serving a page variant without
    // the flag, a bot check) would hide the banner mid-service for a full
    // cache cycle — so double-check with the API before hiding.
    // Quota: only during windows, cached 5 min, well within the daily cap.
    if (!window) return NextResponse.json({ show: false });
    const api = await checkLiveNow();
    if (api.live !== true) return NextResponse.json({ show: false });
    return NextResponse.json({ show: true, verified: true, label: window.label, videoId: api.videoId });
  }

  // Scrape unavailable — fall back to the schedule, verified by API if possible.
  if (!window) return NextResponse.json({ show: false });
  const api = await checkLiveNow();
  if (api.live === false) return NextResponse.json({ show: false });
  return NextResponse.json({
    show: true,
    verified: api.live === true,
    label: window.label,
    videoId: api.videoId,
  });
}
