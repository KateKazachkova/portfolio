import type { CaseStudy, Para, Span } from "./types";
import { skeleton, tk } from "./draft";

/**
 * BulkSource's folders, each its own case — drafts: the pages laid out
 * ahead of their text, with what is already known (content/profile.ts) and
 * a TK chip wherever Kate's words go. The web platform is split by years
 * (there is no 2024 folder); the TMS, the Windows app and the design system
 * are one each. Their order here is their ring's, and their file numbers
 * follow on from OnsiSoft's 003.
 */
const folder = (i: number, { slug, title, what, years, role, scope, outcomes }: {
  slug: string; title: string;
  /** what the folder holds, after "BulkSource, the … platform –" */
  what: string;
  years?: string; role?: Span; scope?: Span; outcomes?: Para[];
}): CaseStudy => ({
  slug: `bulksource-${slug}`,
  parent: "BulkSource",
  draft: true,
  fileNo: `File ${String(4 + i).padStart(3, "0")} · BulkSource`,
  title,
  years: years ?? "TK",
  result: [tk("the result in one line: a number, or what shipped")],
  subtitle: `BulkSource, the B2B supply-chain platform for bulk materials – ${what}.`,
  fields: [
    { key: "Role", value: [role ?? tk("my role")] },
    { key: "Scope", value: [scope ?? tk("what I worked on")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: [years ?? tk("years")] },
  ],
  sections: skeleton({ outcomes }),
});

const BULKSOURCE = [
  { slug: "web-2021-2022", title: "Web platform, 2021–2022", years: "2021 – 2022", what: "its web platform, designed from the ground up",
    role: "Solo designer", scope: "Business analysis · UX research\nUI · Design system · Handoff",
    outcomes: [["Featured on Fox Business “The Claman Countdown” (2021)."]] },
  { slug: "web-2023", title: "Web platform, 2023", years: "2023", what: "its web platform in 2023", role: "Solo designer",
    outcomes: [["Named to the BuiltWorlds 2023 Infrastructure 50."]] },
  { slug: "web-2025-2026", title: "Web platform, 2025–2026", years: "2025 – 2026", what: "its web platform in 2025–2026", role: "Design lead" },
  { slug: "tms", title: "TMS", what: "its transport management system" },
  { slug: "windows", title: "Windows app", what: "its Windows app" },
  { slug: "design-system", title: "Design system", what: "its design system", scope: tk("tokens, components, docs…") },
].map((f, i) => folder(i, f));

export default BULKSOURCE;
