import Link from "next/link";
import site from "@/content/site.json";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// A 404 should answer the question the visitor probably had anyway:
// when do you meet, where are you, and how do I plan a visit.
// Header/Footer are included directly because this file lives outside
// the (site) route group (Next.js requires the global 404 at app root).
export default function NotFound() {
  return (
    <>
      <Header />
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
      </main>
      <Footer />
    </>
  );
}
