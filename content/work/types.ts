/**
 * The shape of a case study.
 *
 * Case studies live here, as code, because the page is an annotated
 * document: a margin note has to be anchored to the section it argues with.
 */

/** Anything still waiting on Kate. Renders as a visible hatched chip, never as fact. */
export type TK = { tk: string };

/** A line of body copy. Strings are plain; the objects carry the annotation layer. */
export type Span =
  | string
  | { mark: string; strong?: boolean }   // highlighter — the deliberate skim path (and bold, where it must stop the eye)
  | { pen: string }         // ink underline, a second weight of emphasis
  | { redact: string }      // for NDA work: the words are there, the ink is not
  | { code: string }
  | { strong: string }
  | TK;

export type Para = Span[];

/** A note in the left rail. `quiet` is the aside to the aside. */
export type MarginNote = { text: Para; quiet?: boolean };

/** Handwriting in the right-hand annotation field. */
export type HandNote = { lines: string[]; inkFrom?: number; offsetTop?: number };

export type Stat = { n: string; sup?: string; caption: string };

export type SidePhoto = { src: string; alt: string; tilt: number; hand?: string;
  /** a cut-out (a phone, not a print): its shadow follows its outline */
  cutout?: boolean };

export type Decision = {
  label: string;
  title: string;
  body: Para[];
  /** What the decision cost. The interesting half. A decision that cost
   *  nothing has none. */
  tradeoff?: Para[];
  /** the song's flash player, in the margin beside the decision */
  player?: boolean;
  /** a screen of the product on the tablet, under the decision's text */
  tablet?: { src: string; alt: string };
};

export type SpecRow = { key: string; value: Para };

/**
 * A jury's mark in the outcome strip.
 *  - `seal`: a full-colour asset pressed as-is, in the award's own colour
 *    (a gold award is a gold seal). `/stamps/awards/<seal>.png`.
 *  - `mask`: an alpha impression re-inked in one colour, for a jury with no
 *    colour badge of its own. `/stamps/awards/<mask>.webp`.
 *  - `text`: a typeset rubber-stamp, for a jury with no asset at all.
 * `ratio` is width ÷ height, so the strip reserves the right box.
 */
export type AwardStamp =
  | { seal: string; label: string; ratio: number }
  | { mask: string; label: string; ratio: number }
  | { text: string };

export type PileItem = {
  src: string;
  /** Describes the decision or the content, never "screenshot". */
  alt: string;
  kind: string;
  caption?: Para;
  /** how much bigger than the others it lies on the table (1 = as they are) */
  size?: number;
};

/** A numbered plate — a full-width figure that breaks out of the measure. */
export type PlateItem = {
  src: string;
  /** The plate number, e.g. "PL. 01". */
  pl: string;
  alt: string;
  caption: Para;
};

export type Section =
  | { kind: "prose"; n: string; label?: string; heading: string; rule?: boolean;
      body: Para[]; notes?: MarginNote[]; hand?: HandNote;
      /** The project's award card under the text (the outcome section). */
      awards?: boolean;
      /** Prints laid in the field beside the text, each at its own tilt, with
       *  an optional line written under it in hand. */
      photos?: SidePhoto[];
      /** the song's flash player, in the margin beside the text */
      player?: boolean;
      /** the numbers under the text, as the outcome strip sets them */
      stats?: Stat[];
      /** a button out to the project, in the margin beside the text */
      cta?: { label: string; href: string } }
  | { kind: "decisions"; n: string; label?: string; heading: string; rule?: boolean;
      body?: Para[]; items: Decision[]; notes?: MarginNote[]; hand?: HandNote; photos?: SidePhoto[] }
  | { kind: "spec"; n: string; label: string; heading: string;
      body: Para[]; rows: SpecRow[]; notes?: MarginNote[]; hand?: HandNote }
  | { kind: "pile"; title: string; count: string; help: string;
      items: PileItem[]; notes?: MarginNote[] }
  | { kind: "plates"; label?: string; heading?: string;
      items: PlateItem[]; notes?: MarginNote[] }
  | { kind: "marker"; ghost: string; lines: Span[][] };

export type CaseStudy = {
  slug: string;
  fileNo: string;
  title: string;
  years: string;
  /** The result, in the first 100 words, above the fold. */
  result?: Para;
  subtitle: string;
  /** Under the title in place of the subtitle, when a case wants more than
   *  one line and the annotation layer (the subtitle still gives the page's
   *  description). */
  summary?: Para[];
  fields: { key: string; value: Para }[];
  lead?: { ghost: string; red: string; ink: string };
  outcome?: {
    stats: Stat[];
    stamps: AwardStamp[];
  };
  /** The live thing on a tablet before the text: a recording of it on the
   *  screen, and a click through to it. */
  /** the product on Kate's tablet by the title; `button` names the link
   *  beside the title */
  tablet?: { video: string; poster: string; href: string; label: string; button?: string };
  sections: Section[];
  /** The last word, under the sections: the title again, one line, and the
   *  way out to the live thing. */
  closing?: { line: string; cta: { label: string; href: string } };
};
