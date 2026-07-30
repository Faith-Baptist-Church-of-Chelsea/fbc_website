// Server-side helpers for the build-your-own pages collection
// (content/pages/*.yaml, edited under "Pages" in /keystatic).
// Rendered by app/(site)/[slug]/page.tsx; built-in pages always win a
// name collision because Next.js prefers static routes over dynamic ones.
import { reader } from "@/lib/content";
import type { NavLink } from "@/lib/nav";

/** The block union as the Keystatic reader returns it. */
export type PageSection = NonNullable<
  Awaited<ReturnType<typeof reader.collections.pages.read>>
>["sections"][number];

export type CustomPage = NonNullable<Awaited<ReturnType<typeof getCustomPage>>>;

/**
 * Web addresses owned by pages built in code. A custom page with one of
 * these names would be silently shadowed by the built-in page, so the
 * places that list custom pages (menus, sitemap) skip them entirely.
 */
export const RESERVED_SLUGS = new Set([
  "about", "church-center-app", "common-questions", "contact", "events",
  "family-school", "fbc-kids", "give", "live", "plan-your-visit",
  "salvation", "sermons", "special-music", "young-adults", "youth-group",
  "admin", "api", "keystatic",
]);

/** All custom pages that actually resolve (reserved names filtered out). */
export async function getCustomPages() {
  const all = await reader.collections.pages.all();
  return all
    .filter(({ slug }) => !RESERVED_SLUGS.has(slug))
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      menu: entry.menu,
      menuOrder: entry.menuOrder ?? 99,
    }));
}

/** One custom page, or null. */
export async function getCustomPage(slug: string) {
  if (RESERVED_SLUGS.has(slug)) return null;
  const entry = await reader.collections.pages.read(slug);
  if (!entry) return null;
  return entry;
}

/**
 * Custom pages' menu entries, for the header's Ministries dropdown and the
 * footer. Never throws — a half-saved page in the CMS must not take down
 * the layout of every page on the site.
 */
export async function getCustomNavLinks(): Promise<{
  ministries: NavLink[];
  footer: NavLink[];
}> {
  try {
    const pages = await getCustomPages();
    const links = (menu: "ministries" | "footer"): NavLink[] =>
      pages
        .filter((p) => p.menu === menu)
        .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title))
        .map((p) => ({ label: p.title, href: `/${p.slug}` }));
    return { ministries: links("ministries"), footer: links("footer") };
  } catch {
    return { ministries: [], footer: [] };
  }
}
