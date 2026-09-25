import Link from "next/link";
import "./AwardRail.css";
import { AWARD_RECORDS, type AwardRecord } from "@/lib/awards";

/**
 * The awards as ribbons on a gold lattice, on the wall right of the Davey
 * trophy — where the camera looks for Recognition (components/DeskScene.tsx).
 *
 * One ribbon per award record. The satin's colour is the level (gold,
 * silver, bronze, or black for a web distinction such as a Site of the Day),
 * the competition's logo runs down the satin, and the ribbons hang on the
 * lattice's bars in one bunch per project under a paper tag with its name, so how much each
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
  Agora: "/#recognition",
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

// Geometry, in box px (1 m = 1075). A gold lattice (public/items/
// award-grid.webp, its shadow on the wall baked in), from just right of the
// trophy on past the framed certificate, which leans on the wall in front of
// its lower right corner (DeskScene's CERT). Bigger than today's ribbons
// need: there is room on it for more.
// Every ribbon hangs from a brass S-hook (award-hook.webp) over one of the
// lattice's horizontal rods, a project's ribbons in one row with its tag
// tied on the same rod, over the hooks. Two bands of them, each laid from
// the right edge leftwards a cell apart: low, Agora beside the
// certificate, then BulkSource and OnsiSoft; above, WayPro, then
// Ukrainska 15; and room for a third band on top.
const GRID_PX = { w: 1073, h: 914, full: [1087, 928] };   // the still: the lattice, then with its shadow
const GRID = { x: 1345, w: 800, y: 656 - 914 * 800 / 1073 };   // its foot on the desk
const GK = GRID.w / GRID_PX.w;
const ROD0 = 66, ROD_PITCH = 53.17;                        // its horizontal rods, in the still's px
const rod = (i: number) => GRID.y + (ROD0 + i * ROD_PITCH) * GK;
const CELL_W = 54.5 * GK;                                  // a cell's width
const HOOK = { h: 36, px: [105, 378, 115, 388], top: 35, bottom: 340, cx: 40 };  // the still's size, and where the rod and the ribbon sit in it
const HK = HOOK.h / HOOK.px[1];
// ribbon size (the stills are 97 × 597) and spacing: short enough that a
// band, hook to tail, takes five cells, so three fit one over another
const RIB = { w: 28, h: 172, pitch: 30 };
const LOOP = 8;                               // the ribbon's top, above where its loop takes the hook
const hangs = (r: number) => rod(r) - HOOK.top * HK + HOOK.bottom * HK - LOOP;   // a ribbon's top, from rod r

const ribbonsFor = (project: string) => AWARD_RECORDS.filter((r) => r.project === project).flatMap(ribbonsOf)
  .sort((a, b) => RANK[a.level] - RANK[b.level]);
const RIGHT = 2082;                           // the bands' right edge, just short of the certificate
// rods 0, 5 and 10; the top one is free for now
const BANDS: { rod: number; projects: string[] }[] = [
  { rod: 10, projects: ["Agora", "BulkSource", "OnsiSoft"] },
  { rod: 5, projects: ["WayPro", "Ukrainska 15"] },
];
const SPOT: Record<string, { x: number; rod: number }> = {};
for (const band of BANDS) {
  let right = RIGHT;
  for (const p of band.projects) {
    const x = right - ribbonsFor(p).length * RIB.pitch;
    SPOT[p] = { x, rod: band.rod };
    right = x - CELL_W;
  }
}
// its tag: the project and the years of its awards (lib/awards.ts)
const tagOf = (project: string) => {
  const ys = AWARD_RECORDS.filter((r) => r.project === project && r.year).map((r) => r.year!);
  if (!ys.length) return project;
  const a = Math.min(...ys), b = Math.max(...ys);
  return `${project} · ${a === b ? a : `${a}–${b}`}`;
};

export default function AwardRail() {
  const groups = ORDER.map((project) => ({ project, ribbons: ribbonsFor(project) }))
    .filter((g) => g.ribbons.length && SPOT[g.project]);

  const wx = (bx: number) => `calc(${bx + 1052.5} * var(--u))`;
  const wy = (by: number) => `calc(${by + 144} * var(--u))`;

  return (
    <div className="award-rail" aria-label="Awards" style={{
      "--rw": RIB.w, "--rh": RIB.h,
    } as React.CSSProperties}>
      <div className="award-grid" aria-hidden style={{
        left: wx(GRID.x), top: wy(GRID.y),
        width: `calc(${GRID_PX.full[0] * GK} * var(--u))`, height: `calc(${GRID_PX.full[1] * GK} * var(--u))`,
      }} />
      {groups.map((g) => {
        const { x: gx, rod: r1 } = SPOT[g.project];
        const gw = g.ribbons.length * RIB.pitch;
        return (
          <div key={g.project}>
            <span className="award-tag" style={{ left: wx(gx + gw / 2), top: wy(rod(r1)) }}>
              {tagOf(g.project)}
            </span>
            {g.ribbons.map((r, i) => {
              const cx = gx + i * RIB.pitch + RIB.pitch / 2;
              const logo = LOGO[r.organisation];
              const what = `${r.organisation} · ${r.recognition}${r.category ? ` · ${r.category}` : ""}`;
              return (
                <div key={r.id}>
                <span className="award-hook" aria-hidden style={{
                  left: wx(cx - HOOK.cx * HK), top: wy(rod(r1) - HOOK.top * HK),
                  width: `calc(${HOOK.px[2] * HK} * var(--u))`, height: `calc(${HOOK.px[3] * HK} * var(--u))`,
                }} />
                <Link
                  href={CASE[g.project]}
                  tabIndex={-1}
                  className={`award-ribbon award-ribbon--${r.level}${r.tint ? " award-ribbon--tint" : ""}`}
                  style={{
                    left: wx(cx - RIB.w / 2), top: wy(hangs(r1)),
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
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
