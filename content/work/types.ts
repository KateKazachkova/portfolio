/**
 * The shape of a case study.
 *
 * Case studies live here rather than in Notion because the page is an
 * annotated document: a margin note has to be anchored to the section it
 * argues with, and a Notion block list has nowhere to say that. Notion still
 * drives the project list and any case that hasn't been written up yet.
 */

/** Anything still waiting on Kate. Renders as a visible hatched chip, never as fact. */
export type TK = { tk: string };

/** A line of body copy. Strings are plain; the objects carry the annotation layer. */
export type Span =
  | string
  | { mark: string }        // highlighter — the deliberate skim path
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

export type Decision = {
  label: string;
  title: string;
  body: Para[];
  /** What the decision cost. The interesting half. */
  tradeoff: Para;
};

export type SpecRow = { key: string; value: Para };

export type PileItem = {
  src: string;
  /** Describes the decision or the content, never "screenshot". */
  alt: string;
  kind: string;
  caption: Para;
};

export type Section =
  | { kind: "prose"; n: string; label: string; heading: string; rule?: boolean;
      body: Para[]; notes?: MarginNote[]; hand?: HandNote }
  | { kind: "decisions"; n: string; label: string; heading: string;
      items: Decision[]; notes?: MarginNote[]; hand?: HandNote }
  | { kind: "spec"; n: string; label: string; heading: string;
      body: Para[]; rows: SpecRow[]; notes?: MarginNote[]; hand?: HandNote }
  | { kind: "pile"; title: string; count: string; help: string;
      items: PileItem[]; notes?: MarginNote[] }
  | { kind: "marker"; ghost: string; lines: Span[][] };

export type CaseStudy = {
  slug: string;
  fileNo: string;
  title: string;
  years: string;
  /** The result, in the first 100 words, above the fold. */
  result: Para;
  subtitle: string;
  fields: { key: string; value: Para }[];
  lead: { ghost: string; red: string; ink: string };
  outcome: {
    stats: { n: string; sup?: string; caption: string }[];
    stamps: string[];
  };
  sections: Section[];
  next?: { label: string; href: string };
};
