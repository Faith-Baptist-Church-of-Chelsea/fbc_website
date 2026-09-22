"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nextServiceStart } from "@/lib/service-windows";

// Ticks down to the next scheduled service. When the target passes, the
// next service rolls forward and the page is refreshed so the live player
// (rendered on the server) can take over.
export default function ServiceCountdown({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null); // null until mounted: avoids a hydration mismatch
  const lastTarget = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const target = nextServiceStart(new Date(t)).startsAt.getTime();
      if (lastTarget.current !== null && target !== lastTarget.current) router.refresh();
      lastTarget.current = target;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [router]);

  if (now === null) return <span className={className} aria-hidden="true">&nbsp;</span>;

  const { startsAt } = nextServiceStart(new Date(now));
  const total = Math.max(0, Math.floor((startsAt.getTime() - now) / 1000));
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const parts: [number, string][] = [
    [d, "d"],
    [h, "h"],
    [m, "m"],
    [s, "s"],
  ];
  const shown = d > 0 ? parts : parts.slice(1);

  return (
    <span className={className} role="timer" aria-live="off">
      {shown.map(([n, unit], i) => (
        <span key={unit} className="tabular-nums">
          {i === 0 ? n : pad(n)}
          <span className="text-slate-400">{unit}</span>
          {i < shown.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
