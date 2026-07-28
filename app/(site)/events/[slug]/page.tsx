import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import site from "@/content/site.json";
import { getEvent, getUpcomingEvents } from "@/lib/content";
import NextStep from "@/components/NextStep";

// Summit-style event detail page: dark hero with the title, a card with
// the description and graphic, When & Where, add-to-calendar, sign-up.
export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Detroit",
});

export async function generateStaticParams() {
  const events = await getUpcomingEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event" };
  return {
    title: event.title,
    description: `${event.title} at Faith Baptist Church of Chelsea — ${dateFmt.format(new Date(event.date + "T12:00:00"))}${event.time ? `, ${event.time}` : ""}.`,
    openGraph: event.image ? { images: [event.image] } : undefined,
  };
}

/** Calendar file (ICS) as a data link — works in Apple/Outlook/Google. */
function icsHref(title: string, date: string, showUntil: string | null, location: string): string {
  const d = date.replace(/-/g, "");
  const end = new Date((showUntil ?? date) + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 1); // DTEND is exclusive for all-day events
  const endStr = end.toISOString().slice(0, 10).replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Faith Baptist Church of Chelsea//Events//EN",
    "BEGIN:VEVENT",
    `UID:${d}-${title.replace(/[^a-z0-9]/gi, "")}@fbcchelsea`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${title}`,
    `LOCATION:${location || `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const prettyDate = dateFmt.format(new Date(event.date + "T12:00:00"));
  const range =
    event.showUntil && event.showUntil !== event.date
      ? `${prettyDate} – ${dateFmt.format(new Date(event.showUntil + "T12:00:00"))}`
      : prettyDate;

  return (
    <main className="flex-1">
      <section className="bg-slate-950 px-4 pb-24 pt-14 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/events" className="text-sm font-semibold text-slate-300 hover:text-white">
            ← Back to events
          </Link>
          <h1 className="mt-4 text-4xl sm:text-6xl">{event.title}</h1>
        </div>
      </section>

      <section className="px-4 pb-14">
        <div className="mx-auto -mt-12 grid max-w-4xl gap-8 rounded-2xl bg-white p-8 shadow-xl md:grid-cols-[1fr_20rem]">
          <div>
            {event.description.length > 0 ? (
              event.description.map((p, i) => (
                <p key={i} className={`text-slate-700 ${i > 0 ? "mt-4" : ""}`}>
                  {p}
                </p>
              ))
            ) : (
              <p className="text-slate-600">Details coming soon — check back, or contact the office.</p>
            )}
            <div className="mt-8 space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">When &amp; where</p>
              <p>📅 {range}{event.time && ` · ${event.time}`}</p>
              <p>📍 {event.location || `Faith Baptist Church — ${site.address.street}, ${site.address.city}`}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {event.signupLink && (
                <a
                  href={event.signupLink}
                  className="hover-lift rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Sign up
                </a>
              )}
              <a
                href={icsHref(event.title, event.date, event.showUntil, event.location)}
                download={`${slug}.ics`}
                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Add to calendar
              </a>
            </div>
          </div>
          <div>
            {event.image && (
              /* Managed by Keystatic; plain img keeps arbitrary aspect ratios intact */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={event.image} alt={event.title} className="w-full rounded-xl border border-slate-200" />
            )}
          </div>
        </div>
      </section>

      <NextStep
        title="Events are better with a church family"
        text="Come for the event — stay for the people."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "All events", href: "/events" }}
      />
    </main>
  );
}
