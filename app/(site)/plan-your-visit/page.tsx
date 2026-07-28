import type { Metadata } from "next";
import Link from "next/link";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Plan Your Visit",
  description:
    "Where to park, which door to use, what to wear, and what happens with your kids — everything you need to know before your first Sunday at Faith Baptist Church in Chelsea.",
  openGraph: { images: ["/images/building-exterior.jpg"] },
};

export default function PlanYourVisit() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="First time?"
        title="We saved you a seat."
        intro="Walking into a new church is a big step, and we don't take it for granted. Here's everything you need to know before Sunday — no surprises."
      />

      {/* When & where — the two facts every visitor needs first */}
      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-8">
            <h2 className="text-xl font-bold text-slate-900">When we meet</h2>
            <ul className="mt-4 space-y-3">
              {site.services.map((s) => (
                <li key={`${s.day}-${s.time}`} className="flex justify-between gap-4 border-b border-slate-200 pb-2 text-slate-700 last:border-0">
                  <span>
                    {s.day} — {s.name}
                  </span>
                  <span className="font-semibold text-slate-900">{s.time}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-slate-600">
              Any of them is a great first visit — each service is different.
              Services run about an hour and 15 minutes.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-8">
            <h2 className="text-xl font-bold text-slate-900">Where we are</h2>
            <p className="mt-4 text-slate-700">
              <a href={site.address.mapsUrl} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
              </a>
            </p>
            <p className="mt-2 text-slate-600">
              Just off {site.address.directionsNote} — a few minutes from
              downtown Chelsea.
            </p>
            <p className="mt-4 text-slate-600">
              Look for the <span className="font-semibold text-slate-900">visitor parking signs</span> —
              those spots are reserved for first-time guests. Greeters at the
              door will help you find everything.
            </p>
          </div>
        </div>
      </section>

      {/* Photos: the "am I in the right place" sequence */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            So you know it when you see it
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <figure>
              <Photo src="/images/building-exterior.jpg" alt="Faith Baptist Church building from the road" width={800} height={600} />
              <figcaption className="mt-2 text-sm text-slate-600">The building, from Kalmbach Road</figcaption>
            </figure>
            <figure>
              <Photo src="/images/parking-lot.jpg" alt="The church parking lot with visitor parking signs" width={800} height={600} />
              <figcaption className="mt-2 text-sm text-slate-600">Visitor parking is marked — those spots are for you</figcaption>
            </figure>
            <figure>
              <Photo src="/images/main-entrance.jpg" alt="The main entrance visitors should use" width={800} height={600} />
              <figcaption className="mt-2 text-sm text-slate-600">Come in through the main entrance</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* The honest answers section */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Where do I go first?</h2>
            <p className="mt-3 text-slate-700">
              The <span className="font-semibold text-slate-900">welcome desk</span>,
              right inside the main entrance. There&rsquo;s a free gift waiting
              for you there, and it&rsquo;s the spot where any question gets
              answered — where the nursery is, where your kids&rsquo; classes
              meet, and anything else you&rsquo;re wondering.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">What should I wear?</h2>
            <p className="mt-3 text-slate-700">
              Whatever you&rsquo;re comfortable in. You&rsquo;ll see plenty of
              suits and dresses and plenty of T-shirts, often in the same pew —
              there is no judgment based on dress here, in either direction.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Will anyone single me out?</h2>
            <p className="mt-3 text-slate-700">
              No. We won&rsquo;t ask you to stand up, raise your hand, or
              introduce yourself to the room. People will greet you — we really
              are a friendly church — but you can be as anonymous as you want
              to be.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">What&rsquo;s the service like?</h2>
            <p className="mt-3 text-slate-700">
              We sing — old hymns and newer spiritual songs, often with our
              choir — and then the preaching works through a passage of the
              Bible, digging into what it actually says. We preach from the
              King James Version.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">What about my kids?</h2>
            <p className="mt-3 text-slate-700">
              A clean, staffed{" "}
              <Link href="/fbc-kids" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                nursery
              </Link>{" "}
              is available for ages 0–3 at every service, and Sunday at 11:00
              there are classes for ages 3 through 12 with a simple, secure
              check-in. Kids are also always welcome to stay in the service
              with you — nobody minds a wiggly toddler.
            </p>
            <p className="mt-2">
              <Link href="/fbc-kids" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                See the full kids schedule →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Low-pressure, clearly optional */}
      <section className="bg-slate-50 px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Want us to expect you? (Totally optional)
          </h2>
          <p className="mt-3 text-slate-700">
            You&rsquo;re welcome to just show up — most people do. But if you
            let us know you&rsquo;re coming, we&rsquo;ll have someone watching
            for you at the door — and if you tell us your kids&rsquo; ages,
            we&rsquo;ll email you a short introduction to their teachers so
            the faces are familiar before you ever walk in.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Let us know you&rsquo;re coming
          </Link>
        </div>
      </section>

      <NextStep
        title="Still have questions?"
        text="Are you KJV? What's the music like? What do you believe? We answer the questions people actually ask."
        primary={{ label: "Read Common Questions", href: "/common-questions" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </main>
  );
}
