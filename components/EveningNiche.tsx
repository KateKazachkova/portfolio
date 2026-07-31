"use client";

import { useEffect, useState } from "react";

/**
 * Evening edition — the doll sits in the niche and reads.
 * These clips are OPAQUE (rendered on the real niche background, no chroma key),
 * so they are clipped to the niche arch and everything around comes from the
 * static suitcase image underneath. All three share the exact same framing, so
 * they cut between each other seamlessly.
 *
 *   sit  → plays once: she stands, sits down cross-legged, opens the book
 *   loop → seamless idle reading (minimal movement)
 *   tea  → every ~2 min: she sips from the mushroom mug and sets it back down,
 *          returning to the exact reading pose so it splices back into the loop
 */
const SIT = "/dolls/video/evening_sit.mp4";
const LOOP = "/dolls/video/evening_read_loop.mp4";
const TEA = "/dolls/video/evening_tea.mp4";
const POSTER = "/dolls/video/evening_poster.jpg";

const TEA_EVERY_MS = 120_000; // sip tea roughly every two minutes

// Transform that seats the portrait clip's niche onto the suitcase niche.
const CLIP = {
  position: "absolute",
  left: "41.3%",
  top: "12%",
  width: "15.7%",
  height: "65%",
  overflow: "hidden",
  borderRadius: "48% 48% 3% 3% / 16% 16% 2% 2%",
  zIndex: 2,
} as const;

const FILL = {
  position: "absolute",
  width: "214%",
  left: "-53.5%",
  top: "-8.3%",
  height: "auto",
  display: "block",
} as const;

type Phase = "sit" | "loop" | "tea";

export default function EveningNiche() {
  const [phase, setPhase] = useState<Phase>("sit");
  const [failed, setFailed] = useState(false);

  const src = phase === "sit" ? SIT : phase === "tea" ? TEA : LOOP;

  // The transition and the tea accent both settle back into the idle loop.
  const handleEnded = () => {
    if (phase !== "loop") setPhase("loop");
  };

  // While looping, schedule the next tea sip.
  useEffect(() => {
    if (phase !== "loop") return;
    const id = window.setTimeout(() => setPhase("tea"), TEA_EVERY_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div style={CLIP} aria-label="Evening edition — reading in the niche">
      {/* Static reading pose behind the video: covers any load gap and is the
          fallback if the browser refuses to play the clip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={POSTER} alt="" aria-hidden style={{ ...FILL, zIndex: 0 }} draggable={false} />
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
          style={{ ...FILL, zIndex: 1 }}
        />
      )}
    </div>
  );
}
