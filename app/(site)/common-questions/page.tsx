import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Common Questions",
  description: "Plain answers to the questions we get asked most.",
};

export default function Page() {
  return <PageStub title="Common Questions" description="Plain answers to the questions we get asked most." />;
}
