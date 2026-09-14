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
  accents?: string[]; // several actions played in turn (e.g. eat → read → tea)
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
  // Workday shifts (Day edition split up). Deep work (10–13) keeps the `office` set.
  work_standup: {
    loop: "work_standup_loop.mp4",
    accent: "work_standup_sip.mp4",
    poster: "work_standup_poster.jpg",
    accentEveryMs: 45_000,
  },
  mon_standup: {
    loop: "mon_standup_loop.mp4",
    accent: "mon_standup_yawn.mp4",
    poster: "mon_standup_poster.jpg",
    accentEveryMs: 40_000,
  },
  work_calls: {
    loop: "work_calls_loop.mp4",
    accent: "work_calls_point.mp4",
    poster: "work_calls_poster.jpg",
    accentEveryMs: 45_000,
  },
  fri_wine: {
    loop: "fri_wine_loop.mp4",
    accent: "fri_wine_sip.mp4",
    poster: "fri_wine_poster.jpg",
    accentEveryMs: 40_000,
  },
  fri_transition: {
    intro: "fri_transition_intro.mp4",   // shuts the laptop, hoodie + raincoat on — plays once
    loop: "fri_transition_loop.mp4",
    poster: "fri_transition_poster.jpg",
  },
  work_lunch: {
    loop: "work_lunch_loop.mp4",
    accent: "work_lunch_eat.mp4",
    poster: "work_lunch_poster.jpg",
    accentEveryMs: 45_000,
  },
  work_wrapup: {
    loop: "work_wrapup_loop.mp4",
    accent: "work_wrapup_think.mp4",
    poster: "work_wrapup_poster.jpg",
    accentEveryMs: 45_000,
  },
  weekend_brunch: {
    loop: "wknd_brunch_loop.mp4",
    accents: ["wknd_brunch_eat.mp4", "wknd_brunch_read.mp4", "wknd_brunch_tea.mp4"],
    poster: "wknd_brunch_poster.jpg",
    accentEveryMs: 5_000, // keep her busy — eat → read → tea in quick succession
  },
  weekend_cleaning: {
    loop: "wknd_clean_loop.mp4",
    accents: ["wknd_clean_spray.mp4", "wknd_clean_wring.mp4"],
    poster: "wknd_clean_poster.jpg",
    accentEveryMs: 7_000,
  },
  weekend_series: {
    loop: "wknd_series_loop.mp4",
    accents: ["wknd_series_popcorn.mp4", "wknd_series_laugh.mp4", "wknd_series_cosy.mp4"],
    poster: "wknd_series_poster.jpg",
    accentEveryMs: 6_000,
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
  const accentList = set?.accents ?? (set?.accent ? [set.accent] : []);
  const [phase, setPhase] = useState<Phase>(
    set?.intro && !introSeen[edition] ? "intro" : "loop"
  );
  const [accentIdx, setAccentIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleEnded = () => {
    if (phase === "intro") introSeen[edition] = true;
    if (phase === "accent") setAccentIdx((i) => i + 1); // advance to next action
    if (phase !== "loop") setPhase("loop");
  };

  useEffect(() => {
    if (phase !== "loop" || accentList.length === 0) return;
    const id = window.setTimeout(() => setPhase("accent"), set?.accentEveryMs ?? 120_000);
    return () => window.clearTimeout(id);
  }, [phase, edition, set, accentList.length]);

  if (!set) return null;

  const file =
    phase === "intro" && set.intro ? set.intro
    : phase === "accent" && accentList.length ? accentList[accentIdx % accentList.length]
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
