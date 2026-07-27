import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Young Adults",
  description: "Ages 18–30 — events, activities, and the Unashamed conference.",
};

export default function Page() {
  return <PageStub title="Young Adults" description="Ages 18–30 — events, activities, and the Unashamed conference." />;
}
