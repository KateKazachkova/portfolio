"use client";

import { useEffect, useRef, useState } from "react";
import { booklet } from "@/content/work/ukrainska-15-booklet";

/**
 * Ukrainska 15's file on the desk: a red card pocket folder in the live
 * site's accent, and beside it the flash player with the site's song.
 *
 * Closed, the folder lies in the row like the other files, the prints and
 * the library card standing out of its pocket. A click opens it where it
 * lies: the folder slides down out of the way, the other files slide off to
 * the right, the two stacks of prints rise up out of the pocket (and can
 * then be dragged anywhere on the desk), the library card of its awards
 * goes to the left, the booklet about the site to the middle, the player to
 * the right. A click on the folder again, or leaving the desk, puts it all
 * back.
 *
 * Everything is laid out in the folder's own units (150 × 208, each K desk
 * px; see .env in globals.css for why it is drawn 3× up), and the open
 * layout is for the camera's pan 0, where the axis is over desk x 1612.
 */

export const U15_OPEN = "kate:u15-open";      // → DeskScene pans home
export const U15_RESET = "kate:u15-reset";    // ← DeskScene, leaving the desk

// The folder is drawn 1.3× a real A4 pocket so that, opened, the card, the
// booklet and the prints read at the camera's height without zooming. Inside
// it everything is in folder units (150 × 208); a unit is K desk px.
const FOLDER = { w: 150, h: 208 };
const K = 1.3;
const SPD = 2150 / 860;                       // screen px per desk px at the camera's height (× --u)

// The round CSSDA seals, stuck on as die-cut stickers in their own colours;
// MUSE Gold is printed in its foil and French Design Awards (no artwork) is a
// struck ink stamp.
const STICKERS = [
  { src: "cssda-ui.png", cls: "ui" },
  { src: "cssda-ux.png", cls: "ux" },
  { src: "cssda-inn.png", cls: "inn" },
  { src: "cssda-kudos.png", cls: "kudos" },
] as const;

// Two stacks of prints tucked in the pocket, the family before and the house
// after (public/artefacts/ukrainska-15/family, after — the live site's own
// sets). First is on top. [file, width, height, tilt]
const STACKS = [
  { key: "family", prints: [[1, 547, 378, -2], [2, 532, 378, 3], [4, 500, 400, -5], [5, 500, 400, 6], [3, 336, 400, 4], [6, 273, 378, -3], [7, 1280, 1280, 2]] },
  { key: "after", prints: [[2, 700, 444, 2], [6, 500, 444, -4], [1, 400, 444, 5], [3, 400, 420, -2], [4, 300, 396, 3], [5, 300, 420, -5], [7, 300, 420, 4], [8, 300, 420, -1]] },
] as const;

// In front of the prints, a library book card — but what it has been out to
// is juries. Dates are stamped only where the award's own page gives one.
const LENDINGS = [
  { jury: "MUSE Creative Awards", award: "Gold · Causes & Awareness" },
  { jury: "MUSE Creative Awards", award: "Gold · Strange & Unusual" },
  { jury: "CSS Design Awards", award: "Best UI Design" },
  { jury: "CSS Design Awards", award: "Best UX Design" },
  { jury: "CSS Design Awards", award: "Best Innovation" },
  { jury: "CSS Design Awards", award: "Special Kudos" },
  { jury: "CSS Winner", award: "Star" },
  { jury: "CSS Nectar", award: "Site of the Day", date: "11 MAR 2026" },
  { jury: "Design Nominees", award: "Site of the Day", date: "06 MAR 2026" },
  { jury: "French Design Awards", award: "Silver" },
];

type Drag = Record<string, { x: number; y: number }>;

export function U15File({ x, y, r }: { x: number; y: number; r: number }) {
  const card = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<Drag>({});
  const [top, setTop] = useState<Record<string, number>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [page, setPage] = useState(0);                      // booklet leaves turned
  const z = useRef(20);

  useEffect(() => {
    const root = document.documentElement;
    if (open) { root.dataset.u15 = "open"; dispatchEvent(new Event(U15_OPEN)); }
    else delete root.dataset.u15;
  }, [open]);
  useEffect(() => {
    const reset = () => { setOpen(false); setDrag({}); setTop({}); setPage(0); };
    addEventListener(U15_RESET, reset);
    return () => { removeEventListener(U15_RESET, reset); delete document.documentElement.dataset.u15; };
  }, []);
  const toggle = () => { if (open) { setDrag({}); setTop({}); setPage(0); } setOpen(!open); };

  // A print follows the pointer across the desk: screen px back to desk px,
  // and turned into the folder's own axes (it lies at r°).
  const grab = (id: string) => (e: React.PointerEvent<HTMLElement>) => {
    if (!open || e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const scale = (card.current!.offsetWidth / FOLDER.w) * SPD;
    const a = (r * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    const from = drag[id] ?? { x: 0, y: 0 }, sx = e.clientX, sy = e.clientY;
    z.current += 1; setTop((t) => ({ ...t, [id]: z.current })); setHeld(id);
    const move = (m: PointerEvent) => {
      const dx = (m.clientX - sx) / scale, dy = (m.clientY - sy) / scale;
      setDrag((d) => ({ ...d, [id]: { x: from.x + dx * cos + dy * sin, y: from.y - dx * sin + dy * cos } }));
    };
    const up = () => { setHeld(null); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  return (
    <div
      ref={card}
      className="desk-card desk-card--env"
      data-open={open || undefined}
      style={{
        left: `calc(${x} * var(--u))`, top: `calc(${y} * var(--u))`,
        "--w": FOLDER.w * K, "--h": FOLDER.h * K, "--r": `${r}deg`, "--k": K,
      } as React.CSSProperties}
    >
      <span className="env">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer env__back u15-sleeve" src="/artefacts/ukrainska-15/envelope/back.webp?v=3" alt="" draggable={false} />

        {STACKS.map((st) => (
          <span key={st.key} className={`env__stack env__stack--${st.key}`}>
            {[...st.prints].reverse().map(([n, w, h, t], i, all) => {
              const id = `${st.key}-${n}`, d = drag[id];
              return (
                <span
                  key={n}
                  className="env__print-photo u15-print"
                  data-held={held === id || undefined}
                  onPointerDown={grab(id)}
                  style={{
                    "--t": `${t}deg`, "--dx": d?.x ?? 0, "--dy": d?.y ?? 0,
                    // fanned a little once out of the pocket, top print last
                    "--fan": all.length - 1 - i,
                    aspectRatio: `${w} / ${h}`, zIndex: top[id],
                  } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/artefacts/ukrainska-15/${st.key}/${String(n).padStart(2, "0")}.webp`} alt="" draggable={false} />
                </span>
              );
            })}
          </span>
        ))}

        <span className="env__card" aria-hidden={!open}>
          <span className="env__card-head">
            <span>Ukrainska 15</span>
            <span>Voice from the Basement · K. Kazachkova</span>
          </span>
          <span className="env__card-row env__card-row--th"><span>Date</span><span>Jury</span><span>Award</span></span>
          {LENDINGS.map((l) => (
            <span key={l.award + l.jury} className="env__card-row">
              <span className="env__card-date">{l.date ?? ""}</span><span>{l.jury}</span><span>{l.award}</span>
            </span>
          ))}
        </span>

        <Booklet live={open} at={page} onTurn={setPage} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer u15-sleeve" src="/artefacts/ukrainska-15/envelope/pocket.webp?v=3" alt="" draggable={false} />
        <span className="env__print u15-sleeve" aria-hidden>
          <span className="env__no">01</span>
          <span className="env__where">Ukrainska 15 · Kupiansk</span>
          <span className="env__big">15</span>
        </span>
        <span className="env__stamps u15-sleeve" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="env__stamp env__stamp--muse" src="/stamps/awards/muse-gold.png" alt="" draggable={false} />
          {STICKERS.map((k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k.src} className={`env__sticker env__sticker--${k.cls}`} src={`/stamps/awards/${k.src}`} alt="" draggable={false} />
          ))}
          <span className="env__stamp env__stamp--fda">French Design Awards<b>Silver</b>2026</span>
        </span>
        <button
          type="button"
          className="u15-hit u15-sleeve"
          tabIndex={-1}
          aria-expanded={open}
          aria-label={open ? "Put Ukrainska 15 away" : "Open Ukrainska 15"}
          onClick={toggle}
        />
      </span>
    </div>
  );
}

/**
 * The mini booklet: a stapled A6 book that turns its pages. Leaves hinge on
 * the spine and turn in 3D (the camera looks straight down, so the booklet's
 * own perspective reads true); a click on the right half turns forward, on
 * the left half back. Closed or finished, the book shifts half a page so
 * the single cover sits in the middle.
 */
function Booklet({ live, at, onTurn }: { live: boolean; at: number; onTurn: (n: number) => void }) {
  const faces: React.ReactNode[] = [
    <span key="cover" className="u15-page u15-page--cover">
      <span className="u15-cover__kicker">{booklet.kicker}</span>
      <span className="u15-cover__title">{booklet.title}</span>
      <span className="u15-cover__big">15</span>
      <span className="u15-cover__place">{booklet.place}<br />{booklet.years}</span>
    </span>,
    ...booklet.pages.map((p, i) => (
      <span key={p.heading} className="u15-page">
        <span className="u15-page__label">{String(i + 1).padStart(2, "0")} · {p.label}</span>
        <span className="u15-page__heading">{p.heading}</span>
        <span className="u15-page__text">{p.text}</span>
        <span className="u15-page__no">{i + 1}</span>
      </span>
    )),
  ];
  if (faces.length % 2 === 0) faces.push(<span key="blank" className="u15-page u15-page--blank" />);
  faces.push(
    <span key="back" className="u15-page u15-page--back">
      <span className="u15-cover__place">{booklet.url}</span>
    </span>,
  );
  const leaves = Math.ceil(faces.length / 2);
  const turn = (e: React.MouseEvent<HTMLElement>) => {
    if (!live) return;
    const b = e.currentTarget.getBoundingClientRect();
    const fwd = e.clientX > b.left + b.width / 2;
    onTurn(Math.max(0, Math.min(leaves, at + (fwd ? 1 : -1))));
  };
  return (
    <span
      className="u15-book"
      data-at={at === 0 ? "start" : at === leaves ? "end" : undefined}
      role={live ? "button" : undefined}
      aria-label={live ? `Booklet: ${booklet.title}, spread ${at} of ${leaves}` : undefined}
      onClick={turn}
    >
      {Array.from({ length: leaves }, (_, i) => (
        <span
          key={i}
          className="u15-leaf"
          data-turned={i < at || undefined}
          style={{ zIndex: i < at ? i + 1 : leaves - i } as React.CSSProperties}
        >
          <span className="u15-leaf__face">{faces[2 * i]}</span>
          <span className="u15-leaf__face u15-leaf__face--back">{faces[2 * i + 1]}</span>
        </span>
      ))}
    </span>
  );
}

// Beside the folder, the song Kate made for the site, on a 2000s flash
// player (public/artefacts/ukrainska-15/player/). Click plays, click again
// pauses; the LCD lights up and scrolls the title while it plays. Desk px:
// the body is ~8 cm (86 px); the cut-out with its earbuds is 58 × 124.
const PLAYER = { x: 1668, y: 598, w: 58, h: 124, r: 5 };
const SONG = { title: "Still live in my mind", src: "/artefacts/ukrainska-15/player/still-live-in-my-mind.mp3" };
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function DeskPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  // leaving the desk (Back, Escape, Case Files again) stops the song
  useEffect(() => {
    const stop = () => audio.current?.pause();
    addEventListener(U15_RESET, stop);
    return () => removeEventListener(U15_RESET, stop);
  }, []);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  return (
    <button
      type="button"
      className="desk-player"
      data-playing={playing || undefined}
      tabIndex={-1}
      aria-label={`${playing ? "Pause" : "Play"} “${SONG.title}”`}
      aria-pressed={playing}
      onClick={toggle}
      style={{
        left: `calc(${PLAYER.x} * var(--u))`, top: `calc(${PLAYER.y} * var(--u))`,
        "--w": PLAYER.w, "--h": PLAYER.h, "--r": `${PLAYER.r}deg`,
      } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/artefacts/ukrainska-15/player/player.webp" alt="" draggable={false} />
      <span className="desk-player__lcd" aria-hidden>
        <span className="desk-player__title"><span>{SONG.title}</span></span>
        <span className="desk-player__time">{playing ? "▶" : "❚❚"} {clock(time)}</span>
      </span>
      <audio
        ref={audio} src={SONG.src} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setTime(0)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
    </button>
  );
}
