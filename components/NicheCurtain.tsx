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
 * The cloth is a photograph (30KB, generated for this), the shape and the light
 * on it are vector. Drawing the folds by hand got the silhouette right but
 * never the pile: velvet is a surface that scatters light, and gradients can
 * only ever hand back a polish. The photograph carries the material; the SVG
 * around it carries the undulating leading edge, the gathered heading, the lamp
 * in the arch and the shadow across the overlap — all the parts that have to
 * respond to the niche rather than sit still inside a texture.
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
 *  "none"), so these numbers are proportions, not pixels. The cloth was cut to
 *  the same proportion, so nothing is squeezed on the way in. */
const W = 100;
const H = 500;

/** The cloth. Cut at 420x1456 — the half's own aspect — so it lands unsqueezed,
 *  and at about six folds across, because the whole bolt pressed into a 94px
 *  half would read as pinstripe rather than drape. */
const CLOTH = "/curtain/velvet-half.webp";

/** The leading edge — the one that meets the other half — undulates. The
 *  amplitude stays well inside the overlap, so closed is closed. */
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
        {/* The lamp in the arch, sitting on the top of the drape. */}
        <radialGradient id={id("lamp")} cx="0.5" cy="0.04" r="0.85">
          <stop offset="0" stopColor="#ffe3c2" stopOpacity="0.26" />
          <stop offset="0.55" stopColor="#ffe3c2" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffe3c2" stopOpacity="0" />
        </radialGradient>
        {/* The hem, which the lamp never reaches. */}
        <linearGradient id={id("weight")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#1a0503" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0503" stopOpacity="0.45" />
        </linearGradient>
        {/* The shadow the near half throws where the two overlap. */}
        <linearGradient id={id("seam")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#1a0503" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0503" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={id("cloth-shape")}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id("cloth-shape")})`}>
        <image href={CLOTH} x="0" y="0" width={W} height={H} preserveAspectRatio="none" />
        <rect width={W} height={H} fill={`url(#${id("lamp")})`} />
        <rect width={W} height={H} fill={`url(#${id("weight")})`} />
        {/* The heading, where the cloth is gathered onto its track. */}
        <rect width={W} height={H * 0.035} fill="#000" opacity="0.3" />
        {/* Only the far half takes the overlap shadow — it is the near half's
            edge casting it. On both, it put two dark stripes down the middle of
            a curtain that has one overlap. */}
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
