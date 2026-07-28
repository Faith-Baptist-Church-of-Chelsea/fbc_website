import Link from "next/link";
import site from "@/content/site.json";
import Photo from "@/components/Photo";
import { getActiveAnnouncements } from "@/lib/content";
import { getRecentVideos } from "@/lib/youtube";

export const revalidate = 900;

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
  const announcements = await getActiveAnnouncements();
  // The true latest video (sorted by real publish date — see lib/youtube).
  const [latest] = await getRecentVideos(1);

  return (
    <main className="flex-1">
      {/* Hero: times + address above the fold, Plan Your Visit dominant */}
      <section className="bg-slate-900 px-4 pb-14 pt-12 text-white sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="animate-rise animate-rise-1 text-4xl font-bold leading-tight sm:text-6xl">
            An extremely friendly church that digs into the Word.
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
              <div key={`${s.day}-${s.time}`} className="rounded-lg bg-slate-800/70 p-3 text-center">
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
          {latest && (
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
