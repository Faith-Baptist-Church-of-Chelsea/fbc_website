import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Layout for every public-facing page: header + page + footer.
// The /keystatic admin route sits outside this group so the CMS
// gets the full screen to itself.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
