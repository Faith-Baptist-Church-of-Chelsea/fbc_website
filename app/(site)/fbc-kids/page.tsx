import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "FBC Kids",
  description:
    "Children's ministry at Faith Baptist Church of Chelsea: staffed nursery at every service and Bible classes for ages 3–12, with simple, secure check-in.",
};

// The children's schedule. "—" means that age group is with their family
// in the main service at that time (which is always welcome).
const schedule: { group: string; sun945: string; sun11: string; sun6: string; wed7: string }[] = [
  { group: "Nursery (0–3)", sun945: "Open", sun11: "Open", sun6: "Open", wed7: "Open" },
  { group: "Ages 3–4", sun945: "—", sun11: "Class", sun6: "—", wed7: "Class (with 5–7)" },
  { group: "Ages 5–7", sun945: "—", sun11: "Class", sun6: "—", wed7: "Class" },
  { group: "Ages 8–12", sun945: "—", sun11: "Class", sun6: "—", wed7: "Class" },
  { group: "Youth (12–18)", sun945: "—", sun11: "—", sun6: "—", wed7: "Youth Group" },
];

// Who teaches what — from the church's teachers page.
const teachers = [
  { class: "Ages 3–4 · Sunday 11:00", who: "Ben & Amanda Bolen", note: "a couple with two kids of their own and a heart for helping young children understand God's Word" },
  { class: "Ages 5–7 · Sunday 11:00", who: "Haley Sackmann", note: "passionate about helping kids grow in their understanding of God's Word" },
  { class: "Ages 8–12 · Sunday 11:00", who: "Abi Wireman", note: "loves helping preteens grow in their faith during these formative years" },
  { class: "Ages 3–7 · Wednesday 7:00", who: "Scott & Heather Turnbow", note: "a lively, nurturing class with a joyful approach" },
  { class: "Ages 8–12 · Wednesday 7:00", who: "Moriah Summers", note: "intentional about making lessons practical and relatable" },
];

export default function FbcKids() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Nursery through age 12"
        title="FBC Kids"
        intro="Your kids are not an interruption here. Every class exists so that children hear the Bible taught at their level — by people who know them by name."
      />

      {/* Schedule table */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            When there&rsquo;s something for your child
          </h2>
          <p className="mt-3 text-slate-600">
            &ldquo;—&rdquo; means kids join their families in the service at
            that hour — always welcome, wiggles included.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="rounded-tl-lg p-3 text-sm font-semibold">Age group</th>
                  <th className="p-3 text-sm font-semibold">Sun 9:45</th>
                  <th className="p-3 text-sm font-semibold">Sun 11:00</th>
                  <th className="p-3 text-sm font-semibold">Sun 6:00</th>
                  <th className="rounded-tr-lg p-3 text-sm font-semibold">Wed 7:00</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr key={row.group} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="border-b border-slate-200 p-3 font-semibold text-slate-900">{row.group}</td>
                    <td className="border-b border-slate-200 p-3 text-slate-700">{row.sun945}</td>
                    <td className="border-b border-slate-200 p-3 text-slate-700">{row.sun11}</td>
                    <td className="border-b border-slate-200 p-3 text-slate-700">{row.sun6}</td>
                    <td className="border-b border-slate-200 p-3 text-slate-700">{row.wed7}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Check-in */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How check-in works
            </h2>
            <p className="mt-4 text-slate-700">
              We use Planning Center Check-Ins, the same system used by
              thousands of churches. At the check-in station your child gets a
              printed name tag, and you get a matching pickup tag — your child
              is released only to the person holding it. It takes about a
              minute, and a real person is at the station to help the first
              time.
            </p>
            {/* TODO: Steven — CONFIRM this describes your actual check-in flow
                (name tag + matching parent tag). Adjust if you run it differently. */}
          </div>
          <Photo
            src="/images/checkin-station.jpg"
            alt="A family using the check-in station"
            width={1200}
            height={800}
          />
        </div>
      </section>

      {/* Who's in the room */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Who&rsquo;s in the room
          </h2>
          <p className="mt-4 text-slate-700">
            Every class has a teacher and a helper — two adults, every time.
            When a child has special needs, we add additional helpers so that
            every kid can be part of the class.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {teachers.map((t) => (
              <div key={t.class} className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{t.class}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{t.who}</p>
                <p className="mt-1 text-sm text-slate-600">{t.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-slate-700">
            What does the hour look like? Bible teaching at their level,
            scripture memory, singing, and yes — some fun. The goal is that
            your child walks out able to tell you what the Bible said, not just
            what the craft was.
          </p>
        </div>
      </section>

      <NextStep
        title="See it before you need it"
        text="Come on a Sunday and walk through check-in with us — or ask us anything first."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "About Family School (9:45)", href: "/family-school" }}
      />
    </main>
  );
}
