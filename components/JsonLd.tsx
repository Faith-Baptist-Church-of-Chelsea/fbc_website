import site from "@/content/site.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

// Structured data (JSON-LD) so search engines understand exactly what this
// site is: a church, at this address, with these services. Emitted on every
// page via the root layout.
export function ChurchJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: `${site.name} of Chelsea`,
    alternateName: "FBC Chelsea",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-header.png`,
    image: `${SITE_URL}/images/building-exterior.jpg`,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: "US",
    },
    sameAs: [site.social.facebook, site.social.instagram, site.social.youtube],
    // Weekly services expressed as a repeating event schedule
    event: site.services.map((s) => ({
      "@type": "Event",
      name: `${s.name} — ${site.name} of Chelsea`,
      eventSchedule: {
        "@type": "Schedule",
        byDay: `https://schema.org/${s.day === "Sunday" ? "Sunday" : "Wednesday"}`,
        repeatFrequency: "P1W",
      },
      location: { "@type": "Place", name: `${site.name} of Chelsea`, address: `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}` },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** FAQ rich-result markup for the Common Questions page. */
export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** Event rich-result markup for event detail pages. */
export function EventJsonLd({
  title,
  date,
  endDate,
  image,
  description,
  slug,
  location,
}: {
  title: string;
  date: string;
  endDate: string | null;
  image: string | null;
  description: string;
  slug: string;
  location: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: date,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: `${SITE_URL}/events/${slug}`,
    ...(image ? { image: [`${SITE_URL}${image}`] } : {}),
    ...(description ? { description } : {}),
    location: {
      "@type": "Place",
      name: location || `${site.name} of Chelsea`,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.state,
        postalCode: site.address.zip,
        addressCountry: "US",
      },
    },
    organizer: { "@type": "Organization", name: `${site.name} of Chelsea`, url: SITE_URL },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
