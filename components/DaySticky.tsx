"use client";

import { useEffect, useState } from "react";
import { EDITIONS } from "@/lib/time";

/**
 * Today's plan, written by hand on a sticky note stuck to the wardrobe wall
 * beside the clothes — the schedule that used to sit in a panel next to the
 * case, now an object inside it.
 *
 * The paper is a photographed note (/items/sticky-note.webp, generated and cut
 * out), so the curl, the crease and the shadow under the lifted corner are
 * photographic rather than drawn in CSS. Only the writing is ours: Kate's own
 * hand (--font-chalk), laid over the paper in container units so it scales
 * with the case exactly like the chalk list on the niche wall.
 *
 * Every line is a real edition — the time is read off that edition's own range
 * in lib/time.ts and the words are its own slogan — so the note cannot drift
 * from the doll it jumps to. The chalk wall says where she is NOW; the note is
 * the whole day, written once in the morning.
 */

/** The opening time of a range. lib/time.ts writes them loosely
 *  ("07:30–08:15", "10–13", "Mon 09–10"), so drop any day prefix and pad a
 *  bare hour — the same normalisation the chalk wall does. */
function startOfRange(range: string): string {
  const m = range.match(/^([A-Za-z]{3}\s+)?(.+)$/);
  const from = (m?.[2] ?? range).split(/[–-]/)[0].trim();
  return /^\d{1,2}$/.test(from) ? `${from.padStart(2, "0")}:00` : from;
}

const hourOf = (range: string) => parseInt(startOfRange(range).slice(0, 2), 10);

/** Six lines — a note you actually write, not a timetable. Monday starts on
 *  two mugs, Friday ends on the wine call instead of the walk, and the weekend
 *  is off the clock. */
function planFor(day: number): string[] {
  if (day === 0 || day === 6)
    return ["weekend_brunch", "weekend_cleaning", "weekend_series", "evening_guitar", "night"];
  const standup = day === 1 ? "mon_standup" : "work_standup";
  const out = day === 5 ? "fri_wine" : "street";
  // The day closes on the guitar rather than on reading: the note is what she
  // means to do, and "four chords so far" is a line you write to yourself.
  return ["morning", standup, "office", "work_lunch", out, "evening_guitar"];
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export default function DaySticky({
  hour,
  active,
  onPick,
}: {
  hour: number | null;
  active: string | null;
  onPick: (key: string) => void;
}) {
  // The date is the visitor's, so it cannot be known while rendering on the
  // server — the note goes up once the page is in a browser.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  if (!today) return null;

  const plan = planFor(today.getDay());

  return (
    // The container query lives on this box: an element cannot query itself,
    // so cqw written inside a padded note would resolve against the viewport.
    <div className="sticky-note">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/sticky-note.webp" alt="" aria-hidden className="sticky-note__paper" draggable={false} />
      {/* The writing sits in the note's flat area, clear of the corner that
          curls away from the wall at the bottom right. */}
      <div className="sticky-note__ink">
        <p className="sticky-note__date">
          {DAYS[today.getDay()]} {today.getDate()} {MONTHS[today.getMonth()]}
        </p>
        <ul>
          {plan.map((key) => {
            const e = EDITIONS[key];
            const h = hourOf(e.range);
            // Crossed off once the hour is behind her. The day on the note
            // starts at seven, so a small hour is the night before, not a
            // morning that has already happened.
            const done = hour !== null && hour >= 7 && h < hour;
            return (
              <li key={key} data-done={done ? "true" : "false"} data-active={active === key ? "true" : "false"}>
                <button type="button" onClick={() => onPick(key)}>
                  <span className="sticky-note__time">{startOfRange(e.range)}</span>
                  <span className="sticky-note__text">{(e.slogan ?? e.label).toLowerCase()}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
