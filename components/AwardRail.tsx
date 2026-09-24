import Link from "next/link";
import "./AwardRail.css";
import { AWARD_RECORDS, type AwardRecord } from "@/lib/awards";

/**
 * The awards as ribbons on a brass rail, on the wall right of the Davey
 * trophy — where the camera looks for Recognition (components/DeskScene.tsx).
 *
 * One ribbon per award record. The satin's colour is the level (gold,
 * silver, bronze, or black for a web distinction such as a Site of the Day),
 * the competition's logo runs down the satin, and the ribbons hang in one
 * bunch per project under a paper tag with its name, so how much each
 * project won is a count you can see. A ribbon opens its project's case file.
 *
 * Laid out in wall px (the desk-wall plane's own: box x + 1052.5 across,
 * box y + 144 down), so it rides with the wall and is always there: from
 * home it is off to the right, out of the window.
 */

// left to right, as in the approved sketch
const ORDER = ["Ukrainska 15", "WayPro", "BulkSource", "OnsiSoft", "Agora"];
const CASE: Record<string, string> = {
  "Ukrainska 15": "/work/ukrainska-15",
  WayPro: "/work/waypro",
  BulkSource: "/work/bulksource",
  OnsiSoft: "/work/onsisoft",
  // no case file yet: its records are on the old page
  Agora: "/recognition",
};
const LOGO: Record<string, string | null> = {
  "MUSE Creative Awards": "muse",
  "CSS Design Awards": "cssda",
  "CSS Winner": "cssw",
  "CSS Nectar": "nectar",
  "Design Nominees": "dn",
  "London Design Awards": "lda",
  "NYX Awards": "nyx",
  "Indigo Design Award": "indigo",
  "NY Product Design Awards": "nypda",
  "Davey Awards": "davey",
  "French Design Awards": null,          // no logo on file: its name instead
};

type Level = "gold" | "silver" | "bronze" | "web";
const levelOf = (recognition: string): Level =>
  /Gold/.test(recognition) ? "gold" : /Silver/.test(recognition) ? "silver"
    : /Bronze/.test(recognition) ? "bronze" : "web";
const RANK: Record<Level, number> = { gold: 0, silver: 1, bronze: 2, web: 3 };

// A web distinction that has a badge of its own wears the badge's colour
// (public/stamps/awards/cssda-*.png): CSSDA's four, blue, red, green, yellow.
const TINT: Record<string, string> = {
  "Best UI": "#5960a8",
  "Best UX": "#df6147",
  "Best Innovation": "#679550",
  "Special Kudos": "#eebd1c",
};

type Ribbon = { id: string; organisation: string; recognition: string; category: string | null; level: Level; tint?: string };
// One record can stand for several distinctions ("Best UI · Best UX · …"):
// each of them is a ribbon of its own.
const ribbonsOf = (r: AwardRecord): Ribbon[] =>
  r.recognition.split(" · ").map((rec, i) => ({
    id: `${r.id}-${i}`, organisation: r.organisation, recognition: rec, category: r.category,
    level: levelOf(rec), tint: TINT[rec],
  }));

// Geometry, in box px (1 m = 1075). The rail runs from just right of the
// trophy to the framed certificate leaning on the wall at the frame's
// right edge (DeskScene's CERT); each project's
// ribbons hang in two rows, each row from its own short bar.
const RAIL = { x0: 1362, x1: 2022, y: 108 };
const RIB = { w: 29, h: 178, pitch: 32 };    // ribbon size (the stills are 97 × 597) and spacing
const GAP = 20;                               // between projects
const SUB = 40;                               // the first row's bar, below the rail
const ROW = RIB.h + 18;                       // from one row's bar to the next

export default function AwardRail() {
  const groups = ORDER.map((project) => {
    const ribbons = AWARD_RECORDS.filter((r) => r.project === project).flatMap(ribbonsOf)
      .sort((a, b) => RANK[a.level] - RANK[b.level]);
    const cols = Math.ceil(ribbons.length / 2);
    return { project, rows: [ribbons.slice(0, cols), ribbons.slice(cols)], cols };
  }).filter((g) => g.cols);

  const width = groups.reduce((s, g) => s + g.cols * RIB.pitch, 0) + GAP * (groups.length - 1);
  let x = RAIL.x0 + (RAIL.x1 - RAIL.x0 - width) / 2;
  const wx = (bx: number) => `calc(${bx + 1052.5} * var(--u))`;
  const wy = (by: number) => `calc(${by + 144} * var(--u))`;

  return (
    <div className="award-rail" aria-label="Awards" style={{
      "--rw": RIB.w, "--rh": RIB.h,
    } as React.CSSProperties}>
      <div className="award-rail__bar" aria-hidden style={{
        left: wx(RAIL.x0), top: wy(RAIL.y), width: `calc(${RAIL.x1 - RAIL.x0} * var(--u))`,
      }} />
      {groups.map((g) => {
        const gx = x;
        x += g.cols * RIB.pitch + GAP;
        const gw = g.cols * RIB.pitch;
        return (
          <div key={g.project}>
            <span className="award-tag" style={{ left: wx(gx + gw / 2), top: wy(RAIL.y + 8) }}>
              {g.project}
            </span>
            {g.rows.map((row, ri) => row.length > 0 && (
              <div key={ri}>
                {/* the row's own short bar, hung from the one above at both ends */}
                <span className="award-rail__sub" aria-hidden style={{
                  left: wx(gx), top: wy(RAIL.y + SUB + ri * ROW), width: `calc(${gw} * var(--u))`,
                  "--drop": `calc(${ri ? ROW : SUB} * var(--u))`,
                } as React.CSSProperties} />
                {row.map((r, i) => {
                  const logo = LOGO[r.organisation];
                  const what = `${r.organisation} · ${r.recognition}${r.category ? ` · ${r.category}` : ""}`;
                  return (
                    <Link
                      key={r.id}
                      href={CASE[g.project]}
                      tabIndex={-1}
                      className={`award-ribbon award-ribbon--${r.level}${r.tint ? " award-ribbon--tint" : ""}`}
                      style={{
                        left: wx(gx + i * RIB.pitch + (RIB.pitch - RIB.w) / 2), top: wy(RAIL.y + SUB - 8 + ri * ROW),
                        width: `calc(${RIB.w} * var(--u))`, height: `calc(${RIB.h} * var(--u))`,
                        ...(r.tint ? { "--tint": r.tint } : {}),
                      } as React.CSSProperties}
                      aria-label={`${g.project}: ${what}`}
                      data-label={what}
                    >
                      {logo
                        ? <span className="award-ribbon__logo" style={{ "--logo": `url(/stamps/awards/${logo}.webp)` } as React.CSSProperties} />
                        : <span className="award-ribbon__name">{r.organisation.replace(/ Awards?$/, "")}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
