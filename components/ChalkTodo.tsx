"use client";

import { EDITIONS } from "@/lib/time";

/**
 * The day, chalked on the back wall of the niche above the doll: one list that
 * is both the schedule and the to-do. Each line carries the hour it happens at,
 * read off that edition's own range in lib/time.ts, and everything already
 * behind her is struck through — so the wall says where she is without needing
 * a marker for "now".
 *
 * Every strike is drawn differently (a wavy line, a scribble, a double line, a
 * clean one) because nobody crosses things out the same way twice.
 *
 * The wall is only 156 × 117 at the case's natural size, so the list is a
 * window of five lines around the current hour rather than the whole day.
 */

/** The weekday in order. The wording is hers where the old to-do had it, and
 *  the edition's own slogan otherwise — nothing invented for the wall. */
const DAY: { key: string; text: string }[] = [
  { key: "morn_alarm",    text: "loading… please wait" },
  { key: "morning",       text: "coffee first" },
  { key: "morn_ready",    text: "running late" },
  { key: "morn_doorstep", text: "lacing up" },
  { key: "work_standup",  text: "survive standup" },
  { key: "office",        text: "deep work" },
  { key: "work_lunch",    text: "lunch. actually eat" },
  { key: "work_calls",    text: "call №100500 (unasked)" },
  { key: "work_wrapup",   text: "fix the grid. again" },
  { key: "street",        text: "urban explorer" },
  { key: "evening",       text: "one more page" },
  { key: "night",         text: "archive mode" },
];

/** Editions that sit outside the weekday run — they stand on their own line. */
const ASIDE: Record<string, string> = {
  mon_alarm: "snooze ×2",
  mon_standup: "standup. two mugs",
  fri_wine: "wine call",
  fri_transition: "closing time",
  weekend_brunch: "off the clock",
  weekend_cleaning: "spring clean",
  weekend_series: "one more episode",
};

// four ways to cross something out (100×10 box, drawn over the words)
const STRIKES = [
  "M2,6 C14,2 26,9 38,5 C50,1 62,9 74,5 C84,2 92,7 98,4",                       // wavy
  "M2,3 C30,1 60,5 98,2 M3,8 C30,6 60,10 97,7",                                  // double
  "M2,5 L22,3 L8,8 L34,2 L20,9 L48,3 L36,8 L62,2 L52,9 L78,3 L66,8 L98,4",      // scribble
  "M4,7 C30,4 60,6 96,3",                                                        // one clean line
];
const MARKS = ["×", "✓", "≈", "×"];

// the niche rect inside the suitcase image (see NicheDoll)
const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;

/** The opening time of a range. lib/time.ts writes them loosely
 *  ("07:30–08:15", "10–13", "Mon 09–10"), so drop any day prefix and pad a
 *  bare hour. The schedule beside the case reads the same field. */
function startOfRange(range: string): string {
  const m = range.match(/^([A-Za-z]{3}\s+)?(.+)$/);
  const from = (m?.[2] ?? range).split(/[–-]/)[0].trim();
  return /^\d{1,2}$/.test(from) ? `${from.padStart(2, "0")}:00` : from;
}

const WINDOW = 5;

export default function ChalkTodo({ edition }: { edition: string }) {
  const now = DAY.findIndex((d) => d.key === edition);

  // A weekend or one-off edition is not part of the run: it gets its own line.
  if (now === -1) {
    const text = ASIDE[edition];
    if (!text || !EDITIONS[edition]) return null;
    return (
      <Wall
        rows={[{ key: edition, time: startOfRange(EDITIONS[edition].range), text, done: false }]}
      />
    );
  }

  // Five lines around the current hour, clamped to the ends of the day.
  const start = Math.max(0, Math.min(now - 2, DAY.length - WINDOW));
  const rows = DAY.slice(start, start + WINDOW).map((d, i) => ({
    key: d.key,
    time: startOfRange(EDITIONS[d.key].range),
    text: d.text,
    done: start + i < now,
  }));

  return <Wall rows={rows} />;
}

function Wall({ rows }: { rows: { key: string; time: string; text: string; done: boolean }[] }) {
  return (
    <div className="chalk" style={{ position: "absolute", ...RECT, zIndex: 4 }} aria-hidden="true">
      <ul>
        {rows.map((r, i) => (
          <li
            key={r.key}
            data-done={r.done ? "true" : "false"}
            style={{ "--tilt": `${(i % 2 ? 1 : -1) * (0.4 + i * 0.2)}deg` } as React.CSSProperties}
          >
            <span className="chalk__box" data-mark={i % MARKS.length}>
              {r.done ? MARKS[i % MARKS.length] : ""}
            </span>
            <span className="chalk__time">{r.time}</span>
            <span className="chalk__text">
              {r.text}
              <svg className="chalk__strike" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d={STRIKES[i % STRIKES.length]} />
              </svg>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
