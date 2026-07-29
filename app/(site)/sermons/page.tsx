import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { getRecentVideos } from "@/lib/youtube";
import { parseSermon } from "@/lib/sermons";
import LiteYouTube from "@/components/LiteYouTube";
import SermonBrowser from "@/components/SermonBrowser";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Watch sermons from Faith Baptist Church of Chelsea — expository preaching through the Bible, live-streamed and archived on YouTube.",
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

  return (
    <main className="flex-1">
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
