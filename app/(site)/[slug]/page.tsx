import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import PageBlocks from "@/components/PageBlocks";
import NextStep from "@/components/NextStep";
import { getCustomPage, getCustomPages } from "@/lib/pages";
import { richTextToPlainText, safeUrl } from "@/lib/richtext";

// Build-your-own pages from the "Pages" collection in /keystatic.
// This route only answers for addresses no built-in page owns — Next.js
// always prefers a static route (about/, give/, …) over this dynamic one,
// so a custom page can shadow nothing.
export const revalidate = 900;

export async function generateStaticParams() {
  const pages = await getCustomPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomPage(slug);
  if (!page) return {};

  // Meta description: the intro, or the first words of the first text block.
  const firstText = page.sections.find(
    (s) => s.discriminant === "text" || s.discriminant === "imageText"
  );
  const description =
    page.intro ||
    (firstText ? richTextToPlainText(firstText.value.body).slice(0, 160) : undefined);

  // OG image: the first photo on the page, if any.
  const firstImage = page.sections
    .map((s) =>
      s.discriminant === "image" || s.discriminant === "imageText" ? s.value.image : null
    )
    .find(Boolean);

  return {
    title: page.title,
    description,
    openGraph: firstImage ? { images: [firstImage] } : undefined,
  };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getCustomPage(slug);
  if (!page) notFound();

  const ns = page.nextStep;
  const hasCustomNextStep = Boolean(ns.title && ns.primaryLabel && safeUrl(ns.primaryLink));
  const hasSecondary = Boolean(ns.secondaryLabel && safeUrl(ns.secondaryLink));

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={page.eyebrow || undefined}
        title={page.title}
        intro={page.intro || undefined}
      />

      <div className="pt-4">
        <PageBlocks sections={page.sections} />
      </div>

      {hasCustomNextStep ? (
        <NextStep
          title={ns.title}
          text={ns.text || undefined}
          primary={{ label: ns.primaryLabel, href: safeUrl(ns.primaryLink)! }}
          secondary={
            hasSecondary
              ? { label: ns.secondaryLabel, href: safeUrl(ns.secondaryLink)! }
              : undefined
          }
        />
      ) : (
        <NextStep
          title="The next step is a visit"
          text="The best way to get to know us is in person — we'd love to meet you."
          primary={{ label: "Plan Your Visit", href: "/plan-your-visit" }}
          secondary={{ label: "Common Questions", href: "/common-questions" }}
        />
      )}
    </main>
  );
}
