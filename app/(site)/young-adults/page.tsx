import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Young Adults",
  description:
    "Young adults (18–30) at Faith Baptist Church of Chelsea — the Unashamed conference, activities organized by Matthew Dowdy, and a group worth belonging to.",
};

export default function YoungAdults() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Ages 18–30"
        title="Young Adults"
        intro="College, first jobs, new marriages — the decade where faith either becomes your own or quietly fades. We're building a group where it becomes your own."
      />

      {/* Unashamed feature */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl bg-slate-900 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">
            Our conference
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Unashamed</h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            A conference for young adults built around one idea from Romans
            1:16 — being unashamed of the gospel. Preaching, music, and a room
            full of people your age who take the Bible seriously. Hosted right
            here at Faith Baptist.
          </p>
          {/* TODO: Steven — CONFIRM conference dates/description; drafted from the
              name and registration page only. */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={site.links.unashamedRegistration}
              className="rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Register for Unashamed
            </a>
            <a
              href="https://www.instagram.com/unashamed_fbcconference/"
              className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              @unashamed_fbcconference
            </a>
          </div>
        </div>
      </section>

      {/* The rhythm of the group */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              What we do between conferences
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
