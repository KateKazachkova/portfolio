import type { Para, Section, Stat, TK } from "./types";

/**
 * The bones of a case not written yet: the sections every case has, each
 * holding only a TK chip for what goes there, so a draft page reads as the
 * page it will be. The screens go in between as `plates` once they come.
 */
export const tk = (tk: string): TK => ({ tk });

export function skeleton({ outcomes = [], awards = false, stats }: {
  /** what is already known for the outcome, before its TK */
  outcomes?: Para[];
  /** the parent's award card under the outcome */
  awards?: boolean;
  stats?: Stat[];
} = {}): Section[] {
  return [
    { kind: "prose", n: "01", heading: "The short version", rule: true,
      body: [[tk("what it is, who it is for and my part in it, in two or three lines")]] },
    { kind: "prose", n: "02", heading: "The problem", rule: true,
      body: [[tk("what was broken, for whom, and how we knew")]] },
    { kind: "decisions", n: "03", heading: "Key decisions", rule: true,
      items: ["01", "02", "03"].map((label) => ({
        label, title: "TK – decision",
        body: [[tk("what I decided and why")]],
        tradeoff: [[tk("what it cost")]],
      })) },
    { kind: "prose", n: "04", heading: "Outcomes", rule: true, awards, stats,
      body: [...outcomes, [tk("numbers, a quote, what shipped")]] },
  ];
}
