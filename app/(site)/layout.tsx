import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveBanner from "@/components/LiveBanner";
import AskBubble from "@/components/AskBubble";

// Layout for every public-facing page: live banner (only during service
// windows) + header + page + footer + question bubble. The /keystatic
// admin route sits outside this group so the CMS gets the full screen.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <LiveBanner />
      <Header />
      {children}
      <Footer />
      {/* Only show the chat bubble when the AI backend is configured */}
      {process.env.ANTHROPIC_API_KEY && <AskBubble />}
    </>
  );
}
