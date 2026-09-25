"use client";

/**
 * The case lights, turned down while she sleeps.
 *
 * The recessed spotlight at the top of the arch is painted into the suitcase
 * and into every clip, so it cannot be switched off — it is burning over the
 * Deep Night edition at full strength while she is asleep under a blanket.
 * This lays a warm darkness over the niche instead, shaped like the light it
 * is cancelling: hardest on the bulb itself, then down the cone, then a thin
 * wash over the rest. Multiply, so the mahogany goes deeper rather than grey.
 *
 * Measured off open2.png, not guessed: the brightest pixel in the top third of
 * the niche — the bulb — sits at 48.7% across and 6.4% down the niche crop.
 */

/** How far down the lamp goes, per edition. 1 is the full turn-down.
 *
 *  Deep Night is the one where she is actually asleep. The alarm editions get
 *  less of it: she is awake at 07:00, rubbing one eye at a phone, and a room
 *  that dark would read as the middle of the night rather than the start of a
 *  bad morning. Everything else is left lit. */
const DIM: Record<string, number> = {
  night: 1,
  morn_alarm: 0.38,
  mon_alarm: 0.38,
};

// The niche's rect inside the suitcase image, and the clip aspect that gives
// it its height — both from NicheDoll, which drops its video on the same box.
const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;
const CLIP_ASPECT = "648 / 1664";

export default function NicheLight({ edition }: { edition: string }) {
  const dim = DIM[edition] ?? 0;

  return (
    <>
    {/* The rest of the case. The lamp in the arch is the only light the trunk
        has; switching it off and leaving the shelves, the rail and the coats
        as bright as noon read as a lamp turned off in a lit room — she slept
        in a dark recess inside a case that was still open for business.
        Masked with the suitcase's own alpha rather than laid down as a
        rectangle: the studio sweep behind it is far wider than this box, so a
        rectangle would cut a visible dark edge across the floor. Lighter than
        the niche gets, because the doors face the room while the recess only
        ever had the bulb. */}
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        mixBlendMode: "multiply",
        opacity: dim * 0.72,
        transition: "opacity 0.9s ease",
        background: "linear-gradient(to bottom, rgba(20,12,7,0.62), rgba(20,12,7,0.52) 60%, rgba(20,12,7,0.48))",
        WebkitMaskImage: "var(--case-plate)",   // the case's own picture: see globals.css
        maskImage: "var(--case-plate)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />

    <div
      aria-hidden
      style={{
        position: "absolute",
        ...RECT,
        aspectRatio: CLIP_ASPECT,
        zIndex: 6, // over the clip, the chalk, and the case-wide layer above
        pointerEvents: "none",
        mixBlendMode: "multiply",
        opacity: dim,
        transition: "opacity 0.9s ease",
        background: [
          // the bulb
          "radial-gradient(ellipse 24% 4.5% at 48.7% 6.2%, rgba(26,14,7,0.88), rgba(26,14,7,0) 72%)",
          // the cone it throws down the back wall
          "radial-gradient(ellipse 52% 40% at 49% 3%, rgba(26,15,8,0.55), rgba(26,15,8,0) 74%)",
          // and the room itself. Killing the bulb and its cone alone left the
          // alcove around her as bright as it is at noon — a lamp switched off
          // in a lit room. With nothing burning above her the whole recess has
          // to fall to what little light reaches in from the page, so this
          // carries most of the weight and barely lifts towards the floor.
          "linear-gradient(to bottom, rgba(20,12,7,0.56), rgba(20,12,7,0.47) 55%, rgba(20,12,7,0.42))",
        ].join(", "),
      }}
    />
    </>
  );
}
