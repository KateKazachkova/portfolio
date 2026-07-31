"use client";

import { useEffect, useState } from "react";

/**
 * Evening edition — the doll sits in the niche and reads.
 * These clips are OPAQUE (rendered on the real niche background, no chroma key)
 * and all share ONE framing. The clip is laid full-frame over the suitcase so its
 * niche coincides with the painted niche, then clipped to the niche arch — only the
 * doll + niche interior show; the drawers, rail and dark edges come from the static
 * image underneath. Because the clip's niche and the painted niche coincide, the
 * arch edge lands on matching wood and reads as seamless.
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

// Full-frame placement in the suitcase container that lands the clip's niche on the
// painted niche (derived by overlaying the clip on /suitcase/open.png).
const FILL = {
  position: "absolute",
  left: "32.9%",
  top: "6.6%",
  width: "33.6%",
  maxWidth: "none", // Tailwind Preflight's img,video{max-width:100%} would clamp this
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
    <>
      {/* Arch-shaped reveal over the niche, in the container's 0–1 coordinate box. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id="eveningNiche" clipPathUnits="objectBoundingBox">
            <path d="M .400 .765 L .400 .225 Q .400 .110 .489 .110 Q .573 .110 .573 .225 L .573 .765 Z" />
          </clipPath>
        </defs>
      </svg>
      <div
        aria-label="Evening edition — reading in the niche"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          clipPath: "url(#eveningNiche)",
          WebkitClipPath: "url(#eveningNiche)",
        }}
      >
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
    </>
  );
}
