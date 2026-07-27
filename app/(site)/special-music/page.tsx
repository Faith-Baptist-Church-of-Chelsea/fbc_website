import type { Metadata } from "next";
import PageStub from "@/components/PageStub";

export const metadata: Metadata = {
  title: "Special Music",
  description: "Our choir and orchestra — anyone can join, no audition.",
};

export default function Page() {
  return <PageStub title="Special Music" description="Our choir and orchestra — anyone can join, no audition." />;
}
