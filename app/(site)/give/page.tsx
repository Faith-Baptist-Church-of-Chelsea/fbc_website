import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Give online to Faith Baptist Church of Chelsea — simple and secure. Giving is for our church family; visitors are our guests.",
};

// The giving destination is a single config value (site.json → links.giving),
// currently ChurchTrac. If we embed a different giving form later, only
// content/site.json changes.
export default function Give() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Cheerfully, not under compulsion"
        title="Give"
        intro="Giving is how our church family supports the work of the church — the ministry here and the missionaries we send. It's an act of worship, not a fee."
      />

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900">Give online</h2>
          <p className="mt-3 text-slate-700">
            Online giving runs through ChurchTrac, our secure giving provider.
            You can give once or set up recurring giving — right here, without
            leaving the page.
          </p>
          {/* Embedded ChurchTrac giving form. Requires this site's domain to
              be entered in ChurchTrac -> Giving -> Online Giving -> Embed
              (one domain only — update it when we move to fbcchelsea.org). */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <iframe
              src={site.links.giving}
              title="Give online to Faith Baptist Church (secure ChurchTrac form)"
              className="h-[52rem] w-full border-0"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Form not loading?{" "}
            <a href={site.links.giving} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              Open the secure giving page directly
            </a>
            .
          </p>
          <p className="mt-8 text-slate-600">
            Prefer to give in person? There&rsquo;s an offering at every
            service — cash or check, envelopes available.
          </p>
          <div className="mt-10 rounded-xl bg-slate-50 p-6">
            <p className="text-slate-700">
              <span className="font-semibold text-slate-900">
                If you&rsquo;re a visitor:
              </span>{" "}
              please don&rsquo;t feel any obligation to give. You&rsquo;re our
              guest. This page exists for our church family.
            </p>
          </div>
        </div>
      </section>

      <NextStep
        title="Questions about giving?"
        text="We're glad to talk it through — including where the money goes."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "What we believe about giving", href: "/about#statement-of-faith" }}
      />
    </main>
  );
}
