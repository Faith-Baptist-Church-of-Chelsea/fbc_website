import type { MetadataRoute } from "next";
import { getUpcomingEvents } from "@/lib/content";
import { getCustomPages } from "@/lib/pages";

// All public pages, for search engines. The base URL matches the one in
// app/layout.tsx (env override first, production URL as fallback).
const base =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

const pages = [
  "",
  "/plan-your-visit",
  "/common-questions",
  "/about",
  "/family-school",
  "/fbc-kids",
  "/youth-group",
  "/young-adults",
  "/special-music",
  "/sermons",
  "/live",
  "/salvation",
  "/events",
  "/give",
  "/church-center-app",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getUpcomingEvents();
  // Build-your-own pages from /keystatic (includes /missions).
  const customPages = await getCustomPages();
  return [
    ...pages.map((p) => ({
      url: `${base}${p}`,
      changeFrequency: (p === "/events" || p === "/sermons" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: p === "" ? 1 : p === "/plan-your-visit" ? 0.9 : 0.6,
    })),
    ...customPages
      .filter((p) => !pages.includes(`/${p.slug}`))
      .map((p) => ({
      url: `${base}/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
