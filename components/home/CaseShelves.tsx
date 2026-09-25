import InkTip from "@/components/InkTip";

/** The still things on the case's left side: the Figma sticker on the top
 *  drawer, the shelf lips, the books and the tapes. Nothing here changes with
 *  the time of day, so it is rendered on the server and handed to home's
 *  scene as it is (app/page.tsx). Percentages of the suitcase box. */
export default function CaseShelves() {
  return (
    <>
      {/* Figma sticker on the top drawer → Figma community profile */}
      <InkTip
        label="Figma"
        meta="@uxui_kazachkova"
        place="top"
        className="group"
        style={{ position: "absolute", left: "28.2%", top: "50.3%", width: "3.9%", height: "5.9%", zIndex: 4 }}
      >
        <a
          href="https://www.figma.com/@uxui_kazachkova"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Figma — @uxui_kazachkova"
          className="block w-full h-full"
          style={{ borderRadius: 9 }}
        >
          <span
            aria-hidden
            className="block w-full h-full rounded-lg warm-glow"
          />
        </a>
      </InkTip>

      {/* The top-left shelf's wooden front lip — Kate's own cut of the case,
          template-matched back onto it (corr 0.93) so it lands where it came
          from. It rides above whatever stands on the shelf (zIndex 3), so
          every item's base tucks behind the shelf. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/items/left-1-shelf-lip1.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: "10.254%",
          top: "26.953%",
          width: "14.29%",
          height: "auto",
          maxWidth: "none",
          zIndex: 3,
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* The middle shelf's front lip, same cut, same treatment. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/items/left-2-shelf-lip1.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: "10.221%",
          top: "42.529%",
          width: "14.323%",
          height: "auto",
          maxWidth: "none",
          zIndex: 3,
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* The left door's top shelf: books where the box sets used to stand,
          in two stacks with the TARDIS between them. Both are set by their
          BASE, not their top — the shelf board is at 28.3% and the spines
          are different heights, so a shared `top` would leave one of them
          floating. Their bottoms run a little past the board, under the
          shelf lip above them (zIndex 3). They carry no label: the shelf is
          a thing to notice, not a list to read. */}
      <div
        className="group"
        style={{ position: "absolute", left: "10.25%", top: "14.45%", width: "5.5%", zIndex: 2 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-1-books-a.webp"
          alt="Books standing on a shelf: Sapiens, IT and Animal Farm"
          className="w-full h-auto warm"
          style={{ "--rest": "brightness(0.9) saturate(0.95) drop-shadow(0 4px 5px rgba(0,0,0,0.45))" } as React.CSSProperties}
          draggable={false}
        />
      </div>

      <div
        className="group"
        style={{ position: "absolute", left: "18.9%", top: "14.9%", width: "5%", zIndex: 2 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-1-books-b.webp"
          alt="Books standing on a shelf: W.I.T.C.H. volumes one to three and The Little Prince"
          className="w-full h-auto warm"
          style={{ "--rest": "brightness(0.9) saturate(0.95) drop-shadow(0 4px 5px rgba(0,0,0,0.45))" } as React.CSSProperties}
          draggable={false}
        />
      </div>

      {/* Left door — middle shelf: the VHS tapes. The row is the width of
          the shelf, like the box sets above it, and its base runs under the
          shelf's front lip (zIndex 3) so the tapes stand on the board rather
          than in front of it. */}
      <div
        className="group"
        style={{ position: "absolute", left: "10.24%", top: "31.54%", width: "13.6%", zIndex: 2 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-2-vhs.webp"
          alt="A shelf of VHS tapes: The 10th Kingdom, Are You Afraid of the Dark?, Goosebumps, Harry Potter, The Lord of the Rings, The X-Files, Supernatural, Jumanji, IT, The Silence of the Lambs, The Princess Bride, Stargate"
          className="w-full h-auto warm"
          style={{ "--rest": "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" } as React.CSSProperties}
          draggable={false}
        />
      </div>
    </>
  );
}
