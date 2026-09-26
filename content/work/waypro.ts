import type { CaseStudy } from "./types";

/**
 * CASE 002 — WayPro.
 *
 * A client/product UX case, ported from the Behance write-up and Kate's own
 * account. The text is the Behance case's own, word for word. Laid out
 * as Ukrainska 15 is: the screens in pairs between the sections, the key
 * line of a section in bold under the highlighter.
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

  tablet: {
    video: "/artefacts/waypro/cover.mp4",
    poster: "/artefacts/waypro/cover-poster.jpg",
    href: "https://www.behance.net/gallery/209626437/WayPro-UIUX-iOS-App",
    label: "WayPro on Behance",
    button: "View on Behance",
  },

  sections: [
    {
      kind: "prose",
      n: "01",
      heading: "About WayPro",
      rule: true,
      photos: [
        { src: "/artefacts/waypro/sign-in.webp", alt: "The WayPro sign-in screen on an iPhone: email, password and a Sign In button", tilt: 4,
          hand: "sign in – the driver's way in", cutout: true },
      ],
      body: [
        ["WayPro is a logistics and delivery management iOS app designed for drivers transporting grass products from farms to buyers."],
        ["It simplifies the delivery process by providing drivers with all the tools they need to efficiently complete their assigned routes."],
      ],
    },

    {
      kind: "prose",
      n: "02",
      heading: "The goal",
      rule: true,
      body: [
        [{ mark: "Create an intuitive, driver-friendly iOS app that simplifies delivery management", strong: true }, " by providing real-time route tracking, easy delivery confirmation, and seamless communication with logistics managers, ultimately improving efficiency and reducing errors in the grass product logistics process."],
        ["As the Lead UX Designer, I was responsible for creating a user-centric experience tailored specifically for drivers in the grass product logistics industry."],
        [{ strong: "Responsibilities:" }],
        [{ strong: "Conducted user research" }, ", including interviews with drivers and stakeholders to gather insights into their workflows and pain points;"],
        [{ strong: "Designed wireframes and prototypes" }, " using Figma, focusing on ease of use and efficient delivery management;"],
        [{ strong: "Collaborated with developers" }, ";"],
        [{ strong: "Facilitated usability testing, gathered feedback" }, ", and iterated on designs to improve overall user experience."],
      ],
    },

    {
      kind: "plates",
      items: [
        { src: "/waypro/board-08.webp", pl: "PL. 01", alt: "The home screen: the day's assigned routes as a list, each with a status and load.", caption: ["The home screen – the day's routes, each tagged with its status and how full the load is."] },
        { src: "/waypro/board-10.webp", pl: "PL. 02", alt: "A route-detail screen with stops in order, addresses, time windows and load status.", caption: ["A route in detail – stops in order, time windows, and the load on board."] },
      ],
    },

    {
      kind: "decisions",
      n: "03",
      heading: "Understanding the user",
      rule: true,
      body: [
        ["Qualitative user interviews with 10 drivers who were actively delivering herbal products."],
        [{ mark: "The initial hypothesis was that the main issue was route navigation.", strong: true }],
      ],
      items: [
        {
          label: "01",
          title: "Real-time delivery updates",
          body: [
            ["Drivers expressed difficulty in receiving real-time updates on delivery status, which led to delays and miscommunication."],
            ["Moving forward, the app design will prioritize real-time notifications to ensure drivers are always informed."],
          ],
        },
        {
          label: "02",
          title: "Complex paperwork",
          body: [
            ["Drivers struggled with completing paperwork and order confirmations efficiently."],
            ["To address this, we designed a streamlined, digital confirmation process with e-signatures to minimize paperwork and improve delivery speed."],
          ],
        },
        {
          label: "03",
          title: "Lack of inventory transparency",
          body: [
            ["Drivers found it frustrating to arrive at delivery points without knowing accurate inventory details."],
            ["By integrating real-time inventory tracking, we ensure that drivers have up-to-date information about product availability before reaching delivery points."],
          ],
        },
        {
          label: "04",
          title: "Navigation issues",
          body: [
            ["Though route planning was handled by managers, drivers reported difficulties navigating complex routes."],
            ["Google Maps integration with turn-by-turn directions was introduced to provide drivers with reliable, real-time navigation assistance."],
          ],
        },
      ],
    },

    {
      kind: "prose",
      n: "04",
      heading: "Persona: Alex Winchester",
      rule: true,
      body: [
        ["32 · High School Diploma · Denver, Colorado · Married, 2 kids · Delivery Driver for Grass Products"],
        [{ mark: "Alex is a 32-year-old driver who needs a way to receive real-time updates and confirm deliveries efficiently because current methods of handling paperwork and navigation slow him down.", strong: true }],
        [{ strong: "Scenario" }],
        ["Alex typically starts his day early, receiving his assigned routes and preparing for deliveries. However, he often encounters problems when product inventories are not up to date, or last-minute changes are not communicated effectively. This leads to wasted time and frustration. He wants a solution that simplifies these processes, allowing him to focus on driving and delivering products efficiently."],
        [{ strong: "Goals" }],
        ["Complete all daily deliveries without unnecessary delays.\nReduce time spent on paperwork by using an app to confirm deliveries.\nStay informed about delivery changes in real time to avoid confusion."],
        [{ strong: "Frustrations" }],
        ["Struggles with inaccurate or outdated delivery information.\nThe current paperwork system is time-consuming and prone to errors.\nDifficulties navigating complex routes without proper GPS guidance."],
      ],
    },

    {
      kind: "plates",
      items: [
        { src: "/waypro/board-11.webp", pl: "PL. 03", alt: "A route in progress with a pinned map and turn-by-turn navigation.", caption: ["In progress – turn-by-turn navigation for the active route."] },
        { src: "/waypro/board-12.webp", pl: "PL. 04", alt: "A delivery-confirmation screen with an on-screen signature pad.", caption: ["Delivery confirmed with an on-screen signature – no paperwork."] },
      ],
    },

    {
      kind: "spec",
      n: "05",
      label: "The journey",
      heading: "Customer journey map",
      body: [],
      rows: [
        { key: "Review assigned routes", value: ["Open app and view assigned routes · Check route details · Verify product inventory\nFeeling: confused, rushed\nImprovement: clearer route overview and real-time traffic updates"] },
        { key: "Start navigation", value: ["Use Google Maps for navigation · Follow route guidance\nFeeling: focused, determined\nImprovement: turn-by-turn guidance that adapts to traffic changes"] },
        { key: "Pickup product", value: ["Check pickup details · Verify inventory · Load product into vehicle\nFeeling: confident, prepared\nImprovement: real-time inventory tracking, improved product verification"] },
        { key: "Deliver product", value: ["Use app to find exact drop-off location · Unload product · Meet with recipient\nFeeling: tired, focused\nImprovement: detailed instructions for delivery drop-offs"] },
        { key: "Confirm delivery", value: ["Collect recipient's signature · Verify delivery in app\nFeeling: relieved, accomplished\nImprovement: quick signature collection, one-step verification process"] },
        { key: "Complete route report", value: ["Finalize route · Submit delivery report\nFeeling: satisfied, ready to finish\nImprovement: automated report submission for faster completion"] },
      ],
    },

    {
      kind: "prose",
      n: "06",
      heading: "Outcomes",
      rule: true,
      awards: true,
      stats: [
        { n: "10", caption: "Drivers interviewed, all actively delivering herbal products" },
        { n: "4", caption: "Pain points, each turned into a feature" },
        { n: "6", sup: "×", caption: "International awards" },
      ],
      body: [
        ["The design of WayPro greatly simplified the delivery process for drivers, reducing the time spent on manual paperwork and improving route efficiency."],
        ["One of the study participants noted, ", { mark: "“The app makes it so much easier to navigate routes and confirm deliveries quickly without getting bogged down by paperwork.”", strong: true }],
      ],
    },
  ],
};

export default waypro;
