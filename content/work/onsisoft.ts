import type { CaseStudy } from "./types";
import { skeleton, tk } from "./draft";
import { VERIFIED_PROJECTS } from "@/lib/awards";

const AWARDS = VERIFIED_PROJECTS.find((p) => p.id === "onsisoft")!;

/**
 * CASE 003 — OnsiSoft. A draft: the page laid out ahead of its text, with
 * what is already known (content/profile.ts, the payslip on the desk,
 * lib/awards.ts) and a TK chip wherever Kate's words go.
 */
const onsisoft: CaseStudy = {
  slug: "onsisoft",
  draft: true,
  fileNo: "File 003 · Product design",
  title: "OnsiSoft",
  years: "2024 – 2026",

  result: [
    { mark: "Support requests down 71%, onboarding completion up 76%" },
    " – ", tk("how, in one line"),
  ],

  subtitle:
    "Compliance and benefits SaaS for US government contractors, redesigned since October 2024.",

  fields: [
    { key: "Role", value: ["Solo designer, 2024–2025\nDesign lead, 2025–present"] },
    { key: "Scope", value: [tk("research, UX, UI, design system…")] },
    { key: "Team", value: ["My design team since Apr 2025\nAn intern, Jun – Nov 2025"] },
    { key: "Duration", value: ["Oct 2024 – present"] },
    { key: "Recognition", value: [AWARDS.awards.join("\n")] },
  ],

  sections: skeleton({
    awards: true,
    stats: [
      { n: "−71", sup: "%", caption: "Support requests" },
      { n: "+76", sup: "%", caption: "Onboarding completion" },
      { n: String(AWARDS.recognitionCount), sup: "×", caption: "International awards" },
    ],
  }),
};

export default onsisoft;
