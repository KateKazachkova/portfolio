"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";

/** Where the box can be, in the suitcase box's own percentages. It starts on
 *  the top-left shelf (home, which alone has the shelf lip laid over its base)
 *  and, each time it is charged, jumps to the next — the wardrobe by the folded
 *  throws, the case lid, the foot of the left door — and round again. */
const TARDIS_SPOTS: { left: number; top: number; width: number; home?: boolean; behind?: boolean; z?: number }[] = [
  { left: 14.9, top: 17.3, width: 5.1, home: true },
  // Beside the folded throws: the stack is drawn at zIndex 4, so the box needs
  // to sit above it or it lands behind the fleece.
  { left: 84.18, top: 58.0, width: 5.1, z: 5 },
  { left: 56.88, top: 1.0, width: 4.4, behind: true },
  // The foot of the left door, tucked into the corner left of the guitar
  // a touch smaller: the corner is narrower than the box, and it must clear the body
  { left: 10.25, top: 78.56, width: 4.8 },
];

const nextSpot = (i: number) => {
  let n = i;
  while (n === i) n = Math.floor(Math.random() * TARDIS_SPOTS.length);
  return n;
};

/** The model police box. Pointing at it (or pressing it, from the keyboard)
 *  lights a blue glow and the box pulses in and out of transparency, then it
 *  fades away to nothing and rematerialises at the next spot on the list —
 *  round and round. With reduced motion it simply is somewhere else. */
export default function Tardis() {
  const [phase, setPhase] = useState<"idle" | "charging" | "gone" | "returning">("idle");
  const [spot, setSpot] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function trigger() {
    if (phase !== "idle") return;
    if (prefersReducedMotion()) {
      setSpot(nextSpot);
      return;
    }
    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    setPhase("charging");
    push(() => setPhase("gone"), 1200);
    push(() => { setSpot(nextSpot); setPhase("returning"); }, 2100);
    push(() => setPhase("idle"), 2900);
  }

  const s = TARDIS_SPOTS[spot];
  const base = "brightness(0.94) drop-shadow(0 5px 6px rgba(0,0,0,0.38))";
  const imgStyle: React.CSSProperties =
    phase === "charging"
      ? { animation: "tardis-charge 1.2s ease-in-out forwards" }
      : phase === "gone"
        ? { opacity: 0, filter: "brightness(1.3) drop-shadow(0 0 14px rgba(130,190,255,0.9))", transition: "opacity 0.9s ease-in, filter 0.9s ease-in" }
        : phase === "returning"
          ? { opacity: 1, filter: base, transition: "opacity 0.8s ease-out, filter 0.8s ease-out" }
          : { opacity: 1, filter: base };
  const glowOpacity = phase === "charging" ? 0.9 : phase === "gone" ? 0.6 : 0;

  return (
    <>
      <div style={{ position: "absolute", left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, zIndex: s.behind ? 0 : (s.z ?? 2) }}>
        <div className="relative w-full">
          {/* The blue glow behind the box, brightening as it charges and
              lingering a beat after it has gone. Screen blend adds light only. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "-50% -70%",
              background:
                "radial-gradient(ellipse at 50% 52%, rgba(150,205,255,0.95), rgba(95,155,255,0.4) 42%, rgba(95,155,255,0) 70%)",
              opacity: glowOpacity,
              transition: "opacity 0.5s ease",
              mixBlendMode: "screen",
              pointerEvents: "none",
              // On the shelf the glow must not spill into the compartment
              // below — clip it at the box's base so no light bleeds through.
              clipPath: s.home ? "inset(0 0 23% 0)" : undefined,
              zIndex: 0,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/left-1-tardis.sm.webp"
            alt=""
            className="block w-full h-auto relative"
            style={{ ...imgStyle, zIndex: 1 }}
            draggable={false}
          />
        </div>
      </div>
      {/* Hover catcher — a transparent hit area over the box, always on top
          (zIndex 5) so the charge fires even at the spots where the box itself
          sits behind the case and cannot receive the pointer. Matches the
          model's footprint via its aspect ratio. A button, so the keyboard
          can send it off too. */}
      <button
        type="button"
        aria-label="A model police box — send it somewhere else in the case"
        className="scene-hit"
        onMouseEnter={trigger}
        onClick={trigger}
        style={{
          position: "absolute",
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: `${s.width}%`,
          aspectRatio: "0.664",
          zIndex: 5,
        }}
      />
    </>
  );
}
