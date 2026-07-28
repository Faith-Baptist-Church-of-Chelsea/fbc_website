import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveBanner from "@/components/LiveBanner";
import AskBubble from "@/components/AskBubble";
import ScrollReveal from "@/components/ScrollReveal";

// Layout for every public-facing page: live banner (only during service
// windows) + header + page + footer + question bubble. The /keystatic
// admin route sits outside this group so the CMS gets the full screen.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <LiveBanner />
      <Header />
      <div id="main-content" className="contents">
        {children}
      </div>
      <Footer />
      {/* Only show the chat bubble when the AI backend is configured */}
      {process.env.ANTHROPIC_API_KEY && <AskBubble />}
      <ScrollReveal />
    </>
  );
}
