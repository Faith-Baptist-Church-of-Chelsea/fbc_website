import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

// Everything public is crawlable; the admin panel and API routes are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/keystatic", "/admin", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
