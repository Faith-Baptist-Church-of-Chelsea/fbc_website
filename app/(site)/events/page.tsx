import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { getActiveAnnouncements } from "@/lib/content";
import { getUpcomingSignups } from "@/lib/pco";
import { getUpcomingCalendarEvents } from "@/lib/calendar";
import { htmlToParagraphs } from "@/lib/html";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Faith Baptist Church of Chelsea — the church calendar, open registrations, and announcements.",
};

// Regenerate at most every 15 minutes. Three sources, all fail-soft:
// the church Google Calendar (ICS), Planning Center Registrations, and
// Keystatic announcements.
export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "long",
  day: "numeric",
  timeZone: "America/Detroit",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Detroit",
});

export default async function Events() {
  const [announcements, signups, calendar] = await Promise.all([
    getActiveAnnouncements(),
    getUpcomingSignups(),
    getUpcomingCalendarEvents(12),
  ]);

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="What's coming up"
        title="Events"
        intro="Beyond the weekly services — trips, conferences, and the occasional excuse to eat together."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* Church calendar (Google Calendar, same source as Church Center) */}
          {calendar.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900">On the calendar</h2>
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
                {calendar.map((e, i) => (
                  <li key={i} className="flex items-baseline gap-4 p-4">
                    <span className="w-32 shrink-0 text-sm font-semibold uppercase tracking-wide text-brand-700">
                      {dateFmt.format(new Date(e.start))}
                    </span>
                    <span>
                      <span className="font-semibold text-slate-900">{e.title}</span>
                      <span className="text-sm text-slate-600">
                        {!e.allDay && <> · {timeFmt.format(new Date(e.start))}</>}
                        {e.location && <> · {e.location}</>}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
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

          {/* Announcements from the admin panel */}
          {announcements.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
              <ul className="mt-4 space-y-4">
                {announcements.map(({ slug, entry }) => (
                  <li key={slug} className="rounded-xl border-l-4 border-brand-500 bg-slate-50 p-5">
                    <p className="font-bold text-slate-900">{entry.title}</p>
                    {entry.link && (
                      <a href={entry.link} className="mt-1 inline-block text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
                        Details &amp; sign-up →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {calendar.length === 0 && signups.length === 0 && announcements.length === 0 && (
            <p className="text-center text-slate-600">
              Nothing special on the calendar right now — which means the best
              thing coming up is Sunday.
            </p>
          )}

          <div className="rounded-xl bg-slate-900 p-8 text-center text-white">
            <h2 className="text-xl font-bold">Also on Church Center</h2>
            <p className="mt-2 text-slate-300">
              Registrations and the full events list live in Church Center too
              — especially handy in the app.
            </p>
            <a
              href={`${site.links.churchCenter}/pages/upcoming-events`}
              className="mt-5 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Upcoming events on Church Center
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
