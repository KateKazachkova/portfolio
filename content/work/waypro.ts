import type { CaseStudy } from "./types";

/**
 * CASE 002 — WayPro.
 *
 * A client/product UX case, ported from the Behance write-up and Kate's own
 * account. Every fact here is taken from that write-up (role, research, the
 * four pain points, the palette, the awards) — nothing is invented. What is
 * still hers to supply — the hindsight, the clean screens, the exact
 * timeline — renders as a `{ tk }` chip, never as fact.
 */
const waypro: CaseStudy = {
  slug: "waypro",
  fileNo: "File 002 · Product design",
  title: "WayPro",
  years: "2024",

  result: [
    { mark: "Ten driver interviews turned into four shipped features" },
    " – a logistics app rebuilt around what drivers actually struggle with, recognised with six international awards, four of them Gold.",
  ],

  subtitle:
    "A logistics and delivery iOS app for drivers moving grass products from farm to buyer – real-time routes, one-tap delivery confirmation and live inventory, designed from field research.",

  fields: [
    { key: "Role", value: ["Lead UX Designer"] },
    { key: "Scope", value: ["Research · IA\nWireframes · Prototyping\nUsability testing"] },
    { key: "Team", value: ["With Alex Broman\nBuilt with developers"] },
    { key: "Duration", value: ["2024"] },
    { key: "Recognition", value: ["Indigo Design Award – 2× Gold, Silver\nDavey Awards – Gold\nLondon Design Awards – Gold\nMUSE – Silver"] },
  ],

  lead: {
    ghost:
      "A driver hauling grass products spends the day inside a sequence: a list of routes handed down by a manager, a pickup that has to match an order, a drive to a place they may never have been, an unload, a signature, and a report at the end of it. Every step is a small negotiation with time, and every step is a place where a wrong number or a late message costs an afternoon. The temptation, designing for that, is to solve the part that looks hardest from the outside – the driving, the map, the route. The interviews said otherwise. The map was the one thing already handled. What actually slowed the day was everything around it: not knowing what was in the van, confirming a delivery on paper, waiting on an update that never came.",
    red: "A delivery app for drivers hauling grass products farm to buyer, built from ten field interviews – not from assumptions.",
    ink: "The problem we were sure of – navigation – turned out to be the smallest one.",
  },

  outcome: {
    stats: [
      { n: "10", caption: "Drivers interviewed, all actively delivering herbal products" },
      { n: "4", caption: "Field pain points, each turned into a feature" },
      { n: "6", caption: "Stages mapped in the driver's journey, route to report" },
      { n: "6", sup: "×", caption: "International awards – Indigo 2× Gold + Silver · Davey Gold · London Design Awards Gold · MUSE Silver" },
    ],
    stamps: [
      { text: "Indigo Design Award · Gold" },
      { text: "Indigo Design Award · Gold" },
      { text: "Indigo Design Award · Silver" },
      { text: "Davey Awards · Gold" },
      { text: "London Design Awards · Gold" },
      { text: "MUSE Creative Awards · Silver" },
    ],
  },

  sections: [
    {
      kind: "prose",
      n: "01",
      label: "Why it exists",
      heading: "Getting grass from the farm to the buyer",
      rule: true,
      notes: [
        { text: [{ strong: "Lead UX Designer." }, " Research, wireframes and prototypes, usability testing – and the argument with the brief."] },
        { quiet: true, text: ["A two-person project with Alex Broman, built alongside a development team. My half was the experience: what a driver sees, in what order, and why."] },
      ],
      body: [
        ["WayPro is a logistics and delivery iOS app for the people who move grass products from farms to buyers. It gives a driver the one thing the job actually needs: everything for the day's run, in the order the day happens."],
        ["The work is coordination under time pressure – ", { mark: "assigned routes, pickups that have to match an order, drop-offs, confirmations, and a report at the end" }, ". Each of those is a place a delivery can go wrong, and most of them had nothing to do with the road."],
      ],
    },

    {
      kind: "prose",
      n: "02",
      label: "Research",
      heading: "The assumption was navigation. It wasn't.",
      hand: { lines: ["ask before you", "assume – the", "whole case is in", "that one flip"], inkFrom: 2, offsetTop: 40 },
      notes: [
        { text: [{ strong: "The hypothesis was wrong," }, " which is the most useful thing research can tell you."] },
      ],
      body: [
        ["We went in certain the main issue was ", { mark: "route navigation" }, ". So we asked – ", { mark: "ten qualitative interviews with drivers actively delivering herbal products" }, " – before committing a single screen."],
        ["The interviews moved the brief. Navigation was the one part already handled: routes were planned by managers, and the real difficulty was executing them. What actually cost the day was ", { pen: "not knowing the inventory, confirming deliveries on paper, and updates that arrived late or not at all." }],
        ["Four pain points came out of it, and each one became a decision."],
      ],
    },

    {
      kind: "decisions",
      n: "03",
      label: "Decisions",
      heading: "What the research changed",
      notes: [
        { text: [{ strong: "Four findings, four features." }, " The interesting half is the pain each one answered."] },
      ],
      hand: { lines: ["every feature", "here has a", "driver behind it"], inkFrom: 1, offsetTop: 150 },
      items: [
        {
          label: "Finding 01",
          title: "Real-time delivery updates, as the spine",
          body: [["Status became the backbone of the app rather than a screen you go looking for. ", { mark: "A driver is never guessing where a delivery stands." }]],
          tradeoff: [["The pain – updates on delivery status arrived late or not at all, so drivers and managers kept falling out of sync."]],
        },
        {
          label: "Finding 02",
          title: "One-tap confirmation, with e-signatures",
          body: [["Paperwork at every stop became a streamlined digital confirmation: collect the recipient's signature, verify in-app, move on."]],
          tradeoff: [["The pain – completing paperwork and order confirmations by hand ate time at every single drop-off."]],
        },
        {
          label: "Finding 03",
          title: "Live inventory, before arrival",
          body: [["Real-time inventory tracking, so a driver knows what is actually available ", { strong: "before" }, " reaching the delivery point, not after."]],
          tradeoff: [["The pain – arriving at a drop with no reliable read on the product actually on board."]],
        },
        {
          label: "Finding 04",
          title: "Turn-by-turn, not route planning",
          body: [["Planning stayed with the managers, where it worked. Drivers got Google Maps turn-by-turn integration for the part that was hard: following a complex route on the road."]],
          tradeoff: [["The pain – the plan was fine; navigating it in the moment was not."]],
        },
      ],
    },

    {
      kind: "spec",
      n: "04",
      label: "The journey",
      heading: "Route to report, in six steps",
      notes: [
        { text: [{ strong: "The whole run, mapped," }, " so every screen has to earn its place in the day."] },
      ],
      body: [
        ["A journey map held the design honest: each stage carries a task, a feeling, and the one thing that could be better. The screens fell out of the map, not the other way round."],
      ],
      rows: [
        { key: "Review routes", value: ["Open the day's routes, check the details, verify product inventory."] },
        { key: "Navigate", value: ["Turn-by-turn guidance that adapts to traffic."] },
        { key: "Pick up", value: ["Check pickup details, verify inventory, load the vehicle."] },
        { key: "Deliver", value: ["Find the exact drop-off, unload, meet the recipient."] },
        { key: "Confirm", value: ["Collect the recipient's signature; verify the delivery in-app."] },
        { key: "Report", value: ["Finalise the route and submit the delivery report."] },
      ],
    },

    {
      kind: "marker",
      ghost:
        "There is a version of this project that ships the navigation app we assumed we were making, wins nothing, and quietly fails the people using it – because the thing it solved beautifully was never the thing in the way. The difference between that version and this one is ten conversations. Research is not the part of the process that slows you down; it is the part that stops you building the wrong thing well.",
      lines: [
        ["The hypothesis was navigation."],
        ["The drivers said paperwork."],
        [{ strong: "You find that out by asking –" }],
        [{ strong: "not by guessing." }],
      ],
    },

    {
      kind: "spec",
      n: "05",
      label: "Craft & build",
      heading: "Built earthy, for eyes on the road all day",
      notes: [
        { text: [{ strong: "The palette is doing a job," }, " not decorating one."] },
        { quiet: true, text: ["Ochre, mustard and olive green are easy on the eyes over a long shift; the muted contrast keeps the thing that matters legible without shouting."] },
      ],
      hand: { lines: ["a driver reads", "this in sun, in", "a moving van –", "so nothing shouts"], inkFrom: 3, offsetTop: 210 },
      body: [
        ["Designed in Figma end to end – wireframes, prototypes and the high-fidelity UI – and tested with drivers, then iterated. The front end was built with a development team; the handover was the prototype plus its states."],
        ["The colour scheme is earthy on purpose: ", { mark: "charcoal, olive, ochre, sage and brick red" }, ". Long hours of use reward low strain over high contrast, so the important element stands out without the screen ever being harsh."],
      ],
      rows: [
        { key: "Platform", value: ["iOS."] },
        { key: "Designed in", value: ["Figma – wireframes, prototypes and hi-fi UI."] },
        { key: "Palette", value: ["Charcoal ", { code: "#1E1E1E" }, ", olive ", { code: "#7F772C" }, ", ochre ", { code: "#CFA84D" }, ", sage ", { code: "#CAC30B" }, ", brick red ", { code: "#A7473B" }, "."] },
        { key: "Method", value: ["Ten driver interviews · persona · journey map · usability testing."] },
        { key: "Team", value: ["Lead UX Designer, with Alex Broman and the development team."] },
      ],
    },

    {
      kind: "plates",
      label: "The screens",
      heading: "What the driver sees",
      notes: [
        { text: [{ strong: "Six screens, one job each." }, " The whole run lives on the phone in the cab."] },
        { quiet: true, text: ["Shown as they were presented – the app on the earthy palette it was designed in."] },
      ],
      items: [
        { src: "/waypro/board-04.webp", pl: "PL. 01",
          alt: "The WayPro sign-in screen shown on an iPhone.",
          caption: ["Sign in – the driver's entry point."] },
        { src: "/waypro/board-08.webp", pl: "PL. 02",
          alt: "The home screen: the day's assigned routes as a list, each with a status and load.",
          caption: ["The home screen – the day's routes, each tagged with its status and how full the load is."] },
        { src: "/waypro/board-10.webp", pl: "PL. 03",
          alt: "A route-detail screen with stops in order, addresses, time windows and load status.",
          caption: ["A route in detail – stops in order, time windows, and the load on board."] },
        { src: "/waypro/board-11.webp", pl: "PL. 04",
          alt: "A route in progress with a pinned map and turn-by-turn navigation.",
          caption: ["In progress – turn-by-turn navigation for the active route."] },
        { src: "/waypro/board-12.webp", pl: "PL. 05",
          alt: "A delivery-confirmation screen with an on-screen signature pad.",
          caption: ["Delivery confirmed with an on-screen signature – no paperwork."] },
        { src: "/waypro/board-13.webp", pl: "PL. 06",
          alt: "A route-complete screen and the one-tap report submission.",
          caption: ["Route complete; the report submits in a tap."] },
      ],
    },

    {
      kind: "prose",
      n: "06",
      label: "Outcome",
      heading: "What happened to it",
      rule: true,
      notes: [
        { text: [{ strong: "Six international awards" }, " for a driver's tool most people will never see."] },
      ],
      body: [
        ["WayPro took ", { mark: "two Golds and a Silver at the Indigo Design Award" }, " (Mobile App; Mobile Interaction & Experience), ", { mark: "Gold at the Davey Awards" }, " (Mobile Features – Best UI), ", { mark: "Gold at the London Design Awards" }, " (UI, Transportation) and ", { mark: "Silver at the MUSE Creative Awards" }, " (Mobile App, Logistics) – recognition for a piece of workwear software, judged on the same terms as consumer apps."],
        [{ tk: "any shipped/usage numbers you can share – drivers on it, deliveries handled" }],
      ],
    },
  ],
};

export default waypro;
