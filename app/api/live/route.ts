// Tells the live banner what to show. YouTube-driven so special services
// work automatically:
//   1. detectLive() — our channel's /live page names the candidate video
//      (free, cached 1 min) and the Data API confirms that exact video is
//      live right now and is ours. See lib/youtube.ts for why both steps
//      exist: scheduled placeholders and other channels' streams fooled
//      the old flag-only check.
//   2. Inside a scheduled service window, a NOT-live answer is double-
//      checked with the API's live search before hiding the banner, so a
//      single bad page read can't hide it mid-service.
//   3. If the page is unreadable and the API can't help, fall back to the
//      service-time schedule so Sundays still work.
import { NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { checkLiveNow, detectLive } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const window = currentServiceWindow();
  const label = window?.label ?? "Special service";
  const status = await detectLive();

  if (status.live === true) {
    return NextResponse.json({ show: true, verified: true, label, videoId: status.videoId });
  }

  if (status.live === false) {
    // Nothing of ours is live. Outside a scheduled window, trust it —
    // that's what lets special services work with no schedule. INSIDE a
    // window, double-check with the API's live search before hiding the
    // banner (a bot-check page or a stale read mustn't hide a service).
    if (!window) return NextResponse.json({ show: false });
    const api = await checkLiveNow();
    if (api.live !== true) return NextResponse.json({ show: false });
    return NextResponse.json({ show: true, verified: true, label: window.label, videoId: api.videoId });
  }

  // Page unreadable — fall back to the schedule, verified by API if possible.
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
