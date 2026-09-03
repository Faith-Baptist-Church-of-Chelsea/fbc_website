import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The /api/ask route reads content/ files from disk at request time
  // (chat-facts.md, staff bios, announcements). Vercel only bundles files
  // it can statically trace, so include the whole content folder for that
  // function explicitly.
  // Every page that re-renders on Vercel (ISR or dynamic) reads content/
  // through the Keystatic reader at runtime, so the content files must be
  // bundled into EVERY serverless function — not just the API routes.
  // Without this, the homepage's 15-minute regeneration finds no
  // content/events/ and the carousel silently goes empty.
  outputFileTracingIncludes: {
    "/": ["./content/**/*"],
    "/**": ["./content/**/*"],
    "/api/digest": ["./public/images/events/**/*"],
    "/api/forms": ["./public/images/teachers/**/*"],
  },
  // node-ical must stay a plain Node dependency (bundling breaks it).
  serverExternalPackages: ["node-ical"],
  // Old WordPress URLs -> new pages, so links and search rankings carry
  // over when fbcchelsea.org points here.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // www -> bare domain. Both were serving the identical site
      // independently (no redirect between them), which Google flagged as
      // duplicate content with no canonical we'd chosen — this is the
      // real fix (a redirect is a directive; the canonical tag is only a
      // hint). Keep this first so it applies before any path-specific rule.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.fbcchelsea.org" }],
        destination: "https://fbcchelsea.org/:path*",
        permanent: true,
      },
      { source: "/statement-of-faith", destination: "/about#statement-of-faith", permanent: true },
      { source: "/statement-of-faith/", destination: "/about#statement-of-faith", permanent: true },
      { source: "/teachers", destination: "/fbc-kids", permanent: true },
      { source: "/teachers/", destination: "/fbc-kids", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/visit", destination: "/plan-your-visit", permanent: true },
      { source: "/watch", destination: "/live", permanent: true },
      // Old WordPress URLs still in Google's index — found via
      // site:fbcchelsea.org still returning only these years-old pages.
      // Redirecting (rather than leaving as 404) helps Google connect
      // the old indexed page to its real replacement on the new site.
      { source: "/nursery", destination: "/fbc-kids", permanent: true },
      { source: "/nursery/", destination: "/fbc-kids", permanent: true },
      { source: "/sermon-videos", destination: "/sermons", permanent: true },
      { source: "/sermon-videos/", destination: "/sermons", permanent: true },
      { source: "/email-list", destination: "/", permanent: true },
      { source: "/email-list/", destination: "/", permanent: true },
      { source: "/activity", destination: "/", permanent: true },
      { source: "/activity/", destination: "/", permanent: true },
      { source: "/category/:slug*", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
