// Reads the church's public Google Calendar (the same one embedded on
// Church Center's upcoming-events page) via its ICS feed — no API key, no
// quota. Recurring events are expanded via each event's RRULE. Fails soft:
// any problem returns [] and the Events page simply omits the section.
import "server-only";
import type { VEvent } from "node-ical";

const ICS_URL =
  "https://calendar.google.com/calendar/ical/qttgtkjtirococheeaoiflgldo%40group.calendar.google.com/public/basic.ics";

export type CalendarEvent = {
  title: string;
  start: string; // ISO
  allDay: boolean;
  location: string | null;
  description: string | null;
};

const LOOKAHEAD_DAYS = 90;

// node-ical fields can be plain strings or {params, val} objects.
function text(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "val" in v) return String((v as { val: unknown }).val);
  return "";
}

export async function getUpcomingCalendarEvents(limit = 12): Promise<CalendarEvent[]> {
  try {
    // Imported lazily: node-ical trips Next's build-time page analysis when
    // imported at module scope (BigInt shim issue), and lazy-loading also
    // keeps it out of every other route's bundle.
    const ical = await import("node-ical");
    const res = await fetch(ICS_URL, { next: { revalidate: 900 } });
    if (!res.ok) {
      console.warn(`[calendar] ICS fetch HTTP ${res.status}`);
      return [];
    }
    const data = ical.parseICS(await res.text());
    const now = new Date();
    const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 3600 * 1000);
    const out: CalendarEvent[] = [];

    for (const item of Object.values(data)) {
      if (!item || item.type !== "VEVENT") continue;
      const ev = item as VEvent;
      const allDay = (ev.datetype as string | undefined) === "date";

      if (ev.rrule) {
        // Recurring: expand occurrences in our window, minus exceptions.
        const exdates = new Set(
          Object.values(ev.exdate ?? {}).map((d) => new Date(d as unknown as Date).toDateString())
        );
        for (const occ of ev.rrule.between(now, horizon, true)) {
          if (exdates.has(occ.toDateString())) continue;
          out.push({ title: text(ev.summary) || "Event", start: occ.toISOString(), allDay, location: text(ev.location) || null, description: text(ev.description) || null });
        }
      } else {
        const start = new Date(ev.start);
        if (start >= now && start <= horizon) {
          out.push({ title: text(ev.summary) || "Event", start: start.toISOString(), allDay, location: text(ev.location) || null, description: text(ev.description) || null });
        }
      }
    }

    return out.sort((a, b) => a.start.localeCompare(b.start)).slice(0, limit);
  } catch (err) {
    console.warn("[calendar] failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
