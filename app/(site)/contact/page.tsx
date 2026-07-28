import type { Metadata } from "next";
import site from "@/content/site.json";
import PageHero from "@/components/PageHero";
import NextStep from "@/components/NextStep";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Faith Baptist Church of Chelsea — directions, office hours, prayer requests, and a direct line if you're new.",
  openGraph: { images: ["/images/building-exterior.jpg"] },
};

export default function Contact() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`
  )}&output=embed`;

  return (
    <main className="flex-1">
      <PageHero
        eyebrow="We answer"
        title="Contact Us"
        intro="A question, a prayer request, or just figuring out if we're the right church to try — every one of those is worth a message."
      />

      {/* The form — one form for everything, kind selector on top */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <ContactForm />
          <p className="mt-4 text-sm text-slate-500">
            Prefer email? The direct addresses below work too.
          </p>
        </div>
      </section>

      {/* Three direct paths */}
      <section className="bg-white px-4 pb-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">I&rsquo;m new here</h2>
            <p className="mt-2 text-sm text-slate-600">
              Planning a visit, or just have questions about what we&rsquo;re
              like? Pastor Steve reads these himself.
            </p>
            <a
              href={`mailto:${site.emails.assistantPastor}?subject=I'm new — question before visiting`}
              className="mt-4 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              {site.emails.assistantPastor}
            </a>
          </div>
          <div className="rounded-xl bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Prayer request</h2>
            <p className="mt-2 text-sm text-slate-600">
              We take these seriously and handle them with care. Mark it
              confidential if you&rsquo;d like it kept to the pastors.
            </p>
            <a
              href={`mailto:${site.emails.pastor}?subject=Prayer request`}
              className="mt-4 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              {site.emails.pastor}
            </a>
          </div>
          <div className="rounded-xl bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Church office</h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything else — scheduling, questions, ministry contacts.
            </p>
            <a
              href={`mailto:${site.emails.office}`}
              className="mt-4 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              {site.emails.office}
            </a>
            <p className="mt-2">
              <a href={`tel:${site.phone.replace(/\D/g, "")}`} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                {site.phone}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Map + hours */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl">
            <iframe
              src={mapSrc}
              title={`Map to ${site.name}, ${site.address.street}, ${site.address.city}`}
              className="h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Office hours</h2>
            <ul className="mt-4 space-y-2">
              {site.officeHours.map((h) => (
                <li key={h.days} className="flex justify-between gap-4 border-b border-slate-200 pb-2 text-slate-700">
                  <span>{h.days}</span>
                  <span className="font-semibold text-slate-900">{h.hours}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-slate-600">
              {site.address.street}, {site.address.city}, {site.address.state}{" "}
              {site.address.zip} — {site.address.directionsNote}.
            </p>
            <a
              href={site.address.mapsUrl}
              className="mt-3 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </section>

      <NextStep
        title="Or skip the email entirely"
        text="The conversation is better in person anyway. Sunday at 11 is a great place to start."
        primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
        secondary={{ label: "Common Questions", href: "/common-questions" }}
      />
    </main>
  );
}
