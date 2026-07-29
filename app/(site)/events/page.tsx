import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import Image from "next/image";
import Link from "next/link";
import { getUpcomingEvents } from "@/lib/content";
import { getUpcomingSignups } from "@/lib/pco";
import { htmlToParagraphs } from "@/lib/html";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Faith Baptist Church of Chelsea — the church calendar, open registrations, and announcements.",
};

// Regenerate at most every 15 minutes. Two sources, both fail-soft:
// manually-entered events (Keystatic/admin) and Planning Center
// Registrations. (The Google Calendar list was removed 2026-07 — it
// mostly duplicated the featured events.)
export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "long",
  day: "numeric",
  timeZone: "America/Detroit",
});
export default async function Events() {
  const [events, signups] = await Promise.all([getUpcomingEvents(), getUpcomingSignups()]);

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="What's coming up"
        title="Events"
        intro="Beyond the weekly services — trips, conferences, and the occasional excuse to eat together."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl space-y-14">
          {/* Featured events — manually entered with graphics (Keystatic/admin) */}
          {events.length > 0 && (
            <div>
              <div className="grid gap-8 sm:grid-cols-2">
                {events.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/events/${e.slug}`}
                    className="hover-lift group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {e.image && (
                      <Image
                        src={e.image}
                        alt=""
                        width={1920}
                        height={1080}
                        sizes="(max-width: 640px) 100vw, 430px"
                        className="w-full"
                      />
                    )}
                    <div className="p-5">
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                        {dateFmt.format(new Date(e.date + "T12:00:00"))}
                        {e.showUntil && e.showUntil !== e.date &&
                          ` – ${dateFmt.format(new Date(e.showUntil + "T12:00:00"))}`}
                        {e.time && ` · ${e.time}`}
                      </p>
                      <h2 className="mt-1 !font-sans text-xl font-bold normal-case tracking-normal text-slate-900 group-hover:text-brand-700" style={{ fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: 0 }}>
                        {e.title}
                      </h2>
                      {e.location && <p className="mt-1 text-sm text-slate-600">{e.location}</p>}
                      <p className="mt-2 text-sm font-semibold text-brand-700">Details →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Open registrations, live from Planning Center */}
          {signups.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign-ups open now</h2>
              <ul className="mt-4 space-y-6">
                {signups.map((s) => (
                  <li key={s.id} className="overflow-hidden rounded-xl border border-slate-200">
                    {s.logoUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element --
                         remote Planning Center image with unknown dimensions */
                      <img src={s.logoUrl} alt="" className="max-h-56 w-full bg-slate-950 object-contain" loading="lazy" />
                    )}
                    <div className="p-6">
                      {s.startsAt && (
                        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                          {dateFmt.format(new Date(s.startsAt))}
                        </p>
                      )}
                      <h3 className="mt-1 text-xl font-bold text-slate-900">{s.name}</h3>
                      {s.description &&
                        htmlToParagraphs(s.description)
                          .slice(0, 2)
                          .map((p, i) => (
                            <p key={i} className="mt-2 text-slate-600">
                              {p}
                            </p>
                          ))}
                      {s.atCapacity ? (
                        <p className="mt-3 font-semibold text-slate-500">
                          Currently full — contact the office about a waitlist.
                        </p>
                      ) : (
                        s.registrationUrl && (
                          <a
                            href={s.registrationUrl}
                            className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600"
                          >
                            Details &amp; register
                          </a>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}


          {events.length === 0 && signups.length === 0 && (
            <p className="text-center text-slate-600">
              Nothing special on the calendar right now — which means the best
              thing coming up is Sunday.
            </p>
          )}

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
