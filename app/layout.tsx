import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import site from "@/content/site.json";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// NEXT_PUBLIC_SITE_URL is set in Vercel (and .env.local) to the site's
// public URL so Open Graph tags resolve to absolute links. Falls back to
// the Vercel preview URL, then localhost, so builds never fail without it.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
