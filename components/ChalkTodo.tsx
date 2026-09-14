"use client";

/**
 * Chalk to-do list on the back wall of the niche, above the doll's head.
 * Same list all day; what changes is how many lines are struck through —
 * and every strike is drawn differently (a wavy line, a scribble, a double
 * line, a tick + slash), because nobody crosses things out the same way twice.
 * Hidden outside the workday.
 */
const TASKS = [
  "survive standup",
  "call №100500 (unasked)",
  "lunch. actually eat",
  "fix the grid. again",
];

// how many are done, per edition
const DONE: Record<string, number> = {
  work_standup: 0, mon_standup: 0,
  office: 1,          // standup survived
  work_lunch: 1,
  work_calls: 2,      // lunch happened
  work_wrapup: 4,
  fri_wine: 4,
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

export default function ChalkTodo({ edition }: { edition: string }) {
  const done = DONE[edition];
  if (done === undefined) return null;
  return (
    <div className="chalk" style={{ position: "absolute", ...RECT, zIndex: 4 }} aria-hidden="true">
      <ul>
        {TASKS.map((t, i) => {
          const isDone = i < done;
          return (
            <li key={t} data-done={isDone ? "true" : "false"} style={{ "--tilt": `${(i % 2 ? 1 : -1) * (0.5 + i * 0.25)}deg` } as React.CSSProperties}>
              <span className="chalk__box" data-mark={i % MARKS.length}>{isDone ? MARKS[i % MARKS.length] : ""}</span>
              <span className="chalk__text">
                {t}
                <svg className="chalk__strike" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d={STRIKES[i % STRIKES.length]} />
                </svg>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
