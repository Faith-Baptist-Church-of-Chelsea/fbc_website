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
  type NavLink,
} from "@/lib/nav";

// Site-wide header. Client component only because the mobile menu and the
// Ministries dropdown need open/closed state — everything else is static.
//
// extraMinistries / extraSecondary are menu entries from the "Pages"
// collection in /keystatic — the layout reads them server-side and passes
// them in, so volunteer-created pages can appear in the menu with no code
// change.
export default function Header({
  extraMinistries = [],
  extraSecondary = [],
}: {
  extraMinistries?: NavLink[];
  extraSecondary?: NavLink[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ministriesOpen, setMinistriesOpen] = useState(false);
  const pathname = usePathname();
  const ministryLinks = [...ministries.links, ...extraMinistries];
  const moreLinks = [...secondaryLinks, ...extraSecondary];

  // Close the mobile menu when a link is chosen.
  const close = () => {
    setMobileOpen(false);
    setMinistriesOpen(false);
  };

  const linkClass = (href: string) =>
    `rounded px-3 py-2.5 text-sm font-medium transition-colors ${
      pathname === href
        ? "text-white"
        : "text-slate-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-navy/95 backdrop-blur supports-[backdrop-filter]:bg-navy/90">
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
          {/* Moriah's official website logo */}
          <Image
            src="/images/logo-header.png"
            alt="Faith Baptist Church of Chelsea — home"
            width={820}
            height={178}
            priority
            className="h-10 w-auto sm:h-11"
          />
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
              className="flex items-center gap-1 rounded px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {ministries.label}
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${ministriesOpen ? "rotate-180" : ""}`}>
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {ministriesOpen && (
              <div className="absolute left-0 top-full w-48 rounded-b-lg bg-navy py-2 shadow-lg">
                {ministryLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
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
        <div id="mobile-menu" className="border-t border-white/10 bg-navy px-4 pb-6 pt-2 lg:hidden">
          <Link
            href={planYourVisit.href}
            onClick={close}
            className="mt-2 block rounded-lg bg-brand-500 px-4 py-3 text-center text-base font-semibold text-white"
          >
            {planYourVisit.label}
          </Link>
          <div className="mt-4 space-y-1">
            {primaryLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-200 hover:bg-white/10">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {ministries.label}
          </p>
          <div className="mt-1 space-y-1">
            {ministryLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-200 hover:bg-white/10">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            {moreLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block rounded px-2 py-2 text-base text-slate-300 hover:bg-white/10">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
