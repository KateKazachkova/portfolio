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
 * line belongs to the hour you actually caught her in), each with its own few
 * branches, and one shared `about` that most of them can fall into. A thread
 * runs three steps deep at most and ends by closing or by handing you over to
 * a real page. This is a portfolio, not a game.
 *
 * Every root ends with the same last option, the polite way out, so the panel
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

const LEAVE: Option = { label: "I’ll leave you to it.", close: true };
const ABOUT: Option = { label: "What do you do?", to: "about" };
const WORKING = (to: string): Option => ({ label: "What are you working on?", to });
const bye = (label: string): Option => ({ label, close: true });

/** The branches, keyed by id. Roots point into these; these point out to the site. */
const BRANCHES: Record<string, Node> = {
  about: {
    lines: ["Product design.", "Mostly complicated things."],
    options: [{ label: "The long version", href: "/#profile" }, bye("Got it.")],
  },
  interrupting: {
    lines: ["A little.", "But go on."],
    options: [ABOUT, LEAVE],
  },
  found: {
    lines: ["Not really.", "Go on."],
    options: [ABOUT, LEAVE],
  },

  // Alarm
  bed: {
    lines: ["Yep.", "Snoozed it twice already."],
    options: [ABOUT, bye("I’ll let you wake up.")],
  },
  mon_bed: {
    lines: ["Yep.", "I’m pretending I have another ten minutes."],
    options: [ABOUT, bye("Take your ten minutes.")],
  },

  // Morning
  mug: {
    lines: ["Coffee. The mushroom mug is non-negotiable.", "It’s survived three jobs with me."],
    options: [ABOUT, bye("Fair enough.")],
  },

  // Work
  standup: {
    lines: ["Technically, yes.", "But go on."],
    options: [WORKING("standup_work"), LEAVE],
  },
  standup_work: {
    lines: ["A product with too many screens and a few decisions still missing."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("I’ll let you work.")],
  },
  mon_standup: {
    lines: ["It’s Monday."],
    options: [WORKING("mon_standup_work"), LEAVE],
  },
  mon_standup_work: {
    lines: ["A product with too many screens and a few decisions still missing."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("Fair.")],
  },
  office: {
    lines: ["A little.", "But you’re already here."],
    options: [WORKING("office_work"), LEAVE],
  },
  office_work: {
    lines: ["A product with too many screens.", "I’m trying to make it need fewer."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("I’ll disappear.")],
  },
  calls: {
    lines: ["Pretty much.", "My calendar made some choices for me."],
    options: [WORKING("calls_work"), LEAVE],
  },
  calls_work: {
    lines: ["Several things at once, apparently."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("Good luck.")],
  },
  wrapup: {
    lines: ["Longer than it was this morning."],
    options: [WORKING("wrapup_work"), LEAVE],
  },
  wrapup_work: {
    lines: ["Enough to need a list."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("See you tomorrow, then.")],
  },
  wine: {
    lines: ["It’s Friday.", "Don’t judge me."],
    options: [WORKING("wine_work"), LEAVE],
  },
  wine_work: {
    lines: ["Nothing in about fifty-eight minutes."],
    options: [{ label: "Show me before you go", href: "/#case-files" }, bye("Fair.")],
  },

  // Night
  night: {
    lines: ["Yeah.", "Nobody needs anything at this hour."],
    options: [WORKING("night_work"), LEAVE],
  },
  night_work: {
    lines: ["Something I said I’d finish earlier."],
    options: [{ label: "Show me", href: "/#case-files" }, bye("I’ll leave you to it.")],
  },

  // Reading
  lunch: {
    lines: ["Harari. Again."],
    options: [{ label: "Again?", to: "lunch_again" }, LEAVE],
  },
  lunch_again: {
    lines: ["Apparently I didn’t get enough existential dread the first time."],
    options: [ABOUT, bye("Enjoy your lunch.")],
  },
  evening: {
    lines: ["Harari. Again."],
    options: [{ label: "Again?", to: "evening_again" }, LEAVE],
  },
  evening_again: {
    lines: ["I reread things.", "Books, designs, conversations. Everything, apparently."],
    options: [ABOUT, bye("I’ll let you read.")],
  },

  // Weekend
  brunch: {
    lines: ["I know myself."],
    options: [ABOUT, bye("Enjoy the pancakes.")],
  },
  cleaning: {
    lines: ["It gets worse before it gets better.", "Allegedly."],
    options: [{ label: "What do you do when you’re not doing this?", to: "cleaning_about" }, LEAVE],
  },
  cleaning_about: {
    lines: ["Product design.", "Much easier to undo."],
    options: [{ label: "The long version", href: "/#profile" }, bye("I’ll pretend I saw nothing.")],
  },
  watching: {
    lines: ["Something with a detective in it.", "I already know who did it."],
    options: [{ label: "Then why watch it again?", to: "rewatch" }, bye("Enjoy.")],
  },
  rewatch: {
    lines: [
      "Second time round, you watch how it’s built, not the plot.",
      "I do the same thing with design.",
    ],
    options: [{ label: "Show me some of that", href: "/#case-files" }, bye("Makes sense.")],
  },

  // Street
  leaving: {
    lines: ["Outside.", "That’s the whole plan."],
    options: [{ label: "Show me what you were working on", href: "/#case-files" }, bye("Go.")],
  },
  walking: {
    lines: ["Yep.", "Things tend to make more sense after a few kilometres."],
    options: [{ label: "Like what?", to: "walking_what" }, LEAVE],
  },
  walking_what: {
    lines: ["Mostly work. Sometimes life.", "Work is easier."],
    options: [{ label: "Show me the work part", href: "/#case-files" }, bye("Keep walking.")],
  },

  // Guitar
  guitar: {
    lines: ["Pretty much.", "I played a bit at university, years ago."],
    options: [{ label: "Why guitar?", to: "guitar_why" }, LEAVE],
  },
  guitar_why: {
    lines: ["This site reminded me I’d wanted to learn for years.", "So, why not now?"],
    options: [{ label: "What else do you do when you’re not working?", to: "guitar_else" }, LEAVE],
  },
  guitar_else: {
    lines: ["Quite a few things, actually."],
    options: [{ label: "Show me", href: "/#off-duty" }, bye("Maybe later.")],
  },
};

/** The opening line, per edition. The key is the edition key from lib/time.ts. */
const ROOTS: Record<string, Node> = {
  morn_alarm: {
    lines: ["Hey.", "I’m not awake yet."],
    options: [{ label: "Still in bed?", to: "bed" }, LEAVE],
  },
  mon_alarm: {
    lines: ["Hey.", "It’s Monday. Give me a minute."],
    options: [{ label: "Still in bed?", to: "mon_bed" }, LEAVE],
  },
  morning: {
    lines: ["Hey.", "Coffee first. Give me a second."],
    options: [{ label: "What’s in the mug?", to: "mug" }, LEAVE],
  },
  morn_ready: {
    lines: ["Hey.", "You found me."],
    options: [{ label: "Am I interrupting?", to: "found" }, LEAVE],
  },
  work_standup: {
    lines: ["Hey.", "Standup. Camera’s off."],
    options: [{ label: "Am I interrupting?", to: "standup" }, WORKING("standup_work"), LEAVE],
  },
  mon_standup: {
    lines: ["Hey.", "Monday standup. Second coffee."],
    options: [{ label: "Already?", to: "mon_standup" }, WORKING("mon_standup_work"), LEAVE],
  },
  office: {
    lines: ["Hey.", "Deep work. Don’t tell anyone I’m here."],
    options: [{ label: "Am I interrupting?", to: "office" }, WORKING("office_work"), LEAVE],
  },
  work_lunch: {
    lines: ["Hey.", "Lunch. And a few pages."],
    options: [{ label: "What are you reading?", to: "lunch" }, LEAVE],
  },
  work_calls: {
    lines: ["Hey.", "Calls. Back to back."],
    options: [{ label: "All afternoon?", to: "calls" }, WORKING("calls_work"), LEAVE],
  },
  work_wrapup: {
    lines: ["Hey.", "Writing tomorrow down before I forget it."],
    options: [{ label: "Long list?", to: "wrapup" }, WORKING("wrapup_work"), LEAVE],
  },
  fri_wine: {
    lines: ["Hey.", "Last call of the week. There’s wine in this mug."],
    options: [{ label: "Wine?", to: "wine" }, WORKING("wine_work"), LEAVE],
  },
  fri_transition: {
    lines: ["Hey.", "Laptop’s shut. I’m leaving."],
    options: [{ label: "Where to?", to: "leaving" }, LEAVE],
  },
  street: {
    lines: ["Hey.", "Out walking. No destination."],
    options: [{ label: "Just walking?", to: "walking" }, LEAVE],
  },
  evening_guitar: {
    lines: ["Hey.", "Learning guitar. Emphasis on learning."],
    options: [{ label: "Just started?", to: "guitar" }, LEAVE],
  },
  evening: {
    lines: ["Hey.", "Reading. Tea’s gone cold again."],
    options: [{ label: "What are you reading?", to: "evening" }, LEAVE],
  },
  night: {
    lines: ["Hey.", "Everyone’s asleep. Best time to work."],
    options: [{ label: "You’re still working?", to: "night" }, WORKING("night_work"), LEAVE],
  },
  weekend_brunch: {
    lines: ["Hey.", "Pancakes. No work yet."],
    options: [{ label: "Yet?", to: "brunch" }, LEAVE],
  },
  weekend_cleaning: {
    lines: ["Hey.", "Cleaning. Don’t look at the floor."],
    options: [{ label: "That bad?", to: "cleaning" }, LEAVE],
  },
  weekend_series: {
    lines: ["Hey.", "I’m rewatching something."],
    options: [{ label: "What are you watching?", to: "watching" }, LEAVE],
  },
};

/** An edition with no root of its own gets the plain opening. */
const FALLBACK: Node = {
  lines: ["Hey."],
  options: [{ label: "Am I interrupting?", to: "interrupting" }, LEAVE],
};

export const ROOT = "root";

/** The node to show: `root` resolves against the edition, everything else is a branch. */
export function nodeFor(edition: string, id: string): Node {
  if (id === ROOT) return ROOTS[edition] ?? FALLBACK;
  return BRANCHES[id] ?? FALLBACK;
}
