import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "About Us",
  description: "Our history, our leadership, and what we believe.",
};

export default function Page() {
  return <PageStub title="About Us" description="Our history, our leadership, and what we believe." />;
}
