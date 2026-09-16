import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { getRecentVideos } from "@/lib/youtube";
import { parseSermon } from "@/lib/sermons";
import LiteYouTube from "@/components/LiteYouTube";
import SermonBrowser from "@/components/SermonBrowser";
import { SermonVideoJsonLd } from "@/components/JsonLd";
import { getSermonSummary } from "@/lib/sermon-summary";

// SermonAudio already generates a real podcast feed (actual MP3 files,
// iTunes tags, artwork) from the same account linked in the footer — the
// broadcaster page URL and the feed URL share the same account slug.
const sermonAudioSlug = site.social.sermonAudio?.match(/sermonaudio\.com\/(?:broadcasters|solo)\/([^/]+)/)?.[1];
const podcastFeedUrl = sermonAudioSlug ? `https://feed.sermonaudio.com/broadcasters/${sermonAudioSlug}` : null;

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Watch sermons from Faith Baptist Church of Chelsea — expository preaching through the Bible, live-streamed and archived on YouTube.",
  // Metadata merges SHALLOWLY across layout -> page (Next docs: "Merging"),
  // so defining `alternates` here at all replaces the root layout's
  // `alternates.canonical` unless re-specified — canonical must come along.
  ...(podcastFeedUrl
    ? {
        alternates: {
          canonical: "./",
          types: { "application/rss+xml": [{ url: podcastFeedUrl, title: `${site.name} — Sermon Podcast` }] },
        },
      }
    : {}),
};

export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Detroit",
});

// With a YOUTUBE_API_KEY: featured latest message plus a browsable grid of
// recent uploads with titles and dates. Without one: the keyless uploads-
// playlist embed. Both degrade to the YouTube channel link.
export default async function Sermons() {
  const uploadsPlaylist = site.social.youtubeChannelId.replace(/^UC/, "UU");
  const videos = await getRecentVideos(48);
  const [latest, ...rest] = videos;
  const browsable = rest.map(parseSermon);
  // Includes `latest` too — every fetched video gets a VideoObject, not
  // just the ones shown in the browsable grid below.
  const allParsed = videos.map(parseSermon);
  // Only the featured latest message gets an AI summary — real API cost per
  // call, so this stays bounded to the one sermon every visitor actually
  // sees, not all 48 fetched for the archive grid below.
  const latestSummary = latest ? await getSermonSummary(latest.videoId, latest.title) : null;

  return (
    <main className="flex-1">
      <SermonVideoJsonLd sermons={allParsed} />
      <PageHero
        eyebrow="Expository preaching"
        title="Sermons"
        intro="We work through the text and dig into the Word — and every message is recorded. Catch up on anything you missed, or check out the preaching before you visit."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            {latest ? "The latest message" : "Latest messages"}
          </h2>
          <div className="mt-6 overflow-hidden rounded-xl">
            {latest ? (
              <LiteYouTube videoId={latest.videoId} title={latest.title} thumbnail={latest.thumbnail} />
            ) : (
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${uploadsPlaylist}`}
                title="Sermons from Faith Baptist Church of Chelsea — latest uploads"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
          {latest && (
            <p className="mt-3 text-slate-700">
              <span className="font-semibold text-slate-900">{latest.title}</span>
              {latest.publishedAt && <> · {dateFmt.format(new Date(latest.publishedAt))}</>}
            </p>
          )}
          {latestSummary && <p className="mt-2 text-slate-600">{latestSummary}</p>}
          {!latest && (
            <p className="mt-4 text-slate-600">
              Use the playlist icon in the player&rsquo;s top-right corner to
              browse recent messages, or visit the full archive on{" "}
              <a href={site.social.youtube} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                our YouTube channel
              </a>
              .
            </p>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-slate-900">Recent messages</h2>
            <p className="mt-2 text-slate-600">
              Search a passage (&ldquo;Genesis 3&rdquo;), a topic
              (&ldquo;grace&rdquo;), or filter by service.
            </p>
            <div className="mt-6">
              <SermonBrowser sermons={browsable} />
            </div>
            <p className="mt-6 text-slate-600">
              Looking for something older? The complete archive lives on{" "}
              <a href={site.social.youtube} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                our YouTube channel
              </a>
              .
            </p>
            {site.social.sermonAudio && (
              <p className="mt-2 text-slate-600">
                Prefer listening on the go? Subscribe as a podcast in Apple
                Podcasts, Spotify, or any podcast app via{" "}
                <a href={site.social.sermonAudio} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  our SermonAudio page
                </a>
                .
              </p>
            )}
          </div>
        </section>
      )}

      <section className="bg-slate-50 px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900">We stream live</h2>
          <p className="mt-3 text-slate-700">
            Can&rsquo;t be here in person? Sunday services stream live on{" "}
            <a href={site.social.youtube} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              YouTube
            </a>{" "}
            and{" "}
            <a href={site.social.facebook} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              Facebook
            </a>
            .
          </p>
        </div>
      </section>

      <NextStep
        title="Live stream is great, but in person is even better"
        text="Watch online — then join us in person."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Subscribe on YouTube", href: site.social.youtube }}
      />
    </main>
  );
}
