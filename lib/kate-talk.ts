/**
 * What Kate says when you point at her.
 *
 * Each string in `lines` is a SENTENCE, not a typeset line: the panel is set in
 * the site's own 16px body type (--t-body), so anything hand-broken here would
 * come apart the moment it wraps. The panel's text column is 270px, about 33
 * characters, and it grows UPWARD into the arch — so keep a sentence under ~66
 * characters and a whole node under three lines, or the top of it climbs out
 * of the niche.
 *
 * The doll in the niche is not only an illustration — she can be spoken to,
 * briefly. The script is a small graph: one ROOT per edition (so the opening
 * line belongs to the hour you actually caught her in), and a handful of shared
 * branches every edition can fall into. Two steps deep at most: a branch either
 * closes or hands you over to a real page. This is a portfolio, not a game.
 *
 * Every root ends with the same third option, the polite way out, so the panel
 * is always one click from gone.
 */

export type Option =
  | { label: string; to: string }      // go to another node
  | { label: string; href: string }    // leave for a page on the site
  | { label: string; close: true };    // end the conversation

export type Node = {
  /** Her side of it. One line per element — short, spoken, never a paragraph. */
  lines: string[];
  options: Option[];
};

const LEAVE: Option = { label: "I'll leave you to it.", close: true };

/** The shared branches. Roots point into these; these point out to the site. */
const BRANCHES: Record<string, Node> = {
  watching: {
    lines: ["Something with a detective in it.", "I've seen it. I'm watching it again."],
    options: [
      { label: "Why again?", to: "again" },
      { label: "Fair enough.", close: true },
    ],
  },
  again: {
    lines: [
      "Second time round you watch how it was built, not what happens.",
      "Same reason I redo my own work.",
    ],
    options: [
      { label: "Show me some of that", href: "/#case-files" },
      { label: "Noted.", close: true },
    ],
  },
  interrupting: {
    lines: ["A little.", "Go on, though."],
    options: [
      { label: "What is it you do?", to: "about" },
      LEAVE,
    ],
  },
  about: {
    lines: ["Product design.", "Complicated things, made less complicated."],
    options: [
      { label: "The long version", href: "/#profile" },
      { label: "Got it.", close: true },
    ],
  },
  working: {
    lines: ["A product with too many screens and not enough decisions in them."],
    options: [
      { label: "Show me", href: "/#case-files" },
      { label: "Sounds familiar.", close: true },
    ],
  },
  reading: {
    lines: ["Harari. Again.", "Big picture, small print."],
    options: [
      { label: "What is it you do?", to: "about" },
      { label: "Enjoy it.", close: true },
    ],
  },
  mug: {
    lines: ["Mushroom mug. Don't ask.", "It has been through three jobs with me."],
    options: [
      { label: "What is it you do?", to: "about" },
      { label: "Fair.", close: true },
    ],
  },
  bed: {
    lines: ["Snoozed it twice.", "The day can start without me."],
    options: [
      { label: "What is it you do?", to: "about" },
      { label: "Understood.", close: true },
    ],
  },
  out: {
    lines: ["Nowhere in particular.", "Walking is how I get things unstuck."],
    options: [
      { label: "Show me what got unstuck", href: "/#case-files" },
      { label: "Have a good one.", close: true },
    ],
  },
};

/** The opening line, per edition. The key is the edition key from lib/time.ts. */
const ROOTS: Record<string, Node> = {
  morn_alarm: {
    lines: ["Hey.", "I'm not awake yet."],
    options: [{ label: "Still in bed?", to: "bed" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  mon_alarm: {
    lines: ["Hey.", "It's Monday. I need a minute."],
    options: [{ label: "Still in bed?", to: "bed" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  morning: {
    lines: ["Hey.", "First coffee. Give me a second."],
    options: [{ label: "What's in the mug?", to: "mug" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  work_standup: {
    lines: ["Hey.", "Standup. My camera's off."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  mon_standup: {
    lines: ["Hey.", "Monday standup. Two mugs deep."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  office: {
    lines: ["Hey.", "Deep work. Don't tell anyone."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  work_lunch: {
    lines: ["Hey.", "Lunch, and a few pages."],
    options: [{ label: "What are you reading?", to: "reading" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  work_calls: {
    lines: ["Hey.", "Calls, back to back."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  work_wrapup: {
    lines: ["Hey.", "Writing tomorrow down before I lose it."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  fri_wine: {
    lines: ["Hey.", "Friday call. There's wine in it."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  fri_transition: {
    lines: ["Hey.", "Laptop's shut. I'm leaving."],
    options: [{ label: "Where to?", to: "out" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  street: {
    lines: ["Hey.", "Out walking. The good kind of lost."],
    options: [{ label: "Where to?", to: "out" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  evening: {
    lines: ["Hey.", "Reading. The tea's going cold."],
    options: [{ label: "What are you reading?", to: "reading" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  night: {
    lines: ["Hey.", "Everyone's asleep. Best hours there are."],
    options: [{ label: "What are you working on?", to: "working" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  weekend_brunch: {
    lines: ["Hey.", "Off the clock. Pancakes."],
    options: [{ label: "What are you reading?", to: "reading" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  weekend_cleaning: {
    lines: ["Hey.", "Spring clean. Don't look at the floor."],
    options: [{ label: "What is it you do?", to: "about" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
  weekend_series: {
    lines: ["Hey.", "I'm watching a movie."],
    options: [{ label: "What are you watching?", to: "watching" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
  },
};

const FALLBACK: Node = {
  lines: ["Hey.", "You found me."],
  options: [{ label: "What is it you do?", to: "about" }, { label: "Am I interrupting?", to: "interrupting" }, LEAVE],
};

export const ROOT = "root";

/** The node to show: `root` resolves against the edition, everything else is shared. */
export function nodeFor(edition: string, id: string): Node {
  if (id === ROOT) return ROOTS[edition] ?? FALLBACK;
  return BRANCHES[id] ?? FALLBACK;
}
