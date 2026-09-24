/**
 * The mini booklet in the Ukrainska 15 folder on the desk — the case, told
 * as a small stapled book about the site.
 *
 * Text is Kate's. Each chapter's paragraphs flow on across as many pages as
 * they need (Booklet paginates them); a `clip` pins a photo to the page on
 * which that paragraph starts, with a paper clip, sticking out over its top.
 * Chapters after "Turning a personal archive…" are still the case study's own openings,
 * waiting for Kate's condensed text.
 *
 * The annotation layer, as on the case page: ==phrase== is the Saffron
 * highlighter (the skim path), and `notes` are handwritten margin notes in
 * the rail, red ink turning dark from `inkFrom`, set beside the page on which
 * that paragraph starts. The notes' words are taken from the case page.
 */
export type BookletNote = { lines: string[]; inkFrom?: number };
export type BookletClip = { src: string; alt: string; tilt: number };
export type BookletChapter = {
  label: string;
  /** the small caps line under the number in the rail */
  kicker?: string;
  heading: string;
  paragraphs: string[];
  /** paragraph index → the photo clipped to the page it starts on */
  clips?: Record<number, BookletClip>;
  /** paragraph index set as a pull line (the chapter's question) */
  pull?: number;
  /** paragraph index → a handwritten note in the rail beside it */
  notes?: Record<number, BookletNote>;
};

export type Booklet = { title: string; lede: string; tags: string; years: string; url: string; chapters: BookletChapter[] };

export const booklet: Booklet = {
  title: "Ukrainska 15",
  lede: "An interactive story about a family home, occupation, loss and the things we keep.",
  tags: "Independent project · UX/UI · Storytelling · Interaction Design · Development",
  years: "2024 — 2026",
  url: "ukrainska15.com",
  chapters: [
    {
      label: "01",
      kicker: "Why it exists",
      heading: "The short version",
      paragraphs: [
        "Ukrainska 15 is the address of my family home in Kupiansk, Kharkiv region.",
        "It was more than a house I grew up visiting. My great-grandparents built it, my grandparents lived there, and then my mother did. For generations, the same rooms, garden and address held a large part of our family’s history.",
        "When the full-scale invasion began on 24 February 2022, my family moved into its basement. Carpets came off the floors and onto the cellar walls. Heaters, blankets and whatever else could help went downstairs.",
        "Five adults, a child and a cat lived there through the first months of the occupation.",
        "During that time, I kept everything without really deciding to: Telegram messages, voice notes, video circles and photographs. Two years later, I realised that ==this accidental archive was the most complete record== I had of what happened to my family and the house.",
        "By then, the project had become personal in another way. Losing the house meant losing a physical connection shared by several generations of my family. War doesn’t begin with one generation, and neither does the weight families carry from it. I became interested in the idea of transgenerational trauma — how fear, loss and displacement can continue through a family long after the original event.",
        "I couldn’t change what had happened to the house. And I couldn’t keep holding on to it as if one day everything would simply return to what it had been. ==Making Ukrainska 15 became my way of processing that loss==.",
        "I could preserve the messages, voices, photographs and memories without trying to preserve the house itself. I could give the story a place to exist — and, in doing so, finally begin to let the physical place go.",
        "That changed what I wanted the project to be.",
        "I didn’t want to build a memorial page. I wanted someone who had never met us to enter the story, understand what happened, and ==stay with it until the end==.",
      ],
      notes: {
        4: { lines: ["sending a message", "was the only way", "to say: still alive"], inkFrom: 2 },
        9: { lines: ["the brief was", "one sentence:", "don’t make it", "a memorial page"], inkFrom: 2 },
      },
      clips: {
        2: { src: "/artefacts/ukrainska-15/booklet/basement.webp", alt: "The cellar, carpets hung on its walls, a bed made up under them", tilt: 6 },
        3: { src: "/artefacts/ukrainska-15/booklet/child-and-cat.webp", alt: "A girl in the basement holding the family's cat", tilt: -5 },
      },
    },
    {
      label: "02",
      kicker: "The problem",
      heading: "Turning a personal archive into an experience",
      paragraphs: [
        "Once I decided to make the project, the problem changed. I had two years of Telegram messages, voice notes, photographs and videos – hundreds of fragments that made sense to my family because we had lived through them.",
        "For everyone else, they were just fragments. The challenge was to ==turn that private archive into a story a stranger could understand== without flattening it into a news article, a historical timeline or a memorial page.",
        "I needed to give people enough context to follow what happened, while keeping the original material — the messages, voices and photographs — at the centre.",
        "And there was another constraint: the story was already emotionally heavy. ==The interface couldn’t make it heavier==. That became the design problem:",
        "How do I turn hundreds of deeply personal fragments into a coherent experience — without losing what made them personal in the first place?",
      ],
      pull: 4,
      notes: {
        0: { lines: ["none of it was", "designed for reading.", "it was designed", "for surviving"], inkFrom: 2 },
      },
    },
    {
      label: "03",
      kicker: "Decisions",
      heading: "What I decided, and what it cost",
      paragraphs: ["The site opens on a drawing of the ruined house and a single door into the story. ==Nothing plays, nothing scrolls, until the visitor chooses==."],
      notes: { 0: { lines: ["the number plate is", "the only thing on the", "site that is red —", "and the only thing", "still hanging on the", "real gate"], inkFrom: 3 } },
    },
    {
      label: "04",
      kicker: "Craft & build",
      heading: "Built like a document, not like a product",
      paragraphs: ["Message bubbles, voice-note players, video circles and the pinned map are components, and they behave identically everywhere. The chrome is deliberately thin: a logo, a sound toggle, a menu."],
      notes: { 0: { lines: ["a documentary about", "surveillance and loss", "should not ask for", "your camera"], inkFrom: 3 } },
    },
    {
      label: "05",
      kicker: "Outcome",
      heading: "What happened to it",
      paragraphs: ["Two MUSE Golds — one in Causes & Awareness, one in Strange & Unusual, which is an odd pair of categories to win with the same site and says something true about it. CSS Design Awards gave it Best UI, Best UX, Best Innovation and Special Kudos."],
    },
    {
      label: "06",
      kicker: "In hindsight",
      heading: "What I would do differently",
      paragraphs: ["I would instrument it. Completion depth is the only metric that matches what the site is for, and I have no idea what it is."],
    },
  ],
};
