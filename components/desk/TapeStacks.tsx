"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Archivo_Black, Bebas_Neue, Caveat_Brush, Gochi_Hand, Permanent_Marker, Reenie_Beanie,
  Righteous, Rock_Salt, Shrikhand, Special_Elite, VT323,
} from "next/font/google";
import type { WatchItem } from "@/lib/content";
import { CM, WALL, come, here, px, usePutBack } from "./offduty";
import { SHELF } from "./BookShelf";
import "./TapeStacks.css";

// The films on VHS at the plank's right end: the oldest eight in a stack
// lying spine out, oldest at the bottom, and the rest standing spine out
// like the books, left of it, oldest first. Box px, as OffDutyShelf; a
// tape in its sleeve is 18.7 × 10.2 × 2.5 cm.
const W = Math.round(18.7 * CM);
const D = Math.round(10.2 * CM);
const T = Math.round(2.5 * CM);
// as many as fit in the frame over the plank
const LYING = 8;
// 3 cm in from the plank's right end, 1.5 cm back from its edge
const STACK_X = SHELF.x + SHELF.w - Math.round(3 * CM) - W;
const FRONT = WALL + SHELF.d - Math.round(1.5 * CM);

// The spines: ten real ones cut from Kate's reference (public/items/off-duty/
// vhs, 858 px across), each with the blank it leaves for a title — its
// left and right edges, % of the spine — and whether that blank is paper
// written on by hand or a printed field; the Dynamicron's own lettering is
// papered over. Taken in turn, paper and print alternating.
type Spine = { n: number; l: number; r: number; hand: boolean; dark?: boolean; mask?: string };
const SPINES: Spine[] = [
  { n: 1, l: 11, r: 17, hand: true },
  { n: 2, l: 3, r: 64, hand: false },
  { n: 4, l: 27, r: 6, hand: true },
  { n: 3, l: 4, r: 42, hand: false, dark: true },
  { n: 6, l: 27, r: 11, hand: true },
  { n: 5, l: 2, r: 62, hand: false, mask: "#e5dfc9" },
  { n: 9, l: 9, r: 28, hand: true },
  { n: 7, l: 45, r: 3, hand: false, dark: true },
  { n: 10, l: 27, r: 6, hand: true },
  { n: 8, l: 10, r: 60, hand: false },
];
// Every title in a different hand or face, as a shelf of tapes recorded
// off the telly over twenty years: markers and biros on the paper ones,
// the printers' own faces on the rest. w is the face's average glyph
// width in em, to fit a title to its blank. (next/font takes only literal
// options, hence the repetition; none is preloaded, the corner is far off.)
const fPermanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fRockSalt = Rock_Salt({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fCaveatBrush = Caveat_Brush({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fReenieBeanie = Reenie_Beanie({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fGochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fBebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fShrikhand = Shrikhand({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fRighteous = Righteous({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fSpecialElite = Special_Elite({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fVT323 = VT323({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const fArchivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const HANDS = [
  { font: fPermanentMarker, w: 0.56 }, { font: fRockSalt, w: 0.72 }, { font: fCaveatBrush, w: 0.42 },
  { font: fReenieBeanie, w: 0.36 }, { font: fGochiHand, w: 0.46 }, { font: null, w: 0.4 },
];
const FACES = [
  { font: fBebasNeue, w: 0.38 }, { font: fShrikhand, w: 0.62 }, { font: fRighteous, w: 0.55 },
  { font: fSpecialElite, w: 0.58 }, { font: fVT323, w: 0.45 }, { font: fArchivoBlack, w: 0.66 },
];
const INKS = ["#c2302a", "#1f2d6e", "#232323", "#2f5d3a"];

// "The Lord of the Rings: The Two Towers" → "The Two Towers", "Van Helsing
// (2004)" → "Van Helsing"; a year stays where two tapes would otherwise
// read the same ("It 1990", "It 2017")
const baseOf = (t: string) => t.replace(/^[^:]*:\s*/, "").replace(/\s*\(\d{4}\)$/, "");
const spineOf = (t: string, all: WatchItem[]) => {
  const b = baseOf(t);
  const y = t.match(/\((\d{4})\)$/)?.[1];
  return y && all.filter((f) => baseOf(f.title) === b).length > 1 ? `${b} ${y}` : b;
};


export default function TapeStacks() {
  const [films, setFilms] = useState<WatchItem[]>([]);
  // the one pulled out of its stack and turned cover out
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/films").then((r) => r.json()).then((d: WatchItem[]) => on && setFilms(
      d.filter((f) => f.year !== null).sort((a, b) => (a.year! - b.year!) || a.title.localeCompare(b.title)),
    )).catch(() => {});
    return () => { on = false; };
  }, []);
  usePutBack(open !== null, () => setOpen(null));
  const out = films.findIndex((f) => f.title === open);
  const toggle = (title: string) => (e: React.MouseEvent) => {
    if (!here()) return;
    e.stopPropagation();
    setOpen((o) => (o === title ? null : title));
  };

  return (
    <div className="vt" onClick={come} data-open={open ? "" : undefined}
      style={{ "--w": W, "--d": D, "--t": T, "--z": FRONT } as CSSProperties}>
      {films.map((f, i) => {
        const spine = SPINES[i % SPINES.length];
        // the paper ones and the printed ones each take the next face
        const k = Math.floor(i / 2);
        const face = spine.hand ? HANDS[k % HANDS.length] : FACES[k % FACES.length];
        const title = spineOf(f.title, films);
        // fitted to the blank on one line, or on two if one would set it
        // under 8 px; never over 42% of the spine's height a line
        const room = (W * (100 - spine.l - spine.r)) / 100;
        const one = room / (title.length * face.w);
        const two = one < 8 && title.includes(" ");
        const size = Math.max(6.5, Math.min(T * (two ? 0.4 : 0.62), two ? one * 1.9 : one));
        const lying = i < LYING;
        const isOpen = f.title === open;
        const standing = films.length - LYING;
        // taken out it stands W tall in front of the plank's edge, its
        // middle 2 cm over the plank, low enough to stay in the frame
        const mid = lying ? SHELF.y - T * (i + 0.5) : SHELF.y - W / 2;
        const dy = Math.round(SHELF.y - 2 * CM - mid);
        return (
          <button key={f.title} type="button" className="vt-tape" data-stand={lying ? undefined : ""}
            data-open={isOpen ? "" : undefined} data-drop={lying && out >= 0 && out < LYING && i > out ? "" : undefined}
            tabIndex={-1} aria-label={`${f.title}${f.year ? `, ${f.year}` : ""}`} onClick={toggle(f.title)}
            style={(lying
              ? { left: px(STACK_X + ((i * 37) % 9) - 4), top: px(SHELF.y - T * (i + 1)), width: px(W), height: px(T), "--dy": dy }
              // side by side, the last 1.5 cm short of the stack
              : { left: px(STACK_X - Math.round(1.5 * CM) - (standing - (i - LYING)) * (T + 1)),
                  top: px(SHELF.y - W), width: px(T), height: px(W), "--dy": dy }
            ) as CSSProperties}>
            <span className="vt-tape__body">
              <span className="vt-tape__spine">
                <span className="vt-tape__label" style={{ backgroundImage: `url("/items/off-duty/vhs/spine-${String(spine.n).padStart(2, "0")}.webp")` }}>
                  {spine.mask && <span className="vt-tape__mask" style={{ left: `${spine.l - 1}%`, right: `${spine.r - 1}%`, background: spine.mask }} />}
                  <span className={`vt-tape__title${face.font ? ` ${face.font.className}` : " vt-tape__title--chalk"}`} data-two={two ? "" : undefined}
                    style={{
                      left: `${spine.l}%`, right: `${spine.r}%`, fontSize: px(Math.round(size * 10) / 10),
                      color: spine.dark ? "#f1ede4" : spine.hand ? INKS[k % INKS.length] : "#1c1c1c",
                    }}>{title}</span>
                </span>
              </span>
              <span className="vt-tape__cover" style={f.poster ? { "--poster": `url("${f.poster}")` } as CSSProperties : undefined} />
              <span className="vt-tape__back" />
              <span className="vt-tape__end vt-tape__end--l" />
              <span className="vt-tape__end vt-tape__end--r" />
            </span>
            <span className="bs-card vt-card" aria-hidden>
              <span className="bs-card__title">{f.title}</span>
              {f.year && <span className="bs-card__meta">{f.year} · VHS</span>}
              {f.why && <span className="bs-card__why">{f.why}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
