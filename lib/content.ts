// Server-side helpers for reading content/ files.
// Uses Keystatic's Reader API so pages get the same validation the
// admin panel enforces. Only import this from server components.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";

export const reader = createReader(process.cwd(), keystaticConfig);

/** Staff sorted by their display order (lowest first). */
export async function getStaff() {
  const all = await reader.collections.staff.all();
  return all.sort((a, b) => (a.entry.order ?? 99) - (b.entry.order ?? 99));
}

/** Announcements that haven't expired yet, soonest-expiring first. */
export async function getActiveAnnouncements() {
  const all = await reader.collections.announcements.all();
  const today = new Date().toISOString().slice(0, 10);
  return all
    .filter((a) => !a.entry.expires || a.entry.expires >= today)
    .sort((a, b) => (a.entry.expires ?? "9999").localeCompare(b.entry.expires ?? "9999"));
}

/** Church facts (same data as importing content/site.json directly). */
export async function getSite() {
  const site = await reader.singletons.site.read();
  if (!site) throw new Error("content/site.json is missing");
  return site;
}
