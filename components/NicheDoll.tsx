"use client";

import { useEffect, useState } from "react";

/**
 * The doll living in the suitcase niche, per time-of-day edition.
 *
 * Every clip is generated straight into a crop of the real niche (openpart.png),
 * so it is OPAQUE and drops onto the niche region 1:1 — no masking, no fitting.
 * The rect below is that crop's exact position inside the suitcase image
 * (template-matched, corr 0.997); it lines up on open.png and open2.png.
 *
 * Per edition: an optional one-off `intro`, a seamless `loop`, and an optional
 * `accent` that fires every couple of minutes. All clips for an edition share
 * the same in/out frame so the cuts are seamless. A poster (the loop's first
 * frame) covers the load gap and non-autoplay fallbacks.
 */
const V = "/dolls/video/";

const NICHE = {
  position: "absolute",
  left: "40.62%",
  top: "11.43%",
  width: "18.16%",
  height: "auto",
  maxWidth: "none",
  display: "block",
} as const;

type ClipSet = {
  intro?: string;
  loop: string;
  accent?: string;
  poster: string;
  accentEveryMs?: number;
};

const CLIPS: Record<string, ClipSet> = {
  morning: {
    loop: "morning_loop.mp4",
    accent: "morning_coffee.mp4",
    poster: "morning_poster.jpg",
    accentEveryMs: 120_000,
  },
  office: {
    loop: "office_loop.mp4",
    accent: "office_accent.mp4",
    poster: "office_poster.jpg",
    accentEveryMs: 120_000,
  },
  street: {
    loop: "street_loop.mp4",
    accent: "street_accent.mp4",
    poster: "street_poster.jpg",
    accentEveryMs: 120_000,
  },
  night: {
    loop: "night_loop.mp4",
    accent: "night_accent.mp4",
    poster: "night_poster.jpg",
    accentEveryMs: 120_000,
  },
  evening: {
    intro: "evening_intro.mp4",
    loop: "evening_read.mp4",
    accent: "evening_tea_sip.mp4",
    poster: "niche_poster.jpg",
    accentEveryMs: 120_000,
  },
};

export function hasNicheClip(edition: string) {
  return edition in CLIPS;
}

// intro-seen per edition, persists across edition toggles within a page session.
const introSeen: Record<string, boolean> = {};

type Phase = "intro" | "loop" | "accent";

export default function NicheDoll({ edition }: { edition: string }) {
  const set = CLIPS[edition];
  const [phase, setPhase] = useState<Phase>(
    set?.intro && !introSeen[edition] ? "intro" : "loop"
  );
  const [failed, setFailed] = useState(false);

  const handleEnded = () => {
    if (phase === "intro") introSeen[edition] = true;
    if (phase !== "loop") setPhase("loop");
  };

  useEffect(() => {
    if (phase !== "loop" || !set?.accent) return;
    const id = window.setTimeout(() => setPhase("accent"), set.accentEveryMs ?? 120_000);
    return () => window.clearTimeout(id);
  }, [phase, edition, set]);

  if (!set) return null;

  const file =
    phase === "intro" && set.intro ? set.intro
    : phase === "accent" && set.accent ? set.accent
    : set.loop;
  const poster = V + set.poster;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={`${edition} edition — in the niche`} style={{ ...NICHE, zIndex: 2 }} draggable={false} />
      {!failed && (
        <video
          key={file}
          src={V + file}
          autoPlay
          muted
          playsInline
          loop={phase === "loop"}
          poster={poster}
          onEnded={handleEnded}
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 3 }}
        />
      )}
    </>
  );
}
