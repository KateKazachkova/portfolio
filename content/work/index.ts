import type { CaseStudy } from "./types";
import { WRITTEN_SLUGS } from "./slugs";
import ukrainska15 from "./ukrainska-15";
import onsisoft from "./onsisoft";
import BULKSOURCE from "./bulksource";

/**
 * Cases written up as annotated documents, the only pages under /work. A
 * case file whose slug isn't here lies on the desk without a link until it
 * is written; adding one is writing the file, listing it here and its slug
 * in ./slugs.ts. Drafts (`draft: true`) are here but not in ./slugs.ts.
 */
const CASES: Record<string, CaseStudy> = Object.fromEntries(
  [ukrainska15, onsisoft, ...BULKSOURCE].map((c) => [c.slug, c]),
);

const WRITTEN = Object.values(CASES).filter((c) => !c.draft).map((c) => c.slug);
if (WRITTEN.sort().join() !== [...WRITTEN_SLUGS].sort().join())
  throw new Error("content/work/slugs.ts is out of step with the cases in content/work/index.ts");

export function getCase(slug: string): CaseStudy | null {
  return CASES[slug] ?? null;
}

/** The cases either side of this one, in the order above, wrapping round:
 *  after the last comes the first again. A written case's ring is the
 *  written ones, a draft's the drafts. */
export function neighbours(slug: string) {
  const draft = !!CASES[slug]?.draft;
  const all = Object.values(CASES).filter((c) => !!c.draft === draft), i = all.findIndex((c) => c.slug === slug);
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

export default CASES;
