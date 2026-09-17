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
 *
 * Drawn, not photographed: each half is an inline SVG, so it is resolution-free
 * and weighs nothing to fetch. Gradient stripes got the colour right but could
 * only ever be straight parallel bands; paths can do what cloth does — an
 * undulating leading edge, folds that gather narrow at the heading and splay
 * under their own weight, and a pile that catches the lamp.
 */

const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;
const CLIP_ASPECT = "648 / 1664";

/** The three beats, in ms. Exported because page.tsx runs the swap against
 *  them: the doll changes on CLOSE, and the curtain parts a HOLD later. */
export const CURTAIN_CLOSE_MS = 350;
export const CURTAIN_HOLD_MS = 300;
export const CURTAIN_OPEN_MS = 420;

/** Each half is wider than half the niche, so the two overlap down the middle
 *  instead of meeting on a hairline — which is what lets the leading edge wave
 *  without opening a gap onto the doll behind. */
const HALF_WIDTH = 60;
/** How far a half sits off-stage. Past 100% so nothing peeks at the edge. */
const OFFSTAGE = 100.5;

/** The drawing's own space. Stretched to the half's box (preserveAspectRatio
 *  "none"), so these numbers are proportions, not pixels. */
const W = 100;
const H = 500;

/** The folds, left to right: centre, half-width, and how hard the crease bites.
 *  Deliberately uneven — evenly spaced folds are the thing that made the old
 *  gradient read as corrugated metal rather than cloth. */
const FOLDS: Array<{ x: number; w: number; a: number }> = [
  { x: 4, w: 4, a: 0.95 },
  { x: 12, w: 5.5, a: 0.7 },
  { x: 21, w: 3.5, a: 1 },
  { x: 29, w: 6, a: 0.55 },
  { x: 39, w: 4.5, a: 0.9 },
  { x: 47, w: 3.5, a: 1 },
  { x: 55, w: 6.5, a: 0.6 },
  { x: 65, w: 4, a: 0.95 },
  { x: 73, w: 5.5, a: 0.72 },
  { x: 82, w: 3.5, a: 1 },
  { x: 90, w: 5, a: 0.66 },
  { x: 97, w: 3.5, a: 0.9 },
];

/** The big movement under the pleats: three or four slack waves the width of a
 *  hand, which is what stops a drape reading as a sheet of corrugation. Drawn
 *  first, under the folds, and kept faint — they are shading, not creases. */
const DRAPE: Array<{ x: number; w: number }> = [
  { x: 16, w: 16 },
  { x: 52, w: 20 },
  { x: 86, w: 14 },
];

/** One fold, as a band that is pinched at the heading and swings out below —
 *  `sway` is how far it wanders on the way down, and it alternates so the cloth
 *  does not lean all one way. */
function foldPath({ x, w }: { x: number; w: number }, i: number) {
  const sway = (i % 2 ? 1 : -1) * (1.6 + (i % 3));
  const top = w * 0.45; // gathered at the top, full width by the hem
  return [
    `M${(x - top).toFixed(2)},0`,
    `C${(x - top + sway).toFixed(2)},${H * 0.3} ${(x - w - sway).toFixed(2)},${H * 0.66} ${(x - w).toFixed(2)},${H}`,
    `L${(x + w).toFixed(2)},${H}`,
    `C${(x + w - sway).toFixed(2)},${H * 0.66} ${(x + top + sway).toFixed(2)},${H * 0.3} ${(x + top).toFixed(2)},0`,
    "Z",
  ].join(" ");
}

/** The cloth itself. The leading edge — the one that meets the other half —
 *  undulates; the amplitude stays well inside the overlap, so closed is closed. */
const SILHOUETTE = [
  `M0,0 L${W - 6},0`,
  `C${W - 1},${H * 0.12} ${W - 9},${H * 0.22} ${W - 4},${H * 0.34}`,
  `C${W},${H * 0.46} ${W - 8},${H * 0.58} ${W - 3},${H * 0.7}`,
  `C${W + 1},${H * 0.82} ${W - 7},${H * 0.9} ${W - 2},${H}`,
  `L0,${H} Z`,
].join(" ");

function Half({ side }: { side: "left" | "right" }) {
  const id = (name: string) => `curtain-${side}-${name}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      // The right half is the same cloth seen from the other side.
      style={{ width: "100%", height: "100%", display: "block", transform: side === "right" ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <defs>
        {/* The bolt: deepest at the hem, where no light reaches. */}
        <linearGradient id={id("cloth")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d2a25" />
          <stop offset="0.42" stopColor="#7c211e" />
          <stop offset="1" stopColor="#521210" />
        </linearGradient>
        {/* A fold in section: crease, ridge, crease. The ridge is warm and
            dusty rather than white — velvet scatters its highlight, and a white
            one is what makes cloth read as satin. */}
        <linearGradient id={id("fold")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a0503" stopOpacity="0.68" />
          <stop offset="0.3" stopColor="#1a0503" stopOpacity="0.1" />
          <stop offset="0.52" stopColor="#f2c9b2" stopOpacity="0.2" />
          <stop offset="0.72" stopColor="#1a0503" stopOpacity="0.12" />
          <stop offset="1" stopColor="#1a0503" stopOpacity="0.68" />
        </linearGradient>
        {/* The slack waves, wide and soft. */}
        <linearGradient id={id("drape")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a0503" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#f2c9b2" stopOpacity="0.08" />
          <stop offset="1" stopColor="#1a0503" stopOpacity="0.32" />
        </linearGradient>
        {/* The lamp in the arch, sitting on the top of the drape. */}
        <radialGradient id={id("lamp")} cx="0.5" cy="0.04" r="0.85">
          <stop offset="0" stopColor="#ffe3c2" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#ffe3c2" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffe3c2" stopOpacity="0" />
        </radialGradient>
        {/* The shadow the near half throws where the two overlap. */}
        <linearGradient id={id("seam")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#1a0503" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0503" stopOpacity="0.55" />
        </linearGradient>
        {/* Velvet is pile, not satin: a fine broken surface that scatters the
            light instead of reflecting it. Stretched sideways, the way the nap
            of a hanging drape lies. */}
        <filter id={id("pile")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7 0.22" numOctaves="3" stitchTiles="stitch" result="n" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <clipPath id={id("cloth-shape")}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id("cloth-shape")})`}>
        <rect width={W} height={H} fill={`url(#${id("cloth")})`} />
        {DRAPE.map((d, i) => (
          <path key={`d${d.x}`} d={foldPath(d, i)} fill={`url(#${id("drape")})`} />
        ))}
        {FOLDS.map((f, i) => (
          <path key={f.x} d={foldPath(f, i)} fill={`url(#${id("fold")})`} opacity={f.a} />
        ))}
        <rect width={W} height={H} filter={`url(#${id("pile")})`} opacity="0.2" style={{ mixBlendMode: "overlay" }} />
        <rect width={W} height={H} fill={`url(#${id("lamp")})`} />
        {/* The heading, where the cloth is gathered onto its track. */}
        <rect width={W} height={H * 0.035} fill="#000" opacity="0.3" />
        {/* Only the far half takes the shadow — it is the near half's edge
            casting it. Drawing it on both put two dark stripes down the middle
            of a curtain that has one overlap. */}
        {side === "left" && <rect width={W} height={H} fill={`url(#${id("seam")})`} />}
      </g>
    </svg>
  );
}

function slide(side: "left" | "right", closed: boolean): React.CSSProperties {
  const sign = side === "left" ? -1 : 1;
  return {
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: `${HALF_WIDTH}%`,
    // The right half laps over the left, so the overlap has a near side.
    zIndex: side === "right" ? 1 : 0,
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
      <div style={slide("left", closed)}>
        <Half side="left" />
      </div>
      <div style={slide("right", closed)}>
        <Half side="right" />
      </div>
    </div>
  );
}
