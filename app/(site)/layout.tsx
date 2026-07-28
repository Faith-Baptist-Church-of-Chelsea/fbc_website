import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveBanner from "@/components/LiveBanner";

// Layout for every public-facing page: live banner (only during service
// windows) + header + page + footer. The /keystatic admin route sits
// outside this group so the CMS gets the full screen to itself.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <LiveBanner />
      <Header />
      {children}
      <Footer />
    </>
  );
}
