"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { booklet, type BookletChapter, type BookletClip } from "@/content/work/ukrainska-15-booklet";

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
export const U15_CLOSE = "kate:u15-close";    // ← DeskScene: Escape, or another case in focus
export const U15_CLOSED = "kate:u15-closed";  // → DeskScene, put away

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

type Pt = { x: number; y: number };

// Where each thing goes once the folder is open, as an offset from where it
// lies closed (folder units) and the angle it lands at. The layout is for the
// camera at pan 0: the card left, the booklet to the middle, the stacks up,
// the player right, the tablet slid out bottom right, the folder down.
// The booklet (nearly the folder's own size, so it lies in the pocket behind
// the prints) takes the middle of the desk; everything else is laid round
// its edges, in sight but out of the way, and can be pulled out from under it.
const OPEN: Record<string, Pt & { r: number }> = {
  sleeve: { x: -20, y: 190, r: -2 },
  family: { x: -67.5, y: -63, r: 4 },
  after: { x: 169.5, y: -74.6, r: -3 },
  card: { x: -120, y: 31, r: -4 },
  book: { x: 55.5, y: -12.5, r: 1 },
  player: { x: 129, y: 20, r: 12 },
  tablet: { x: 160, y: 95, r: -4 },
};
// On the way out everything first slides straight up out of the pocket,
// together, and only then spreads; on the way back it gathers there first.
const SPILL: Record<string, Pt> = { family: { x: 0, y: -62 }, after: { x: 0, y: -72 }, card: { x: 0, y: -78 }, book: { x: 0, y: -70 } };
const SPILL_MS = 480, GATHER_MS = 820;
const CLOSED_R: Record<string, number> = { card: -1.5, player: 8, tablet: 5 };

export function U15File({ x, y, r }: { x: number; y: number; r: number }) {
  const card = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"closed" | "spill" | "open">("closed");
  const open = phase !== "closed";
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [drag, setDrag] = useState<Record<string, Pt>>({});
  const [top, setTop] = useState<Record<string, number>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [page, setPage] = useState(0);                      // booklet leaves turned
  const [screen, setScreen] = useState(false);              // the tablet, raised
  const z = useRef(20);

  useEffect(() => {
    const root = document.documentElement;
    if (open) { root.dataset.u15 = "open"; dispatchEvent(new Event(U15_OPEN)); }
    else if (root.dataset.u15) { delete root.dataset.u15; dispatchEvent(new Event(U15_CLOSED)); }
  }, [open]);
  const go = (to: "spill", then: "open" | "closed", ms: number) => {
    clearTimeout(timer.current); setPhase(to);
    timer.current = setTimeout(() => setPhase(then), ms);
  };
  const putAway = () => { setDrag({}); setTop({}); setPage(0); setScreen(false); go("spill", "closed", GATHER_MS); };
  useEffect(() => {
    const reset = () => { clearTimeout(timer.current); setDrag({}); setTop({}); setPage(0); setScreen(false); setPhase("closed"); };
    const close = () => document.querySelector<HTMLElement>(".desk-card--env[data-phase=open] .u15-hit")?.click();
    addEventListener(U15_RESET, reset);
    addEventListener(U15_CLOSE, close);
    return () => { removeEventListener(U15_RESET, reset); removeEventListener(U15_CLOSE, close); clearTimeout(timer.current); delete document.documentElement.dataset.u15; };
  }, []);
  const toggle = () => (phase === "open" ? putAway() : phase === "closed" ? go("spill", "open", SPILL_MS) : undefined);

  // Anything on the open desk follows the pointer: screen px back to folder
  // units, turned into the folder's own axes (it lies at r°). A press that
  // does not travel is a click, and does the thing's own job instead — turn
  // a page, play the song, raise the tablet, put the folder away. Closed,
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
    // pointer move — the booklet alone is dozens of pages); the state
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
      <span className="env">
        <Tablet place={place("tablet", 8)} held={held === "tablet"} onPointerDown={(e) => grab("tablet", () => setScreen(true))(e)} onOpen={() => setScreen(true)} />

        <span className="env__shadow u15-sleeve u15-item" style={sleeve} aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer env__back u15-sleeve u15-item" {...is("sleeve")} style={sleeve} src="/artefacts/ukrainska-15/envelope/back.webp?v=3" alt="" draggable={false} />

        {/* the booklet, behind the prints in the pocket */}
        <Booklet live={open} at={page} held={held === "book"} place={place("book", 11)}
          onGrab={(e, turn) => grab("book", turn)(e)} onTurn={setPage} />

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
                  <img src={`/artefacts/ukrainska-15/${st.key}/${String(n).padStart(2, "0")}.webp`} alt="" draggable={false} />
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
          {LENDINGS.map((l) => (
            <span key={l.award + l.jury} className="env__card-row">
              <span className="env__card-date">{l.date ?? ""}</span><span>{l.jury}</span><span>{l.award}</span>
            </span>
          ))}
        </span>


        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__layer u15-sleeve u15-item" {...is("sleeve")} style={sleeve} src="/artefacts/ukrainska-15/envelope/pocket.webp?v=3" alt="" draggable={false} />
        <span className="env__print u15-sleeve u15-item" {...is("sleeve")} style={sleeve} aria-hidden>
          <span className="env__no">01</span>
          <span className="env__where">Ukrainska 15 · Kupiansk</span>
          <span className="env__big">15</span>
        </span>
        <span className="env__stamps u15-sleeve u15-item" {...is("sleeve")} style={sleeve} aria-hidden>
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
      {screen && <TabletScreen onClose={() => setScreen(false)} />}
    </div>
  );
}

// The booklet's pages: each chapter's paragraphs poured into pages of about
// LINES lines of CHARS characters (the page's measure at its type size),
// a chapter's first page shorter by its heading; a paragraph that will not fit is
// broken at a sentence and carried over. Deliberately a little short of
// full, so nothing is ever cut off.
type Para = { t: string; pull?: boolean };
type Page = { head?: { label: string; kicker?: string; heading: string }; paras: Para[]; cont?: boolean; clips: BookletClip[] };
const CHARS = 44, LINES = 29;
// the heading (≈19 capitals to a line, each 1.3 text lines) and the rule under it
const headLines = (h: string) => 1.8 + Math.ceil(h.length / 19) * 1.3;
const linesOf = (t: string) => Math.ceil(t.length / CHARS) + 0.5;
function paginate(chapters: BookletChapter[]): Page[] {
  const out: Page[] = [];
  for (const ch of chapters) {
    let page: Page = { head: { label: ch.label, kicker: ch.kicker, heading: ch.heading }, paras: [], clips: [] };
    let room = LINES - headLines(ch.heading);
    const turn = (cont: boolean) => { out.push(page); page = { paras: [], cont, clips: [] }; room = LINES; };
    ch.paragraphs.forEach((para, i) => {
      if (room < 2) turn(false);
      const clip = ch.clips?.[i];
      if (clip) page.clips.push(clip);
      const pull = ch.pull === i;
      const cost = (t: string) => linesOf(t) * (pull ? 1.4 : 1);
      let rest = para;
      while (rest) {
        if (cost(rest) <= room) { page.paras.push({ t: rest, pull }); room -= cost(rest); rest = ""; break; }
        // as many whole sentences as fit
        const sentences = rest.match(/[^.!?]+[.!?]+[”’"]?\s*|.+$/g) ?? [rest];
        let fit = "";
        for (const sn of sentences) { if (cost(fit + sn) <= room) fit += sn; else break; }
        if (!fit && page.paras.length === 0) { page.paras.push({ t: rest, pull }); room = 0; rest = ""; break; }  // one huge sentence
        if (!fit) { turn(false); continue; }
        page.paras.push({ t: fit.trim(), pull }); rest = rest.slice(fit.length).trim();
        turn(true);
      }
    });
    out.push(page);
  }
  return out;
}

/**
 * The mini booklet: a stapled A6 book that turns its pages. Leaves hinge on
 * the spine and turn in 3D (the camera looks straight down, so the booklet's
 * own perspective reads true); a click on the right half turns forward, on
 * the left half back. Closed or finished, the book shifts half a page so
 * the single cover sits in the middle.
 */
const PAGES = paginate(booklet.chapters);

function Booklet({ live, at, held, place, onGrab, onTurn }: {
  live: boolean; at: number; held: boolean; place: React.CSSProperties;
  onGrab: (e: React.PointerEvent<HTMLElement>, turn: (e: PointerEvent) => void) => void;
  onTurn: (n: number) => void;
}) {
  const faces: React.ReactNode[] = [
    <span key="cover" className="u15-page u15-page--cover">
      <span className="u15-cover__title">{booklet.title}</span>
      <span className="u15-cover__lede">{booklet.lede}</span>
      <span className="u15-cover__big">15</span>
      <span className="u15-cover__place">{booklet.tags}<br />{booklet.years}</span>
    </span>,
    ...PAGES.map((pg, i) => (
      <span key={i} className="u15-page-wrap">
        <span className="u15-page">
          <span className="u15-page__rail">
            {pg.head && <>
              <span className="u15-page__num">{pg.head.label}</span>
              {pg.head.kicker && <span className="u15-page__kick">{pg.head.kicker}</span>}
            </>}
          </span>
          <span className="u15-page__body">
            {pg.head && <span className="u15-page__heading">{pg.head.heading}</span>}
            {pg.paras.map((p, j) => (
              <span key={j} className={p.pull ? "u15-page__p u15-page__pull" : "u15-page__p"} data-cont={(j === 0 && pg.cont) || undefined}>{p.t}</span>
            ))}
          </span>
          <span className="u15-page__no">{i + 1}</span>
        </span>
        {pg.clips.map((c, k) => (
          <span key={c.src} className="u15-clip" data-n={k} style={{ "--t": `${c.tilt}deg` } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={c.alt} draggable={false} />
            <svg className="u15-clip__wire" viewBox="0 0 12 34" aria-hidden>
              <path d="M4 30V7a3 3 0 0 1 6 0v21a5 5 0 0 1-10 0V9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
        ))}
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
  const inner = useRef<HTMLSpanElement>(null);
  // forward on the right half of what shows, back on the left
  const turn = (e: PointerEvent) => {
    if (!live || !inner.current) return;
    const b = inner.current.getBoundingClientRect();
    const fwd = e.clientX > b.left + b.width / 2;
    onTurn(Math.max(0, Math.min(leaves, at + (fwd ? 1 : -1))));
  };
  return (
    <span
      className="u15-book u15-item"
      data-item="book"
      data-held={held || undefined}
      style={place}
      role={live ? "button" : undefined}
      aria-label={live ? `Booklet: ${booklet.title}, spread ${at} of ${leaves}` : undefined}
      onPointerDown={(e) => onGrab(e, turn)}
    >
     <span ref={inner} className="u15-book__inner" data-at={at === 0 ? "start" : at === leaves ? "end" : undefined}>
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
    </span>
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

// The live site, on Kate's own blue 10th-generation tablet (landscape,
// 248.6 × 179.5 mm). On the desk its screen plays a scroll through the
// story (public/artefacts/ukrainska-15/tablet/site-scroll.mp4, recorded off
// the live site); a click raises it to the camera with the real site inside.
// The screen is 4.08% / 3.32% in, 91.3 × 88.6% of the cut-out (2360 × 1640).
const SITE = "https://ukrainska15.com/";

function Tablet({ place, held, onPointerDown, onOpen }: {
  place: React.CSSProperties; held: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void; onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="u15-tablet u15-item"
      data-item="tablet"
      data-held={held || undefined}
      style={place}
      tabIndex={-1}
      aria-label="Open the live site, ukrainska15.com"
      aria-haspopup="dialog"
      onPointerDown={onPointerDown}
      onClick={(e) => { if (e.detail === 0) onOpen(); }}   // keyboard
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/artefacts/ukrainska-15/tablet/tablet.webp" alt="" draggable={false} />
      <video className="u15-tablet__screen" src="/artefacts/ukrainska-15/tablet/site-scroll.mp4"
        poster="/artefacts/ukrainska-15/tablet/site-poster.jpg" muted loop playsInline autoPlay preload="metadata" />
    </button>
  );
}

// Raised: the tablet over the whole window, the real site running in its
// screen. Escape, the backdrop or ✕ put it back; the site can also be
// opened in its own tab. (ukrainska15.com has to allow this page as a frame
// ancestor in its _headers for the frame to load.)
function TabletScreen({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); } };
    addEventListener("keydown", key, true);
    return () => removeEventListener("keydown", key, true);
  }, [onClose]);
  return createPortal(
    <div className="u15-raised" role="dialog" aria-modal="true" aria-label="ukrainska15.com" onClick={onClose}>
      <div className="u15-raised__tablet" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/artefacts/ukrainska-15/tablet/tablet.webp" alt="" draggable={false} />
        <iframe className="u15-raised__site" src={SITE} title="Ukrainska 15 — Voice from the Basement" allow="autoplay" />
      </div>
      <div className="u15-raised__bar" onClick={(e) => e.stopPropagation()}>
        <a href={SITE} target="_blank" rel="noopener">Open ukrainska15.com ↗</a>
        <button type="button" onClick={onClose} aria-label="Put the tablet down">✕</button>
      </div>
    </div>,
    document.body,
  );
}
