import Link from "next/link";
import site from "@/content/site.json";

// The 404 body, shared by the two not-found boundaries:
//   app/(site)/not-found.tsx — what almost every unknown URL hits, because
//     the (site)/[slug] route matches it and calls notFound(); it renders
//     INSIDE the (site) layout, which already supplies Header/Footer.
//   app/not-found.tsx — the root boundary for paths outside the (site)
//     group; that one adds Header/Footer itself.
// Rendering the chrome in both places is what produced a doubled header.
export default function NotFoundContent() {
  return (
  <main className="flex-1 px-4 py-20 text-center">
  <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
    Page not found
  </p>
  <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
    That page isn&rsquo;t here — but you&rsquo;re welcome anytime.
  </h1>
  <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
    The link may be old or mistyped. Here&rsquo;s what most people are
    looking for:
  </p>
  <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
    <ul className="rounded-lg border border-slate-200 p-6 text-slate-700">
      {site.services.map((s) => (
        <li key={`${s.day}-${s.time}`} className="py-1">
          <span className="font-semibold text-slate-900">
            {s.day} {s.time}
          </span>{" "}
          — {s.name}
        </li>
      ))}
    </ul>
  </div>
  <div className="mt-8 flex flex-wrap justify-center gap-4">
    <Link
      href="/plan-your-visit"
      className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
    >
      Plan Your Visit
    </Link>
    <Link
      href="/"
      className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
    >
      Go to the homepage
    </Link>
  </div>
  <nav aria-label="Main pages" className="mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-brand-700">
    {[
      ["/sermons", "Sermons"],
      ["/live", "Watch Live"],
      ["/events", "Events"],
      ["/give", "Give"],
      ["/about", "About"],
      ["/contact", "Contact"],
    ].map(([href, label]) => (
      <Link key={href} href={href} className="underline-offset-4 hover:underline">
        {label}
      </Link>
    ))}
  </nav>
  </main>
  );
}
