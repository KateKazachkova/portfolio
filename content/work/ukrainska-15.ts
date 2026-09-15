import type { CaseStudy } from "./types";

/**
 * CASE 001 — Ukrainska 15.
 *
 * Every fact here is either checked against the live site (stack, behaviour,
 * accessibility) or given by Kate (dates, role). Anything still unknown is a
 * `{ tk }` chip and renders as one — nothing is invented to fill a gap.
 */
const ukrainska15: CaseStudy = {
  slug: "ukrainska-15",
  fileNo: "File 001 · Self-initiated",
  title: "Ukrainska 15",
  years: "2024 — 2026",

  result: [
    { mark: "Eight international awards in its first year — including two MUSE Golds" },
    " — for a site with no client, no budget and no team.",
  ],

  subtitle:
    "A self-initiated documentary website that keeps the story of one house in Kupiansk — and of the people who lived in its basement through the first months of the occupation.",

  fields: [
    { key: "Role", value: ["Sole author"] },
    { key: "Scope", value: ["Research · Narrative\nArt direction · UI · Build"] },
    { key: "Team", value: ["No client\nNo developer"] },
    { key: "Duration", value: ["Feb 2024 — Mar 2026\nActive: Dec — Mar"] },
    { key: "Live", value: ["ukrainska15.com ↗"] },
  ],

  lead: {
    ghost:
      "The material was already there: two years of messages, voice notes recorded in a basement, photographs taken through a broken window, the timestamps of a life being interrupted. None of it was designed for reading. It was designed for surviving. The work was to turn a private archive into something a stranger could enter without being asked to perform grief, and leave without feeling used. That meant deciding what a visitor is allowed to hear before they have agreed to hear it, how long a person will stay with a text they did not choose, and where a timestamp does more work than a sentence. It also meant deciding what to leave out — which, on a project like this, is most of the design work.",
    red: "A private family archive — messages, voice notes, photographs — rebuilt as a site a stranger will actually finish.",
    ink: "The hard part was never what to show. It was what to leave out.",
  },

  outcome: {
    stats: [
      { n: "8", caption: "International recognitions across UX, UI, innovation and storytelling" },
      { n: "2", sup: "×", caption: "MUSE Creative Awards Gold — Causes & Awareness · Strange & Unusual" },
      { n: "4", sup: "×", caption: "CSS Design Awards — Best UI, Best UX, Best Innovation, Special Kudos" },
      { n: "6", caption: "Independent juries, in the site's first year" },
    ],
    stamps: [
      "MUSE · Gold", "MUSE · Gold",
      "CSSDA · Best UI", "CSSDA · Best UX", "CSSDA · Best Innovation", "CSSDA · Special Kudos",
      "CSS Winner · Star", "CSS Nectar · SOTD",
      "Design Nominees · SOTD", "French Design Awards · Silver",
    ],
  },

  sections: [
    {
      kind: "prose",
      n: "01",
      label: "Why it exists",
      heading: "A house with a number on it",
      rule: true,
      notes: [
        { text: [{ strong: "Self-initiated." }, " No client, no brief, no deadline — so the only constraint was honesty."] },
        { quiet: true, text: ["Two years of picking it up and putting it down, and four months of actually doing it — December to March. A project with no deadline gets finished only when you give it one."] },
      ],
      hand: { lines: ["the brief was", "one sentence:", "don't make it", "a memorial page"], inkFrom: 2, offsetTop: 96 },
      body: [
        ["Ukrainska Street 15, Kupiansk, Kharkiv region. On 24 February 2022 the war reached the street, and the house became a basement: carpets off the floors upstairs and onto the cellar walls, heaters carried down, a child and a cat and five adults sleeping under the beams."],
        ["I kept everything without meaning to — ", { mark: "Telegram threads, voice notes, video circles, photographs" }, " — because at the time sending a message was the only way to confirm we were still alive. Two years later that accidental archive was the most complete record of the thing, and it was sitting in a phone."],
        ["The project started as a way to keep it. It became a design problem: ", { pen: "how do you get a stranger to read someone else's worst year all the way to the end?" }],
      ],
    },

    {
      kind: "prose",
      n: "02",
      label: "The material",
      heading: "An archive that was never meant to be read",
      notes: [
        { text: [{ strong: "Rule." }, " Nothing reconstructed. Every message on the site is the message as it was sent, typos included."] },
        { quiet: true, text: ["Two languages sit side by side — the narration in Ukrainian, the chat fragments in the Russian they were typed in. Correcting that would have been a lie."] },
      ],
      body: [
        ["Raw material, in order of usefulness: timestamped chat threads; voice notes; video circles filmed on the drive into the fields to find a mobile signal; photographs of the house after the shelling; the objects that survived."],
        ["Sorting it produced the structure. ", { mark: "The timestamps were already the navigation" }, " — 05:00, 05:45, 06:05 — so the site didn't need a menu, it needed a clock."],
      ],
    },

    {
      kind: "pile",
      title: "The pile",
      count: "6 items — none of them made for this",
      help: "Push them around — or focus one and use the arrow keys",
      notes: [
        { quiet: true, text: ["Sorting this pile is what produced the structure of the site. You are doing, in miniature, the only research method this project had."] },
      ],
      items: [
        { src: "/artefacts/ukrainska-15/photo-01.jpg", kind: "Photograph",
          alt: "The back door of the house, its green paint blistered, the brick frame rusted and the roof sheeting torn.",
          caption: ["The back door of the house, photographed on the first visit after the family got back in."] },
        { src: "/artefacts/ukrainska-15/photo-02.jpg", kind: "Photograph",
          alt: "A photograph of the damaged house.", caption: [{ tk: "caption" }] },
        { src: "/artefacts/ukrainska-15/photo-03.jpg", kind: "Photograph",
          alt: "A photograph of the damaged house.", caption: [{ tk: "caption" }] },
        { src: "/artefacts/ukrainska-15/photo-04.jpg", kind: "Photograph",
          alt: "A photograph of the damaged house.", caption: [{ tk: "caption" }] },
        { src: "/artefacts/ukrainska-15/plate-01.jpg", kind: "Artefact plate",
          alt: "Photographs of the house, medals, a handwritten name tag and a teddy bear arranged on aged paper.",
          caption: ["Objects that survived, laid out and photographed together."] },
        { src: "/artefacts/ukrainska-15/plate-02.jpg", kind: "Artefact plate",
          alt: "A second arrangement of surviving objects and photographs.", caption: [{ tk: "caption" }] },
      ],
    },

    {
      kind: "decisions",
      n: "03",
      label: "Decisions",
      heading: "What I decided, and what it cost",
      notes: [
        { text: [{ strong: "Three that mattered" }, " — each one cost something. The cost is the interesting part."] },
      ],
      hand: { lines: ["the number plate is", "the only thing on the", "site that is red —", "and the only thing", "still hanging on the", "real gate"], inkFrom: 3, offsetTop: 180 },
      items: [
        {
          label: "Decision 01",
          title: "A threshold before the story, not a hero section",
          body: [["The site opens on a drawing of the ruined house and a single door into the story. Nothing plays, nothing scrolls, until the visitor chooses. ", { mark: "Consent before content." }]],
          tradeoff: ["Cost — a hard stop on the landing page will lose the casual visitor. Accepted: this project is not optimising for traffic."],
        },
        {
          label: "Decision 02",
          title: "The timeline is the interface",
          body: [["No sections, no chapters, no progress bar. Dates and times carry the whole structure, so the reading order is the order it happened in. A map pins itself to the viewport where geography matters and releases when it doesn't."]],
          tradeoff: ["Cost — you cannot skim it. The compromise: every date and every section is an anchor, so the story can be linked to from the middle without giving it a menu."],
        },
        {
          label: "Decision 03",
          title: "Monochrome, with one red",
          body: [["Hand-drawn engraving in black and white, and a single red: the enamel house number, ", { strong: "15" }, ". The red is never decorative — it marks the house, and later the things that did not survive."]],
          tradeoff: ["Cost — none worth reporting. The restriction did most of the art direction for free."],
        },
      ],
    },

    {
      kind: "marker",
      ghost:
        "A documentary site is judged by whether people finish it. Everything else — the animation, the sound design, the type — is in service of one number, and that number is not visits. It is completion. Which is why the hardest edit on this project was not visual at all: it was deciding how much of a person's worst week a stranger can be asked to carry, and stopping one paragraph before that line. The archive holds far more than the site shows. The version that shows everything is the version nobody finishes, and a story nobody finishes has not been preserved at all — it has only been uploaded.",
      lines: [
        ["The site holds"],
        ["less than the archive."],
        [{ redact: "That was the hard part." }, { strong: " That is the" }],
        [{ strong: "whole design." }],
      ],
    },

    {
      kind: "spec",
      n: "04",
      label: "Craft & build",
      heading: "Built like a document, not like a product",
      notes: [
        { text: [{ strong: "Designed and built by the same person" }, " — which is why the motion is cheap and the type is not."] },
        { quiet: true, text: ["Written and shipped solo, pair-coding with an AI assistant. No agency, no developer, no budget."] },
        { quiet: true, text: ["Nothing on the page is a component library's default. Every element was written for this one document."] },
      ],
      hand: { lines: ["a documentary about", "surveillance and loss", "should not ask for", "your camera"], inkFrom: 3, offsetTop: 220 },
      body: [
        ["Message bubbles, voice-note players, video circles and the pinned map are components, and they behave identically everywhere. The chrome is deliberately thin: a logo, a sound toggle, a menu."],
        ["I designed it and I shipped it — ", { mark: "design engineering, in the sense the word is used now" }, ": the component, its states and its code were one decision, not a handover. The front end was written solo, pair-coding with an AI assistant."],
        ["Sound is opt-in and always stoppable. ", { mark: "Nothing on the site takes a decision away from the reader" }, " — no voice plays until it is asked for, and the audio files load their metadata only, so a reader on a slow connection downloads nothing they never play."],
      ],
      rows: [
        { key: "Built with", value: ["Hand-written HTML, CSS and JavaScript. No framework, no build step, no template."] },
        { key: "Motion", value: ["GSAP 3.12.5 + ScrollTrigger — the pinned map, the timeline, the reveals."] },
        { key: "Languages", value: ["Ukrainian and English, through a translation layer I wrote — including the aria-labels, not only the visible copy."] },
        { key: "Hosting", value: ["Netlify. Formspree for the one form on the site."] },
        { key: "Media", value: ["WebP throughout, 43 images lazy-loaded; audio as OGG with MP3 fallback."] },
        { key: "Hardened", value: ["Content-Security-Policy, HSTS, nosniff, ", { code: "frame-ancestors: none" }, "; geolocation, microphone and camera denied outright."] },
      ],
    },

    {
      kind: "prose",
      n: "05",
      label: "Outcome",
      heading: "What happened to it",
      rule: true,
      notes: [
        { text: [{ strong: "Eight recognitions" }, " across six juries in one year, for a site with no budget and no client."] },
      ],
      body: [
        ["Two MUSE Golds — one in Causes & Awareness, one in Strange & Unusual, which is an odd pair of categories to win with the same site and says something true about it. CSS Design Awards gave it Best UI, Best UX, Best Innovation and Special Kudos. CSS Winner, CSS Nectar, Design Nominees and the French Design Awards followed."],
        ["What I cannot tell you is how many people finished it. ", { mark: "I shipped the site with no analytics at all" }, " — a deliberate choice at the time, about not measuring a story like this, and the wrong one. The number that would prove the whole argument of this case study is the one number I chose not to collect."],
      ],
    },

    {
      kind: "prose",
      n: "06",
      label: "In hindsight",
      heading: "What I would do differently",
      rule: true,
      hand: { lines: ["hiring managers read", "this section first.", "be specific, not modest"], inkFrom: 2, offsetTop: 44 },
      body: [
        [{ strong: "I would instrument it." }, " Completion depth is the only metric that matches what the site is for, and I have no idea what it is. Privacy-first analytics would have cost nothing and told me whether the restraint worked."],
        [{ strong: "I would honour " }, { code: "prefers-reduced-motion" }, { strong: "." }, " The whole site runs on scroll-driven animation and it does not check whether the reader has asked their system to stop moving things. For a project this careful about not taking decisions away from the reader, that is the one place it does. ", { tk: "fix it, then reword to “found in review and fixed”" }],
        [{ strong: "I would write the English version first, not second." }, " ", { tk: "true?" }],
      ],
    },
  ],

  next: { label: "Next: Case 002 — BulkSource", href: "/work/bulksource" },
};

export default ukrainska15;
