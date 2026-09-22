import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomPageView, { customPageMetadata } from "@/components/CustomPageView";
import { getCustomPage } from "@/lib/pages";

// The Spanish visitor page. Its CONTENT is the ordinary "espanol" entry in
// the Pages collection (editable in /keystatic like any page); what's
// special is that it renders inside the Spanish (es) layout so the header,
// footer, banner and chat bubble read in Spanish too.
export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCustomPage("espanol");
  return page ? customPageMetadata(page) : {};
}

export default async function EspanolPage() {
  const page = await getCustomPage("espanol");
  if (!page) notFound();
  return <CustomPageView page={page} locale="es" />;
}
