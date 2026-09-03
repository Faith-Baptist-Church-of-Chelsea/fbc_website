import type { Metadata } from "next";
import { Anton, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import site from "@/content/site.json";
import { Analytics } from "@vercel/analytics/react";
import { ChurchJsonLd } from "@/components/JsonLd";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display face for big headings — bold, condensed, confident.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Elegant serif accent — reserved for the gospel section and /salvation.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// The site's public URL, used to build absolute links for Facebook/social
// previews. NEXT_PUBLIC_SITE_URL (set in Vercel) overrides the default —
// when we eventually cut over to fbcchelsea.org, set it there or update
// the fallback below.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Relative canonical in a shared layout resolves per-page against
  // metadataBase automatically — every page gets its own correct
  // canonical URL without touching each page's own metadata. Google
  // was flagging pages as duplicates "without a user-selected canonical"
  // because the site never explicitly declared one before this.
  alternates: { canonical: "./" },
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
    images: ["/images/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ChurchJsonLd />
        <Analytics />
      </body>
    </html>
  );
}
