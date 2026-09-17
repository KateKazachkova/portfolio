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


/** Each mask's own proportion, so anything showing these outside the pile — the
 *  parts list, say — can give them their real shape instead of a fixed box. */
export const STAMP_RATIOS: Record<string, number> = {
  muse: 3.026, cssda: 1.0, lda: 3.129, cssw: 1.285, davey: 2.911,
  nyx: 2.644, indigo: 4.0, nectar: 1.667, nypda: 1.966, dn: 3.286,
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

/** The same marks again, thrown across the report's own sheet beside the PASS.
 *  Fewer, because the card is a sheet and not a wall — but pressed at full
 *  strength. A stamp does not go faint where it crosses the type: whoever held
 *  it was not looking at the layout, and that is the whole reason a stamped
 *  document reads as handled rather than designed. They lean off the right edge
 *  on purpose — the card clips them, which is what a stamp pressed half over
 *  the edge of a sheet does. */
const ON_CARD: Stamp[] = [
  { key: "muse",   label: "MUSE Creative Awards",     ratio: 3.026, left: 2,  top: 12, width: 62, rotate: -8,  ink: "plum", opacity: 0.8 },
  { key: "cssda",  label: "CSS Design Awards",        ratio: 1.0,   left: 60, top: 2,  width: 30, rotate: 15,  ink: "red",  opacity: 0.86 },
  { key: "lda",    label: "London Design Awards",     ratio: 3.129, left: 26, top: 30, width: 66, rotate: 7,   ink: "red",  opacity: 0.74 },
  { key: "davey",  label: "Davey Awards",             ratio: 2.911, left: 8,  top: 52, width: 62, rotate: 4,   ink: "plum", opacity: 0.82 },
  { key: "nyx",    label: "NYX Awards",               ratio: 2.644, left: 44, top: 64, width: 56, rotate: -11, ink: "red",  opacity: 0.8 },
  { key: "indigo", label: "Indigo Design Award",      ratio: 4.0,   left: 18, top: 84, width: 60, rotate: -5,  ink: "plum", opacity: 0.74 },
];

/** The block is sized by proportion rather than a fixed height, so nothing is
 *  cropped when the page narrows. 100:56 is the lowest stamp's bottom edge plus
 *  room to lean — tight, because a pile of stamps that fits in a neat grid with
 *  air around every mark is a logo wall, not a pile. */
const RATIO = 100 / 56;

export default function AwardStamps({ variant = "pile" }: { variant?: "pile" | "card" }) {
  const onCard = variant === "card";
  const stamps = onCard ? ON_CARD : STAMPS;
  const label = `Marks of the juries that recognised the work: ${stamps.map((x) => x.label).join(", ")}.`;

  return (
    <div
      className="relative w-full"
      // On the card the block fills the corner it was given; on its own it sets
      // its own height from its proportion.
      style={onCard ? { position: "absolute", inset: 0, pointerEvents: "none" } : { aspectRatio: RATIO }}
      role="img"
      aria-label={label}
    >
      {stamps.map((s) => (
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
            WebkitMaskImage: `url(/stamps/awards/${s.key}.webp)`,
            maskImage: `url(/stamps/awards/${s.key}.webp)`,
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
