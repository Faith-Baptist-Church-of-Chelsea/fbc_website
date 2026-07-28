"use client";

import { useState } from "react";

// YouTube "facade": renders just the thumbnail with a play button, and only
// loads the real (heavy, ~1MB+) YouTube player when someone clicks. This is
// the single biggest page-weight win on the site.
export default function LiteYouTube({
  videoId,
  title,
  thumbnail,
}: {
  videoId: string;
  title: string;
  thumbnail?: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative block aspect-video w-full bg-slate-950"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbnail */}
      <img
        src={thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 bg-slate-950/20 transition-colors group-hover:bg-slate-950/10" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-16 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600 transition-transform group-hover:scale-110"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
