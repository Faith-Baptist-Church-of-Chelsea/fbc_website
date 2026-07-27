import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Church Center App",
  description: "Our church in your pocket — events, groups, and more.",
};

export default function Page() {
  return <PageStub title="Church Center App" description="Our church in your pocket — events, groups, and more." />;
}
