// YouTube integration.
//
// Works at two levels:
//   1. WITHOUT an API key (current state): the live banner runs on the
//      service-time schedule alone, and the sermons page embeds the
//      channel's uploads playlist. Nothing to expire, nothing to break.
//   2. WITH a YOUTUBE_API_KEY env var: the banner VERIFIES we're actually
//      live before saying "live" (a false 'we're live' is worse than
//      none), and the sermons page lists real videos with titles/dates.
//
// Quota math (free tier = 10,000 units/day): the live check costs 100
// units and is cached 5 minutes → ~288 calls/day worst case = 28,800...
// which is why the live check ONLY runs during service windows (see
// /api/live) — real usage is ~30 checks/week ≈ 3,000 units. The video
// list costs 1 unit, cached 15 minutes. Comfortable margins.
import "server-only";
import site from "@/content/site.json";

const KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL = site.social.youtubeChannelId;

export function youtubeKeyConfigured(): boolean {
  return Boolean(KEY);
}

/**
 * Is the channel live right now?
 * Returns: true / false when the API key is set and answers,
 * or null when we can't know (no key, quota exhausted, network error).
 */
export async function checkLiveNow(): Promise<{ live: boolean | null; videoId: string | null }> {
  if (!KEY) return { live: null, videoId: null };
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL}` +
      `&eventType=live&type=video&maxResults=1&key=${KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.warn(`[youtube] live check HTTP ${res.status}`);
      return { live: null, videoId: null };
    }
    const json = (await res.json()) as { items?: { id?: { videoId?: string } }[] };
    const videoId = json.items?.[0]?.id?.videoId ?? null;
    return { live: Boolean(videoId), videoId };
  } catch (err) {
    console.warn("[youtube] live check failed:", err instanceof Error ? err.message : err);
    return { live: null, videoId: null };
  }
}

/**
 * Free live check: reads the channel's public /live page and looks for
 * YouTube's own "isLive" flag. Costs no API quota, so it can run around
 * the clock — this is what lets the banner appear for special services
 * without a schedule. Returns null when the page can't be read (then the
 * caller falls back to the service-time schedule).
 */
export async function scrapeLiveNow(): Promise<{ live: boolean | null; videoId: string | null }> {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${CHANNEL}/live`, {
      next: { revalidate: 300 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) return { live: null, videoId: null };
    const html = await res.text();
    if (html.includes('"isLive":true')) {
      const m = html.match(/"videoId":"([\w-]{6,20})"/);
      return { live: true, videoId: m?.[1] ?? null };
    }
    return { live: false, videoId: null };
  } catch (err) {
    console.warn("[youtube] live scrape failed:", err instanceof Error ? err.message : err);
    return { live: null, videoId: null };
  }
}

export type SermonVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
};

/**
 * Recent uploads (newest first) via the uploads playlist — 1 quota unit.
 * Returns [] without an API key or on any failure; callers fall back to
 * the keyless playlist embed.
 */
export async function getRecentVideos(limit = 12): Promise<SermonVideo[]> {
  if (!KEY) return [];
  try {
    const playlist = CHANNEL.replace(/^UC/, "UU");
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist}` +
      `&maxResults=${limit}&key=${KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      console.warn(`[youtube] playlistItems HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as {
      items?: {
        snippet?: {
          title?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
        };
      }[];
    };
    return (json.items ?? [])
      .map((i) => ({
        videoId: i.snippet?.resourceId?.videoId ?? "",
        title: i.snippet?.title ?? "Untitled",
        publishedAt: i.snippet?.publishedAt ?? "",
        thumbnail: i.snippet?.thumbnails?.medium?.url ?? i.snippet?.thumbnails?.high?.url ?? null,
      }))
      .filter((v) => v.videoId);
  } catch (err) {
    console.warn("[youtube] getRecentVideos failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
