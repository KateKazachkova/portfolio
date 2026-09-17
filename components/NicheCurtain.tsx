"use client";

/**
 * The curtain across the niche, drawn while one doll is swapped for another.
 *
 * The editions used to cut: click a different hour and the old clip vanished
 * mid-frame while the new one was still fetching its first byte. A theatre
 * closes first. Two halves run in from the sides of the niche, hold shut long
 * enough for the swap to happen behind them, and part again — so what the page
 * shows is a curtain call rather than a jump cut.
 *
 * It is pinned to the same rect as the doll and the lamp (NicheDoll's NICHE,
 * NicheLight's RECT): the niche's own box inside the suitcase photograph, with
 * the clip's aspect giving it its height. That keeps it on the niche 1:1 at any
 * viewport size, exactly as the clips are.
 *
 * Red because the case is already lined in it — the seat of the niche and the
 * left compartment are the same velvet — so the curtain reads as part of the
 * object rather than as an overlay dropped on top of it.
 */

const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;
const CLIP_ASPECT = "648 / 1664";

/** The three beats, in ms. Exported because page.tsx runs the swap against
 *  them: the doll changes on CLOSE, and the curtain parts a HOLD later. */
export const CURTAIN_CLOSE_MS = 350;
export const CURTAIN_HOLD_MS = 300;
export const CURTAIN_OPEN_MS = 420;

/** How far a half sits off-stage. Past 100% so nothing peeks at the edge. */
const OFFSTAGE = 100.5;

/** Velvet, in three layers over the cloth itself: the gathered folds, then the
 *  lamp in the arch falling on the top of the drape and losing the hem, then
 *  the shadow the near half throws where the two overlap. Every stop is a
 *  percentage, so the folds keep their proportions as the case resizes. */
const FABRIC = [
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.04) 3.2%, rgba(255,255,255,0.13) 6.4%, rgba(0,0,0,0.04) 9.6%, rgba(0,0,0,0.5) 12.8%)",
  "linear-gradient(180deg, rgba(255,232,205,0.18), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5))",
  "linear-gradient(180deg, #8f2723, #6d1a17)",
];

function half(side: "left" | "right", closed: boolean): React.CSSProperties {
  const sign = side === "left" ? -1 : 1;
  // The seam shadow belongs to whichever edge meets the middle.
  const seam =
    side === "left"
      ? "linear-gradient(90deg, rgba(0,0,0,0) 78%, rgba(0,0,0,0.45))"
      : "linear-gradient(270deg, rgba(0,0,0,0) 78%, rgba(0,0,0,0.45))";
  return {
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    // Wider than half, so the two overlap at the seam instead of meeting on a
    // hairline that any rounding would open up.
    width: "52%",
    backgroundImage: [seam, ...FABRIC].join(", "),
    transform: `translateX(${closed ? 0 : sign * OFFSTAGE}%)`,
    // Closing is quick and lands soft; parting is slower, because a reveal
    // reads better slow than a cover does.
    transition: `transform ${closed ? CURTAIN_CLOSE_MS : CURTAIN_OPEN_MS}ms ${
      closed ? "cubic-bezier(0.2, 0.8, 0.25, 1)" : "cubic-bezier(0.4, 0, 0.25, 1)"
    }`,
  };
}

export default function NicheCurtain({ closed }: { closed: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        ...RECT,
        aspectRatio: CLIP_ASPECT,
        // Over the clip and the chalk on the back wall, under the lamp — the
        // light in the arch falls on the curtain too.
        zIndex: 5,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div style={half("left", closed)} />
      <div style={half("right", closed)} />
    </div>
  );
}
