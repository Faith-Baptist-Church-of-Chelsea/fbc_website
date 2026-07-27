import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Missions",
  description:
    "Faith Baptist Church of Chelsea supports missionaries around the world — see who we support and why missions is central to who we are.",
};

export default function Missions() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="To every nation"
        title="Missions"
        intro="We believe the Church was given a great commission: proclaim the Gospel to all nations — going to them, not waiting for them to come to us. So we put our money and our prayers where that belief is."
      />

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              The missionaries we support
            </h2>
            <p className="mt-4 text-slate-700">
              We support a lot of missionaries — families serving across the
              world, sent out and sustained by churches like ours. Each one is
              prayed for by name here, and many visit and report back when
              they&rsquo;re stateside.
            </p>
            <p className="mt-4 text-slate-700">
              The full list, with fields and details for each, lives on our
              Church Center page:
            </p>
            <a
              href={site.links.missionaries}
              className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Meet our missionaries
            </a>
            {/* Phase 5 investigates surfacing a few missionaries directly on
                this page via the Church Center/Publishing API. */}
          </div>
          <Photo
            src="/images/missions-map.jpg"
            alt="Map or display of the missionaries we support"
            width={1200}
            height={800}
          />
        </div>
      </section>

      <NextStep
        title="Missions starts at home"
        text="The same Gospel we send around the world is preached here every Sunday."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "What we believe", href: "/about#statement-of-faith" }}
      />
    </main>
  );
}
