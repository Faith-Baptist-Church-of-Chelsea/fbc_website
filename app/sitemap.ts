import type { MetadataRoute } from "next";

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
  "/events",
  "/missions",
  "/give",
  "/church-center-app",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "/events" || p === "/sermons" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/plan-your-visit" ? 0.9 : 0.6,
  }));
}
