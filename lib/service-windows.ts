// Shared definition of "when might we be streaming" — used by the live
// banner (client) and the /api/live route (server), so keep it free of
// server-only imports.
//
// Windows are service start → start + 105 minutes, in Michigan time.
// If service times change, update BOTH content/site.json (what the site
// displays) and this list (when the banner appears).
export type ServiceWindow = {
  day: number; // 0 = Sunday … 6 = Saturday
  startMinutes: number; // minutes since midnight, America/Detroit
  durationMinutes: number;
  label: string;
};

export const SERVICE_WINDOWS: ServiceWindow[] = [
  { day: 0, startMinutes: 9 * 60 + 45, durationMinutes: 75, label: "Family School" },
  { day: 0, startMinutes: 11 * 60, durationMinutes: 105, label: "Sunday Morning Service" },
  { day: 0, startMinutes: 18 * 60, durationMinutes: 105, label: "Sunday Evening Service" },
  { day: 3, startMinutes: 19 * 60, durationMinutes: 105, label: "Midweek Service" },
];

/** The next upcoming service (label + friendly time), Michigan time. */
export function nextService(now = new Date()): { label: string; when: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const nowMinutes = dayIndex * 24 * 60 + parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
  const WEEK = 7 * 24 * 60;

  let best: { delta: number; w: ServiceWindow } | null = null;
  for (const w of SERVICE_WINDOWS) {
    const start = w.day * 24 * 60 + w.startMinutes;
    const delta = (start - nowMinutes + WEEK) % WEEK;
    if (!best || delta < best.delta) best = { delta, w };
  }
  const w = best!.w;
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][w.day];
  const h = Math.floor(w.startMinutes / 60);
  const m = w.startMinutes % 60;
  const time = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  return { label: w.label, when: `${dayName} at ${time}` };
}

/** The window we're currently inside, if any (Michigan time). */
export function currentServiceWindow(now = new Date()): ServiceWindow | null {
  // Read the current weekday/time in America/Detroit regardless of where
  // the server or visitor actually is.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minutes = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);

  return (
    SERVICE_WINDOWS.find(
      (w) =>
        w.day === dayIndex &&
        minutes >= w.startMinutes &&
        minutes < w.startMinutes + w.durationMinutes
    ) ?? null
  );
}
