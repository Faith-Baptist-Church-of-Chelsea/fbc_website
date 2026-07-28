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
