import Link from "next/link";
import site from "@/content/site.json";
import Photo from "@/components/Photo";
import EventsCarousel, { type CarouselItem } from "@/components/EventsCarousel";
import TestimonialRotator from "@/components/TestimonialRotator";
import { getActiveAnnouncements, getTestimonials } from "@/lib/content";
import { getRecentVideos } from "@/lib/youtube";
import { getUpcomingSignups } from "@/lib/pco";
import { getUpcomingCalendarEvents } from "@/lib/calendar";
import { churchCenterEventLink } from "@/lib/churchcenter";

export const revalidate = 900;

const fullDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "America/Detroit",
});
const timeOnly = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Detroit",
});
const dayNumFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "America/Detroit" });
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "America/Detroit" });

/** Merges Registrations signups + calendar events into carousel cards. */
async function featuredEvents(): Promise<CarouselItem[]> {
  const [signups, calendar] = await Promise.all([
    getUpcomingSignups(),
    getUpcomingCalendarEvents(10),
  ]);
  const items: (CarouselItem & { sort: string })[] = [];
  for (const s of signups) {
    items.push({
      title: s.name,
      dateLabel: s.startsAt ? fullDate.format(new Date(s.startsAt)) : "Sign-ups open now",
      meta: s.atCapacity ? "Currently full" : "Registration open",
      href: s.registrationUrl ?? `${site.links.churchCenter}/registrations`,
      image: s.logoUrl,
      dayNum: s.startsAt ? dayNumFmt.format(new Date(s.startsAt)) : "•",
      month: s.startsAt ? monthFmt.format(new Date(s.startsAt)) : "",
      sort: s.startsAt ?? "9999",
    });
  }
  for (const e of calendar) {
    // Skip calendar duplicates of registrations already shown.
    if (items.some((i) => i.title.toLowerCase().includes(e.title.toLowerCase().slice(0, 12)))) continue;
    const d = new Date(e.start);
    items.push({
      title: e.title,
      dateLabel: `${fullDate.format(d)}${e.allDay ? "" : ` · ${timeOnly.format(d)}`}`,
      meta: e.location,
      href: await churchCenterEventLink(e.title, e.description),
      image: null,
      dayNum: dayNumFmt.format(d),
      month: monthFmt.format(d),
      sort: e.start,
    });
  }
  return items.sort((a, b) => a.sort.localeCompare(b.sort)).slice(0, 8);
}

// The homepage has one job: move a hesitant visitor one step closer to
// showing up on Sunday. Service times and address are visible without
// scrolling; Plan Your Visit is the most prominent element on the page.

const ministries = [
  { label: "Family School", href: "/family-school", desc: "All ages, one room, side by side — Sundays 9:45 AM", img: "/images/family-school-wide.jpg" },
  { label: "FBC Kids", href: "/fbc-kids", desc: "Nursery through age 12, with secure check-in", img: "/images/kids-class.jpg" },
  { label: "Youth Group", href: "/youth-group", desc: "Ages 12–18 — Wednesdays 7:00 PM", img: "/images/youth-group.jpg" },
  { label: "Young Adults", href: "/young-adults", desc: "Ages 18–30 — home of the Unashamed conference", img: "/images/young-adults-activity.jpg" },
  { label: "Special Music", href: "/special-music", desc: "Choir & orchestra — anyone can join", img: "/images/choir.jpg" },
  { label: "Missions", href: "/missions", desc: "Supporting missionaries around the world", img: "/images/missions-map.jpg" },
];

export default async function Home() {
  const [announcements, [latest], events, testimonials] = await Promise.all([
    getActiveAnnouncements(),
    getRecentVideos(1),
    featuredEvents(),
    getTestimonials(),
  ]);

  return (
    <main className="flex-1">
      {/* Hero: times + address above the fold, Plan Your Visit dominant.
          Until real photos land, the background is a frame from the most
          recent stream — real people, real room — under a heavy overlay. */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-14 pt-12 text-white sm:pb-20 sm:pt-16">
        {latest?.thumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element --
             YouTube CDN thumbnail as a decorative background */
          <img
            src={latest.thumbnail ?? `https://i.ytimg.com/vi/${latest.videoId}/hqdefault.jpg`}
            alt=""
            aria-hidden="true"
            data-parallax="0.3"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-md"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="animate-rise animate-rise-1 text-5xl leading-none sm:text-7xl">
            An extremely friendly church<br className="hidden sm:block" />
            <span className="text-brand-400"> that digs into the Word.</span>
          </h1>
          <p className="animate-rise animate-rise-2 mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Expository Bible preaching, music that blends the old hymns with
            newer songs, and people who will learn your name. In Chelsea, just
            off {site.address.directionsNote}.
          </p>
          <Link
            href="/plan-your-visit"
            className="animate-rise animate-rise-3 hover-lift mt-8 inline-block rounded-lg bg-brand-500 px-10 py-4 text-xl font-bold text-white shadow-lg transition-colors hover:bg-brand-600"
          >
            Plan Your Visit
          </Link>
          <div className="animate-rise animate-rise-4 mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {site.services.map((s) => (
              <div key={`${s.day}-${s.time}`} className="rounded-lg bg-slate-900/70 p-3 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">{s.day}</p>
                <p className="text-lg font-bold">{s.time}</p>
                <p className="text-xs text-slate-300">{s.name}</p>
              </div>
            ))}
          </div>
          <p className="animate-rise animate-rise-5 mt-6 text-slate-300">
            <a href={site.address.mapsUrl} className="font-semibold text-white underline-offset-4 hover:underline">
              {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
            </a>
          </p>
        </div>
      </section>

      {/* This week at a glance */}
      {announcements.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              This week at Faith Baptist
            </h2>
            <ul className="mt-6 space-y-4">
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
        </section>
      )}

      {/* Featured events — auto-rotating cards from Registrations + the
          church Google Calendar, each linking to its Church Center page */}
      {events.length > 0 && (
        <section className="bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl text-slate-900 sm:text-4xl">Coming up</h2>
              <Link href="/events" className="shrink-0 font-semibold text-brand-700 underline-offset-4 hover:underline">
                All events →
              </Link>
            </div>
            <div className="mt-8">
              <EventsCarousel items={events} />
            </div>
          </div>
        </section>
      )}

      {/* Latest sermon */}
      <section className={`px-4 py-12 ${announcements.length > 0 ? "bg-slate-50" : ""}`}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            The latest message
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            Check out the preaching before you ever walk in — we&rsquo;d rather
            you know exactly what you&rsquo;re coming to.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl">
            <iframe
              className="aspect-video w-full"
              src={
                latest
                  ? `https://www.youtube-nocookie.com/embed/${latest.videoId}`
                  : `https://www.youtube-nocookie.com/embed/videoseries?list=${site.social.youtubeChannelId.replace(/^UC/, "UU")}`
              }
              title={latest?.title ?? "Latest sermon from Faith Baptist Church of Chelsea"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {latest?.thumbnail && (
            <p className="mt-3 text-center text-slate-700">
              <span className="font-semibold text-slate-900">{latest.title}</span>
            </p>
          )}
          <p className="mt-4 text-center">
            <Link href="/sermons" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              Browse all sermons →
            </Link>
          </p>
        </div>
      </section>

      {/* Ministry entry points */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            There&rsquo;s a place for everyone in your car
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ministries.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="group hover-lift overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
              >
                <Photo src={m.img} alt="" width={800} height={500} className="w-full" />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700">
                    {m.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — real voices; add them in /keystatic or /admin */}
      {testimonials.length > 0 && (
        <section className="bg-slate-900 px-4 py-16">
          <h2 className="text-center text-3xl text-white sm:text-4xl">
            What visitors say
          </h2>
          <div className="mt-10">
            <TestimonialRotator items={testimonials} />
          </div>
          <p className="mt-8 text-center">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Faith+Baptist+Church+4030+Kalmbach+Rd+Chelsea+MI"
              className="text-sm font-semibold text-brand-400 underline-offset-4 hover:underline"
            >
              Read our reviews on Google →
            </a>
          </p>
        </section>
      )}

      {/* The most important question */}
      <section className="bg-slate-950 px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-400">
            — The most important question —
          </p>
          <h2 className="font-accent mt-6 text-4xl italic sm:text-5xl">
            Do you know where you will spend eternity?
          </h2>
          <blockquote className="font-accent mx-auto mt-8 max-w-2xl text-lg italic text-slate-300">
            &ldquo;For by grace are ye saved through faith; and that not of
            yourselves: it is the gift of God: Not of works, lest any man
            should boast.&rdquo;
          </blockquote>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
            Ephesians 2:8–9
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-slate-300">
            The Bible has a clear answer to the most important question a
            person can ask. Not church attendance, not good works — only the
            finished work of Jesus Christ on the cross, and your personal
            faith in Him.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/salvation"
              className="hover-lift rounded-lg bg-brand-500 px-8 py-4 font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-600"
            >
              What the Bible says
            </Link>
            <Link
              href="/contact"
              className="hover-lift rounded-lg border border-slate-600 px-8 py-4 font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-800"
            >
              Talk to someone
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            The hardest part is the first Sunday.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            We know — we were all new here once. That&rsquo;s why we wrote down
            everything you might be wondering, from parking to what to wear.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/plan-your-visit"
              className="rounded-lg bg-brand-500 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-brand-600"
            >
              Plan Your Visit
            </Link>
            <Link
              href="/common-questions"
              className="rounded-lg border border-slate-600 px-8 py-4 text-lg font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Common Questions
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
