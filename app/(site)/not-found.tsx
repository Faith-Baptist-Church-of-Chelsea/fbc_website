import NotFoundContent from "@/components/NotFoundContent";

// 404 boundary for everything inside the (site) group — the layout already
// renders Header/Footer around this.
export default function NotFound() {
  return <NotFoundContent />;
}
