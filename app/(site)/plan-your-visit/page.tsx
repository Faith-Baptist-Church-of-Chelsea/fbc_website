import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Plan Your Visit",
  description: "Everything you need to know before your first Sunday — where to park, which door, and what to expect.",
};

export default function Page() {
  return <PageStub title="Plan Your Visit" description="Everything you need to know before your first Sunday — where to park, which door, and what to expect." />;
}
