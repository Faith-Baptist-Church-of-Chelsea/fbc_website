// Pulls the church's Google reviews via the official Places API (New).
//
// Requirements (one-time, in the same Google Cloud project as the YouTube
// key): enable "Places API (New)" and allow it on the API key. Until then
// this fails soft and the homepage shows only hand-entered testimonials.
// Google returns at most 5 reviews; we show 4-5 star ones, cached daily.
import "server-only";
import site from "@/content/site.json";

export type GoogleReview = {
  quote: string;
  name: string;
  detail: string;
};

export async function getGoogleReviews(): Promise<GoogleReview[]> {
  const key = process.env.YOUTUBE_API_KEY; // same Google Cloud key
  const placeId = site.googlePlaceId;
  if (!key || !placeId) return [];
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=reviews,rating&key=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.warn(`[reviews] Places API HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as {
      reviews?: {
        rating?: number;
        text?: { text?: string };
        authorAttribution?: { displayName?: string };
      }[];
    };
    return (json.reviews ?? [])
      .filter((r) => (r.rating ?? 0) >= 4 && r.text?.text)
      .map((r) => ({
        quote: r.text!.text!.replace(/\s+/g, " ").trim().slice(0, 400),
        name: r.authorAttribution?.displayName ?? "A Google reviewer",
        detail: `Google review · ${"★".repeat(r.rating ?? 5)}`,
      }))
      .slice(0, 5);
  } catch (err) {
    console.warn("[reviews] failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
