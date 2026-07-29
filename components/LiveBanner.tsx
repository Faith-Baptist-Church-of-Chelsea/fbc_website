"use client";

import { useEffect, useState } from "react";

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
    // Add ?preview-live to any page URL to see the banner without being
    // live — for checking the design, not shown to normal visitors.
    const preview = window.location.search.includes("preview-live");
    const check = () => {
      (preview
        ? Promise.resolve({ show: true, verified: true, label: "Sunday Morning Service (preview)" })
        : fetch("/api/live")
            .then((r) => (r.ok ? r.json() : { show: false }))
      )
        .then((s: LiveState) => {
          if (!cancelled) setState(s);
        })
        .catch(() => {
          if (!cancelled) setState((prev) => prev ?? { show: false });
        });
    };
    check();
    // A tab opened before the service starts should still get the banner:
    // re-check every 90s while visible, and immediately on tab refocus.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 90_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!state?.show) return null;

  const watchUrl = "/live";

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
