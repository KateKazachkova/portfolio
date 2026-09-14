"use client";

/**
 * Three chalk lines on the back wall of the niche, above the doll's head.
 * The list is the same all day; what changes is how many are struck through:
 * none at standup, one after lunch, two after the afternoon calls, all three
 * at wrap-up (and on Friday evening). No animation — like a wall you glance
 * at on the hour. Hidden outside the workday.
 */
const TASKS = ["fix the grid", "answer the PM", "ship empty state"];

// how many are done, per edition
const DONE: Record<string, number> = {
  work_standup: 0, mon_standup: 0,
  office: 0,
  work_lunch: 1,
  work_calls: 2,
  work_wrapup: 3,
  fri_wine: 3, // (hidden while she stands up to leave — the standing doll overlaps the wall)
};

// the niche rect inside the suitcase image (see NicheDoll) — the list sits in
// the empty arch above the doll
const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;

export default function ChalkTodo({ edition }: { edition: string }) {
  const done = DONE[edition];
  if (done === undefined) return null;
  return (
    <div className="chalk" style={{ position: "absolute", ...RECT, zIndex: 4 }} aria-hidden="true">
      <ul>
        {TASKS.map((t, i) => (
          <li key={t} data-done={i < done ? "true" : "false"} style={{ "--tilt": `${(i % 2 ? 1 : -1) * (0.6 + i * 0.3)}deg` } as React.CSSProperties}>
            <span className="chalk__box">{i < done ? "×" : ""}</span>
            <span className="chalk__text">
              {t}
              <svg className="chalk__strike" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M2,6 C20,3 40,8 60,5 C75,3 90,7 98,4" />
              </svg>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
