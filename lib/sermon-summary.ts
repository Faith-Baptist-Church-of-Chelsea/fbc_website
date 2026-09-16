// AI-generated 2-3 sentence summary of the latest sermon, so a visitor
// deciding whether to watch has more than just the title to go on.
//
// Transcripts come from YouTube's official captions API (captions.list +
// captions.download), which requires OAuth as the channel owner/manager —
// there's no way to get real caption text without it. (An earlier attempt
// scraped the public timedtext endpoint used by the player; YouTube now
// returns an empty body for every unauthenticated request to it, confirmed
// directly — that path is dead.) YOUTUBE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN
// come from a one-time OAuth consent Steven granted as the channel owner.
//
// Caching: this project doesn't have Cache Components enabled (next.config.ts
// has no `cacheComponents: true`) — that's a sitewide opt-in with broad
// rendering/caching implications for every route, not something to flip on
// as a side effect of one feature. `unstable_cache` (the API Cache Components
// replaces) is soft-deprecated but still fully supported, uses the same
// persistent Vercel Data Cache, and is the right-sized tool here.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";

/** A fresh access token from the stored refresh token — access tokens are
 *  short-lived (~1hr), the refresh token is the long-lived credential. */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      console.warn(`[sermon-summary] token refresh HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (err) {
    console.warn("[sermon-summary] token refresh failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function srtToPlainText(srt: string): string {
  return srt
    .split(/\r?\n/)
    .filter((line) => !/^\d+$/.test(line.trim()) && !line.includes("-->"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  try {
    const listRes = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) {
      console.warn(`[sermon-summary] captions.list HTTP ${listRes.status}`);
      return null;
    }
    const listJson = (await listRes.json()) as {
      items?: { id: string; snippet?: { language?: string; trackKind?: string } }[];
    };
    const tracks = listJson.items ?? [];
    if (tracks.length === 0) return null;
    const track = tracks.find((t) => t.snippet?.language?.startsWith("en")) ?? tracks[0];

    const dlRes = await fetch(
      `https://www.googleapis.com/youtube/v3/captions/${track.id}?tfmt=srt`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!dlRes.ok) {
      console.warn(`[sermon-summary] captions.download HTTP ${dlRes.status}`);
      return null;
    }
    const srt = await dlRes.text();
    return srtToPlainText(srt) || null;
  } catch (err) {
    console.warn("[sermon-summary] transcript fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function generateSummary(videoId: string, title: string): Promise<string | null> {
  const text = await fetchTranscript(videoId);
  if (!text) return null;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 500,
      system:
        "You summarize church sermon transcripts for someone deciding whether to watch. Respond with EXACTLY 2-3 sentences, under 70 words total — what the message is about and the main takeaway. Never invent details not in the transcript. No preamble, no line breaks, just the summary as one short paragraph.",
      messages: [
        {
          role: "user",
          content: `Sermon title: ${title}\n\nTranscript:\n${text.slice(0, 60_000)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    const summary = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return summary || null;
  } catch (err) {
    console.warn("[sermon-summary] Claude call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Cached for 30 days per video — a sermon's summary never changes, so
 *  there's no reason to regenerate it on every request. */
export const getSermonSummary = unstable_cache(generateSummary, ["sermon-summary"], {
  revalidate: 60 * 60 * 24 * 30,
});
