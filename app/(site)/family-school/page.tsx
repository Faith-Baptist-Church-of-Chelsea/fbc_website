import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Family School",
  description:
    "Sunday mornings at 9:45 — Family School at Faith Baptist Church, where all ages learn the Bible side by side instead of splitting into age-graded classes.",
};

export default function FamilySchool() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Sundays · 9:45 AM"
        title="Family School"
        intro="Our version of Sunday school — with one big difference: nobody gets split up. Kids, parents, and grandparents learn the same passage at the same time, side by side."
      />

      {/* The why — most visitors have never seen this */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Why we keep families together
          </h2>
          <p className="mt-4 text-slate-700">
            Most churches send children one way and adults another. We used to
            think that was just how it worked, too. But something happens when
            a family sits down and digs into the same scripture together: the
            conversation doesn&rsquo;t end when class does. Kids hear their
            parents wrestle with the text. Parents know exactly what their
            children are learning — because they learned it in the same room,
            at the same time.
          </p>
          <p className="mt-4 text-slate-700">
            The Bible puts the responsibility for teaching children about God
            squarely on parents. Family School doesn&rsquo;t replace that — it
            equips it. Every week, every family leaves with the same passage in
            their hands and something to talk about on the drive home.
          </p>
        </div>
      </section>

      {/* What it actually looks like */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              What it looks like in the room
            </h2>
            <p className="mt-4 text-slate-700">
              It&rsquo;s a class, not a service — taught by Pastor Summers or
              Pastor Steve, our assistant pastor. There&rsquo;s teaching from
              the front, questions along the way, and all ages in the seats.
              Bring your Bible; expect to open it.
            </p>
            <p className="mt-4 text-slate-700">
              Our current study is{" "}
              <span className="font-semibold text-slate-900">
                &ldquo;Portraits of Proverbs&rdquo;
              </span>{" "}
              — walking through the characters found in Proverbs, comparing the
              wise and the foolish, the diligent and the sluggard, and asking
              which portrait looks most like us.
            </p>
          </div>
          <Photo
            src="/images/family-school-wide.jpg"
            alt="All ages learning together in one room during Family School"
            width={1200}
            height={800}
          />
        </div>
      </section>

      {/* The honest toddler answer */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            &ldquo;But what if my toddler is a distraction?&rdquo;
          </h2>
          <p className="mt-4 text-slate-700">
            They might be. Ours are too — that&rsquo;s what a room full of
            families sounds like, and nobody here will give you a look over a
            restless two-year-old. If you&rsquo;d rather have the hour to
            focus, our staffed{" "}
            <Link href="/fbc-kids" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              nursery
            </Link>{" "}
            is open for ages 0–3 during Family School, every week. Use it or
            don&rsquo;t — both are genuinely fine.
          </p>
        </div>
      </section>

      <NextStep
        title="Come sit in this Sunday"
        text="9:45 AM, an hour before the morning service. Show up once and see what it's like — no preparation needed."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "What about older kids?", href: "/fbc-kids" }}
      />
    </main>
  );
}
