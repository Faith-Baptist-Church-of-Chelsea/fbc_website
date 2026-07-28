"use client";

import { useEffect, useState } from "react";

export type Testimonial = { quote: string; name: string; detail: string };

// Crossfading rotation of member/visitor testimonials.
export default function TestimonialRotator({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(id);
  }, [items.length]);

  const t = items[index];
  if (!t) return null;

  return (
    <figure aria-live="polite" className="mx-auto max-w-3xl text-center">
      <blockquote key={index} className="testimonial-fade">
        <p className="text-xl leading-relaxed text-slate-100 sm:text-2xl">
          &ldquo;{t.quote}&rdquo;
        </p>
      </blockquote>
      <figcaption className="mt-5">
        <p className="font-bold text-white">{t.name}</p>
        {t.detail && <p className="text-sm text-slate-400">{t.detail}</p>}
      </figcaption>
      {items.length > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${i === index ? "bg-brand-400" : "bg-slate-600 hover:bg-slate-500"}`}
            />
          ))}
        </div>
      )}
    </figure>
  );
}
