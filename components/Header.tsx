"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ministries,
  planYourVisit,
  primaryLinks,
  secondaryLinks,
} from "@/lib/nav";

// Site-wide header. Client component only because the mobile menu and the
// Ministries dropdown need open/closed state — everything else is static.
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ministriesOpen, setMinistriesOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu when a link is chosen.
  const close = () => {
    setMobileOpen(false);
    setMinistriesOpen(false);
  };

  const linkClass = (href: string) =>
    `rounded px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "text-white"
        : "text-slate-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/85">
      <nav
        aria-label="Main"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-2 px-4"
      >
        <Link
          href="/"
          onClick={close}
          aria-label="Faith Baptist Church of Chelsea — home"
          className="flex shrink-0 items-center gap-3"
        >
          <Image
            src="/images/logo-mark-white.png"
            alt=""
            width={471}
            height={254}
            priority
            className="h-[42px] w-auto"
          />
          {/* Real text, not an image. FAITH's letters are spread with
              justify-between so the word is exactly as wide as the
              BAPTIST CHURCH line beneath it. */}
          <span className="inline-block leading-none">
            <span aria-hidden="true" className="flex justify-between font-display text-[27px] text-white">
              <span>F</span><span>A</span><span>I</span><span>T</span><span>H</span>
            </span>
            <span
              className="mt-[4px] block whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.32em] text-brand-400"
              style={{ marginRight: "-0.32em" }}
            >
              Baptist Church
            </span>
            <span className="sr-only">Faith Baptist Church</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          <Link href="/about" className={linkClass("/about")}>
            About
          </Link>

          {/* Ministries dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMinistriesOpen(true)}
            onMouseLeave={() => setMinistriesOpen(false)}
          >
            <button
              type="button"
              aria-expanded={ministriesOpen}
              onClick={() => setMinistriesOpen((o) => !o)}
              className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {ministries.label}
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${ministriesOpen ? "rotate-180" : ""}`}>
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {ministriesOpen && (
              <div className="absolute left-0 top-full w-48 rounded-b-lg bg-slate-900 py-2 shadow-lg">
                {ministries.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {primaryLinks
            .filter((l) => l.href !== "/about")
            .map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}

          <Link
            href={planYourVisit.href}
            className="ml-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {planYourVisit.label}
          </Link>
        </div>

        {/* Mobile: visit button + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={planYourVisit.href}
            onClick={close}
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white"
          >
            Visit
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded p-2 text-slate-200"
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-800 bg-slate-950 px-4 pb-6 pt-2 lg:hidden">
          <Link
            href={planYourVisit.href}
            onClick={close}
            className="mt-2 block rounded-lg bg-brand-500 px-4 py-3 text-center text-base font-semibold text-white"
          >
            {planYourVisit.label}
          </Link>
          <div className="mt-4 space-y-1">
            {primaryLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-200 hover:bg-slate-900">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {ministries.label}
          </p>
          <div className="mt-1 space-y-1">
            {ministries.links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-200 hover:bg-slate-900">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-slate-800 pt-4">
            {secondaryLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-300 hover:bg-slate-900">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
