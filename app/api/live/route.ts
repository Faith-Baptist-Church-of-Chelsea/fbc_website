// Tells the live banner what to show. YouTube-driven so special services
// work automatically, in three layers:
//   1. Free scrape of the channel's /live page (cached 1 min, no quota) —
//      runs around the clock and names the candidate video; the API then
//      confirms that video is really live (not scheduled, not ended).
//   2. The Data API (quota-costing, cached 5 min) plays a supporting role:
//      it supplies the videoId when the scrape says LIVE, and it gets the
//      final say only when the scrape says NOT live during a scheduled
//      service window (guarding against a scrape false negative). It never
//      overrides a positive scrape — its live search lags real streams.
//   3. If the scrape itself fails (layer 1 unreadable), fall back to the
//      service-time schedule + API check, so Sundays still work.
import { NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { checkLiveNow, confirmLive, scrapeLiveNow } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const window = currentServiceWindow();
  const label = window?.label ?? "Special service";
  const scraped = await scrapeLiveNow();

  // The scrape names a candidate video; YouTube's API (1 unit, cached
  // 1 min) confirms that exact video is live right now. The confirmation
  // is per-video, so it doesn't suffer the lag of the eventType=live
  // search — and it rejects scheduled placeholders and ended streams,
  // which the raw page flag did not. If the API can't answer, the scrape
  // (which already excludes "upcoming") stands on its own.
  let live = scraped.live;
  if (scraped.live === true && scraped.videoId) {
    const confirmed = await confirmLive(scraped.videoId);
    if (confirmed.live === false) live = false;
  }

  if (live === true) {
    return NextResponse.json({ show: true, verified: true, label, videoId: scraped.videoId });
  }

  if (live === false) {
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
