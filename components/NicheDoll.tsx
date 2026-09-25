"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/reducedMotion";
import { EDITIONS } from "@/lib/time";

/**
 * The doll living in the suitcase niche, per time-of-day edition.
 *
 * Every clip is generated straight into a crop of the real niche (mid-niche-empty.png),
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
  // The case was re-exported a little wider after the clips were baked, so the
  // clip's own woodwork frame overran the real niche on the right by ~0.7% of
  // the box. Squeeze the clip horizontally back onto the real frame (its left
  // edge already lines up, so anchor there); vertical registration is untouched.
  transform: "scaleX(0.9614)",
  transformOrigin: "left top",
} as const;

type ClipSet = {
  intro?: string;
  loop: string;
  accent?: string;
  accents?: string[]; // several actions played in turn (e.g. eat → read → tea)
  poster: string;
  accentEveryMs?: number;
  still?: boolean; // show the poster only — clips not re-shot yet
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
  evening_guitar: {
    loop: "evening_guitar_loop.mp4",
    accent: "evening_guitar_stuck.mp4",
    poster: "evening_guitar_poster.jpg",
    accentEveryMs: 60_000,
  },
  evening: {
    // Re-shot 2026-09-23: the old clips were generated into a niche of their
    // own, so their wood never matched the case's. The intro belongs to the
    // retired doll and is gone with it.
    // New pose: back to the left wall, knees up, book on her knees.
    // evening_read / evening_page_turn are the retired cross-legged pose.
    loop: "evening_knees_loop.mp4",
    accent: "evening_knees_turn.mp4",
    poster: "evening_knees_poster.jpg",
    accentEveryMs: 120_000,
  },
  // Morning before work
  morn_alarm: {
    intro: "morn_alarm_wake.mp4",   // asleep → the phone goes off → she surfaces
    loop: "morn_alarm_loop.mp4",
    accent: "morn_alarm_snooze.mp4",
    poster: "morn_alarm_poster.jpg",
    accentEveryMs: 40_000,
  },
  mon_alarm: {
    intro: "morn_alarm_wake.mp4",
    loop: "morn_alarm_loop.mp4",
    accent: "mon_alarm_snooze2.mp4",
    poster: "morn_alarm_poster.jpg",
    accentEveryMs: 35_000,
  },
  // morn_ready hidden for now — its clip's frame doesn't register (seam on the
  // right); falls back to the static cutout until it's regenerated.
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
    accents: ["wknd_brunch_eat.mp4", "wknd_brunch_sip.mp4", "wknd_brunch_wake.mp4"],
    poster: "wknd_brunch_poster_v4.jpg",
    accentEveryMs: 5_000, // keep her busy — eat → sip → wake in quick succession
  },
  weekend_cleaning: {
    loop: "wknd_clean_loop.mp4",
    accents: ["wknd_clean_spray.mp4", "wknd_clean_wring.mp4"],
    poster: "wknd_clean_poster.jpg",
    accentEveryMs: 7_000,
  },
  weekend_series: {
    // Re-shot 2026-09-23 at the size of the other seated editions. She flinches
    // at the screen rather than laughing — the old laugh clip had her mouth
    // wide open, which read as a horse, not a doll.
    loop: "wknd_series_loop.mp4",
    accents: ["wknd_series_scare.mp4", "wknd_series_cosy.mp4"],
    poster: "wknd_series_poster.jpg",
    accentEveryMs: 6_000,
  },
};

export function hasNicheClip(edition: string) {
  return edition in CLIPS;
}

/** The first frame of an edition's loop. The curtain sequence warms this up
 *  while it is closing, so the niche has something to show the moment it
 *  parts instead of a frame of nothing while the clip is still fetching. */
export function nichePoster(edition: string) {
  const set = CLIPS[edition];
  return set ? V + set.poster : `/dolls/cut/web/${edition}.webp`;
}

// intro-seen per edition, persists across edition toggles within a page session.
const introSeen: Record<string, boolean> = {};

type Phase = "intro" | "loop" | "accent";

/** `ready`: the visitor's own hour is known. Until then the edition is only
 *  the server's placeholder, and its clip would be fetched for nothing.
 *
 *  Two <video>s stay mounted for the life of the edition: the loop, and one
 *  on top of it for the intro or the next accent, fetched while the loop
 *  plays. A cut is only a change of which one shows — nothing is remounted,
 *  so the poster never shows through between clips. An accent that falls due
 *  waits for the loop to come round to its first frame, the one they share. */
export default function NicheDoll({ edition, ready = true }: { edition: string; ready?: boolean }) {
  const set = CLIPS[edition];
  const accentList = set?.accents ?? (set?.accent ? [set.accent] : []);
  const [phase, setPhase] = useState<Phase>(
    set?.intro && !introSeen[edition] ? "intro" : "loop"
  );
  const [accentIdx, setAccentIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const loopRef = useRef<HTMLVideoElement>(null);
  const overRef = useRef<HTMLVideoElement>(null);
  // With reduced motion she sits still: the poster, no clips.
  const still = useReducedMotion();
  // The clip waits until the page's pictures are in and the browser is idle:
  // it is the heaviest thing in the case, and fetched alongside them it
  // holds everything else up. The poster, which is its first frame, stands
  // in until then.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let idle = 0;
    const go = () => {
      idle = typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setSettled(true), { timeout: 2000 })
        : window.setTimeout(() => setSettled(true), 200);
    };
    if (document.readyState === "complete") go();
    else addEventListener("load", go, { once: true });
    return () => {
      removeEventListener("load", go);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle); else clearTimeout(idle);
    };
  }, []);

  // The next accent is fetched a little before it falls due (not with the
  // page: some weigh twice the loop). When it is due the loop plays out its
  // round instead of wrapping, and its end starts the accent (onLoopEnded).
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (phase !== "loop" || accentList.length === 0) return;
    const every = set?.accentEveryMs ?? 120_000;
    const w = window.setTimeout(() => setWarm(true), Math.max(0, every - 15_000));
    const id = window.setTimeout(() => {
      if (loopRef.current) loopRef.current.loop = false;
    }, every);
    return () => { window.clearTimeout(w); window.clearTimeout(id); };
  }, [phase, edition, set, accentList.length]);
  // preload turned up from "none" is not always taken as a cue to fetch
  useEffect(() => {
    const over = overRef.current;
    if (warm && over && over.readyState === HTMLMediaElement.HAVE_NOTHING) over.load();
  }, [warm]);

  if (!set) return null;

  const overFile =
    phase === "intro" && set.intro ? set.intro
    : accentList.length ? accentList[accentIdx % accentList.length]
    : null;
  const poster = V + set.poster;
  const live = ready && settled && !set.still && !still && !failed;

  const onLoopEnded = () => {
    const loop = loopRef.current, over = overRef.current;
    // not in yet: another round of the loop, and the question again at its end
    if (!over || over.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      if (loop) { loop.currentTime = 0; loop.play().catch(() => {}); }
      return;
    }
    over.currentTime = 0;
    over.play().catch(() => {});
    setPhase("accent");
  };
  const onOverEnded = () => {
    if (phase === "intro") introSeen[edition] = true;
    if (phase === "accent") { setAccentIdx((i) => i + 1); setWarm(false); } // advance to next action
    const loop = loopRef.current;
    if (loop) { loop.loop = true; loop.currentTime = 0; loop.play().catch(() => {}); }
    setPhase("loop");
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="niche-clip" src={poster} alt={`${EDITIONS[edition]?.label ?? edition} — in the niche`} fetchPriority="high" style={{ ...NICHE, zIndex: 2 }} draggable={false} />
      {live && (
        <video
          ref={loopRef}
          className="niche-clip"
          // src after the flags: React sets props in this order, and a src
          // set before autoplay and muted starts a metadata-only load the
          // browser then drops and starts again, a second download
          autoPlay={phase === "loop"}
          muted
          playsInline
          loop
          preload="auto"
          poster={poster}
          src={V + set.loop}
          onEnded={onLoopEnded}
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 3 }}
        />
      )}
      {live && overFile && (
        <video
          ref={overRef}
          className="niche-clip"
          autoPlay={phase === "intro"}
          muted
          playsInline
          preload={phase === "intro" || warm ? "auto" : "none"}
          src={V + overFile}
          onEnded={onOverEnded}
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 4, visibility: phase === "loop" ? "hidden" : "visible" }}
        />
      )}
    </>
  );
}
