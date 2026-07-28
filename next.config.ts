import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The /api/ask route reads content/ files from disk at request time
  // (chat-facts.md, staff bios, announcements). Vercel only bundles files
  // it can statically trace, so include the whole content folder for that
  // function explicitly.
  outputFileTracingIncludes: {
    "/api/ask": ["./content/**/*"],
    "/api/digest": ["./content/**/*"],
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
      { source: "/statement-of-faith", destination: "/about#statement-of-faith", permanent: true },
      { source: "/statement-of-faith/", destination: "/about#statement-of-faith", permanent: true },
      { source: "/teachers", destination: "/fbc-kids", permanent: true },
      { source: "/teachers/", destination: "/fbc-kids", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/visit", destination: "/plan-your-visit", permanent: true },
      { source: "/watch", destination: "/live", permanent: true },
    ];
  },
};

export default nextConfig;
