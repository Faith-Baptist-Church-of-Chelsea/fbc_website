import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "FBC Kids",
  description: "Our children’s ministry, nursery through age 12.",
};

export default function Page() {
  return <PageStub title="FBC Kids" description="Our children’s ministry, nursery through age 12." />;
}
