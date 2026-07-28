"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Reveals each page section as it scrolls into view (see globals.css for
// the transition). Renders nothing; it only wires up an IntersectionObserver.
// The hero (anything containing .animate-rise) is skipped — it has its own
// entrance animation.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-reveal");

    const sections = [...document.querySelectorAll<HTMLElement>("main > section")].filter(
      (s) => !s.querySelector(".animate-rise") && !s.classList.contains("revealed")
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    for (const s of sections) {
      s.classList.add("reveal-pending");
      observer.observe(s);
    }
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
