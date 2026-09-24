"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The red flip clock on the desk, left of the case under the index — it
 * tells the scene's time and sets it, and replaces the pocket watch that
 * used to hang on the rail.
 *
 * The body is a generated still (/items/flip-clock.webp: blank flaps, a wide
 * date window, KATE™ on the face, two knurled knobs on the right side); the
 * flaps, the AM/PM dots and the date are drawn over it here. Every position
 * below is a percentage of that still, measured off the file.
 *
 *  - Upper knob: the time, in quarter hours. Drag it up or down, turn the
 *    wheel over it, or focus it and use the arrow keys.
 *  - Lower knob: the day of the week — so every edition is reachable, not
 *    only today's (Monday's alarm, Friday's call, the weekend).
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

/** A knob you turn: drag vertically (a notch every 14px), wheel over it, or
 *  the arrow keys. Exposed as a slider. */
function Knob({
  className, label, value, min, max, valueText, onStep,
}: {
  className: string; label: string; value: number; min: number; max: number;
  valueText: string; onStep: (n: number) => void;
}) {
  const [turn, setTurn] = useState(0);
  const drag = useRef<{ y: number; acc: number } | null>(null);
  const el = useRef<HTMLButtonElement>(null);
  const step = (n: number) => { if (!n) return; setTurn((t) => t + n); onStep(n); };

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    // Non-passive so the page doesn't scroll while the knob is being turned.
    const onWheel = (e: WheelEvent) => { e.preventDefault(); step(e.deltaY > 0 ? 1 : -1); };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  });

  return (
    <button
      ref={el}
      type="button"
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      className={`clock-knob ${className}`}
      style={{ "--turn": turn } as React.CSSProperties}
      onPointerDown={(e) => { drag.current = { y: e.clientY, acc: 0 }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        const d = drag.current; if (!d) return;
        const dy = d.y - e.clientY; d.y = e.clientY; d.acc += dy;
        const n = Math.trunc(d.acc / 14); if (n) { d.acc -= n * 14; step(n); }
      }}
      onPointerUp={() => { drag.current = null; }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); step(1); }
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      }}
    />
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

  const addMinutes = (n: number) => {
    // Snap to the quarter first, so a live 10:37 turns to 10:45, not 10:52.
    const base = n > 0 ? Math.floor(time.minutes / STEP) * STEP : Math.ceil(time.minutes / STEP) * STEP;
    const next = (((base + n * STEP) % DAY_MIN) + DAY_MIN) % DAY_MIN;
    onChange({ day: time.day, minutes: next });
  };
  const addDays = (n: number) => onChange({ day: (((time.day + n) % 7) + 7) % 7, minutes: time.minutes });

  return (
    <div className="flip-clock" role="group" aria-label={`Scene clock: ${hhmm}, ${dayText}${live ? " (now)" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/flip-clock.webp" alt="" draggable={false} className="flip-clock__body" />
      <span className="flip-clock__win flip-clock__win--h"><Flap value={String(h12)} /></span>
      <span className="flip-clock__win flip-clock__win--m"><Flap value={String(mm).padStart(2, "0")} /></span>
      <span className="flip-clock__win flip-clock__win--d"><Flap value={dayText} /></span>
      <span className={`flip-clock__dot flip-clock__dot--am${h24 < 12 ? " is-on" : ""}`} aria-hidden />
      <span className={`flip-clock__dot flip-clock__dot--pm${h24 >= 12 ? " is-on" : ""}`} aria-hidden />
      <Knob className="clock-knob--time" label="Time" value={time.minutes} min={0} max={DAY_MIN - 1} valueText={hhmm} onStep={addMinutes} />
      <Knob className="clock-knob--day" label="Day of the week" value={time.day} min={0} max={6} valueText={dayText} onStep={addDays} />
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
