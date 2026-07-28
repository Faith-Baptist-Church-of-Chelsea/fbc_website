import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/ask route reads content/ files from disk at request time
  // (chat-facts.md, staff bios, announcements). Vercel only bundles files
  // it can statically trace, so include the whole content folder for that
  // function explicitly.
  outputFileTracingIncludes: {
    "/api/ask": ["./content/**/*"],
  },
  // node-ical must stay a plain Node dependency (bundling breaks it).
  serverExternalPackages: ["node-ical"],
};

export default nextConfig;
