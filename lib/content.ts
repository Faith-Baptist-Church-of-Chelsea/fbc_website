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

export type ChurchEvent = {
  slug: string;
  title: string;
  date: string;
  time: string;
  showUntil: string | null;
  location: string;
  image: string | null;
  signupLink: string | null;
};

/** Upcoming manually-entered events (content/events), soonest first. */
export async function getUpcomingEvents(): Promise<ChurchEvent[]> {
  const all = await reader.collections.events.all();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      date: entry.date ?? "",
      time: entry.time ?? "",
      showUntil: entry.showUntil ?? null,
      location: entry.location ?? "",
      image: entry.image ?? null,
      signupLink: entry.signupLink ?? null,
    }))
    .filter((e) => e.date && (e.showUntil ?? e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** One event with its description text resolved into paragraphs. */
export async function getEvent(slug: string) {
  const entry = await reader.collections.events.read(slug);
  if (!entry) return null;
  const description = (await entry.description())
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return {
    title: entry.title,
    date: entry.date ?? "",
    time: entry.time ?? "",
    showUntil: entry.showUntil ?? null,
    location: entry.location ?? "",
    image: entry.image ?? null,
    signupLink: entry.signupLink ?? null,
    description,
  };
}

/** Homepage testimonials with their quote text resolved. */
export async function getTestimonials() {
  const all = await reader.collections.testimonials.all();
  return Promise.all(
    all.map(async ({ slug, entry }) => ({
      name: entry.name,
      detail: entry.detail,
      quote: (await entry.quote())
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      slug,
    }))
  );
}

/** Church facts (same data as importing content/site.json directly). */
export async function getSite() {
  const site = await reader.singletons.site.read();
  if (!site) throw new Error("content/site.json is missing");
  return site;
}
