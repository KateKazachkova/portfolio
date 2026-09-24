"use client";

import { useEffect, useState } from "react";

/**
 * The red flip clock on the desk, left of the case under the index — it
 * tells the scene's time and sets it, and replaces the pocket watch that
 * used to hang on the rail.
 *
 * The body is a generated still (/items/flip-clock.webp: matte oxblood case,
 * aged ivory face, blank flaps, a wide date window, KATE™), facing the room
 * straight on; the flaps, the AM/PM lamps and the date are drawn over it
 * here. Every position is a percentage of that still, measured off the file.
 *
 * It is set the way a flip clock looks like it should be: by its flaps.
 *  - Each flap is two buttons — the upper half turns it forward, the lower
 *    half back, with ▲ / ▼ showing on hover: hours by one, minutes by a
 *    quarter, the date window by a day (so every weekday's edition is
 *    reachable — Monday's alarm, Friday's call, the weekend — not only
 *    today's).
 *  - AM and PM are buttons on the face, their lamp lit for the half of the
 *    day it is.
 *  - The bar on top: back to now.
 */

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const STEP = 15;                       // minutes per notch of the time knob
const DAY_MIN = 24 * 60;

export type ClockTime = { day: number; minutes: number };

/** The scene's clock as a real Date: this week's `day`, at `minutes`. */
export function clockDate(t: ClockTime): Date {
  const d = new Date();
  d.setDate(d.getDate() + (t.day - d.getDay()));
  d.setHours(Math.floor(t.minutes / 60), t.minutes % 60, 0, 0);
  return d;
}

/** One flip card. When the value changes, the old top half falls over the
 *  new one — a short rotateX about the split line. */
function Flap({ value }: { value: string }) {
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState<string | null>(null);
  // A new value swaps in during render (React's pattern for state that
  // follows a prop); the falling half is cleared once its animation is done.
  if (value !== shown) { setPrev(shown); setShown(value); }
  useEffect(() => {
    if (prev === null) return;
    const t = window.setTimeout(() => setPrev(null), 260);
    return () => window.clearTimeout(t);
  }, [prev, shown]);
  return (
    <span className="flap">
      <span className="flap__face">{shown}</span>
      {prev !== null && (
        <span className="flap__fall" aria-hidden>
          <span className="flap__face">{prev}</span>
        </span>
      )}
    </span>
  );
}

/** A flap you can set: the card, with its upper and lower halves as the two
 *  buttons that turn it forward and back. */
function SetFlap({ value, label, onStep }: { value: string; label: string; onStep: (n: number) => void }) {
  return (
    <>
      <Flap value={value} />
      <button type="button" className="flap-btn flap-btn--up" aria-label={`${label}: forward`} onClick={() => onStep(1)}>
        <span aria-hidden>▲</span>
      </button>
      <button type="button" className="flap-btn flap-btn--down" aria-label={`${label}: back`} onClick={() => onStep(-1)}>
        <span aria-hidden>▼</span>
      </button>
    </>
  );
}

export default function FlipClock({
  time, live, onChange, onNow,
}: {
  time: ClockTime; live: boolean;
  onChange: (t: ClockTime) => void; onNow: () => void;
}) {
  const h24 = Math.floor(time.minutes / 60);
  const h12 = (h24 % 12) || 12;
  const mm = time.minutes % 60;
  const date = clockDate(time);
  const hhmm = `${h12}:${String(mm).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
  const dayText = `${DAYS[time.day]} ${date.getDate()}`;

  const set = (minutes: number, day = time.day) =>
    onChange({ day: ((day % 7) + 7) % 7, minutes: ((minutes % DAY_MIN) + DAY_MIN) % DAY_MIN });
  const addHours = (n: number) => set(time.minutes + n * 60);
  const addQuarters = (n: number) => {
    // Snap to the quarter first, so a live 10:37 turns to 10:45, not 10:52.
    const base = n > 0 ? Math.floor(mm / STEP) * STEP : Math.ceil(mm / STEP) * STEP;
    const next = (((base + n * STEP) % 60) + 60) % 60;       // the hour stays put
    set(h24 * 60 + next);
  };
  const addDays = (n: number) => set(time.minutes, time.day + n);
  const setHalf = (pm: boolean) => { if (pm !== h24 >= 12) set(time.minutes + (pm ? 720 : -720)); };

  return (
    <div className="flip-clock" role="group" aria-label={`Scene clock: ${hhmm}, ${dayText}${live ? " (now)" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/flip-clock.webp" alt="" draggable={false} className="flip-clock__body" />
      <span className="flip-clock__win flip-clock__win--h"><SetFlap value={String(h12)} label="Hour" onStep={addHours} /></span>
      <span className="flip-clock__win flip-clock__win--m"><SetFlap value={String(mm).padStart(2, "0")} label="Minutes" onStep={addQuarters} /></span>
      <span className="flip-clock__win flip-clock__win--d"><SetFlap value={dayText} label="Day" onStep={addDays} /></span>
      <button type="button" className={`flip-clock__half flip-clock__half--am${h24 < 12 ? " is-on" : ""}`}
        aria-label="AM" aria-pressed={h24 < 12} onClick={() => setHalf(false)}><span className="flip-clock__lamp" /></button>
      <button type="button" className={`flip-clock__half flip-clock__half--pm${h24 >= 12 ? " is-on" : ""}`}
        aria-label="PM" aria-pressed={h24 >= 12} onClick={() => setHalf(true)}><span className="flip-clock__lamp" /></button>
      <button
        type="button"
        className="flip-clock__now"
        aria-label="Back to now"
        title="Back to now"
        onClick={onNow}
        aria-pressed={live}
      />
    </div>
  );
}
