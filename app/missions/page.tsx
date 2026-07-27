import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Missions",
  description: "The missionaries we support around the world.",
};

export default function Page() {
  return <PageStub title="Missions" description="The missionaries we support around the world." />;
}
