/**
 * What each stack of awards on the desk is, as plain data: read by the
 * stacks themselves (CaseStack, a client module) and by the Case Studies
 * index (components/case/CaseIndex, a server one, which can't read a client
 * module's constants).
 */

// Whose awards a stack holds (lib/awards.ts, its card's head too), and what
// rides along with it
export const PROJECT: Record<string, { name: string; about: string }> = {
  bulksource: { name: "BulkSource",
    about: "A B2B supply-chain platform for bulk materials – sand, gravel and the trucks that haul them. I designed it from the ground up as the sole product designer: research, UX, UI, the design system and handoff." },
  onsisoft: { name: "OnsiSoft",
    about: "Compliance and benefits SaaS for US government contractors. I have led its redesign since October 2024: support requests down 71%, onboarding completion up 76%." },
  waypro: { name: "WayPro",
    about: "An iOS app for drivers delivering grass products from farm to buyer – live routes, one-tap delivery confirmation and inventory, designed from ten driver interviews." },
  atumatu: { name: "Atumatu",
    about: "A landing page for a swimwear and lingerie brand built on self-love. I designed it in 2020 as a live teaching example for my UX/UI course; its tablet and mobile versions were finished in 2026." },
};

const BEHANCE = {
  waypro: "https://www.behance.net/gallery/209626437/WayPro-UIUX-iOS-App",
  atumatu: "https://www.behance.net/gallery/256516327/Atumatu-Landing-Page-for-a-Swimwear-Brand",
};

export const STACK_LINKS: Record<string, { label: string; href: string; external?: boolean }[]> = {};

/** Where a case's sticky note sends you: a red button at its foot, in place
 *  of "Case study in progress" (WayPro's case is on Behance; Atumatu's is
 *  there only, ELSEWHERE). */
export const NOTE_GO: Record<string, { where: string; href: string }> = {
  waypro: { where: "Behance", href: BEHANCE.waypro },
  atumatu: { where: "Behance", href: BEHANCE.atumatu },
};

/** A case written up only elsewhere, with no page here: where, and when it
 *  was made. Its stack says so, and on Case Studies it opens there. */
export const ELSEWHERE: Record<string, { where: string; href: string; year: string }> = {
  atumatu: { where: "Behance", href: BEHANCE.atumatu, year: "2020" },
};
