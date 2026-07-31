"use client";

import { useEffect, useState } from "react";

/**
 * Evening edition — the doll lives in the niche.
 *
 * Every clip is generated straight into a crop of the real suitcase niche
 * (openpart.png), so it is OPAQUE and drops onto the niche region 1:1 — no
 * masking, no clip-path, no fitting. The rect below is that niche crop's exact
 * position inside the suitcase image (template-matched, corr 0.997), so it
 * lines up on both open.png and open2.png.
 *
 * Sequence (all clips share the seated reading pose as their in/out frame, so
 * the cuts are seamless):
 *   intro → plays once per session: she stands, sits down and opens the book
 *   loop  → seamless idle reading
 *   tea   → every ~2 min: she sips from the mushroom mug and settles back
 *
 * A poster (a reading frame) sits behind for the load gap and as the fallback
 * where the browser can't autoplay the video (e.g. reduced-motion / codec).
 */
const INTRO = "/dolls/video/evening_intro.mp4";
const LOOP = "/dolls/video/evening_read.mp4";
const TEA = "/dolls/video/evening_tea_sip.mp4";
const POSTER = "/dolls/video/niche_poster.jpg";

const TEA_EVERY_MS = 120_000; // sip tea roughly every two minutes

// Exact niche rect inside the suitcase container (matches openpart.png).
const NICHE = {
  position: "absolute",
  left: "40.62%",
  top: "11.43%",
  width: "18.16%",
  height: "auto",
  maxWidth: "none",
  display: "block",
} as const;

// Persists across edition toggles within a page session, so the sit-down intro
// only plays the first time Evening is shown.
let introSeen = false;

type Phase = "intro" | "loop" | "tea";

export default function EveningNiche() {
  const [phase, setPhase] = useState<Phase>(introSeen ? "loop" : "intro");
  const [failed, setFailed] = useState(false);

  const src = phase === "intro" ? INTRO : phase === "tea" ? TEA : LOOP;

  // The intro and the tea accent both settle back into the idle loop.
  const handleEnded = () => {
    if (phase === "intro") introSeen = true;
    if (phase !== "loop") setPhase("loop");
  };

  // While looping, schedule the next tea sip.
  useEffect(() => {
    if (phase !== "loop") return;
    const id = window.setTimeout(() => setPhase("tea"), TEA_EVERY_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER}
        alt="Evening edition — reading in the niche"
        style={{ ...NICHE, zIndex: 2 }}
        draggable={false}
      />
      {!failed && (
        <video
          key={src}
          src={src}
          autoPlay
          muted
          playsInline
          loop={phase === "loop"}
          poster={POSTER}
          onEnded={handleEnded}
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 3 }}
        />
      )}
    </>
  );
}
