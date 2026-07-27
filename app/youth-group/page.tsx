import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Youth Group",
  description: "Ages 12–18, Wednesdays at 7:00 PM.",
};

export default function Page() {
  return <PageStub title="Youth Group" description="Ages 12–18, Wednesdays at 7:00 PM." />;
}
