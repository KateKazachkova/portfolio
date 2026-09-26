import type { CaseStudy } from "./types";

/**
 * CASE 001 — Ukrainska 15.
 *
 * The text is Kate's, as she wrote it (26.09.2026) — sections, order and
 * wording. The page adds only its own furniture: section numbers, the
 * highlighter on the skim path, the pile of photographs and the award card.
 */
// the archive in the pile: Telegram screenshots, a video still and photographs
const P = "/artefacts/ukrainska-15/pile/";

const ukrainska15: CaseStudy = {
  slug: "ukrainska-15",
  fileNo: "File 001 · Self-initiated",
  title: "Ukrainska 15",
  years: "2024 – 2026",

  subtitle:
    "An interactive digital story built from my family’s real messages, voice notes, photographs and videos during the Russian occupation of Kupiansk.",
  summary: [
    ["An interactive digital story built from my family’s real messages, voice notes, photographs and videos ", { mark: "during the Russian occupation of Kupiansk." }, " Ukrainska 15 turns this personal archive into a chronological experience about one house, several generations of one family, and what happens to memory when the physical place that held it is lost."],
  ],

  fields: [
    { key: "Project", value: ["Independent / Personal"] },
    { key: "Role", value: ["UX/UI Designer · Interaction Designer · Developer"] },
    { key: "Focus", value: ["Digital Storytelling · Content Design · Narrative Experience"] },
    { key: "Duration", value: ["Feb 2024 – Mar 2026\nActive design & development: Dec 2025 – Mar 2026"] },
  ],

  tablet: {
    video: "/artefacts/ukrainska-15/tablet/site-scroll.mp4",
    poster: "/artefacts/ukrainska-15/tablet/site-poster.jpg",
    href: "https://ukrainska15.com",
    label: "Open the live site, ukrainska15.com",
  },

  sections: [
    {
      kind: "prose",
      n: "01",
      heading: "The short version",
      rule: true,
      photos: [
        { src: "/artefacts/ukrainska-15/booklet/basement.webp", alt: "The cellar, carpets hung on its walls, a bed made up under them", tilt: 4,
          hand: "our basement – we set it up during the war" },
        { src: "/artefacts/ukrainska-15/booklet/child-and-cat.webp", alt: "My daughter in the basement, holding the family's cat", tilt: -3,
          hand: "my daughter with the cat" },
      ],
      body: [
        ["Ukrainska 15 is the address of my family home in Kupiansk, Kharkiv region. My great-grandparents built it and lived there, then my granny and mother. For generations, this house was part of our family’s life."],
        ["When the full-scale invasion began on 24 February 2022, my family moved into the basement. Carpets went from the floors to the cellar walls. Five adults – the whole family, my daughter and a cat lived there through the first months of the occupation."],
        ["During that time, I kept everything without really meaning to: ", { mark: "Telegram messages, voice notes, video circles and photographs" }, ". Two years later, I realised I had built an accidental archive of what happened to my family and our home."],
        ["But this project was also about letting go."],
        ["The house connected several generations of my family, and losing it made me think about what we carry from one generation to the next – memories, displacement, fear, trauma."],
        ["I couldn’t bring the house back. But I could preserve what was left: the messages, voices, photographs and memories. Ukrainska 15 became my way of giving them a place to live – and of finally letting the physical place go."],
        ["I didn’t want to build a memorial page. ", { mark: "I wanted someone who had never met us to enter the story, understand what happened, and stay with it until the end." }],
      ],
    },

    {
      kind: "prose",
      n: "02",
      heading: "Turning a personal archive into an experience",
      rule: true,
      body: [
        ["Once I decided to make the project, I wasn’t designing only for myself anymore. To my family because we had lived through them. To everyone else, they were just fragments."],
        [{ mark: "But the challenge was to turn this private archive into a story a stranger could follow – without turning it into a news article, a historical timeline or a memorial." }],
        [{ strong: "The original material had to stay at the centre. The interface had one job: give it enough context to be understood without adding more weight to an already difficult story." }],
      ],
    },

    {
      kind: "prose",
      n: "03",
      heading: "An archive that was never meant to be read",
      rule: true,
      body: [
        ["There was no research phase in the usual sense. The material was already in my phone."],
        ["And of course, none of it was made for an audience. The messages were fragmented, repetitive and sometimes deeply personal. A few words could mean everything to us and almost nothing to someone outside the family."],
        ["I started by putting everything in chronological order and adding only the context a stranger would need to follow the story."],
      ],
    },

    {
      kind: "pile",
      title: "The pile",
      count: "20 items – none of them made for this",
      help: "Push them around – or focus one and use the arrow keys",
      items: [
        { src: P + "msg-01.webp", size: 2, kind: "Telegram message", alt: "A night of messages: the centre has been bombed, windows blown out; “I’m going down to the basement”, the power banks and laptop charged.", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "msg-02.webp", size: 1.3, kind: "Telegram message", alt: "Morning messages: it has been quiet for half an hour, the family went into the house – power, water and gas still on; outside it smells of burning.", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-20.webp", kind: "Photograph", alt: "A single bulb hanging from the basement ceiling, the only light in the dark.", caption: ["The light we ran down into the basement"] },
        { src: P + "msg-03.webp", kind: "Voice note", alt: "A seven-second voice note, captioned “My mum at work”.", caption: ["A voice note from my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-23.webp", kind: "Photograph", alt: "Shelves of preserves in the cellar – jars of pickles, tomatoes and jam against a whitewashed wall.", caption: ["The supplies we kept in the basement"] },
        { src: P + "video-01.webp", kind: "Video still", alt: "A frame from a video: a laptop open on a table in the house, a child's hand at the edge of the frame.", caption: ["My daughter’s first work in Figma"] },
        { src: P + "msg-05.webp", size: 1.3, kind: "Telegram message", alt: "“Alive. Everyone’s on edge. Mum and the others.” – “Here it’s quiet now; they say it’s loud near the tractor plant.”", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-22.webp", kind: "Photograph", alt: "The cat on the patterned blanket, a child's hands holding a phone above it.", caption: ["The cat, who had no idea what was going on – neither did we"] },
        { src: P + "msg-07.webp", size: 2, kind: "Telegram message", alt: "26 February 2022, just after midnight: the suburb was shelled in the morning; “I slept a few hours, and now I’m jumpier than before”.", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-24.webp", kind: "Photograph", alt: "The garden through a basement window, bare trees and snow.", caption: ["The yard in the first days of the war"] },
        { src: P + "msg-10.webp", size: 1.3, kind: "Telegram message", alt: "“We’re in the basement.” – “It’s quiet, but you’re in the basement?” – “Not quiet. But in the basement. I’ll grab some things and go back.”", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-36.webp", kind: "Photograph", alt: "My daughter lying on a bed after breaking her arm, a hand over her face.", caption: ["My daughter broke her arm: a fighter jet frightened her and she fell. We barely found a doctor to set it – a few weeks later we learned he had been killed in the shelling"] },
        { src: P + "msg-11.webp", kind: "Telegram message", alt: "“We’re still sitting in the basement. We hung the carpet” – with a photo of the carpet on the cellar wall.", caption: ["Messages with my boyfriend, who stayed in Kharkiv"] },
        { src: P + "photo-15.webp", kind: "Photograph", alt: "The cat's back on a rug by the wooden steps.", caption: ["The cat getting ready to go down to the basement"] },
        { src: P + "photo-17.webp", kind: "Photograph", alt: "Snowdrops coming up through last year's leaves.", caption: ["My great-grandmother loved flowers"] },
        { src: P + "photo-18.webp", kind: "Photograph", alt: "The basement ceiling, close up.", caption: ["The basement ceiling"] },
        { src: P + "photo-33.webp", kind: "Photograph", alt: "Maksym, the grey cat, close up, a dandelion caught in his fur.", caption: ["Maksym, the cat"] },
        { src: P + "photo-38.webp", kind: "Photograph", alt: "A hand holding a violet with a clump of soil and roots.", caption: ["Planting the vegetable garden, hoping it would all be over soon"] },
        { src: P + "photo-39.webp", kind: "Photograph", alt: "Red berries left on a bare bush.", caption: ["Guelder rose – my granny boiled it in winter for colds"] },
        { src: P + "photo-40.webp", kind: "Photograph", alt: "A selfie, half a face in the frame, a hand in the hair.", caption: ["My first grey hair, at 29, after two weeks of the war"] },
      ],
    },

    {
      kind: "prose",
      n: "04",
      heading: "Finding the structure",
      rule: true,
      body: [
        ["My first instinct was to organise the story into chapters: occupation, survival, liberation, destruction. It made sense on paper. But it didn’t feel like what we had lived through. Those categories only made sense afterwards, knowing how the story ended. At the time, we didn’t know what the next day – or even the next hour – would bring."],
        ["Then I went back to the messages: ", { code: "05:00" }, ", ", { code: "05:45" }, ", ", { code: "06:05" }, "."],
        [{ mark: "The structure was already there: time.", strong: true }, " Dates and timestamps became the information architecture. Instead of retrospective chapters, the visitor moves through events in the same order my family did."],
        ["That became a rule for the whole project."],
      ],
    },

    {
      kind: "plates",
      items: [
        { src: "/artefacts/ukrainska-15/site/timeline.webp", pl: "PL. 01", alt: "The site's first days: a pencil illustration of the house beside messages, each under its date and time", caption: ["Messages arrive one by one, under their dates and times"] },
        { src: "/artefacts/ukrainska-15/site/basement.webp", pl: "PL. 02", alt: "An illustration of an armchair in the basement beside the family's messages", caption: ["An illustration holds the place while the messages talk"] },
      ],
    },

    {
      kind: "decisions",
      n: "05",
      heading: "Four decisions that shaped the experience",
      rule: true,
      photos: [
        { src: "/artefacts/ukrainska-15/after/01.webp", alt: "The house on Ukrainska Street after the occupation: bare trees, a dark fence, two people by the gate", tilt: 3,
          hand: "the photo the cover started from" },
        { src: "/artefacts/ukrainska-15/door/sketch.webp", alt: "A sketch of the damaged house, the fence and the trees, drawn in red on black", tilt: -2,
          hand: "one of the sketches" },
      ],
      items: [
        {
          label: "01",
          title: "You have to open the door",
          body: [
            ["I knew this story could be difficult for some people to experience. It includes war, occupation, loss, personal messages and sound."],
            ["So I didn’t want the story to simply start."],
            ["The first screen asks the visitor to make a conscious choice: open the door and enter. Only then does the experience – including sound – begin. The door became a natural boundary between the outside world and the story. It gives people a moment to decide whether they want to step inside. The cover itself started with a photograph of my family home. I explored several directions through sketches, then used AI to develop the final illustration from the original photo and selected concept."],
            [{ mark: "Entering this story had to be a choice.", strong: true }],
          ],
          tablet: { src: "/artefacts/ukrainska-15/door/first-screen.webp", alt: "The first screen of Ukrainska 15: a girl with a red bag stands at the gate of the ruined house, under the line “My girl, wake up… the war has begun” and a Ready to listen button" },
        },
        {
          label: "02",
          title: "The story comes first",
          body: [
            ["I didn’t want people to pay much attention to the interface. The story had to stay at the centre. It unfolds through time – dates, timestamps, messages, photographs and voice notes appear in the order they happened. There are no chapters to choose from or menus telling you where to go next."],
            ["I added illustrations and a map where they helped give context, but never as decoration. When location matters, the map supports the story. When it doesn’t, it disappears."],
            [{ mark: "The UI was designed to do the same: guide the visitor when needed, then step back.", strong: true }],
          ],
        },
        {
          label: "03",
          title: "One colour, one meaning",
          player: true,   // the song's player lies in the margin between the notes 02 and 04
          body: [
            ["I kept the experience almost entirely black and white. It felt right for the archive and left the focus on the story rather than the visuals. ", { mark: "Red is the only exception." }, " I chose it because this is an emotional story – about danger, loss, memory and home. I used it sparingly, so when it appears, it carries weight without overwhelming the content."],
            ["The number 15 became the main visual symbol of the project, taken from the enamel plate on our house. The real plate is still hanging on the gate."],
          ],
        },
        {
          label: "04",
          title: "Editing was part of the design",
          body: [
            ["The archive contains much more than the website does. Some messages repeated what was already clear. Some photographs were too personal to share. And some details simply didn’t help move the story forward."],
            ["Choosing what to leave out was one of the hardest parts. I kept coming back to one question:"],
            [{ strong: "Does someone need this to understand what happens next?" }],
            ["If not, it probably didn’t need to be there. Showing everything wouldn’t have made the story more honest. It would have made it harder to follow. The goal wasn’t to preserve every piece of the archive. It was to preserve the story."],
          ],
        },
      ],
    },

    {
      kind: "prose",
      n: "06",
      heading: "Designing the emotional pace",
      rule: true,
      body: [
        ["The story is emotionally heavy on its own, so I didn’t want the interface to exaggerate it. Instead, I used pacing to guide attention. Messages appear one by one. Photographs interrupt conversations. Voice notes make you stop reading and listen. Sound effects add atmosphere without telling you what to feel."],
        ["Some moments move quickly. Others slow down and leave space before the story continues. I treated motion, sound and pauses as part of the storytelling – not as effects added on top of it."],
        ["The goal was to create space for the material, not make it more dramatic."],
      ],
    },

    {
      kind: "plates",
      items: [
        { src: "/artefacts/ukrainska-15/site/family.webp", pl: "PL. 03", alt: "A strip of family photographs across the screen, generation by generation", caption: ["The family, generation by generation"] },
        { src: "/artefacts/ukrainska-15/site/after.webp", pl: "PL. 04", alt: "Photographs of the house after the occupation: the burnt yard, the ruined walls", caption: ["The house after the occupation"] },
      ],
    },

    {
      kind: "prose",
      n: "09",
      heading: "Beyond Figma",
      rule: true,
      body: [
        [{ mark: "Ukrainska 15 started in Figma, but I quickly realised that static screens weren’t enough.", strong: true }, " Timing, transitions, sound and pacing only really work when you experience them. So I designed and built the site myself, pair-coding the front end with AI."],
        [{ code: "HTML · CSS · JavaScript · GSAP · ScrollTrigger · Netlify" }],
      ],
    },

    {
      kind: "prose",
      n: "12",
      heading: "The outcome",
      rule: true,
      awards: true,
      body: [
        ["I made Ukrainska 15 independently – without a client, a team or an existing brief. The project received international recognition across UX, UI, innovation and digital storytelling, including ", { mark: "two MUSE Gold awards and four CSS Design Awards" }, ", and was featured in international media and design publications."],
        ["What mattered most to me was that something so personal could resonate with people who had never met my family or seen this house."],
        ["A private family story had found an audience far beyond us."],
      ],
    },

    {
      kind: "prose",
      n: "13",
      heading: "What I would do differently",
      rule: true,
      body: [
        ["I launched Ukrainska 15 without analytics. At the time, tracking such a personal story felt wrong. Looking back, privacy-first analytics could have answered one important question: ", { mark: "Did people reach the end?", strong: true }],
        ["If I built it today, I would measure completion and drop-off – not to optimise for clicks, but to understand how people experienced the story."],
      ],
    },

    {
      kind: "prose",
      n: "14",
      heading: "What the project changed for me",
      cta: { label: "View the live project ↗", href: "https://ukrainska15.com" },
      rule: true,
      body: [
        ["This project taught me that sometimes design is as much about what you leave out as what you add. But personally, it gave me something more important. For a long time, preserving the house and preserving the memory of it felt like the same thing. They aren’t. The house is gone. The messages, voices, photographs and stories are not."],
        [{ mark: "Ukrainska 15 didn’t bring my home back. But it helped me finally let it go.", strong: true }],
      ],
    },
  ],

};

export default ukrainska15;
