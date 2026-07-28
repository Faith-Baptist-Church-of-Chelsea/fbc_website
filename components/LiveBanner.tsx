"use client";

import { useEffect, useState } from "react";
import site from "@/content/site.json";

type LiveState = {
  show: boolean;
  verified?: boolean;
  label?: string;
  videoId?: string | null;
};

// Shows during service windows, unmistakably, at the very top of the page.
// Wording is honest about what we know: "WE'RE LIVE" only when the YouTube
// API confirmed it; otherwise "happening now" with a watch link.
export default function LiveBanner() {
  const [state, setState] = useState<LiveState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/live")
      .then((r) => (r.ok ? r.json() : { show: false }))
      .then((s: LiveState) => {
        if (!cancelled) setState(s);
      })
      .catch(() => {
        if (!cancelled) setState({ show: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state?.show) return null;

  const watchUrl = state.videoId
    ? `https://www.youtube.com/watch?v=${state.videoId}`
    : `${site.social.youtube}/live`;

  return (
    <div className="bg-red-700 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
        <p className="font-bold">
        <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-white align-middle" aria-hidden="true" />
          {state.verified
            ? `We're live right now — ${state.label}`
            : `${state.label} is happening now`}
        </p>
        <a
          href={watchUrl}
          className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          Watch the live stream
        </a>
      </div>
    </div>
  );
}
