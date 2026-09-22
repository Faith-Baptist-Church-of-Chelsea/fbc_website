import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomPageView, { customPageMetadata } from "@/components/CustomPageView";
import { getCustomPage, getCustomPages, LOCALIZED_SLUGS } from "@/lib/pages";

// Build-your-own pages from the "Pages" collection in /keystatic.
// This route only answers for addresses no built-in page owns — Next.js
// always prefers a static route (about/, give/, …) over this dynamic one,
// so a custom page can shadow nothing. Pages with their own localized
// route group (LOCALIZED_SLUGS) are skipped here for the same reason.
export const revalidate = 900;

export async function generateStaticParams() {
  const pages = await getCustomPages();
  return pages.filter((p) => !LOCALIZED_SLUGS.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (LOCALIZED_SLUGS.has(slug)) return {};
  const page = await getCustomPage(slug);
  return page ? customPageMetadata(page) : {};
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (LOCALIZED_SLUGS.has(slug)) notFound();
  const page = await getCustomPage(slug);
  if (!page) notFound();
  return <CustomPageView page={page} />;
}
