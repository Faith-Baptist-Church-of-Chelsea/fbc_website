import SiteChrome from "@/components/SiteChrome";

// Layout for every public-facing (English) page. The /keystatic admin route
// sits outside this group so the CMS gets the full screen; the Spanish
// visitor page lives in the (es) group with the same chrome in Spanish.
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome locale="en">{children}</SiteChrome>;
}
