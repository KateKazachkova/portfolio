"use client";

import { useEffect, useRef, useState } from "react";

/**
 * She takes the wheel out for a ride.
 *
 * Clicking the electric unicycle parked in the right-hand compartment plays a
 * short sequence over the scene: the doll — already in her street clothes and
 * Leatt pads — steps out of the niche, walks to the compartment, lifts the
 * wheel down, rides off to the right, round behind the case, back along the
 * front, puts the wheel back and climbs into the niche again.
 *
 * Every clip is a generated video of her alone on plain grey (kling3_0, from
 * keyframes), keyed to alpha (delete/key_clip.py): VP9-alpha WebM for Chrome
 * and Firefox, HEVC-alpha MOV for Safari, which draws VP9's alpha as black.
 * The clips keep her centred, as if on a treadmill; the travel across the desk
 * is this component's, one Web Animation per clip. The way back is the same
 * clips reversed.
 *
 * Geometry, in the case box's own percentages (the element lives in
 * .case-world): a clip frame is 718 × 960; her ground contact sits 94.5% down
 * it, at `ax` across (measured per clip, start → end). At scale 1 the frame is
 * 69.8% of the box tall (34.8% of its width), which makes her standing height
 * 61% of the box and the wheel in her hands the size of the one on the shelf.
 * In the niche she is 0.88 (it is deeper); on the desk in front, 1.04.
 * z 9 is in front of the case, 0 behind it (the case image is 1).
 */

type Pt = { x: number; y: number; s: number; z?: number; o?: number };
type Phase = { clip: string; frames: number; ax: [number, number]; path: Pt[] };

const FPS = 24;
const RATE = 1.2;
const W = 34.8;             // frame width, % of the box width, at scale 1
const H = 69.8;             // frame height, % of the box height, at scale 1
const GROUND = 0.945;       // her ground contact, fraction down the frame

const NICHE: Pt = { x: 49.7, y: 75.5, s: 0.88, z: 9 };
const DOWN: Pt = { x: 51, y: 93, s: 1, z: 9 };
const WHEEL: Pt = { x: 56, y: 95, s: 1.04, z: 9 };

const PHASES: Phase[] = [
  // out of the niche, a hop down onto the desk, and over to the wheel
  { clip: "c1_stepout", frames: 121, ax: [0.5, 0.651], path: [NICHE, { ...DOWN, o: 0.28 }, WHEEL] },
  // lifts it down off the compartment floor and gets on
  { clip: "c2_lift", frames: 145, ax: [0.37, 0.613], path: [WHEEL, WHEEL] },
  // pushes off and rides away to the right, past the right-hand door
  { clip: "c3_pushoff", frames: 121, ax: [0.612, 0.473], path: [WHEEL, { ...WHEEL, o: 0.3 }, { x: 97, y: 95, s: 1.04, z: 9 }] },
  // swings round the end of the case and goes behind it
  { clip: "c4_uturn", frames: 121, ax: [0.473, 0.54], path: [
    { x: 97, y: 95, s: 1.04, z: 9 }, { x: 108, y: 93, s: 1, z: 9, o: 0.35 },
    { x: 104, y: 85, s: 0.92, z: 0, o: 0.62 }, { x: 92, y: 82, s: 0.88, z: 0 },
  ] },
  // along the back of the desk, hidden by the case
  { clip: "l_back", frames: 121, ax: [0.54, 0.54], path: [{ x: 92, y: 82, s: 0.88, z: 0 }, { x: 9, y: 82, s: 0.88, z: 0 }] },
  // out round the left end, turning back to the room — a tight turn round
  // the left door's foot, so she never passes under the text column
  { clip: "c4_uturn_r", frames: 121, ax: [0.54, 0.473], path: [
    { x: 9, y: 82, s: 0.88, z: 0 }, { x: 3, y: 86, s: 0.92, z: 0, o: 0.3 },
    { x: 5, y: 93, s: 1, z: 9, o: 0.62 }, { x: 12, y: 95, s: 1.04, z: 9 },
  ] },
  // along the front of the desk, back towards the compartment
  { clip: "l_front", frames: 121, ax: [0.473, 0.473], path: [{ x: 12, y: 95, s: 1.04, z: 9 }, { x: 50, y: 95, s: 1.04, z: 9 }] },
  // slows, a foot down
  { clip: "c3_pushoff_r", frames: 121, ax: [0.473, 0.612], path: [{ x: 50, y: 95, s: 1.04, z: 9 }, { ...WHEEL, o: 0.7 }, WHEEL] },
  // puts the wheel back on the compartment floor
  { clip: "c2_lift_r", frames: 145, ax: [0.613, 0.37], path: [WHEEL, WHEEL] },
  // and back up into the niche
  { clip: "c1_stepout_r", frames: 121, ax: [0.651, 0.5], path: [WHEEL, { ...DOWN, o: 0.72 }, NICHE] },
];

const isSafari = () =>
  typeof navigator !== "undefined" && /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

function keyframes(p: Phase): Keyframe[] {
  const n = p.path.length;
  return p.path.map((pt, i) => {
    const offset = pt.o ?? (n === 1 ? 0 : i / (n - 1));
    const ax = p.ax[0] + (p.ax[1] - p.ax[0]) * offset;
    return {
      offset,
      left: `${pt.x - ax * W * pt.s}%`,
      top: `${pt.y - GROUND * H * pt.s}%`,
      width: `${W * pt.s}%`,
      zIndex: String(pt.z ?? 9),
    };
  });
}

/** Warm the clips so the first one starts without a wait. */
export function preloadRide() {
  if (typeof document === "undefined" || document.querySelector("link[data-ride]")) return;
  const ext = isSafari() ? "mov" : "webm";
  PHASES.slice(0, 3).forEach((p) => {
    const l = document.createElement("link");
    l.rel = "preload"; l.as = "video"; l.href = `/dolls/ride/${p.clip}.${ext}`; l.dataset.ride = "1";
    document.head.appendChild(l);
  });
}

export default function MonoRide({ run, onPhase, onEnd }: {
  run: boolean;
  /** Told which clip is playing, so the scene can hide the niche doll and
   *  the parked wheel at the right moments. */
  onPhase: (clip: string | null) => void;
  onEnd: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  // Only ever rendered on the client after a click, so reading the UA here is
  // safe: on the server `run` is false and nothing is drawn.
  const [ext] = useState<"webm" | "mov">(() => (isSafari() ? "mov" : "webm"));
  const cbs = useRef({ onPhase, onEnd });
  useEffect(() => { cbs.current = { onPhase, onEnd }; }, [onPhase, onEnd]);

  useEffect(() => {
    if (!run) return;
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let anim: Animation | null = null;
    const clips = vids.current;

    const playPhase = (i: number) => new Promise<void>((resolve) => {
      const p = PHASES[i];
      const v = vids.current[i];
      if (!v || cancelled) return resolve();
      const dur = (p.frames / FPS / RATE) * 1000;
      v.playbackRate = RATE;
      v.currentTime = 0;
      const start = () => {
        vids.current.forEach((o, j) => { if (o) o.style.opacity = j === i ? "1" : "0"; });
        cbs.current.onPhase(p.clip);
        anim?.cancel();
        anim = el.animate(keyframes(p), { duration: dur, fill: "forwards", easing: "linear" });
      };
      v.addEventListener("playing", start, { once: true });
      v.addEventListener("ended", () => resolve(), { once: true });
      // A play() can be aborted by a pause from a previous run of this effect
      // (React runs it twice in development) or by the file still loading;
      // try again rather than skip the clip, and only give up for real errors.
      const go = (tries: number) => {
        if (cancelled) return resolve();
        v.play().catch((e: DOMException) => {
          if (cancelled) return resolve();
          if (e.name === "AbortError" && tries > 0) window.setTimeout(() => go(tries - 1), 120);
          else resolve();
        });
      };
      go(8);
    });

    // Development only: ?ride=<phase>,<0..1> freezes the scene on one frame
    // of one clip, to check placement without playing (and without a visible
    // tab — a hidden one never advances time).
    const still = process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("ride");
    if (still) {
      const [pi, f] = still.split(",").map(Number);
      const p = PHASES[pi], v = vids.current[pi];
      if (p && v) {
        vids.current.forEach((o, j) => { if (o) o.style.opacity = j === pi ? "1" : "0"; });
        const dur = (p.frames / FPS / RATE) * 1000;
        anim = el.animate(keyframes(p), { duration: dur, fill: "forwards" });
        anim.pause(); anim.currentTime = f * dur;
        v.currentTime = Math.min(f * p.frames / FPS, p.frames / FPS - 0.05);
        cbs.current.onPhase(p.clip);
      }
      return () => { anim?.cancel(); };
    }

    (async () => {
      for (let i = 0; i < PHASES.length && !cancelled; i++) await playPhase(i);
      if (!cancelled) { cbs.current.onPhase(null); cbs.current.onEnd(); }
    })();

    return () => {
      cancelled = true;
      anim?.cancel();
      clips.forEach((v) => { if (v) { v.pause(); v.style.opacity = "0"; } });
      cbs.current.onPhase(null);
    };
  }, [run]);

  if (!run) return null;
  return (
    <div ref={box} className="mono-ride" aria-hidden>
      <span className="mono-ride__shadow" />
      {PHASES.map((p, i) => (
        <video
          key={p.clip}
          ref={(v) => { vids.current[i] = v; }}
          src={`/dolls/ride/${p.clip}.${ext}`}
          muted
          playsInline
          preload="auto"
          className="mono-ride__clip"
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}
