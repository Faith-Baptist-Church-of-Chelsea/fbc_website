import site from "@/content/site.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fbc-website-delta.vercel.app";

/** "9:45 AM" -> "09:45", "6:00 PM" -> "18:00" — schema.org wants 24h time. */
function to24Hour(time: string): string | null {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2];
  const isPM = m[3].toUpperCase() === "PM";
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

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
    // Weekly services as recurring opening hours (the schema.org-correct
    // way to represent them — Event requires a concrete startDate, which
    // a perpetually-repeating service doesn't have, and was failing
    // Google's Rich Results validation on every service every time).
    openingHoursSpecification: site.services
      .map((s) => {
        const opens = to24Hour(s.time);
        return opens
          ? {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: `https://schema.org/${s.day}`,
              opens,
              description: s.name,
            }
          : null;
      })
      .filter(Boolean),
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
