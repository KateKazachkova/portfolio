import type { CaseStudy } from "./types";
import { skeleton, tk } from "./draft";

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
    { key: "Role", value: [tk("my role on the project")] },
    { key: "Scope", value: [tk("research, UX, UI, design system…")] },
    { key: "Team", value: ["My design team since Apr 2025\nAn intern, Jun – Nov 2025"] },
    { key: "Duration", value: ["Oct 2024 – present"] },
    { key: "Recognition", value: ["NYX Awards – 3× Silver\nMUSE – 3× Silver\nIndigo Design Award – Silver, Bronze"] },
  ],

  sections: skeleton({
    awards: true,
    stats: [
      { n: "−71", sup: "%", caption: "Support requests" },
      { n: "+76", sup: "%", caption: "Onboarding completion" },
      { n: "8", sup: "×", caption: "International awards" },
    ],
  }),
};

export default onsisoft;
