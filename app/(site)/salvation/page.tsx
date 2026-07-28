import type { Metadata } from "next";
import Link from "next/link";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: "What the Bible Says About Salvation",
  description:
    "Do you know where you will spend eternity? What the Bible says about salvation — by grace, through faith in Jesus Christ. Faith Baptist Church of Chelsea, Michigan.",
};

// The most important page on the site, doctrinally: the gospel, straight
// from Scripture (KJV), in the plain order the church itself teaches it.
// TODO: Steven — have Pastor Summers review this wording before launch.
const steps: { heading: string; verse: string; ref: string; note: string }[] = [
  {
    heading: "We have all sinned",
    verse: "For all have sinned, and come short of the glory of God;",
    ref: "Romans 3:23",
    note: "Every one of us — no exceptions. Sin is what separates us from a holy God, and no amount of trying harder closes that gap.",
  },
  {
    heading: "Sin has a price",
    verse:
      "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
    ref: "Romans 6:23",
    note: "Death — eternal separation from God — is what our sin earns. But notice the second half: God offers a gift instead.",
  },
  {
    heading: "Christ paid it for you",
    verse:
      "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
    ref: "Romans 5:8",
    note: "Jesus Christ — God's own Son — died on the cross in your place and rose from the dead. Not after you cleaned up your life. While you were still a sinner.",
  },
  {
    heading: "Salvation is received by faith, not earned",
    verse:
      "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    ref: "Ephesians 2:8–9",
    note: "Not church membership. Not baptism. Not being a good person. A gift can only be received.",
  },
  {
    heading: "Call on Him",
    verse:
      "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.",
    ref: "Romans 10:9",
    note: "And two verses later: “For whosoever shall call upon the name of the Lord shall be saved.” Whosoever includes you.",
  },
];

export default function SalvationPage() {
  return (
    <main className="flex-1 bg-slate-950 text-white">
      <section className="px-4 pb-8 pt-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-400">
            — The most important question —
          </p>
          <h1 className="font-accent mt-6 text-4xl sm:text-6xl">
            Do you know where you will spend eternity?
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            The Bible answers plainly. Here is what it says — not our words,
            God&rsquo;s.
          </p>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-2xl space-y-12">
          {steps.map((s, i) => (
            <div key={s.ref} className="border-l-2 border-brand-500 pl-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {i + 1}. {s.heading}
              </p>
              <blockquote className="mt-3 text-xl leading-relaxed text-slate-100 sm:text-2xl">
                &ldquo;{s.verse}&rdquo;
              </blockquote>
              <p className="mt-2 text-sm font-semibold text-slate-400">{s.ref}</p>
              <p className="mt-3 text-slate-300">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-accent text-3xl sm:text-4xl">
            This is a conversation worth having today.
          </h2>
          <p className="mx-auto mt-5 text-slate-300">
            If you have questions — or you&rsquo;ve just prayed and trusted
            Christ and don&rsquo;t know what comes next — we would be honored
            to talk with you. No pressure, no judgment. This is the very
            reason our church exists.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="hover-lift rounded-lg bg-brand-500 px-8 py-4 font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-600"
            >
              Talk to someone
            </Link>
            <a
              href={`tel:${site.phone.replace(/\D/g, "")}`}
              className="hover-lift rounded-lg border border-slate-600 px-8 py-4 font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-800"
            >
              Call {site.phone}
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            Or just come this Sunday —{" "}
            <Link href="/plan-your-visit" className="font-semibold text-brand-400 underline-offset-4 hover:underline">
              here&rsquo;s everything you need to know
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
