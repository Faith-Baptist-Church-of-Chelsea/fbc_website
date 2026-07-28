"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type CarouselItem = {
  title: string;
  dateLabel: string;
  meta: string | null;
  href: string;
  image: string | null;
  dayNum: string;
  month: string;
};

// Auto-rotating featured-events cards (Summit-style). Advances every 5s,
// pauses while hovered or touched, and users can swipe/scroll manually.
export default function EventsCarousel({ items }: { items: CarouselItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = track.current;
      if (!el || paused) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + 24;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - step / 2;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      ref={track}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]"
    >
      {items.map((e, i) => (
        <a
          key={i}
          href={e.href}
          className="hover-lift group w-[19rem] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg sm:w-[22rem]"
        >
          {e.image ? (
            <Image
              src={e.image}
              alt=""
              width={1920}
              height={1080}
              sizes="(max-width: 640px) 90vw, 384px"
              className="aspect-video w-full bg-slate-950 object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-brand-600 via-slate-800 to-slate-950">
              <div className="text-center">
                <p className="font-display text-5xl leading-none">{e.dayNum}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.25em] text-brand-400">{e.month}</p>
              </div>
            </div>
          )}
          <div className="p-5">
            <h3 className="text-lg font-bold leading-snug group-hover:text-brand-400">{e.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{e.dateLabel}</p>
            {e.meta && <p className="mt-0.5 text-sm text-slate-400">{e.meta}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}
