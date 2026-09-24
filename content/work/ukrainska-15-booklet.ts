/**
 * The mini booklet in the Ukrainska 15 folder on the desk — the case, told
 * as a small stapled book about the site.
 *
 * PLACEHOLDER: these pages are the case study's own section headings and
 * the first lines under them, standing in until Kate sends the condensed
 * text. Replace `pages` wholesale; the booklet lays out whatever is here,
 * two pages to a spread.
 */
export type BookletPage = { label: string; heading: string; text: string };

export const booklet = {
  title: "Voice from the Basement",
  kicker: "About the site",
  place: "Ukrainska 15 · Kupiansk",
  years: "2024 — 2026",
  url: "ukrainska15.com",
  pages: [
    {
      label: "Why it exists",
      heading: "A house with a number on it",
      text: "Ukrainska Street 15, Kupiansk, Kharkiv region. On 24 February 2022 the war reached the street, and the house became a basement: carpets off the floors upstairs and onto the cellar walls, heaters carried down, a child and a cat and five adults sleeping under the beams.",
    },
    {
      label: "The material",
      heading: "An archive that was never meant to be read",
      text: "Raw material, in order of usefulness: timestamped chat threads; voice notes; video circles filmed on the drive into the fields to find a mobile signal; photographs of the house after the shelling; the objects that survived.",
    },
    {
      label: "Decisions",
      heading: "What I decided, and what it cost",
      text: "The site opens on a drawing of the ruined house and a single door into the story. Nothing plays, nothing scrolls, until the visitor chooses.",
    },
    {
      label: "Craft & build",
      heading: "Built like a document, not like a product",
      text: "Message bubbles, voice-note players, video circles and the pinned map are components, and they behave identically everywhere. The chrome is deliberately thin: a logo, a sound toggle, a menu.",
    },
    {
      label: "Outcome",
      heading: "What happened to it",
      text: "Two MUSE Golds — one in Causes & Awareness, one in Strange & Unusual, which is an odd pair of categories to win with the same site and says something true about it. CSS Design Awards gave it Best UI, Best UX, Best Innovation and Special Kudos.",
    },
    {
      label: "In hindsight",
      heading: "What I would do differently",
      text: "I would instrument it. Completion depth is the only metric that matches what the site is for, and I have no idea what it is.",
    },
  ] satisfies BookletPage[],
};
