import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { FaqJsonLd } from "@/components/JsonLd";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Common Questions",
  description:
    "Are you KJV? What's the music like? What do you believe? Plain answers to the questions people actually ask about Faith Baptist Church in Chelsea.",
};

// These are the questions the church actually gets asked most, answered in
// the church's own words (lightly edited). Don't reword the doctrine.
const questions = [
  {
    q: "Are you KJV?",
    a: (
      <>
        <p>
          Yes. We believe that the word of God has every answer for life. We
          use only the King James Version, because we believe it is the most
          accurate translation we have today for English-speaking people.
        </p>
        <p className="mt-3">
          You&rsquo;re welcome to follow along in whatever Bible you bring —
          nobody will look sideways at you.
        </p>
      </>
    ),
  },
  {
    q: "What is the music like?",
    a: (
      <>
        <p>
          We have a beautiful blend of music at our church. We love the old
          hymns, and we also sing newer spiritual songs. Our choir is a
          blessing every Sunday, and we have an orchestra too.
        </p>
        <p className="mt-3">
          <Link href="/special-music" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Hear it for yourself on the Special Music page →
          </Link>
        </p>
      </>
    ),
  },
  {
    q: "What do you believe?",
    a: (
      <>
        <p>
          The short version: we believe the Bible is the inspired, inerrant
          Word of God and the final authority for faith and life. We believe
          salvation is God&rsquo;s gift, received by personal faith in the Lord
          Jesus Christ. And we preach the Bible expositionally — working
          through the text and digging into what it actually says.
        </p>
        <p className="mt-3">
          The long version is written down, all of it.{" "}
          <Link href="/about#statement-of-faith" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Read our full statement of faith →
          </Link>
        </p>
      </>
    ),
  },
  {
    q: "What do you have for my kids?",
    a: (
      <>
        <p>
          A staffed nursery for ages 0–3 at every single service, and classes
          for ages 3–12 on Sunday mornings at 11:00 and Wednesday nights at
          7:00 — with a simple, secure check-in system. Teens (12–18) have
          their own youth group on Wednesday nights.
        </p>
        <p className="mt-3">
          And on Sunday mornings at 9:45, our{" "}
          <Link href="/family-school" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Family School
          </Link>{" "}
          does something you may not have seen before: everyone — kids,
          parents, grandparents — learns together in the same room.
        </p>
        <p className="mt-3">
          <Link href="/fbc-kids" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            See the full FBC Kids schedule →
          </Link>
        </p>
      </>
    ),
  },
  {
    q: "How do I get involved?",
    a: (
      <>
        <p>
          Start by showing up — that&rsquo;s genuinely the whole first step.
          From there: the choir and orchestra are open to anyone (no audition —
          just talk to Matthew Dowdy), our ministries always welcome helpers,
          and the{" "}
          <Link href="/church-center-app" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Church Center app
          </Link>{" "}
          is where sign-ups and groups live.
        </p>
        <p className="mt-3">
          Not sure where you&rsquo;d fit?{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Ask us
          </Link>{" "}
          — that&rsquo;s an easy conversation, not a commitment.
        </p>
      </>
    ),
  },
];

const faqPlain = [
  { q: "Are you KJV?", a: "Yes. We believe the word of God has every answer for life. We use only the King James Version, because we believe it is the most accurate translation we have today for English-speaking people. You're welcome to follow along in whatever Bible you bring." },
  { q: "What is the music like?", a: "A beautiful blend: we love the old hymns and also sing newer spiritual songs. Our choir is a blessing every Sunday, and we have an orchestra too." },
  { q: "What do you believe?", a: "We believe the Bible is the inspired, inerrant Word of God and the final authority for faith and life, and that salvation is God's gift received by personal faith in the Lord Jesus Christ. Our full statement of faith is published on our About page." },
  { q: "What do you have for my kids?", a: "A staffed nursery for ages 0-3 at every service, classes for ages 3-12 on Sunday mornings at 11:00 and Wednesday nights at 7:00 with secure check-in, youth group for ages 12-18 on Wednesdays, and Family School on Sundays at 9:45 where all ages learn together." },
  { q: "How do I get involved?", a: "Start by visiting. The choir and orchestra are open to anyone with no audition — just talk to Matthew Dowdy — and sign-ups and groups live in the Church Center app." },
];

export default function CommonQuestions() {
  return (
    <main className="flex-1">
      <FaqJsonLd faqs={faqPlain} />
      <PageHero
        eyebrow="No question is too basic"
        title="Common Questions"
        intro="These are the questions people actually ask us before they visit. Plain answers, no runaround."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-12">
          {questions.map(({ q, a }) => (
            <div key={q}>
              <h2 className="text-2xl font-bold text-slate-900">{q}</h2>
              <div className="mt-3 text-slate-700">{a}</div>
            </div>
          ))}
        </div>
      </section>

      <NextStep
        title="Ask us anything else"
        text="Seriously — if it matters to you, it's worth asking. Or just come see for yourself."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </main>
  );
}
