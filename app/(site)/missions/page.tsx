import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Missions",
  description:
    "Missions at Faith Baptist Church of Chelsea — supporting missionaries around the world, missions nights, and mission trips.",
  openGraph: { images: ["/images/missions-map.jpg"] },
};

export default function Missions() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="To every nation"
        title="Missions"
        intro="We believe the Church was given a great commission: proclaim the Gospel to all nations — going to them, not waiting for them to come to us. So we put our money, our prayers, and our people where that belief is."
      />

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              What missions looks like here
            </h2>
            <p className="mt-4 text-slate-700">
              <span className="font-semibold text-slate-900">We support missionaries around the world</span>{" "}
              — families sent out to preach the gospel, sustained by our
              church&rsquo;s giving and prayed for by name. When they&rsquo;re
              stateside, they&rsquo;re often right here in our services,
              reporting what God is doing on their fields.
            </p>
            <p className="mt-4 text-slate-700">
              <span className="font-semibold text-slate-900">Missions is on our calendar, not just our budget.</span>{" "}
              Fifth-Sunday Missions Nights turn an evening service toward the
              work of the gospel around the world, and mission trips put our
              own people on the field serving alongside the missionaries we
              support.
            </p>
            <p className="mt-4 text-slate-700">
              And missions starts in Chelsea: the same gospel we send around
              the world is preached here every week, to whoever walks through
              the door.
            </p>
          </div>
          <Photo
            src="/images/missions-map.jpg"
            alt="Display of the missionaries we support"
            width={1200}
            height={800}
          />
        </div>
      </section>

      <NextStep
        title="Want to know more?"
        text="Ask us about the missionaries we support or the next missions trip — we love talking about this."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "What we believe about missions", href: "/about#statement-of-faith" }}
      />
    </main>
  );
}
