/**
 * The juries' marks, pressed onto the report.
 *
 * Every one of these is the organisation's own logo, taken from the badge or
 * certificate they issued — not a drawing of it. Each was reduced to a single
 * channel of ink coverage and bitten back at the edges, the way a rubber stamp
 * lands on paper: a dry-pad blotch field takes whole patches out, a finer one
 * gives the tooth, and anything under 16% coverage simply misses. That is why
 * they read as impressions rather than as logos placed on a page.
 *
 * They ship as masks, not pictures: the file carries only the alpha, and the
 * colour comes from CSS. So the ink can change with the theme, and one file
 * serves every use.
 *
 * Laid out by hand. Stamps on a parcel are not on a grid — they overlap, they
 * lean, and the person holding the stamp never lines it up. The positions are
 * percentages of the block, so the whole pile scales as one.
 */

type Stamp = {
  key: string;
  /** What was pressed — read out to screen readers, which see no ink. */
  label: string;
  /** Intrinsic ratio of the mask, so the block reserves the right height. */
  ratio: number;
  /** Percentages of the block: where it landed and how big the stamp was. */
  left: number;
  top: number;
  width: number;
  rotate: number;
  /** How hard it was pressed, and out of which pad. */
  ink: "red" | "plum";
  opacity: number;
};

const STAMPS: Stamp[] = [
  { key: "muse",   label: "MUSE Creative Awards",    ratio: 3.026, left: 2,  top: 3,  width: 31, rotate: -6,  ink: "plum", opacity: 0.78 },
  { key: "cssda",  label: "CSS Design Awards",       ratio: 1.0,   left: 29, top: -2, width: 16, rotate: 13,  ink: "red",  opacity: 0.84 },
  { key: "lda",    label: "London Design Awards",    ratio: 3.129, left: 43, top: 7,  width: 29, rotate: -9,  ink: "red",  opacity: 0.7 },
  { key: "cssw",   label: "CSS Winner",              ratio: 1.285, left: 74, top: 0,  width: 16, rotate: 9,   ink: "plum", opacity: 0.76 },
  { key: "davey",  label: "Davey Awards",            ratio: 2.911, left: 0,  top: 33, width: 33, rotate: 4,   ink: "plum", opacity: 0.8 },
  { key: "nyx",    label: "NYX Awards",              ratio: 2.644, left: 27, top: 38, width: 28, rotate: -8,  ink: "red",  opacity: 0.78 },
  { key: "indigo", label: "Indigo Design Award",     ratio: 4.0,   left: 57, top: 30, width: 32, rotate: 11,  ink: "plum", opacity: 0.7 },
  { key: "nectar", label: "CSS Nectar",              ratio: 1.667, left: 8,  top: 60, width: 20, rotate: -12, ink: "red",  opacity: 0.7 },
  { key: "nypda",  label: "NY Product Design Awards", ratio: 1.966, left: 34, top: 64, width: 21, rotate: 6,  ink: "plum", opacity: 0.42 },
  { key: "dn",     label: "Design Nominees",         ratio: 3.286, left: 62, top: 66, width: 20, rotate: -14, ink: "red",  opacity: 0.76 },
];

const RATIO = 100 / 56;

export default function AwardStamps() {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: RATIO }}
      role="img"
      aria-label={`Marks of the juries that recognised the work: ${STAMPS.map((s) => s.label).join(", ")}.`}
    >
      {STAMPS.map((s) => (
        <span
          key={s.key}
          aria-hidden
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.width}%`,
            aspectRatio: s.ratio,
            transform: `rotate(${s.rotate}deg)`,
            backgroundColor: s.ink === "red" ? "var(--accent-red)" : "var(--fg)",
            opacity: s.opacity,
            WebkitMaskImage: `url(/stamps/awards/${s.key}.png)`,
            maskImage: `url(/stamps/awards/${s.key}.png)`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
