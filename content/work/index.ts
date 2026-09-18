import type { CaseStudy } from "./types";
import ukrainska15 from "./ukrainska-15";
import waypro from "./waypro";

/**
 * Cases written up as annotated documents. A slug that isn't here falls back
 * to the Notion renderer in app/work/[slug]/page.tsx, so adding one is a
 * matter of writing the file — nothing else has to change.
 */
const CASES: Record<string, CaseStudy> = {
  [ukrainska15.slug]: ukrainska15,
  [waypro.slug]: waypro,
};

export function getCase(slug: string): CaseStudy | null {
  return CASES[slug] ?? null;
}

export default CASES;
