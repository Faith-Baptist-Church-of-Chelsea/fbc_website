import bulletin from "@/content/bulletin.json";

// content/bulletin.json starts as `{ "bulletins": [] }` — TS infers an empty
// array literal as never[], so the shape needs spelling out explicitly.
type BulletinEntry = { weekOf: string | null; pdf: string | null };
const bulletins = bulletin.bulletins as BulletinEntry[];

/** The Sunday that starts the current week, as a YYYY-MM-DD string — a
 *  bulletin runs Sunday-Saturday, so whichever entry has this exact date
 *  is the one to show. UTC arithmetic on an already-Detroit-resolved date
 *  string keeps this safe across the DST transition. */
function currentWeekSunday(): string {
  const todayInDetroit = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
  const d = new Date(`${todayInDetroit}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

/** Whichever bulletin (if any) is tagged with the Sunday that started this
 *  week — set in Keystatic, can be uploaded days ahead of its week. */
export function getCurrentBulletin(): BulletinEntry | null {
  return bulletins.find((b) => b.weekOf === currentWeekSunday()) ?? null;
}
