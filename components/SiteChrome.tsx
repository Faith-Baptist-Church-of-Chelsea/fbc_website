import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveBanner from "@/components/LiveBanner";
import AskBubble from "@/components/AskBubble";
import ScrollReveal from "@/components/ScrollReveal";
import { getCustomNavLinks } from "@/lib/pages";
import { ES, type Locale } from "@/lib/i18n";

// Everything that wraps a public page: live banner (only during service
// windows) + header + page + footer + question bubble. Used by the English
// (site) layout and the Spanish (es) layout, which differ only in locale.
// Volunteer-created pages (the "Pages" collection) that opted into the menu
// are read here and passed to the header and footer.
export default async function SiteChrome({ locale = "en", children }: { locale?: Locale; children: React.ReactNode }) {
  const cmsNav = await getCustomNavLinks();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        {locale === "es" ? ES.skipToContent : "Skip to content"}
      </a>
      <LiveBanner locale={locale} />
      <Header extraMinistries={cmsNav.ministries} extraSecondary={cmsNav.footer} locale={locale} />
      <div id="main-content" className="contents">
        {children}
      </div>
      <Footer extraLinks={cmsNav.footer} locale={locale} />
      {/* Only show the chat bubble when the AI backend is configured */}
      {process.env.ANTHROPIC_API_KEY && <AskBubble locale={locale} />}
      <ScrollReveal />
    </>
  );
}
