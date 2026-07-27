import Image from "next/image";
import site from "@/content/site.json";

// Phase 1 placeholder homepage. The real homepage (Plan Your Visit CTA,
// this-week-at-a-glance, latest sermon, ministry entry points) lands in
// phase 4. This page exists so the deploy pipeline has something honest
// to show: who we are, when we meet, where we are.
export default function Home() {
  return (
    <main className="flex-1">
      <section className="bg-white px-6 py-16 text-center">
        <Image
          src="/images/logo.svg"
          alt={`${site.name} logo`}
          width={320}
          height={160}
          priority
          className="mx-auto h-auto w-64 sm:w-80"
        />
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          {site.tagline}. A new website is on the way — in the meantime,
          here&rsquo;s everything you need to join us this week.
        </p>
      </section>

      <section className="bg-slate-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-3xl font-bold sm:text-4xl">
            Join us this week
          </h1>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {site.services.map((s) => (
              <li
                key={`${s.day}-${s.time}`}
                className="rounded-lg bg-slate-800 p-6 text-center"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                  {s.day}
                </p>
                <p className="mt-1 text-2xl font-bold">{s.time}</p>
                <p className="mt-1 text-slate-300">{s.name}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <a
              href={site.address.mapsUrl}
              className="text-lg font-semibold text-sky-400 underline-offset-4 hover:underline"
            >
              {site.address.street}, {site.address.city}, {site.address.state}{" "}
              {site.address.zip}
            </a>
            <p className="mt-1 text-slate-400">{site.address.directionsNote}</p>
            <p className="mt-6 text-slate-300">
              <a href={`tel:${site.phone.replace(/\D/g, "")}`} className="hover:text-white">
                {site.phone}
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
