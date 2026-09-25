import InkTip from "@/components/InkTip";

/** The still things in the case's middle and right: the bike on the wall with
 *  its shadows, and the field kit — the wheel, the pads, the Converse.
 *  Rendered on the server like CaseShelves. Percentages of the suitcase box. */
export default function CaseKit() {
  return (
    <>
      {/* The bike's own shadow on the back wall: the same picture again,
          offset down and to the right of the light, flattened to black and
          blurred. A drop-shadow filter could not do this — it would follow
          the bike wherever it went, and a shadow on a wall does not. */}
      <div
        aria-hidden
        style={{ position: "absolute", left: "57.9%", top: "18.5%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4, pointerEvents: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-bike.webp"
          alt=""
          className="w-full h-auto"
          style={{ filter: "brightness(0) blur(4px)", opacity: 0.5 }}
          draggable={false}
        />
      </div>

      {/* A second pass, displaced almost straight down. The wide one slides
          along the bars — they run down and to the right, the same way the
          light throws the shadow, so it hides behind them — and the bike
          loses its shadow exactly where it meets the wood. */}
      <div
        aria-hidden
        style={{ position: "absolute", left: "56.8%", top: "19.3%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4, pointerEvents: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-bike.webp"
          alt=""
          className="w-full h-auto"
          style={{ filter: "brightness(0) blur(2px)", opacity: 0.45 }}
          draggable={false}
        />
      </div>

      {/* Right compartment, above the poster: the bicycle hung on the wall. */}
      <div
        className="group"
        style={{ position: "absolute", left: "56.48%", top: "17.16%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-bike.webp"
          alt="A miniature gravel bike hung by its front wheel in the niche"
          className="w-full h-auto warm"
          // Colour is baked into the file now, so only the shadow is left.
          style={{ "--rest": "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" } as React.CSSProperties}
          draggable={false}
        />
      </div>

      {/* Where the wheel meets the floor: a contact shadow, dense under the
          tyre and gone within a few pixels, because that is the only part of
          it actually touching the boards. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "59.6%",
          top: "78.4%",
          width: "13%",
          height: "3.2%",
          background: "radial-gradient(ellipse at center, rgba(14,9,5,0.5), rgba(14,9,5,0) 72%)",
          filter: "blur(4px)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "62.4%",
          top: "79.3%",
          width: "7.4%",
          height: "1.7%",
          background: "radial-gradient(ellipse at center, rgba(8,5,2,0.78), rgba(8,5,2,0) 62%)",
          filter: "blur(1.5px)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* The other way she gets around, parked on the compartment floor
          under the hung bike — the bike hangs, the wheel stands. Colour is
          baked into the file like the bike's, so only the shadow is left. */}
      <InkTip
        label="Field kit"
        meta="The wheel"
        place="bottom"
        focusable
        className="group"
        style={{ position: "absolute", left: "60.5%", top: "56.4%", width: "11.1%", zIndex: 4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-mono.webp"
          alt="A miniature electric unicycle parked on the compartment floor under the bike"
          className="w-full h-auto warm"
          style={{ "--rest": "drop-shadow(0 5px 7px rgba(0,0,0,0.42))" } as React.CSSProperties}
          draggable={false}
        />
      </InkTip>

      {/* Beside them, the armour that goes on before the wheel does: knee and
          elbow pads stacked at the front of the shelf, overlapping the shoes
          the way a pile of kit dumped on a shelf overlaps whatever is behind
          it. Same baked colour and shadow as the rest of the compartment. */}
      <InkTip
        label="Field kit"
        meta="The armour"
        place="bottom"
        focusable
        className="group"
        style={{ position: "absolute", left: "78.96%", top: "70.6%", width: "10.8%", zIndex: 6 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-pads.webp"
          alt="A set of miniature knee and elbow pads stacked on the wardrobe's bottom shelf"
          className="w-full h-auto warm"
          // Cut at the wardrobe's side wall: the case is a photograph, so
          // nothing can pass behind it by z-index — the pile is clipped where
          // the wall stands, which reads as pushed into the corner.
          style={{ "--rest": "drop-shadow(0 4px 5px rgba(0,0,0,0.42))", clipPath: "inset(0 9% 0 0)" } as React.CSSProperties}
          draggable={false}
        />
      </InkTip>

      {/* The Converse she rides in, paired on the wardrobe's bottom shelf
          under the folded blankets — the floor below the bike is the wheel's
          now, and shoes on a shelf read as put away rather than dropped. */}
      <InkTip
        label="Field kit"
        meta="The Converse"
        place="bottom"
        focusable
        className="group"
        style={{ position: "absolute", left: "75.1%", top: "72.96%", width: "8.1%", zIndex: 5 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-bike-shoes.webp"
          alt="A pair of black canvas high-top sneakers on the wardrobe's bottom shelf"
          className="w-full h-auto warm"
          style={{ "--rest": "drop-shadow(0 4px 5px rgba(0,0,0,0.4))" } as React.CSSProperties}
          draggable={false}
        />
      </InkTip>
    </>
  );
}
