import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";
import { getUpcomingSignups } from "@/lib/pco";
import { htmlToParagraphs } from "@/lib/html";

export const metadata: Metadata = {
  title: "Young Adults",
  description:
    "Young adults (18–30) at Faith Baptist Church of Chelsea — the Unashamed conference, activities organized by Matthew Dowdy, and a group worth belonging to.",
};

export const revalidate = 900;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "America/Detroit",
});

export default async function YoungAdults() {
  // The Unashamed details come live from the Planning Center registration,
  // so the church updates one place and the website follows. Falls back to
  // brief static copy if the API is unreachable or the signup is closed.
  const unashamed = (await getUpcomingSignups()).find((s) => /unashamed/i.test(s.name));
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Ages 18–30"
        title="Young Adults"
        intro="College, first jobs, new marriages — the decade where faith either becomes your own or quietly fades. We're building a group where it becomes your own."
      />

      {/* Unashamed feature — live from Planning Center Registrations */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-slate-900 text-white">
          {unashamed?.logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element --
               remote Planning Center image with unknown dimensions */
            <img src={unashamed.logoUrl} alt="" className="max-h-80 w-full bg-slate-950 object-contain" loading="lazy" />
          )}
          <div className="p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">
              Our conference{unashamed?.startsAt ? ` · ${dateFmt.format(new Date(unashamed.startsAt))}` : ""}
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              {unashamed?.name ?? "Unashamed"}
            </h2>
            {unashamed?.description ? (
              htmlToParagraphs(unashamed.description).map((p, i) => (
                <p key={i} className="mt-4 max-w-2xl text-slate-300">
                  {p}
                </p>
              ))
            ) : (
              <p className="mt-4 max-w-2xl text-slate-300">
                A two-day conference for young adults (18–30), hosted right
                here at Faith Baptist — preaching, fellowship, and a room full
                of people your age who take the Bible seriously. Details and
                this year&rsquo;s theme are on the registration page.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              {(!unashamed || !unashamed.atCapacity) && (
                <a
                  href={unashamed?.registrationUrl ?? site.links.unashamedRegistration}
                  className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Register for Unashamed
                </a>
              )}
              <a
                href="https://www.instagram.com/unashamed_fbcconference/"
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                @unashamed_fbcconference
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The rhythm of the group */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
Connecting outside of Sunday
            </h2>
            <p className="mt-4 text-slate-700">
              Young adult activities happen as life allows — game nights,
              bonfires, trips, serving together — organized by{" "}
              <span className="font-semibold text-slate-900">Matthew Dowdy</span>{" "}
              and scheduled as they come rather than on a rigid calendar.
              That&rsquo;s on purpose: it fits real schedules, and it means
              when something&rsquo;s happening, it&rsquo;s because people
              actually wanted to do it.
            </p>
            <p className="mt-4 text-slate-700">
              The catch with an irregular schedule: you have to be on the list
              to hear about the next thing.
            </p>
          </div>
          <Photo
            src="/images/young-adults-activity.jpg"
            alt="Young adults at a recent activity"
            width={1200}
            height={800}
          />
        </div>
      </section>

      {/* Get on the list */}
      <section className="px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Get on the list
          </h2>
          <p className="mt-3 text-slate-700">
            Two ways, both easy: grab the{" "}
            <a href={site.links.churchCenter} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              Church Center app
            </a>{" "}
            and you&rsquo;ll see young adult events as they&rsquo;re posted —
            or just talk to Matthew on a Sunday and he&rsquo;ll make sure you
            hear about the next one.
          </p>
        </div>
      </section>

      <NextStep
        title="Start with a Sunday"
        text="The group you're looking for is here on Sunday mornings. Come meet us."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Get the Church Center app", href: "/church-center-app" }}
      />
    </main>
  );
}
