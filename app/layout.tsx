import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import site from "@/content/site.json";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// The site's public URL, used to build absolute links for Facebook/social
// previews. NEXT_PUBLIC_SITE_URL (set in Vercel) overrides the default —
// when we eventually cut over to fbcchelsea.org, set it there or update
// the fallback below.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | Chelsea, Michigan`,
    template: `%s | ${site.name}`,
  },
  description:
    "Faith Baptist Church in Chelsea, Michigan — an extremely friendly church that preaches the Bible expositionally. Join us Sundays at 9:45 & 11 AM and 6 PM.",
  openGraph: {
    siteName: `${site.name} of Chelsea`,
    type: "website",
    locale: "en_US",
    // TODO: replace with a real photo-based OG image in phase 8
    // (nearly all traffic arrives from Facebook — this preview matters).
    images: ["/images/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
