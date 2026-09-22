import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFoundContent from "@/components/NotFoundContent";

// Root 404 boundary: only reached for paths outside the (site) route group,
// so it has to supply the site chrome itself. Unknown URLs inside the site
// (the common case) use app/(site)/not-found.tsx instead.
export default function NotFound() {
  return (
    <>
      <Header />
      <NotFoundContent />
      <Footer />
    </>
  );
}
