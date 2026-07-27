import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Sermons",
  description: "Watch the latest message or browse the archive.",
};

export default function Page() {
  return <PageStub title="Sermons" description="Watch the latest message or browse the archive." />;
}
