import { notFound } from "next/navigation";
import CASES, { getCase } from "@/content/work";
import CaseStudy from "@/components/case/CaseStudy";

// Only the cases written up in content/work have a page; any other slug is a
// 404 straight away.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CASES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const written = getCase(slug);
  if (!written) return { title: "Case Study – Kate Kazachkova" };
  return { title: `${written.title} – Kate Kazachkova`, description: written.subtitle };
}

export default async function CaseStudyRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const written = getCase(slug);
  if (!written) notFound();
  return <CaseStudy data={written} />;
}
