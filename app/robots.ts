import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

// AI-training crawlers only (not search engines — Googlebot/Bingbot/etc.
// stay allowed below, since search visibility matters and blocking them
// would undo it). These don't send visitors; they just add to the Edge
// Request count that counts against the Vercel free-tier cap.
const AI_TRAINING_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Amazonbot",
  "Diffbot",
  "cohere-ai",
  "Omgilibot",
  "YouBot",
];

// Everything public is crawlable; the admin panel and API routes are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/keystatic", "/admin", "/api"] },
      { userAgent: AI_TRAINING_BOTS, disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
