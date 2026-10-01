import type { Metadata } from "next";
import CaseIndex from "@/components/case/CaseIndex";

// Every case file, one level above each case: reached from a case's crumbs.
export const metadata: Metadata = {
  title: "Case Studies – Kate Kazachkova",
  description: "Every case file: the written ones and those still being written.",
};

export default function CaseStudiesRoute() {
  return <CaseIndex />;
}
