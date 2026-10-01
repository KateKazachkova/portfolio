import type { CaseStudy } from "./types";
import { skeleton, tk } from "./draft";

/**
 * BulkSource's folders, each its own case — drafts: the pages laid out
 * ahead of their text, with what is already known (content/profile.ts) and
 * a TK chip wherever Kate's words go. The web platform is split by years
 * (there is no 2024 folder); the TMS, the Windows app and the design system
 * are one each. Their order here is their ring's.
 */
const PARENT = "BulkSource";
const ABOUT = "BulkSource, the B2B supply-chain platform for bulk materials";

const common: Pick<CaseStudy, "parent" | "draft" | "result"> = { parent: PARENT, draft: true, result: [tk("the result in one line: a number, or what shipped")] };

const web2021: CaseStudy = {
  ...common,
  slug: "bulksource-web-2021-2022",
  fileNo: "File 004 · BulkSource",
  title: "Web platform, 2021–2022",
  years: "2021 – 2022",
  subtitle: `${ABOUT} – its web platform, designed from the ground up.`,
  fields: [
    { key: "Role", value: ["Sole product designer"] },
    { key: "Scope", value: ["Business analysis · UX research\nUI · Design system · Handoff"] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: ["2021 – 2022"] },
  ],
  sections: skeleton({ outcomes: [["Featured on Fox Business “The Claman Countdown” (2021)."]] }),
};

const web2023: CaseStudy = {
  ...common,
  slug: "bulksource-web-2023",
  fileNo: "File 005 · BulkSource",
  title: "Web platform, 2023",
  years: "2023",
  subtitle: `${ABOUT} – its web platform in 2023.`,
  fields: [
    { key: "Role", value: [tk("my role that year")] },
    { key: "Scope", value: [tk("what I worked on")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: ["2023"] },
  ],
  sections: skeleton({ outcomes: [["Named to the BuiltWorlds 2023 Infrastructure 50."]] }),
};

const web2025: CaseStudy = {
  ...common,
  slug: "bulksource-web-2025-2026",
  fileNo: "File 006 · BulkSource",
  title: "Web platform, 2025–2026",
  years: "2025 – 2026",
  subtitle: `${ABOUT} – its web platform in 2025–2026.`,
  fields: [
    { key: "Role", value: [tk("my role")] },
    { key: "Scope", value: [tk("what I worked on")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: ["2025 – 2026"] },
  ],
  sections: skeleton(),
};

const tms: CaseStudy = {
  ...common,
  slug: "bulksource-tms",
  fileNo: "File 007 · BulkSource",
  title: "TMS",
  years: "TK",
  subtitle: `${ABOUT} – its transport management system.`,
  fields: [
    { key: "Role", value: [tk("my role")] },
    { key: "Scope", value: [tk("what I worked on")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: [tk("years")] },
  ],
  sections: skeleton(),
};

const windows: CaseStudy = {
  ...common,
  slug: "bulksource-windows",
  fileNo: "File 008 · BulkSource",
  title: "Windows app",
  years: "TK",
  subtitle: `${ABOUT} – its Windows app.`,
  fields: [
    { key: "Role", value: [tk("my role")] },
    { key: "Scope", value: [tk("what I worked on")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: [tk("years")] },
  ],
  sections: skeleton(),
};

const designSystem: CaseStudy = {
  ...common,
  slug: "bulksource-design-system",
  fileNo: "File 009 · BulkSource",
  title: "Design system",
  years: "TK",
  subtitle: `${ABOUT} – its design system.`,
  fields: [
    { key: "Role", value: [tk("my role")] },
    { key: "Scope", value: [tk("tokens, components, docs…")] },
    { key: "Team", value: [tk("who I worked with")] },
    { key: "Duration", value: [tk("years")] },
  ],
  sections: skeleton(),
};

const BULKSOURCE = [web2021, web2023, web2025, tms, windows, designSystem];
export default BULKSOURCE;
