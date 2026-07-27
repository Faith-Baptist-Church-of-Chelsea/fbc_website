import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Give",
  description: "A simple, secure way to give online.",
};

export default function Page() {
  return <PageStub title="Give" description="A simple, secure way to give online." />;
}
