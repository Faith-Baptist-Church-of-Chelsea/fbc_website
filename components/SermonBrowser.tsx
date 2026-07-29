"use client";

import { useMemo, useState } from "react";
import type { ParsedSermon, SermonKind } from "@/lib/sermons";

const KINDS: (SermonKind | "All")[] = [
  "All",
  "Sunday AM",
  "Sunday PM",
  "Midweek",
  "Family School",
  "Special",
];

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Detroit",
});

// Search + filter over recent messages. Everything happens client-side —
// the sermons arrive already parsed from the server component.
export default function SermonBrowser({ sermons }: { sermons: ParsedSermon[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");

  const counts = useMemo(() => {
    const c = new Map<string, number>([["All", sermons.length]]);
    for (const s of sermons) c.set(s.kind, (c.get(s.kind) ?? 0) + 1);
    return c;
  }, [sermons]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons.filter(
      (s) =>
        (kind === "All" || s.kind === kind) &&
        (!q ||
          s.raw.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          (s.passage ?? "").toLowerCase().includes(q))
    );
  }, [sermons, query, kind]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search sermons</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a passage or topic…"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by service">
          {KINDS.filter((k) => (counts.get(k) ?? 0) > 0).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                kind === k
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
            >
              {k}
              <span className={kind === k ? "ml-1.5 text-slate-400" : "ml-1.5 text-slate-400"}>
                {counts.get(k)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-slate-600">
          Nothing matches — try fewer words, or browse the full archive on YouTube below.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <li key={s.videoId}>
              <a
                href={`https://www.youtube.com/watch?v=${s.videoId}`}
                className="group block h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
              >
                {s.thumbnail && (
                  /* eslint-disable-next-line @next/next/no-img-element --
                     YouTube CDN thumbnail, fixed size, not worth proxying */
                  <img src={s.thumbnail} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    {s.kind}
                    {s.publishedAt && <> · {dateFmt.format(new Date(s.publishedAt))}</>}
                  </p>
                  <p className="mt-1.5 font-semibold text-slate-900 group-hover:text-brand-700">
                    {s.title}
                  </p>
                  {s.passage && <p className="mt-1 text-sm text-slate-500">{s.passage}</p>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
