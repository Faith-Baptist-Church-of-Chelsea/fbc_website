import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Youth Group",
  description:
    "Youth group at Faith Baptist Church of Chelsea — ages 12–18, Wednesday nights at 7:00, led by Josiah & Ashley Jaworski.",
  openGraph: { images: ["/images/youth-group.jpg"] },
};

export default function YouthGroup() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Ages 12–18 · Wednesdays · 7:00 PM"
        title="Youth Group"
        intro="A youth group where God's Word is taught and every teenager matters."
      />

      {/* Trip feature */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl rounded-2xl bg-brand-500 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-100">
            August 4–6
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Creation Museum &amp; Ark Encounter Trip
          </h2>
          <p className="mt-4 max-w-2xl text-sky-50">
            Three days in Kentucky at the Creation Museum and the life-size Ark
            Encounter. If you&rsquo;re 12–18, you don&rsquo;t want to miss this
            one — talk to the Jaworskis on a Wednesday night for details and to
            get signed up.
          </p>
        </div>
      </section>

      {/* What Wednesday looks like */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Wednesday nights
            </h2>
            <p className="mt-4 text-slate-700">
              While the adults are in the midweek service, the youth meet for
              their own time in the Word — teaching that takes teenagers
              seriously enough to open the Bible and work through it, plus time
              to just be together.
            </p>
            <p className="mt-4 text-slate-700">
              The group is led by{" "}
              <span className="font-semibold text-slate-900">
                Josiah &amp; Ashley Jaworski
              </span>
              , who are passionate about investing in the next generation and
              helping teens live out their faith boldly — not someday, now.
            </p>
          </div>
          <Photo
            src="/images/youth-group.jpg"
            alt="Youth group on a Wednesday night"
            width={1200}
            height={800}
          />
        </div>
      </section>

      <NextStep
        title="Just show up on a Wednesday"
        text="7:00 PM. Bring a friend — half the group probably started that way."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Questions? Contact us", href: "/contact" }}
      />
    </main>
  );
}
