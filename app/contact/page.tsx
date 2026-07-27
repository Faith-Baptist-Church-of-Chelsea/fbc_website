import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach us, send a prayer request, or let us know you’re new.",
};

export default function Page() {
  return <PageStub title="Contact" description="Reach us, send a prayer request, or let us know you’re new." />;
}
