"use client";

import AwardStack from "./AwardStack";
import { Calculator, Payslip } from "./OnsiSoftKit";

/**
 * What lies on and round a case file's stack of awards, on home's desk
 * (DeskScene) and on the Case Studies index (components/case/CaseIndex).
 * On the index (`flat`) the files lie flat and closed: no side views
 * standing up, no sticky note or tags, and the pictures' small copies.
 */

// Whose awards a stack holds (lib/awards.ts), and what rides along with it
export const PROJECT: Record<string, { name: string; sub: string; about: string }> = {
  bulksource: { name: "BulkSource", sub: "Supply-chain SaaS · K. Kazachkova",
    about: "A B2B supply-chain platform for bulk materials – sand, gravel and the trucks that haul them. I designed it from the ground up as the sole product designer: research, UX, UI, the design system and handoff." },
  onsisoft: { name: "OnsiSoft", sub: "Compliance SaaS · K. Kazachkova",
    about: "Compliance and benefits SaaS for US government contractors. I have led its redesign since October 2024: support requests down 71%, onboarding completion up 76%." },
  waypro: { name: "WayPro", sub: "Logistics iOS app · K. Kazachkova",
    about: "An iOS app for drivers delivering grass products from farm to buyer – live routes, one-tap delivery confirmation and inventory, designed from ten driver interviews." },
};
// BulkSource moves sand and gravel: its stack lies in a spill of sand with
// a toy dump truck parked on top (public/items/bulksource, generated).
// WayPro delivers herbs from farms: moss and fly agarics on its card, and a
// picture postcard of the app (board 04 of its Behance) on the juries'.
export const STACK_LINKS: Record<string, { label: string; href: string; external?: boolean }[]> = {
  waypro: [{ label: "Behance ↗", href: "https://www.behance.net/gallery/209626437/WayPro-UIUX-iOS-App", external: true }],
};

/** A picture of the stack's: on the desk `pic` holds it back until the room
 *  has painted (useWarm); flat, its small copy (.sm.webp), loaded lazily. */
function Pic({ src, flat, pic, className }: { src: string; flat?: boolean; pic?: (s: string) => string | undefined; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={flat ? src.replace(/\.webp$/, ".sm.webp") : pic ? pic(src) : src} alt="" draggable={false} decoding="async"
    loading={flat ? "lazy" : undefined} />;
}

export function StackDressing({ slug, title, pic, flat }: {
  slug: string; title: string; pic?: (src: string) => string | undefined; flat?: boolean;
}) {
  const p = { pic, flat };
  return (
    <>
      {slug === "bulksource" && <Pic className="stack-sand" src="/items/bulksource/sand.webp" {...p} />}
      {slug === "onsisoft" && <Payslip />}
      {slug === "waypro" && (
        <span className="stack-mush" aria-hidden>
          <Pic src="/items/waypro/mush.webp" {...p} />
          {!flat && <Pic className="stack-side" src="/items/waypro/mush-side.webp" {...p} />}
        </span>
      )}
      <AwardStack project={PROJECT[slug].name} title={title} sub={PROJECT[slug].sub} about={PROJECT[slug].about}
        links={STACK_LINKS[slug] ?? []} flat={flat}
        picture={slug === "waypro" ? { src: flat ? "/items/waypro/postcard.sm.webp" : pic ? pic("/items/waypro/postcard.webp") : "/items/waypro/postcard.webp", href: STACK_LINKS.waypro[0].href, alt: "WayPro on Behance" } : undefined} />
      {slug === "waypro" && (
        <span className="stack-moss" aria-hidden>
          <Pic src="/items/waypro/moss.webp" {...p} />
          {!flat && <Pic className="stack-side" src="/items/waypro/moss-side.webp" {...p} />}
        </span>
      )}
      {slug === "onsisoft" && <Calculator />}
      {slug === "bulksource" && (
        <span className="stack-truck" aria-hidden>
          {/* its side, standing on the centreline (edge-on from above), and
              its top at the truck's height, so it has a body from the case */}
          {!flat && <Pic className="stack-side" src="/items/bulksource/truck-side.webp" {...p} />}
          <Pic className="stack-top" src="/items/bulksource/truck.webp" {...p} />
        </span>
      )}
    </>
  );
}
