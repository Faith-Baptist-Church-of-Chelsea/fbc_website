// Called by .github/workflows/live-alerts.yml once per stream. Requires the
// shared LIVE_ALERT_SECRET, then independently re-verifies that a stream
// really is live and recently started before emailing anyone — the caller
// is trusted for *when* to ask, never for *whether* we're live.
import { NextRequest, NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { checkLiveNow, scrapeLiveNow } from "@/lib/youtube";
import { sendLiveAlert } from "@/lib/live-alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Don't alert for a stream that's been going a while (e.g. the poll was
// down and only now noticed) — an email 40 minutes into the service is
// worse than none.
const MAX_AGE_MIN = 45;

async function startedMinutesAgo(videoId: string): Promise<number | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: { liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string } }[];
    };
    const d = json.items?.[0]?.liveStreamingDetails;
    if (!d?.actualStartTime) return null;
    if (d.actualEndTime) return Number.POSITIVE_INFINITY;
    return (Date.now() - new Date(d.actualStartTime).getTime()) / 60_000;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.LIVE_ALERT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const scraped = await scrapeLiveNow();
  const api = await checkLiveNow();
  const live = scraped.live === true || api.live === true;
  if (!live) return NextResponse.json({ sent: 0, skipped: "not live" });

  const videoId = api.videoId ?? scraped.videoId;
  if (videoId) {
    const age = await startedMinutesAgo(videoId);
    if (age !== null && age > MAX_AGE_MIN) {
      return NextResponse.json({ sent: 0, skipped: `stream started ${Math.round(age)} min ago` });
    }
  }

  const label = currentServiceWindow()?.label ?? "Special service";
  const result = await sendLiveAlert(videoId, label);
  return NextResponse.json({ ...result, videoId, label });
}
