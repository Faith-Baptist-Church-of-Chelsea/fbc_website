import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import site from "@/content/site.json";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | Chelsea, Michigan`,
    template: `%s | ${site.name}`,
  },
  description:
    "Faith Baptist Church in Chelsea, Michigan — an extremely friendly church that preaches the Bible expositionally. Join us Sundays at 9:45 & 11 AM and 6 PM.",
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
