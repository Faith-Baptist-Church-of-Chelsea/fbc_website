import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { getActiveAnnouncements } from "@/lib/content";
import { getUpcomingSignups } from "@/lib/pco";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Faith Baptist Church of Chelsea — announcements, registrations, and events.",
};

// Regenerate at most every 15 minutes; between regenerations visitors get
// the cached page instantly (and if Planning Center is down, the cached
// data simply persists — a visitor never sees an error).
export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "long",
  day: "numeric",
  timeZone: "America/Detroit",
});

export default async function Events() {
  const [announcements, signups] = await Promise.all([
    getActiveAnnouncements(),
    getUpcomingSignups(),
  ]);

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="What's coming up"
        title="Events"
        intro="Beyond the weekly services — trips, conferences, and the occasional excuse to eat together."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          {/* Open registrations, live from Planning Center (empty if none
              or if the API is unreachable — the page still works). */}
          {signups.length > 0 && (
            <ul className="mb-10 space-y-6">
              {signups.map((s) => (
                <li key={s.id} className="overflow-hidden rounded-xl border border-slate-200">
                  {s.logoUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element --
                       remote Planning Center image with unknown dimensions */
                    <img src={s.logoUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-6">
                    {s.startsAt && (
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                        {dateFmt.format(new Date(s.startsAt))}
                      </p>
                    )}
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{s.name}</h2>
                    {s.description && (
                      <p className="mt-2 text-slate-600">{s.description}</p>
                    )}
                    {s.atCapacity ? (
                      <p className="mt-3 font-semibold text-slate-500">Currently full — contact the office about a waitlist.</p>
                    ) : (
                      s.registrationUrl && (
                        <a href={s.registrationUrl} className="mt-3 inline-block rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600">
                          Register
                        </a>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {announcements.length > 0 ? (
            <ul className="space-y-6">
              {announcements.map(({ slug, entry }) => (
                <li key={slug} className="rounded-xl bg-slate-50 p-6">
                  <h2 className="text-xl font-bold text-slate-900">{entry.title}</h2>
                  {entry.link && (
                    <a href={entry.link} className="mt-2 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline">
                      Details &amp; sign-up →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : signups.length === 0 ? (
            <p className="text-center text-slate-600">
              Nothing special on the calendar right now — which means the best
              thing coming up is Sunday.
            </p>
          ) : null}

          <div className="mt-10 rounded-xl bg-slate-900 p-8 text-center text-white">
            <h2 className="text-xl font-bold">Registrations live on Church Center</h2>
            <p className="mt-2 text-slate-300">
              Sign-ups for trips, conferences, and events all happen in one
              place.
            </p>
            <a
              href={`${site.links.churchCenter}/registrations`}
              className="mt-5 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              See open registrations
            </a>
          </div>
        </div>
      </section>

      <NextStep
        title="The main event is weekly"
        text="Four services a week, every week. Start there."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Get the Church Center app", href: "/church-center-app" }}
      />
    </main>
  );
}
