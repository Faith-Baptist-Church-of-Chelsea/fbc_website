import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Events",
  description: "What’s coming up at Faith Baptist Church.",
};

export default function Page() {
  return <PageStub title="Events" description="What’s coming up at Faith Baptist Church." />;
}
