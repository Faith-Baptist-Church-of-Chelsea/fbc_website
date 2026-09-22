"use client";

import { useEffect, useRef } from "react";

// The homepage's background footage. Rendered as just the poster frame on
// the server (no video bytes requested), then upgraded to the video on the
// client: phones get a phone-sized encode (640px, ~1/5 the bytes of the
// full one), everything else the full clip. Only two things keep it as a
// still: the visitor's own data-saver setting, or a reduced-motion
// preference (which the site's CSS honors for this element anyway).
export default function HeroVideo({
  src,
  mobileSrc,
  poster,
  className,
}: {
  src: string;
  mobileSrc: string;
  poster: string;
  className: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const saveData = nav.connection?.saveData === true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (saveData || reducedMotion) return;
    const smallScreen = window.matchMedia("(max-width: 767px)").matches;
    // Let the browser's own (muted) autoplay start it once data arrives —
    // calling play() the instant src is assigned can be interrupted by the
    // load that assignment triggers. The canplay listener is the fallback.
    video.autoplay = true;
    video.src = smallScreen ? mobileSrc : src;
    const start = () => {
      video.play().catch(() => {
        /* autoplay refused — the poster stays, which is fine */
      });
    };
    video.addEventListener("canplay", start, { once: true });
    return () => video.removeEventListener("canplay", start);
  }, [src, mobileSrc]);

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
