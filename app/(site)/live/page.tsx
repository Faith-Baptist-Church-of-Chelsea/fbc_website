import type { Metadata } from "next";
import Link from "next/link";
import site from "@/content/site.json";
import NextStep from "@/components/NextStep";
import { checkLiveNow, getRecentVideos, scrapeLiveNow } from "@/lib/youtube";
import { nextService } from "@/lib/service-windows";
import LiteYouTube from "@/components/LiteYouTube";

export const metadata: Metadata = {
  title: "Watch Live",
  description:
    "Watch Faith Baptist Church of Chelsea live — Sunday and Wednesday services stream on this page, with the latest message available anytime.",
};

// Re-render every minute so the page flips to the player promptly when a
// stream starts (the underlying live checks are cached ~5 minutes anyway).
export const revalidate = 60;

export default async function LivePage() {
  const scraped = await scrapeLiveNow();
  let live = scraped.live === true;
  let videoId = scraped.videoId;
  if (live) {
    const api = await checkLiveNow();
    if (api.live === false) live = false;
    if (api.videoId) videoId = api.videoId;
  }
  const next = nextService();
  const [latest] = live ? [undefined] : await getRecentVideos(1);

  return (
    <main className="flex-1">
      <section className="bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          {live ? (
            <>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                Live now
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Welcome — you&rsquo;re right on time.
              </h1>
              <div className="mt-6 overflow-hidden rounded-xl">
                <iframe
                  className="aspect-video w-full"
                  src={
                    videoId
                      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
                      : `https://www.youtube.com/embed/live_stream?channel=${site.social.youtubeChannelId}&autoplay=1`
                  }
                  title="Faith Baptist Church live stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="mt-4 text-slate-300">
                Glad you&rsquo;re here. If you&rsquo;re nearby, we&rsquo;d love
                to have you in the room next time —{" "}
                <Link href="/plan-your-visit" className="font-semibold text-brand-400 underline-offset-4 hover:underline">
                  here&rsquo;s everything you need to know
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-400">
                Watch live
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                We&rsquo;re not live right now.
              </h1>
              <p className="mt-3 text-lg text-slate-300">
                The next service is{" "}
                <span className="font-bold text-white">
                  {next.label}, {next.when}
                </span>{" "}
                (Michigan time). This page becomes the live player the moment
                the stream starts.
              </p>
              {latest && (
                <>
                  <h2 className="mt-10 text-xl font-bold">
                    In the meantime — the latest message
                  </h2>
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <LiteYouTube videoId={latest.videoId} title={latest.title} thumbnail={latest.thumbnail} />
                  </div>
                  <p className="mt-3 text-slate-300">{latest.title}</p>
                </>
              )}
            </>
          )}
          <p className="mt-8 text-sm text-slate-400">
            Streams are also on{" "}
            <a href={site.social.youtube} className="font-semibold text-slate-200 underline-offset-4 hover:underline">
              YouTube
            </a>{" "}
            and{" "}
            <a href={site.social.facebook} className="font-semibold text-slate-200 underline-offset-4 hover:underline">
              Facebook
            </a>
            .
          </p>
        </div>
      </section>

      <NextStep
        title="A screen is a start. A seat is better."
        text="Watching online is a great way to check us out — and there's a seat saved when you're ready."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Browse past sermons", href: "/sermons" }}
      />
    </main>
  );
}
