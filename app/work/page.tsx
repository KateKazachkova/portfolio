import { notFound } from "next/navigation";

// Case Studies, the index of every case file, is not on the live site yet:
// the case files are on home's desk (/#case-files).
export default function CaseStudiesRoute() {
  notFound();
}
