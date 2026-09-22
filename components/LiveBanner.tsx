"use client";

import { useEffect, useRef, useState } from "react";
import { nearServiceStart } from "@/lib/service-windows";
import { ES, serviceName, type Locale } from "@/lib/i18n";

type LiveState = {
  show: boolean;
  verified?: boolean;
  label?: string;
  videoId?: string | null;
};

// Shows during service windows, unmistakably, at the very top of the page.
// Wording is honest about what we know: "WE'RE LIVE" only when the YouTube
// API confirmed it; otherwise "happening now" with a watch link.
export default function LiveBanner({ locale = "en" }: { locale?: Locale }) {
  const es = locale === "es";
  const [state, setState] = useState<LiveState | null>(null);
  // Refs (not state) so the polling interval can read them without
  // re-subscribing every time the banner toggles.
  const showingRef = useRef(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Add ?preview-live to any page URL to see the banner without being
    // live — for checking the design, not shown to normal visitors.
    const preview = window.location.search.includes("preview-live");
    const check = () => {
      lastCheck.current = Date.now();
      (preview
        ? Promise.resolve({ show: true, verified: true, label: "Sunday Morning Service (preview)" })
        : fetch("/api/live")
            .then((r) => (r.ok ? r.json() : { show: false }))
      )
        .then((s: LiveState) => {
          if (!cancelled) {
            showingRef.current = Boolean(s.show);
            setState(s);
          }
        })
        .catch(() => {
          if (!cancelled) setState((prev) => prev ?? { show: false });
        });
    };
    check();
    // A tab opened before the service starts should still get the banner.
    // Re-check every 45s in the stretch around a scheduled service start
    // (when going live is actually expected and the banner isn't up yet),
    // every 5 min otherwise — keeps request volume low from tabs left open
    // all week without making the banner slow to appear when it matters.
    // Also re-check on tab refocus and when a phone restores the page from
    // its back-forward cache (effects don't re-run on that restore).
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const wanted = nearServiceStart() && !showingRef.current ? 45_000 : 300_000;
      if (Date.now() - lastCheck.current >= wanted) check();
    }, 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      cancelled = true;
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  if (!state?.show) return null;

  const watchUrl = "/live";

  return (
    <div className="bg-red-700 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
        <p className="font-bold">
        <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-white align-middle" aria-hidden="true" />
          {es
            ? state.verified
              ? ES.live.verified(serviceName("es", state.label ?? ""))
              : ES.live.scheduled(serviceName("es", state.label ?? ""))
            : state.verified
              ? `We're live right now — ${state.label}`
              : `${state.label} is happening now`}
        </p>
        <a
          href={watchUrl}
          className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          {es ? ES.live.watch : "Watch the live stream"}
        </a>
      </div>
    </div>
  );
}
