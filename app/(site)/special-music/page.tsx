import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Photo from "@/components/Photo";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Special Music",
  description:
    "The choir and orchestra of Faith Baptist Church of Chelsea — and how to join them. No audition required; just talk to Matthew Dowdy.",
};

export default function SpecialMusic() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Choir & Orchestra"
        title="Special Music"
        intro="A beautiful blend — old hymns and newer spiritual songs, sung and played by our own people. The choir is a blessing every single Sunday."
      />

      {/* Hear it */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Hear it for yourself
          </h2>
          <div className="mt-8 overflow-hidden rounded-xl">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube-nocookie.com/embed/JtMjjbSNP88"
              title="Special music at Faith Baptist Church"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* The barrier is lower than you think */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Anyone can join. We mean that literally.
            </h2>
            <p className="mt-4 text-slate-700">
              No audition. No tryout. No music degree. If you can carry a tune
              — or used to play an instrument and think you&rsquo;re too rusty
              — the seat is already there. Simply speak with{" "}
              <span className="font-semibold text-slate-900">Matthew Dowdy</span>,
              our music director.
            </p>
            <p className="mt-4 text-slate-700">
              Matthew has a music degree and more than a decade of directing
              experience, and he&rsquo;d rather have a willing voice than a
              perfect one.
            </p>
          </div>
          <div className="grid gap-4">
            <Photo src="/images/choir.jpg" alt="The choir singing on a Sunday morning" width={1200} height={700} />
            <Photo src="/images/orchestra.jpg" alt="The orchestra playing" width={1200} height={700} />
          </div>
        </div>
      </section>

      {/* One obvious button */}
      <section className="px-4 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Want in?
          </h2>
          <p className="mt-3 text-slate-700">
            Tell us you&rsquo;re interested and Matthew will find you on Sunday.
            That&rsquo;s the whole process.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-brand-600"
          >
            I want to join the choir or orchestra
          </Link>
        </div>
      </section>

      <NextStep
        title="Come hear it live"
        text="A recording doesn't do a full choir justice. Come listen on Sunday at 11."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "More on our music", href: "/common-questions" }}
      />
    </main>
  );
}
