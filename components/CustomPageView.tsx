import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import PageBlocks from "@/components/PageBlocks";
import NextStep from "@/components/NextStep";
import { getCustomPage } from "@/lib/pages";
import { richTextToPlainText, safeUrl } from "@/lib/richtext";
import type { Locale } from "@/lib/i18n";

type CustomPage = NonNullable<Awaited<ReturnType<typeof getCustomPage>>>;

/** Metadata for a build-your-own page: description from the dedicated field,
 *  the intro, or the first words of the first text block — in that order. */
export function customPageMetadata(page: CustomPage): Metadata {
  const firstText = page.sections.find((s) => s.discriminant === "text" || s.discriminant === "imageText");
  const description =
    page.description ||
    page.intro ||
    (firstText ? richTextToPlainText(firstText.value.body).slice(0, 160) : undefined);
  const firstImage = page.sections
    .map((s) => (s.discriminant === "image" || s.discriminant === "imageText" ? s.value.image : null))
    .find(Boolean);
  return {
    title: page.browserTitle || page.title,
    description,
    openGraph: firstImage ? { images: [firstImage] } : undefined,
  };
}

const FALLBACK_NEXT_STEP = {
  en: {
    title: "The next step is a visit",
    text: "The best way to get to know us is in person — we'd love to meet you.",
    primary: "Plan Your Visit",
    secondary: "Common Questions",
  },
  es: {
    title: "El siguiente paso es una visita",
    text: "La mejor manera de conocernos es en persona — nos encantaría recibirle.",
    primary: "Planifique su visita",
    secondary: "Preguntas frecuentes",
  },
};

/** Renders a build-your-own page from the "Pages" collection. */
export default function CustomPageView({ page, locale = "en" }: { page: CustomPage; locale?: Locale }) {
  const ns = page.nextStep;
  const hasCustomNextStep = Boolean(ns.title && ns.primaryLabel && safeUrl(ns.primaryLink));
  const hasSecondary = Boolean(ns.secondaryLabel && safeUrl(ns.secondaryLink));
  const fb = FALLBACK_NEXT_STEP[locale];

  return (
    <main className="flex-1">
      <PageHero eyebrow={page.eyebrow || undefined} title={page.title} intro={page.intro || undefined} />

      <div className="pt-4">
        <PageBlocks sections={page.sections} />
      </div>

      {hasCustomNextStep ? (
        <NextStep
          title={ns.title}
          text={ns.text || undefined}
          primary={{ label: ns.primaryLabel, href: safeUrl(ns.primaryLink)! }}
          secondary={hasSecondary ? { label: ns.secondaryLabel, href: safeUrl(ns.secondaryLink)! } : undefined}
        />
      ) : (
        <NextStep
          title={fb.title}
          text={fb.text}
          primary={{ label: fb.primary, href: "/plan-your-visit" }}
          secondary={{ label: fb.secondary, href: "/common-questions" }}
        />
      )}
    </main>
  );
}
