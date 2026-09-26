"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { awardHref } from "@/lib/awards";

/**
 * Ukrainska 15's file on the desk: a red card pocket folder in the live
 * site's accent, and beside it the flash player with the site's song.
 *
 * Closed, the folder lies in the row like the other files, the prints and
 * the library card standing out of its pocket. A click opens it where it
 * lies: the folder slides down out of the way, the other files slide off to
 * the right, the two stacks of prints rise up out of the pocket (and can
 * then be dragged anywhere on the desk), the library card of its awards
 * goes to the left, the player to the right, and a tag out of the pocket
 * leads to the case's own page (where the story and the live site are now,
 * rather than a booklet and a tablet on the desk). A click on the folder
 * again, or leaving the desk, puts it all back.
 *
 * Everything is laid out in the folder's own units (150 × 208, each K desk
 * px; see .env in globals.css for why it is drawn 3× up), and the open
 * layout is for the camera's pan 0, where the axis is over desk x 1412.
 */

export const U15_OPEN = "kate:u15-open";      // → DeskScene pans home
export const U15_RESET = "kate:u15-reset";    // ← DeskScene, leaving the desk
export const U15_CLOSE = "kate:u15-close";    // ← DeskScene: Escape, or another case in focus
export const U15_CLOSED = "kate:u15-closed";  // → DeskScene, put away

// The folder is drawn 1.15× a real A4 pocket so that, opened, the card and
// the prints read at the camera's height without zooming. Inside
// it everything is in folder units (150 × 208); a unit is K desk px.
const FOLDER = { w: 150, h: 208 };
const K = 1.15;
const SPD = 2150 / 860;                       // screen px per desk px at the camera's height (× --u)

// The round CSSDA seals, stuck on as die-cut stickers in their own colours;
// MUSE Gold is printed in its foil and French Design Awards (no artwork) is a
// struck ink stamp.
const STICKERS = [
  { src: "cssda-ui-paper.webp", cls: "ui" },
  { src: "cssda-ux-paper.webp", cls: "ux" },
  { src: "cssda-inn-paper.webp", cls: "inn" },
  { src: "cssda-kudos-paper.webp", cls: "kudos" },
] as const;

// Two stacks of prints tucked in the pocket, the family before and the house
// after (public/artefacts/ukrainska-15/family, after — the live site's own
// sets). First is on top. [file, width, height, tilt]
const STACKS = [
  { key: "family", prints: [[1, 547, 378, -2], [2, 532, 378, 3], [4, 500, 400, -5], [5, 500, 400, 6], [3, 336, 400, 4], [6, 273, 378, -3]] },
  { key: "after", prints: [[2, 700, 444, 2], [6, 500, 444, -4], [1, 400, 444, 5], [3, 400, 420, -2], [4, 300, 396, 3], [5, 300, 420, -5], [7, 300, 420, 4], [8, 300, 420, -1]] },
] as const;

// In front of the prints, a library book card — but what it has been out to
// is juries. Dates are stamped only where the award's own page gives one.
// Each row opens its jury's winner page (lib/awards.ts), where there is one.
const LENDINGS = [
  { id: "muse-u15-2", jury: "MUSE Creative Awards", award: "Gold · Causes & Awareness" },
  { id: "muse-u15-1", jury: "MUSE Creative Awards", award: "Gold · Strange & Unusual" },
  { id: "cssda-u15", jury: "CSS Design Awards", award: "Best UI Design" },
  { id: "cssda-u15", jury: "CSS Design Awards", award: "Best UX Design" },
  { id: "cssda-u15", jury: "CSS Design Awards", award: "Best Innovation" },
  { id: "cssda-u15", jury: "CSS Design Awards", award: "Special Kudos" },
  { id: "csswinner-u15", jury: "CSS Winner", award: "Star" },
  { id: "cssnectar-u15", jury: "CSS Nectar", award: "Site of the Day", date: "11 MAR 2026" },
  { id: "designnominees-u15", jury: "Design Nominees", award: "Site of the Day", date: "06 MAR 2026" },
  { id: "french-u15", jury: "French Design Awards", award: "Silver" },
];

type Pt = { x: number; y: number };

// Where each thing goes once the folder is open, as an offset from where it
// lies closed (folder units) and the angle it lands at. The layout is for the
// camera at pan 0, clear of the nav column on the left (it stays on the desk
// too): the card left, the stacks up, the player right, the tag to the
// case's page between them, the folder down.
const OPEN: Record<string, Pt & { r: number }> = {
  sleeve: { x: -20, y: 175, r: -2 },
  family: { x: 32.5, y: -40, r: 4 },
  after: { x: 105, y: -52, r: -3 },
  card: { x: 10, y: 31, r: -4 },
  player: { x: 100, y: 22, r: 12 },
  tag: { x: 112, y: 30, r: -3 },
};
// On the way out everything first slides straight up out of the pocket,
// together, and only then spreads; on the way back it gathers there first.
const SPILL: Record<string, Pt> = { family: { x: 0, y: -62 }, after: { x: 0, y: -72 }, card: { x: 0, y: -78 }, tag: { x: 0, y: -70 } };
const SPILL_MS = 480, GATHER_MS = 820;
const CLOSED_R: Record<string, number> = { card: -1.5, player: 8 };

export function U15File({ x, y, r }: { x: number; y: number; r: number }) {
  const card = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"closed" | "spill" | "open">("closed");
  const open = phase !== "closed";
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [drag, setDrag] = useState<Record<string, Pt>>({});
  const [top, setTop] = useState<Record<string, number>>({});
  const [held, setHeld] = useState<string | null>(null);
  const z = useRef(20);
  // The prints in the pocket (about a megabyte) are not fetched with home:
  // they load once home has, when the browser is idle — or at once if Case
  // Files opens first — so they are in the pocket before the camera arrives
  // (loaded on the way, they popped in after it had).
  const [warm, setWarm] = useState(false);
  // The envelope itself is drawn from a 600px copy while home only shows it
  // small, and from the full picture from the moment Case Files opens: the
  // camera takes a couple of seconds to come down over it, time enough to
  // fetch the full one before it is seen close.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => { if (root.dataset.desk === "open") { setWarm(true); setNear(true); } };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    const idle = () => (typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(() => setWarm(true), { timeout: 4000 })
      : setTimeout(() => setWarm(true), 400));
    if (document.readyState === "complete") idle(); else window.addEventListener("load", idle, { once: true });
    return () => { mo.disconnect(); window.removeEventListener("load", idle); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (open) { root.dataset.u15 = "open"; dispatchEvent(new Event(U15_OPEN)); }
    else if (root.dataset.u15) { delete root.dataset.u15; dispatchEvent(new Event(U15_CLOSED)); }
  }, [open]);
  const go = (to: "spill", then: "open" | "closed", ms: number) => {
    clearTimeout(timer.current); setPhase(to);
    timer.current = setTimeout(() => setPhase(then), ms);
  };
  const putAway = () => { setDrag({}); setTop({}); go("spill", "closed", GATHER_MS); };
  useEffect(() => {
    const reset = () => { clearTimeout(timer.current); setDrag({}); setTop({}); setPhase("closed"); };
    const close = () => document.querySelector<HTMLElement>(".desk-card--env[data-phase=open] .u15-hit")?.click();
    addEventListener(U15_RESET, reset);
    addEventListener(U15_CLOSE, close);
    return () => { removeEventListener(U15_RESET, reset); removeEventListener(U15_CLOSE, close); clearTimeout(timer.current); delete document.documentElement.dataset.u15; };
  }, []);
  const toggle = () => (phase === "open" ? putAway() : phase === "closed" ? go("spill", "open", SPILL_MS) : undefined);

  // Anything on the open desk follows the pointer: screen px back to folder
  // units, turned into the folder's own axes (it lies at r°). A press that
  // does not travel is a click, and does the thing's own job instead — play
  // the song, put the folder away. Closed,
  // nothing moves; only the clicks work.
  const grab = (id: string, click?: (e: PointerEvent) => void) => (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    try { el.setPointerCapture(e.pointerId); } catch { /* a synthetic press has no pointer to capture */ }
    const scale = (card.current!.offsetWidth / FOLDER.w) * SPD;
    const a = (r * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    const from = drag[id] ?? { x: 0, y: 0 }, sx = e.clientX, sy = e.clientY;
    let moved = false, now = from;
    // while it is carried the element is moved directly (no re-render per
    // pointer move); the state
    // catches up once, when it is put down
    const els = [...card.current!.querySelectorAll<HTMLElement>(`[data-item="${id}"]`)];
    const print = el.classList.contains("u15-print");
    const [vx, vy] = print ? ["--dx", "--dy"] : ["--ox", "--oy"];
    const bx = print ? 0 : Number(el.style.getPropertyValue("--ox")) - from.x;
    const by = print ? 0 : Number(el.style.getPropertyValue("--oy")) - from.y;
    const move = (m: PointerEvent) => {
      if (!open) return;
      if (!moved && Math.hypot(m.clientX - sx, m.clientY - sy) < 5) return;
      if (!moved) { moved = true; z.current += 1; setTop((t) => ({ ...t, [id]: z.current })); setHeld(id); }
      const dx = (m.clientX - sx) / scale, dy = (m.clientY - sy) / scale;
      now = { x: from.x + dx * cos + dy * sin, y: from.y - dx * sin + dy * cos };
      for (const x of els) { x.style.setProperty(vx, String(bx + now.x)); x.style.setProperty(vy, String(by + now.y)); }
    };
    const up = (u: PointerEvent) => {
      setHeld(null);
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      if (moved) setDrag((d) => ({ ...d, [id]: now }));
      else if (u.type === "pointerup") click?.(u);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };
  // the offset and angle of a thing: where the layout puts it, plus the drag
  const place = (id: string, zBase: number) => {
    const o = phase === "open" ? OPEN[id] : undefined, d = drag[id];
    const sp = phase === "spill" ? SPILL[id] : undefined;
    return {
      "--ox": (o?.x ?? sp?.x ?? 0) + (d?.x ?? 0), "--oy": (o?.y ?? sp?.y ?? 0) + (d?.y ?? 0),
      "--rot": `${o ? o.r : CLOSED_R[id] ?? 0}deg`,
      zIndex: open ? top[id] ?? zBase : undefined,
    } as React.CSSProperties;
  };
  const is = (id: string) => ({ "data-held": held === id || undefined, "data-item": id });

  const sleeve = place("sleeve", 5);

  return (
    <div
      ref={card}
      className="desk-card desk-card--env"
      data-slug="ukrainska-15"
      data-x={x}
      data-open={open || undefined}
      data-phase={phase}
      style={{
        left: `calc(${x} * var(--u))`, top: `calc(${y} * var(--u))`,
        "--w": FOLDER.w * K, "--h": FOLDER.h * K, "--r": `${r}deg`, "--k": K,
      } as React.CSSProperties}
    >
      {/* the thickness of what lies here closed — the folder and its
          prints, the player — as edges standing up off the desk (edge-on
          from overhead; gone once it opens) */}
      <span className="env__edge env__edge--front" aria-hidden />
      <span className="env__edge env__edge--right" aria-hidden />
      <span className="env__player" aria-hidden><span className="env__player-l" /><span className="env__player-r" /><span className="env__player-b" /></span>
      <span className="env">
        <span className="env__shadow u15-sleeve u15-item" style={sleeve} aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer env__back u15-sleeve u15-item" {...is("sleeve")} style={sleeve} src={near ? "/artefacts/ukrainska-15/envelope/back.webp?v=4" : "/artefacts/ukrainska-15/envelope/back.sm.webp"} alt="" draggable={false} />

        <Link className="u15-tag" href="/work/ukrainska-15" style={place("tag", 9)} tabIndex={open ? 0 : -1} aria-hidden={!open}>Read the case →</Link>

        {STACKS.map((st) => (
          <span key={st.key} className={`env__stack env__stack--${st.key} u15-item`} data-item={st.key} style={place(st.key, 10)}>
            {[...st.prints].reverse().map(([n, w, h, t], i, all) => {
              const id = `${st.key}-${n}`, d = drag[id];
              return (
                <span
                  key={n}
                  className="env__print-photo u15-print"
                  data-held={held === id || undefined}
                  data-item={id}
                  onPointerDown={(e) => grab(id)(e)}
                  style={{
                    "--t": `${t}deg`, "--dx": d?.x ?? 0, "--dy": d?.y ?? 0,
                    // fanned a little once out of the pocket, top print last
                    "--fan": all.length - 1 - i,
                    aspectRatio: `${w} / ${h}`, zIndex: top[id],
                  } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={warm || open ? `/artefacts/ukrainska-15/${st.key}/${String(n).padStart(2, "0")}.webp` : undefined} alt="" draggable={false} />
                </span>
              );
            })}
          </span>
        ))}

        <span className="env__card u15-item" {...is("card")} style={place("card", 10)} onPointerDown={(e) => grab("card")(e)} aria-hidden={!open}>
          <span className="env__card-head">
            <span>Ukrainska 15</span>
            <span>Voice from the Basement · K. Kazachkova</span>
          </span>
          <span className="env__card-row env__card-row--th"><span>Date</span><span>Jury</span><span>Award</span></span>
          {LENDINGS.map((l) => ({ ...l, href: awardHref(l.id) })).map((l) => l.href ? (
            // a link, not a handle: pressing it opens the page instead of
            // picking the card up (the card still drags from anywhere else)
            <a key={l.award + l.jury} className="env__card-row env__card-row--link" href={l.href} target="_blank" rel="noopener noreferrer"
              tabIndex={open ? 0 : -1} aria-label={`${l.jury} – ${l.award}: winner page`} onPointerDown={(e) => e.stopPropagation()}>
              <span className="env__card-date">{l.date ?? ""}</span><span>{l.jury}</span><span>{l.award}</span>
            </a>
          ) : (
            <span key={l.award + l.jury} className="env__card-row">
              <span className="env__card-date">{l.date ?? ""}</span><span>{l.jury}</span><span>{l.award}</span>
            </span>
          ))}
        </span>


        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer u15-sleeve u15-item" {...is("sleeve")} style={sleeve} src={near ? "/artefacts/ukrainska-15/envelope/pocket.webp?v=4" : "/artefacts/ukrainska-15/envelope/pocket.sm.webp"} alt="" draggable={false} />
        <span className="env__print u15-sleeve u15-item" {...is("sleeve")} style={sleeve} aria-hidden>
          <span className="env__no">01</span>
          <span className="env__where">Ukrainska 15 · Kupiansk</span>
          <span className="env__big">15</span>
        </span>
        <span className="env__stamps u15-sleeve u15-item" {...is("sleeve")} style={sleeve} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="env__stamp env__stamp--muse" src="/stamps/awards/muse-gold.sm.webp" alt="" draggable={false} />
          {STICKERS.map((k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k.src} className={`env__sticker env__sticker--${k.cls}`} src={`/stamps/awards/${k.src}`} alt="" draggable={false} />
          ))}
          <span className="env__stamp env__stamp--fda">French Design Awards<b>Silver</b>2026</span>
        </span>
        <button
          type="button"
          className="u15-hit u15-sleeve u15-item"
          {...is("sleeve")}
          style={{ ...sleeve, zIndex: open ? (top.sleeve ?? 5) + 1 : 30 }}
          tabIndex={-1}
          aria-expanded={open}
          aria-label={open ? "Put Ukrainska 15 away" : "Open Ukrainska 15"}
          onPointerDown={(e) => grab("sleeve", toggle)(e)}
          onClick={(e) => { if (e.detail === 0) toggle(); }}   // keyboard
        />

        <DeskPlayer place={place("player", 12)} held={held === "player"} onGrab={(e, play) => grab("player", play)(e)} />
      </span>
    </div>
  );
}

// Beside the folder, the song Kate made for the site, on a 2000s flash
// player (public/artefacts/ukrainska-15/player/). Click plays, click again
// pauses; the LCD lights up and scrolls the title while it plays. The body
// is ~8 cm; the cut-out with its earbuds is 58 × 124 desk px.
const SONG = { title: "Still live in my mind", src: "/artefacts/ukrainska-15/player/still-live-in-my-mind.mp3" };
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function DeskPlayer({ place, held, onGrab }: {
  place: React.CSSProperties; held: boolean;
  onGrab: (e: React.PointerEvent<HTMLElement>, play: () => void) => void;
}) {
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
      className="desk-player u15-item"
      data-item="player"
      data-playing={playing || undefined}
      data-held={held || undefined}
      tabIndex={-1}
      aria-label={`${playing ? "Pause" : "Play"} “${SONG.title}”`}
      aria-pressed={playing}
      onPointerDown={(e) => onGrab(e, toggle)}
      onClick={(e) => { if (e.detail === 0) toggle(); }}
      style={place}
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
