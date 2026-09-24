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
const levelOf = (r: AwardRecord): Level =>
  /Gold/.test(r.recognition) ? "gold" : /Silver/.test(r.recognition) ? "silver"
    : /Bronze/.test(r.recognition) ? "bronze" : "web";
const RANK: Record<Level, number> = { gold: 0, silver: 1, bronze: 2, web: 3 };

// Geometry, in box px (1 m = 1075). The rail runs from just right of the
// trophy to the right edge of Recognition's frame at 1512px.
const RAIL = { x0: 1362, x1: 2350, y: 118 };
const RIB = { w: 24, h: 148, pitch: 26 };    // ribbon size (the stills are 97 × 597) and spacing
const GAP = 20;                               // between projects
const SUB = 40;                               // the bunch's bar, below the rail

export default function AwardRail() {
  const groups = ORDER.map((project) => ({
    project,
    records: AWARD_RECORDS.filter((r) => r.project === project)
      .sort((a, b) => RANK[levelOf(a)] - RANK[levelOf(b)]),
  })).filter((g) => g.records.length);

  const width = groups.reduce((s, g) => s + g.records.length * RIB.pitch, 0) + GAP * (groups.length - 1);
  let x = RAIL.x0 + (RAIL.x1 - RAIL.x0 - width) / 2;
  const wx = (bx: number) => `calc(${bx + 1052.5} * var(--u))`;
  const wy = (by: number) => `calc(${by + 144} * var(--u))`;

  return (
    <div className="award-rail" aria-label="Awards">
      <div className="award-rail__bar" aria-hidden style={{
        left: wx(RAIL.x0), top: wy(RAIL.y), width: `calc(${RAIL.x1 - RAIL.x0} * var(--u))`,
      }} />
      {groups.map((g) => {
        const gx = x;
        x += g.records.length * RIB.pitch + GAP;
        const gw = g.records.length * RIB.pitch;
        return (
          <div key={g.project}>
            {/* the bunch's own short bar, hung from the rail at both ends, with
                the project's tag between them */}
            <span className="award-rail__sub" aria-hidden style={{
              left: wx(gx), top: wy(RAIL.y + SUB), width: `calc(${gw} * var(--u))`,
              "--drop": `calc(${SUB} * var(--u))`,
            } as React.CSSProperties} />
            <span className="award-tag" style={{ left: wx(gx + gw / 2), top: wy(RAIL.y + 8) }}>
              {g.project}
            </span>
            {g.records.map((r, i) => {
              const level = levelOf(r);
              const logo = LOGO[r.organisation];
              return (
                <Link
                  key={r.id}
                  href={CASE[g.project]}
                  tabIndex={-1}
                  className={`award-ribbon award-ribbon--${level}`}
                  style={{
                    left: wx(gx + i * RIB.pitch + (RIB.pitch - RIB.w) / 2), top: wy(RAIL.y + SUB - 6),
                    width: `calc(${RIB.w} * var(--u))`, height: `calc(${RIB.h} * var(--u))`,
                  }}
                  aria-label={`${g.project}: ${r.organisation}, ${r.recognition}${r.category ? ` — ${r.category}` : ""}`}
                  data-label={`${r.organisation} · ${r.recognition}${r.category ? ` · ${r.category}` : ""}`}
                >
                  {logo
                    ? <span className="award-ribbon__logo" style={{ "--logo": `url(/stamps/awards/${logo}.webp)` } as React.CSSProperties} />
                    : <span className="award-ribbon__name">{r.organisation.replace(/ Awards?$/, "")}</span>}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
