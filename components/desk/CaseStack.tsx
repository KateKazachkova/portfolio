"use client";

import AwardStack from "./AwardStack";
import { ELSEWHERE, NOTE_GO, PROJECT, SHOW_TRUCK, STACK_LINKS } from "./stacks";
import { Calculator, Payslip } from "./OnsiSoftKit";

/**
 * What lies on and round a case file's stack of awards, on home's desk
 * (DeskScene) and on the Case Studies index (components/case/CaseIndex).
 * On the index (`flat`) the files lie flat and closed: no side views
 * standing up, no sticky note or tags, and the pictures' small copies.
 */

// BulkSource moves sand and gravel: a toy dump truck is parked on its stack
// (public/items/bulksource, generated).
// WayPro delivers herbs from farms: moss and fly agarics on its card, and a
// picture postcard of the app (board 04 of its Behance) on the juries'.
// Atumatu has no awards and its case is on Behance only: its hero (the
// Pinterest pin, "A throne of flowers") as a print lies on a swatch of the
// swimsuit's lilac lycra (public/items/atumatu, generated).
const PICTURE: Record<string, { alt: string; portrait?: boolean }> = {
  waypro: { alt: "WayPro on Behance" },
  atumatu: { alt: "Atumatu on Behance", portrait: true },
};

/** A picture's source: on the desk `pic` holds it back until the room has
 *  painted (useWarm); flat, its small copy (.sm.webp). */
const srcOf = (src: string, { flat, pic }: { flat?: boolean; pic?: (s: string) => string | undefined }) =>
  flat ? src.replace(/\.webp$/, ".sm.webp") : pic ? pic(src) : src;

/** A picture of the stack's (srcOf), flat loaded lazily. */
function Pic({ src, flat, pic, className }: { src: string; flat?: boolean; pic?: (s: string) => string | undefined; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={srcOf(src, { flat, pic })} alt="" draggable={false} decoding="async"
    loading={flat ? "lazy" : undefined} />;
}

export function StackDressing({ slug, title, pic, flat }: {
  slug: string; title: string; pic?: (src: string) => string | undefined; flat?: boolean;
}) {
  const p = { pic, flat };
  const away = ELSEWHERE[slug];
  return (
    <>
      {slug === "onsisoft" && <Payslip />}
      {slug === "waypro" && (
        <span className="stack-mush" aria-hidden>
          <Pic src="/items/waypro/mush.webp" {...p} />
          {!flat && <Pic className="stack-side" src="/items/waypro/mush-side.webp" {...p} />}
        </span>
      )}
      {slug === "atumatu" && (
        <span className="stack-fabric" aria-hidden><Pic src="/items/atumatu/fabric.webp" {...p} /></span>
      )}
      <AwardStack project={PROJECT[slug].name} title={title} about={PROJECT[slug].about}
        links={STACK_LINKS[slug] ?? []} flat={flat} away={away} noteGo={NOTE_GO[slug]}
        picture={PICTURE[slug] && { ...PICTURE[slug], href: NOTE_GO[slug].href, src: srcOf(`/items/${slug}/postcard.webp`, p) }} />
      {slug === "waypro" && (
        <span className="stack-moss" aria-hidden>
          <Pic src="/items/waypro/moss.webp" {...p} />
          {!flat && <Pic className="stack-side" src="/items/waypro/moss-side.webp" {...p} />}
        </span>
      )}
      {slug === "onsisoft" && <Calculator />}
      {slug === "bulksource" && SHOW_TRUCK && (
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
