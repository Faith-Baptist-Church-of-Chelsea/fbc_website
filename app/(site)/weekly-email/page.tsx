import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import SubscribeForm from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "This Week at Faith — the weekly email",
  description:
    "One short email every Monday morning: what's happening at Faith Baptist Church of Chelsea this week — events, sign-ups, and announcements.",
};

// Explains what the Monday digest actually is before asking for an email
// address. The signup form itself is the same one in the footer.
export default function WeeklyEmailPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Every Monday morning"
        title="This Week at Faith"
        intro="One short email, once a week, with what's happening at the church — so nothing sneaks up on you."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900">What&rsquo;s in it</h2>
          <ul className="mt-4 space-y-3 text-lg text-slate-700">
            <li className="flex gap-3">
              <span className="text-brand-500" aria-hidden="true">✓</span>
              This week&rsquo;s events and anything that needs a sign-up, with the links to do it
            </li>
            <li className="flex gap-3">
              <span className="text-brand-500" aria-hidden="true">✓</span>
              Announcements — the things that usually get said from the front on Sunday
            </li>
            <li className="flex gap-3">
              <span className="text-brand-500" aria-hidden="true">✓</span>
              The service times and how to watch live, for anyone who needs them
            </li>
          </ul>
          <p className="mt-4 text-slate-600">
            That&rsquo;s it. No daily emails, nothing sold, and an unsubscribe link at the bottom of
            every one.{" "}
            <a
              href="/api/digest?preview=1"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              See this week&rsquo;s issue →
            </a>
          </p>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Get it in your inbox</h2>
            <p className="mt-1 text-slate-600">Arrives Monday mornings. Church family and visitors both welcome.</p>
            <div className="mt-4">
              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>

      <NextStep
        title="The best week is one you show up for"
        text="Four services a week, every week — the email just helps you not miss the rest."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "See what's coming up", href: "/events" }}
      />
    </main>
  );
}
