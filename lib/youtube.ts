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
 * Free live check: reads the channel's public /live page. Costs no API
 * quota, so it can run around the clock — this is what lets the banner
 * appear for special services without a schedule.
 *
 * When the channel is live (or has a scheduled stream), YouTube serves the
 * WATCH page for that video and its <link rel="canonical"> names it. When
 * nothing is live, YouTube serves the channel home page instead — which
 * can still contain "isLive":true and videoIds for OTHER channels' live
 * videos in its recommendations (on 2026-11-01 the site briefly picked up
 * a different church's "Church Online" stream this way). So the canonical
 * watch URL is the only accepted source of the video id; without it,
 * nothing of ours is live. `upcoming` is reported so callers without API
 * access can still tell a scheduled placeholder from a real stream.
 * Returns live:null when the page can't be read.
 */
export async function scrapeLiveNow(): Promise<{ live: boolean | null; videoId: string | null; upcoming: boolean }> {
  try {
    // Cached only 1 min: this costs no API quota and Next's fetch cache is
    // shared across all visitors, so that's at most one YouTube fetch per
    // minute site-wide — and it's what decides how fast the banner appears.
    const res = await fetch(`https://www.youtube.com/channel/${CHANNEL}/live`, {
      next: { revalidate: 60 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    if (!res.ok) return { live: null, videoId: null, upcoming: false };
    const html = await res.text();
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{6,20})"/);
    if (!canonical) return { live: false, videoId: null, upcoming: false };
    const upcoming = html.includes('"isUpcoming":true');
    return { live: html.includes('"isLive":true') && !upcoming, videoId: canonical[1], upcoming };
  } catch (err) {
    console.warn("[youtube] live scrape failed:", err instanceof Error ? err.message : err);
    return { live: null, videoId: null, upcoming: false };
  }
}

/** What the channel /live page looks like from here — for debugging the
 *  scrape from production (the page can differ by network/region). */
export async function scrapeDiagnostics(): Promise<Record<string, unknown>> {
  const res = await fetch(`https://www.youtube.com/channel/${CHANNEL}/live`, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  const html = await res.text();
  return {
    status: res.status,
    finalUrl: res.url,
    length: html.length,
    title: html.match(/<title>([^<]*)/)?.[1] ?? null,
    canonical: html.match(/<link rel="canonical"[^>]*>/)?.[0] ?? null,
    ogUrl: html.match(/<meta property="og:url"[^>]*>/)?.[0] ?? null,
    isLive: html.includes('"isLive":true'),
    isUpcoming: html.includes('"isUpcoming":true'),
    videoIds: [...new Set([...html.matchAll(/"videoId":"([\w-]{6,20})"/g)].map((m) => m[1]))].slice(0, 5),
  };
}

export type LiveStatus = {
  live: boolean | null; // null = couldn't tell (page unreadable and no API)
  videoId: string | null;
  startedAt: string | null;
};

/**
 * THE live check, shared by the banner API and the alert sender so they
 * can never disagree. Scrape names the candidate video off our channel's
 * /live page; the Data API then confirms that exact video is live right
 * now AND belongs to our channel. If the API can't answer, the scrape's
 * own verdict (live flag, not upcoming) stands.
 */
export async function detectLive(): Promise<LiveStatus> {
  const scraped = await scrapeLiveNow();
  if (scraped.live === null) return { live: null, videoId: null, startedAt: null };
  if (!scraped.videoId) return { live: false, videoId: null, startedAt: null };
  const confirmed = await confirmLive(scraped.videoId);
  if (confirmed.live === null) return { live: scraped.live, videoId: scraped.live ? scraped.videoId : null, startedAt: null };
  return { live: confirmed.live, videoId: confirmed.live ? scraped.videoId : null, startedAt: confirmed.startedAt };
}

export type LiveConfirmation = {
  /** true = YouTube's API says this video is live right now; false = it
   *  isn't (upcoming, ended, or an ordinary video); null = couldn't check. */
  live: boolean | null;
  /** When the broadcast actually started, if it has. */
  startedAt: string | null;
  ended: boolean;
};

/**
 * The authoritative answer for ONE video — 1 quota unit, cached 1 min.
 * The scrape finds a candidate; this decides. A video counts as live only
 * when YouTube itself reports liveBroadcastContent === "live" and a real
 * actualStartTime, so scheduled placeholders and finished streams never
 * pass. Null when the key is missing or the API errors (callers fall back
 * to the scrape alone).
 */
export async function confirmLive(videoId: string): Promise<LiveConfirmation> {
  if (!KEY) return { live: null, startedAt: null, ended: false };
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${KEY}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      console.warn(`[youtube] confirmLive HTTP ${res.status}`);
      return { live: null, startedAt: null, ended: false };
    }
    const json = (await res.json()) as {
      items?: {
        snippet?: { liveBroadcastContent?: string; channelId?: string };
        liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
      }[];
    };
    const item = json.items?.[0];
    if (!item) return { live: false, startedAt: null, ended: false };
    const d = item.liveStreamingDetails ?? {};
    const ended = Boolean(d.actualEndTime);
    // Must be OUR stream: another channel's live video can turn up on our
    // channel page's recommendations when we're off the air.
    const ours = item.snippet?.channelId === CHANNEL;
    if (!ours) console.warn(`[youtube] confirmLive: ${videoId} belongs to another channel — ignoring`);
    const live = ours && item.snippet?.liveBroadcastContent === "live" && Boolean(d.actualStartTime) && !ended;
    return { live, startedAt: d.actualStartTime ?? null, ended };
  } catch (err) {
    console.warn("[youtube] confirmLive failed:", err instanceof Error ? err.message : err);
    return { live: null, startedAt: null, ended: false };
  }
}

export type SermonVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  /** Largest thumbnail YouTube reports — for big featured players. */
  thumbnail: string | null;
  /** Small (320px) thumbnail — for grid cards and emails. */
  thumbSmall: string | null;
  /** ISO 8601 (e.g. "PT58M12S") — schema.org VideoObject wants this format
   *  directly, no conversion needed. Null if the lookup failed. */
  duration: string | null;
};

/**
 * Durations for a batch of video IDs — 1 quota unit regardless of count
 * (YouTube allows up to 50 ids per call), so this is cheap to always fetch.
 */
async function getDurations(videoIds: string[]): Promise<Map<string, string>> {
  const durations = new Map<string, string>();
  if (!KEY || videoIds.length === 0) return durations;
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails` +
      `&id=${videoIds.join(",")}&key=${KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      console.warn(`[youtube] videos.list HTTP ${res.status}`);
      return durations;
    }
    const json = (await res.json()) as {
      items?: { id?: string; contentDetails?: { duration?: string } }[];
    };
    for (const item of json.items ?? []) {
      if (item.id && item.contentDetails?.duration) durations.set(item.id, item.contentDetails.duration);
    }
  } catch (err) {
    console.warn("[youtube] getDurations failed:", err instanceof Error ? err.message : err);
  }
  return durations;
}

/** View counts for a batch of ids — 1 quota unit per call (up to 50 ids). */
export async function getVideoStats(videoIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!KEY || videoIds.length === 0) return out;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.slice(0, 50).join(",")}&key=${KEY}`,
      { cache: "no-store" }
    );
    if (!res.ok) return out;
    const json = (await res.json()) as { items?: { id?: string; statistics?: { viewCount?: string } }[] };
    for (const item of json.items ?? []) {
      if (item.id && item.statistics?.viewCount) out.set(item.id, Number(item.statistics.viewCount));
    }
  } catch (err) {
    console.warn("[youtube] getVideoStats failed:", err instanceof Error ? err.message : err);
  }
  return out;
}

/**
 * Recent uploads (newest first) — 1 quota unit. YouTube's uploads playlist
 * orders completed LIVE STREAMS by their scheduled date rather than when
 * they actually happened, so playlist order can't be trusted: we fetch 50
 * and sort by the video's real publish date ourselves.
 * Returns [] without an API key or on any failure; callers fall back to
 * the keyless playlist embed.
 */
export async function getRecentVideos(limit = 12): Promise<SermonVideo[]> {
  if (!KEY) return [];
  try {
    // UULF = the channel's "Videos" tab only (their published uploads with
    // proper thumbnails) — NOT raw live-stream VODs (whose auto thumbnail
    // is the outro frame) and not shorts.
    const playlist = CHANNEL.replace(/^UC/, "UULF");
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlist}` +
      `&maxResults=50&key=${KEY}`;
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
          thumbnails?: {
            medium?: { url?: string };
            high?: { url?: string };
            standard?: { url?: string };
            maxres?: { url?: string };
          };
        };
        contentDetails?: { videoPublishedAt?: string };
      }[];
    };
    const parsed = (json.items ?? [])
      .map((i) => ({
        videoId: i.snippet?.resourceId?.videoId ?? "",
        // Some uploads are duplicated from streams as "Copy of …" — the
        // copy is the published version; hide the prefix.
        title: (i.snippet?.title ?? "Untitled").replace(/^copy of\s*/i, ""),
        // contentDetails carries the video's true publish time; snippet's
        // publishedAt is only "when it was added to the playlist".
        publishedAt: i.contentDetails?.videoPublishedAt ?? i.snippet?.publishedAt ?? "",
        // The API only lists sizes that actually exist, so preferring
        // maxres never 404s the way hardcoding maxresdefault.jpg did.
        thumbnail:
          i.snippet?.thumbnails?.maxres?.url ??
          i.snippet?.thumbnails?.standard?.url ??
          i.snippet?.thumbnails?.high?.url ??
          i.snippet?.thumbnails?.medium?.url ??
          null,
        thumbSmall: i.snippet?.thumbnails?.medium?.url ?? i.snippet?.thumbnails?.high?.url ?? null,
      }))
      .filter((v) => v.videoId && v.publishedAt)
      .filter((v) => !/#shorts/i.test(v.title))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, limit);

    const durations = await getDurations(parsed.map((v) => v.videoId));
    return parsed.map((v) => ({ ...v, duration: durations.get(v.videoId) ?? null }));
  } catch (err) {
    console.warn("[youtube] getRecentVideos failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
