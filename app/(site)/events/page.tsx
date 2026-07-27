import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import { getActiveAnnouncements } from "@/lib/content";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Faith Baptist Church of Chelsea — announcements, registrations, and events.",
};

// Interim events page: shows announcements from content/announcements plus a
// link to Church Center. Phase 5 adds upcoming registrations pulled from the
// Planning Center API.
export default async function Events() {
  const announcements = await getActiveAnnouncements();

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="What's coming up"
        title="Events"
        intro="Beyond the weekly services — trips, conferences, and the occasional excuse to eat together."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
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
          ) : (
            <p className="text-center text-slate-600">
              Nothing special on the calendar right now — which means the best
              thing coming up is Sunday.
            </p>
          )}

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
