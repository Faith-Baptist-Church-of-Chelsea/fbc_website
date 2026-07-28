// Tells the live banner what to show. YouTube-driven so special services
// work automatically, in three layers:
//   1. Free scrape of the channel's /live page (cached 5 min, no quota) —
//      runs around the clock. Says definitively live / not live.
//   2. When the scrape says LIVE and an API key exists, the Data API
//      double-confirms before the banner claims "we're live".
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
    // Double-confirm with the API when possible; it can also supply the videoId.
    const api = await checkLiveNow();
    if (api.live === false) return NextResponse.json({ show: false });
    return NextResponse.json({
      show: true,
      verified: true,
      label,
      videoId: api.videoId ?? scraped.videoId,
    });
  }

  if (scraped.live === false) {
    // YouTube says nothing is live — no banner, scheduled service or not.
    return NextResponse.json({ show: false });
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
