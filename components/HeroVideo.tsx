"use client";

import { useEffect, useRef } from "react";

// The homepage's background footage. Rendered as just the poster frame on
// the server (no video bytes requested), then upgraded to the video only
// when it's worth it: a large screen, no data-saver, no reduced-motion
// preference, and a fast connection. Lighthouse measured the mp4 at 3.9 MB
// on a phone — ~80% of the whole page — for a clip that's mostly hidden
// under an overlay and never the LCP element (the poster is).
export default function HeroVideo({ src, poster, className }: { src: string; poster: string; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    const conn = nav.connection;
    const slow = conn?.saveData === true || (conn?.effectiveType ? !/4g/.test(conn.effectiveType) : false);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smallScreen = window.matchMedia("(max-width: 767px)").matches;
    if (slow || reducedMotion || smallScreen) return;
    // Let the browser's own (muted) autoplay start it once data arrives —
    // calling play() the instant src is assigned can be interrupted by the
    // load that assignment triggers. The canplay listener is the fallback.
    video.autoplay = true;
    video.src = src;
    const start = () => {
      video.play().catch(() => {
        /* autoplay refused — the poster stays, which is fine */
      });
    };
    video.addEventListener("canplay", start, { once: true });
    return () => video.removeEventListener("canplay", start);
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-hidden="true"
    />
  );
}
