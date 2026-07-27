import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Watch sermons from Faith Baptist Church of Chelsea — expository preaching through the Bible, live-streamed and archived on YouTube.",
};

// Interim sermons page: embeds the channel's uploads playlist (newest first)
// with no API key needed. Phase 6 replaces this with a proper archive
// (browsable by date and speaker) built on the YouTube Data API.
export default function Sermons() {
  const uploadsPlaylist = site.social.youtubeChannelId.replace(/^UC/, "UU");

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Expository preaching"
        title="Sermons"
        intro="We work through the text and dig into the Word — and every message is recorded. Catch up on anything you missed, or check out the preaching before you visit."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">Latest messages</h2>
          <div className="mt-6 overflow-hidden rounded-xl">
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${uploadsPlaylist}`}
              title="Sermons from Faith Baptist Church of Chelsea — latest uploads"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-slate-600">
            Use the playlist icon in the player&rsquo;s top-right corner to
            browse recent messages, or visit the full archive on{" "}
            <a href={site.social.youtube} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              our YouTube channel
            </a>
            .
          </p>
        </div>
      </section>

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
        title="A sermon is better with the singing before it"
        text="Watch online this week — then come hear one in the room."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Subscribe on YouTube", href: site.social.youtube }}
      />
    </main>
  );
}
