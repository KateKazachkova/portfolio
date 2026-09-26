import type { CaseStudy } from "./types";

/**
 * CASE 001 — Ukrainska 15.
 *
 * The text is Kate's, as she wrote it (26.09.2026) — sections, order and
 * wording. The page adds only its own furniture: section numbers, the
 * highlighter on the skim path, the pile of photographs, the award card and
 * one marker spread quoting her own line.
 */
const ukrainska15: CaseStudy = {
  slug: "ukrainska-15",
  fileNo: "File 001 · Self-initiated",
  title: "Ukrainska 15",
  years: "2024 – 2026",

  subtitle:
    "An interactive digital story built from my family’s real messages, voice notes, photographs and videos during the Russian occupation of Kupiansk.",
  summary: [
    ["An interactive digital story built from my family’s real messages, voice notes, photographs and videos ", { mark: "during the Russian occupation of Kupiansk." }],
    ["Ukrainska 15 turns this personal archive into a chronological experience about one house, several generations of one family, and what happens to memory when the physical place that held it is lost."],
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
        ["Ukrainska 15 is the address of my family home in Kupiansk, Kharkiv region."],
        ["My great-grandparents built it. My grandparents lived there, and then my mother did. For generations, the same rooms, garden and address held a large part of our family’s history."],
        ["When the full-scale invasion began on 24 February 2022, my family moved into its basement. Carpets came off the floors and onto the cellar walls. Heaters, blankets and whatever else could help went downstairs."],
        ["Five adults, a child and a cat lived there through the first months of the occupation."],
        ["During that time, I kept everything without really deciding to: ", { mark: "Telegram messages, voice notes, video circles and photographs" }, ". Sending them was how we knew everyone was still alive."],
        ["Two years later, I realised that this accidental archive was the most complete record I had of what happened to my family and the house."],
        ["By then, the project had become personal in another way."],
        ["Losing the house meant losing a physical connection shared by several generations of my family. War doesn’t begin with one generation, and neither does the weight families carry from it. I became interested in transgenerational trauma – how fear, loss and displacement can continue through a family long after the original event."],
        ["I couldn’t change what had happened to the house. And I couldn’t keep holding on to it as if one day everything would simply return to what it had been."],
        ["Making Ukrainska 15 became my way of processing that loss."],
        ["I could preserve the messages, voices, photographs and memories without trying to preserve the house itself. I could give the story a place to exist – and, in doing so, begin to let the physical place go."],
        ["That changed what I wanted the project to be."],
        ["I didn’t want to build a memorial page."],
        [{ mark: "I wanted someone who had never met us to enter the story, understand what happened, and stay with it until the end." }],
      ],
    },

    {
      kind: "prose",
      n: "02",
      heading: "Turning a personal archive into an experience",
      rule: true,
      body: [
        ["Once I decided to make the project, the problem changed."],
        ["I wasn’t designing only for myself anymore."],
        ["I had two years of Telegram messages, voice notes, photographs and videos – hundreds of fragments that made sense to my family because we had lived through them."],
        ["For everyone else, they were just fragments."],
        ["The challenge was to turn that private archive into a story a stranger could understand without flattening it into a news article, a historical timeline or a memorial page."],
        ["I needed to give people enough context to follow what happened, while keeping the original material – the messages, voices and photographs – at the centre."],
        ["And there was another constraint: the story was already emotionally heavy."],
        ["The interface couldn’t make it heavier."],
        ["That became the design problem:"],
        [{ pen: "How do I turn hundreds of deeply personal fragments into a coherent experience – without losing what made them personal in the first place?" }],
      ],
    },

    {
      kind: "prose",
      n: "03",
      heading: "An archive that was never meant to be read",
      rule: true,
      body: [
        ["There was no research phase in the usual sense."],
        ["The material was already in my phone."],
        ["Two years of Telegram threads. Voice messages recorded from the basement. Video circles filmed while driving into the fields to find a mobile signal. Photos taken after shelling. Photos of ordinary things that survived."],
        ["None of it had been created for an audience."],
        ["That became both the value of the archive and the difficulty of working with it."],
        ["The messages were fragmented, repetitive and deeply contextual. A few words could mean everything to us and almost nothing to someone outside the family."],
        ["I started by putting the material into chronological order and looking for the minimum context a stranger would need to understand each moment."],
        ["I also made one decision early: ", { mark: "the original messages would stay original" }, "."],
        ["I kept the language, typos and phrasing as they were sent. The narration is in Ukrainian; some family conversations remain in Russian because that is how my family wrote them at the time."],
        ["Cleaning them up would have made the experience neater."],
        ["It would also have made the archive less real."],
      ],
    },

    {
      kind: "pile",
      title: "The pile",
      count: "4 items – none of them made for this",
      help: "Push them around – or focus one and use the arrow keys",
      items: [
        { src: "/artefacts/ukrainska-15/photo-01.jpg", kind: "Photograph",
          alt: "The back door of the house, its green paint blistered, the brick frame rusted and the roof sheeting torn.",
          caption: ["The back door of the house, photographed on the first visit after the family got back in."] },
        { src: "/artefacts/ukrainska-15/photo-02.jpg", kind: "Photograph",
          alt: "A window with its glass blown in – shards across the sill and the cast-iron radiator below, the lace curtain torn, bare trees through the frame.",
          caption: ["A window blown in – the glass across the sill and the radiator beneath it."] },
        { src: "/artefacts/ukrainska-15/photo-03.jpg", kind: "Photograph",
          alt: "A furnished room in disarray beneath a crystal chandelier, belongings across the floor, the window behind blocked by a collapsed wall.",
          caption: ["The main room, everything shifted – the chandelier still up, the window behind it filled by the wall that came down."] },
        { src: "/artefacts/ukrainska-15/photo-04.jpg", kind: "Photograph",
          alt: "A windowsill of broken glass and toppled plant pots, looking onto a collapsed brick building outside where a small fire still burns.",
          caption: ["The view from the sill – broken glass, a knocked-over plant, and the building opposite still burning."] },
      ],
    },

    {
      kind: "prose",
      n: "04",
      heading: "Finding the structure",
      rule: true,
      body: [
        ["My first instinct was to organise the story into chapters: occupation, survival, liberation, destruction."],
        ["It made sense on paper."],
        ["But it didn’t feel like what we had lived through."],
        ["Those categories were something I could create afterwards, knowing how the story ended. At the time, we didn’t know what the next day – or even the next hour – would bring."],
        ["Then I went back to the messages."],
        [{ code: "05:00." }, "\n", { code: "05:45." }, "\n", { code: "06:05." }],
        ["Every fragment already had a place in the story."],
        [{ strong: "Time." }],
        ["The dates and timestamps became the information architecture of the experience. Instead of dividing the story into retrospective chapters, I let the visitor move through events in the same order my family did."],
        ["This gave me a rule I used throughout the project:"],
        [{ mark: "When the archive already contained a meaningful structure, I didn’t add another layer of UI on top of it." }],
      ],
    },

    {
      kind: "decisions",
      n: "05",
      heading: "Four decisions that shaped the experience",
      rule: true,
      items: [
        {
          label: "01",
          title: "The visitor has to open the door",
          body: [
            ["The first screen shows the house and a closed door."],
            ["Nothing starts automatically."],
            ["No audio. No animation carrying you forward. No story until the visitor chooses to open it."],
            [{ strong: "Why" }],
            ["Autoplay would have made the experience easier to enter, but it felt wrong for the subject."],
            ["I wanted one deliberate action between seeing the house and entering the family’s story."],
            ["Opening a door is also an interaction people understand without instructions. Here, that familiar action becomes part of the narrative itself."],
          ],
          tradeoff: [
            [{ strong: "Trade-off" }],
            ["Adding friction at the very beginning increases the chance that someone will leave."],
            ["I accepted that."],
            ["Not every point of friction is a UX problem. In this case, removing it would have made the experience easier, but weaker."],
          ],
        },
        {
          label: "02",
          title: "Time became the navigation",
          body: [
            ["Once chronology became the structure, conventional navigation started to feel unnecessary."],
            ["There are no chapters to choose from and no menu telling the visitor where to go next."],
            ["The story moves through dates, timestamps, messages, photographs and changes in place."],
            ["When geography becomes important, a map appears and stays with the reader."],
            ["When it stops being useful, it disappears."],
            ["The same principle applies throughout the experience: ", { mark: "UI exists only for as long as the story needs it." }],
          ],
          tradeoff: [
            [{ strong: "Trade-off" }],
            ["Chronological navigation is less efficient if someone wants to find a specific event."],
            ["But Ukrainska 15 isn’t a reference archive."],
            ["The primary task is to follow the story."],
            ["I chose narrative continuity over information-retrieval efficiency."],
          ],
        },
        {
          label: "03",
          title: "One colour, one meaning",
          body: [
            ["Almost everything in the experience is black and white."],
            ["There is one exception."],
            [{ strong: "Red." }],
            ["The colour comes from the enamel number plate on the house: 15."],
            ["I used the same red throughout the experience to connect moments of loss and memory back to the house."],
            ["Instead of creating a larger colour system, I gave one colour one job."],
            ["Its meaning comes from repetition rather than decoration."],
            ["The real plate is still hanging on the gate."],
          ],
        },
        {
          label: "04",
          title: "Editing was part of the design",
          body: [
            ["The archive contains much more than the website does."],
            ["Some messages repeated what was already understood. Some photographs were too personal. Some details added emotional weight without adding meaning."],
            ["Choosing what not to show became one of the hardest parts of the project."],
            ["I treated editing as a UX problem."],
            ["Every additional fragment adds context, but it also adds cognitive and emotional load. More evidence doesn’t automatically create more understanding."],
            ["So I kept asking one question:"],
            [{ pen: "Does the visitor need this to understand what happens next?" }],
            ["If the answer was no, I considered removing it."],
            ["The version that shows everything is the version nobody finishes."],
            ["And a story nobody finishes hasn’t really been preserved – it has only been uploaded."],
          ],
        },
      ],
    },

    {
      kind: "marker",
      ghost:
        "The archive contains much more than the website does. Some messages repeated what was already understood. Some photographs were too personal. Some details added emotional weight without adding meaning. Choosing what not to show became one of the hardest parts of the project. I treated editing as a UX problem. Every additional fragment adds context, but it also adds cognitive and emotional load. More evidence doesn’t automatically create more understanding.",
      lines: [
        ["The version that shows"],
        ["everything is the version"],
        [{ strong: "nobody finishes." }],
      ],
    },

    {
      kind: "prose",
      n: "06",
      heading: "Designing the emotional pace",
      rule: true,
      body: [
        ["The material was already heavy. The interface didn’t need to make it feel heavier."],
        ["I didn’t want dramatic transitions telling people when something was important. I didn’t want a soundtrack telling them when to feel sad. And I didn’t want motion simply because the web allowed me to add it."],
        ["Instead, I worked with pacing."],
        ["A message appears."],
        ["Then another."],
        ["A photograph interrupts the conversation."],
        ["A map stays on screen while the family moves."],
        ["A voice note asks the visitor to stop reading and listen."],
        ["Some sections move quickly. Others deliberately slow down."],
        ["Silence and empty space became part of the interface too."],
        ["Motion wasn’t decoration. It controlled attention and helped establish rhythm."],
        [{ mark: "The quieter the interface became, the more space the original material had." }],
      ],
    },

    {
      kind: "prose",
      n: "07",
      heading: "Making digital evidence feel human",
      rule: true,
      body: [
        ["Telegram was central to the story because that is where much of it actually happened."],
        ["But reproducing Telegram literally would have turned the project into an imitation of an app."],
        ["I wasn’t interested in recreating its interface."],
        ["I wanted to preserve the feeling of receiving those messages."],
        ["So I kept what mattered – sequence, sender, timestamps, voice, pauses – and removed most of the surrounding UI."],
        ["The same approach shaped photographs, audio and maps."],
        ["I wasn’t trying to reproduce the tools that captured the archive."],
        [{ mark: "I was trying to preserve what it felt like to receive it." }],
      ],
    },

    {
      kind: "prose",
      n: "08",
      heading: "Designing for different ways of experiencing the story",
      rule: true,
      body: [
        ["A narrative website can easily assume that everyone will experience it exactly as designed: with motion enabled, sound on, a large screen and enough time to stay until the end."],
        ["I couldn’t make those assumptions."],
        ["Motion respects reduced-motion preferences. Audio isn’t the only carrier of information. Typography and contrast remain clear against the restrained visual system, and interaction states don’t rely on animation alone."],
        ["These weren’t features added after the experience was finished."],
        ["They affected how I designed it from the beginning."],
        ["Accessibility became another useful constraint: ", { mark: "if removing an effect also removed meaning, too much meaning had been placed in the effect." }],
      ],
    },

    {
      kind: "prose",
      n: "09",
      heading: "Designing in the browser",
      rule: true,
      body: [
        ["Ukrainska 15 started in Figma, but fairly quickly I realised that static screens weren’t enough."],
        ["The timing of a message, the speed of a transition, how long a photograph stays visible or when a map leaves the screen are all part of the design."],
        ["They only really exist when you experience them."],
        ["So I designed and built the site myself, pair-coding the front end with an AI assistant."],
        ["That changed the process."],
        ["Instead of finishing the design and then translating it into code, I moved between the two."],
        ["Some interactions changed once I felt them in the browser."],
        ["Some animations became simpler."],
        ["Some disappeared completely."],
        ["And parts of the story were edited again once I could experience their real pacing."],
        [{ mark: "The browser became part of the design process" }, " rather than just the place where the final design was implemented."],
        [{ code: "HTML · CSS · JavaScript · GSAP · ScrollTrigger · Netlify" }],
      ],
    },

    {
      kind: "prose",
      n: "10",
      heading: "Performance is part of storytelling",
      rule: true,
      body: [
        ["The site contains photographs, audio, animation and long-form content."],
        ["That can become heavy very quickly."],
        ["And for this project, performance wasn’t only a technical metric."],
        ["If a photograph arrives after the moment it belongs to, the story pauses for the wrong reason."],
        ["If an animation stutters, attention moves from the story to the interface."],
        ["If loading becomes frustrating, someone leaves."],
        ["So media formats, loading behaviour and animation performance became part of the design work."],
        ["The goal wasn’t to make the site technically impressive."],
        [{ mark: "It was to make the technology disappear while the story was being told." }],
      ],
    },

    {
      kind: "prose",
      n: "11",
      heading: "What I deliberately didn’t build",
      rule: true,
      body: [
        ["There is no account."],
        ["No personalisation."],
        ["No recommendation system."],
        ["No social mechanics."],
        ["No complex navigation."],
        ["No CMS."],
        ["Independent projects make it very easy to keep adding things because nobody is there to say no."],
        ["So I gave myself a constraint:"],
        [{ mark: "Build only what the story needs." }],
        ["For this project, restraint wasn’t just a visual decision."],
        ["It was the product strategy."],
      ],
    },

    {
      kind: "prose",
      n: "12",
      heading: "The outcome",
      rule: true,
      awards: true,
      body: [
        ["I made Ukrainska 15 independently – without a client, a product team or an existing brief."],
        ["The project went on to receive international recognition across UX, UI, innovation and digital storytelling, including ", { mark: "two MUSE Gold awards and four CSS Design Awards" }, "."],
        ["It was also featured in international media and design publications."],
        ["For me, the recognition mattered for two reasons."],
        ["Personally, it meant that something created from a very private family experience could resonate with people who had never met us."],
        ["Professionally, it showed that a digital experience could hold attention through restraint, original material and narrative structure rather than conventional engagement mechanics."],
      ],
    },

    {
      kind: "prose",
      n: "13",
      heading: "The decision I would change",
      rule: true,
      body: [
        ["I launched Ukrainska 15 without analytics."],
        ["At the time, measuring people inside such a personal story felt wrong."],
        ["I didn’t want something so closely connected to my family to turn into another dashboard of page views, sessions and engagement rates."],
        ["Looking back, I think I confused analytics with optimisation."],
        ["I didn’t need to know who the visitors were."],
        ["But privacy-first anonymous measurement could have answered the question that actually mattered:"],
        [{ pen: "Did people reach the end?" }],
        ["Completion rate, drop-off points and interaction with optional media could have shown me where the narrative worked and where I was asking too much from the visitor."],
        ["If I were building the project today, I would include that from the beginning."],
        ["Not to optimise the story for clicks."],
        ["To understand whether the design was helping people stay with it."],
      ],
    },

    {
      kind: "prose",
      n: "14",
      heading: "What the project changed for me",
      rule: true,
      body: [
        ["Most of my professional work deals with complexity: workflows, roles, states, permissions, data and information architecture."],
        ["Ukrainska 15 was complex in a completely different way."],
        ["The problem wasn’t that there wasn’t enough information."],
        ["There was too much."],
        ["The work was deciding what deserved attention, what could disappear, and when the interface should stop trying to help."],
        ["That lesson followed me back into product design."],
        ["Complex systems don’t always become clearer when we add more UI."],
        [{ mark: "Sometimes the hardest design decision is knowing what not to design." }],
        ["And personally, the project did something I hadn’t expected from a website."],
        ["For a long time, preserving the house and preserving the memory of it felt like the same thing."],
        ["They aren’t."],
        ["The house can disappear. The messages, voices, photographs and stories don’t have to disappear with it."],
        ["Putting them into one place didn’t bring my home back."],
        ["But it gave me a way to stop waiting for it to come back."],
      ],
    },
  ],

  closing: {
    line: "A house can disappear. Its address doesn’t have to.",
    cta: { label: "View the experience →", href: "https://ukrainska15.com" },
  },
};

export default ukrainska15;
