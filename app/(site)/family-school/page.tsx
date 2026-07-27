import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Family School",
  description: "Sunday mornings at 9:45 — all ages learning side by side.",
};

export default function Page() {
  return <PageStub title="Family School" description="Sunday mornings at 9:45 — all ages learning side by side." />;
}
