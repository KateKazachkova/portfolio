"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * The desk the case stands on at night, as a room the camera can move in.
 *
 * At rest this is the same picture the flat plate used to be: the planes are
 * laid out in render_desk.py's camera (f 2150 px/m, eye 0.40 m above the desk,
 * the case's base 2 m away, the desk's vanishing point on the case's centre
 * line at (560, 226) of the 1118 × 745 box), and their textures are that
 * plate projected back onto them (delete/render_desk3d.py). Everything is in
 * the box's own px, scaled to its real width through --u (see .scene-cam).
 *
 * Case Files moves the camera instead of the page: it rises to 0.8 m over the
 * row of case files and looks straight down (90°), then pans along it, the case leaves
 * past the top of the frame, and the case files — lying on the desk all
 * along, slivers in front of the case — fill the view. The URL
 * becomes /#case-files, so Back, Escape or Case Files again bring it home.
 * The desk is home's scene in every theme. The prototype this came from is
 * public/proto/desk.html.
 *
 * Recognition is the same camera's second stop: it stays at the case's eye
 * height, dollies in and to the right and tips down 12°, so the frame is the
 * wall behind the case with a strip of desk under it, the Davey trophy
 * standing there on the left (the case's edge just in shot beside it) and the
 * wall to its right for the rest of the recognition. The URL becomes
 * /#recognition, and it closes the same ways.
 */

// The case files. Each will be its own kind of object — a zine, a stack, a
// folder — so for now each lies there as a reference picture of the object
// it will become (public/scene/desk3d/placeholders/, Kate's picks), labelled
// with the project it stands for. Portfolio has no picture yet and stays a
// plain card. Sizes are desk px (1075 per metre), roughly the real objects.
// x, y are the centre on the desk plane from its left/back corner.
//
// They lie in one row along the desk, laid down by hand rather than on a
// grid, starting just right of the nav column. From the camera's end height
// they are ~2.5 screen px per desk px — more than fits across the window,
// which is why the camera pans along the row (see the pan in useDeskCamera).
const CASES = [
  { slug: "ukrainska-15", title: "Ukrainska 15", img: "envelope", w: 150, h: 208, x: 1559, y: 575, r: -3 },
  { slug: "bulksource", title: "BulkSource", img: "bulksource", w: 210, h: 261, x: 1809, y: 548, r: 3 },
  { slug: "onsisoft", title: "OnsiSoft", img: "onsisoft", w: 190, h: 257, x: 2079, y: 570, r: -2 },
  { slug: "waypro", title: "WayPro · VerDistro", img: "waypro", w: 230, h: 230, x: 2359, y: 552, r: 2 },
  { slug: "my-portfolio2026", title: "Portfolio & My Branding", img: null, w: 180, h: 126, x: 2634, y: 580, r: -1.5 },
] as const;
const ROW_END = 2724 + 70;         // right edge of the last object, plus a margin
const VIEW_X = 1612.5;             // desk x under the camera's axis at pan 0
const SPD = 2150 / 860;            // screen px per desk px at the end height (× --u)

export const DESK_EVENT = "kate:case-files";
export const AWARD_EVENT = "kate:recognition";
type View = "files" | "award";
const HASH: Record<View, string> = { files: "#case-files", award: "#recognition" };
// html[data-desk] for each view; "open" is the desk's, from before it had a second
const STATE: Record<View, string> = { files: "open", award: "award" };
const viewOf = (hash: string) =>
  (Object.keys(HASH) as View[]).find((v) => HASH[v] === hash) ?? null;

// The Davey trophy, standing on the desk against the wall right of the case:
// 56 cm tall (600 box px), its front 7 cm off the wall (z -190), and far
// enough right that from the case's camera the window's edge cuts it about
// in half at 1512px (x is its centre).
const AWARD = { x: 1240, h: 600, z: -190 };
const AWARD_W = Math.round(AWARD.h * 1033 / 3590);   // the still's own aspect
// how far its shadow falls on the wall, 8 cm behind it (box px)
const CAST = { x: 34, y: 20 };

// Ukrainska 15's file: a red card pocket folder (public/artefacts/ukrainska-15/
// envelope/, generated empty in two layers so the papers can go in between
// later), in the live site's accent. The print and the award stamps are set
// here rather than generated, so the type and the seals stay true.
// The round CSSDA seals, stuck on as die-cut stickers in their own colours;
// MUSE Gold is printed in its foil and French Design Awards (no artwork) is a
// struck ink stamp.
const STICKERS = [
  { src: "cssda-ui.png", cls: "ui" },
  { src: "cssda-ux.png", cls: "ux" },
  { src: "cssda-inn.png", cls: "inn" },
  { src: "cssda-kudos.png", cls: "kudos" },
] as const;

// What's in the folder so far: two stacks of prints tucked in the pocket,
// the family before and the house after (public/artefacts/ukrainska-15/
// family, after — the live site's own sets). Only the top few are drawn;
// the rest wait for the folder to be opened. First is on top.
const STACKS = [
  { key: "family", prints: [[1, 547, 378, -2], [2, 532, 378, 3], [4, 500, 400, -5], [5, 500, 400, 6]] },
  { key: "after", prints: [[2, 700, 444, 2], [6, 500, 444, -4], [1, 400, 444, 5], [3, 400, 420, -2]] },
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

function Envelope() {
  return (
    <span className="env">
      <span className="sr-only">Ukrainska 15</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="env__layer" src="/artefacts/ukrainska-15/envelope/back.webp?v=3" alt="" draggable={false} />
      {STACKS.map((st) => (
        <span key={st.key} className={`env__stack env__stack--${st.key}`}>
          {[...st.prints].reverse().map(([n, w, h, t]) => (
            <span key={n} className="env__print-photo" style={{ "--t": `${t}deg`, aspectRatio: `${w} / ${h}` } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/artefacts/ukrainska-15/${st.key}/${String(n).padStart(2, "0")}.webp`} alt="" draggable={false} />
            </span>
          ))}
        </span>
      ))}
      <span className="env__card" aria-hidden>
        <span className="env__card-head">
          <span>Ukrainska 15</span>
          <span>Voice from the Basement · K. Kazachkova</span>
        </span>
        <span className="env__card-row env__card-row--th"><span>Date</span><span>Jury</span><span>Award</span></span>
        {LENDINGS.map((l) => (
          <span key={l.award + l.jury} className="env__card-row">
            <span className="env__card-date">{"date" in l ? l.date : ""}</span><span>{l.jury}</span><span>{l.award}</span>
          </span>
        ))}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="env__layer" src="/artefacts/ukrainska-15/envelope/pocket.webp?v=3" alt="" draggable={false} />
      <span className="env__print" aria-hidden>
        <span className="env__no">01</span>
        <span className="env__where">Ukrainska 15 · Kupiansk</span>
        <span className="env__big">15</span>
      </span>
      <span className="env__stamps" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="env__stamp env__stamp--muse" src="/stamps/awards/muse-gold.png" alt="" draggable={false} />
        {STICKERS.map((k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={k.src} className={`env__sticker env__sticker--${k.cls}`} src={`/stamps/awards/${k.src}`} alt="" draggable={false} />
        ))}
        <span className="env__stamp env__stamp--fda">French Design Awards<b>Silver</b>2026</span>
      </span>
    </span>
  );
}

export function DeskPlanes() {
  return (
    <div className="desk-world">
      <div className="desk-plane desk-wall" aria-hidden>
        {/* the trophy's shadow thrown back onto the wall behind it: the key
            is above, in front and to the left, so it lands down and to the
            right of the trophy, as the case's own does (render_desk.py).
            Wall px are box x + 1052.5 across, box y + 144 down; the desk
            line at the wall's foot cuts it off. */}
        <div className="desk-award-cast" style={{
          left: `calc(${AWARD.x - AWARD_W / 2 + CAST.x + 1052.5} * var(--u))`,
          top: `calc(${656 - AWARD.h + CAST.y + 144} * var(--u))`,
          width: `calc(${AWARD_W} * var(--u))`, height: `calc(${AWARD.h} * var(--u))`,
        }} />
      </div>
      <div className="desk-plane desk-wall desk-ext" aria-hidden />
      <div className="desk-plane desk-top desk-ext" aria-hidden />
      <div className="desk-plane desk-ply desk-ext" aria-hidden />
      <div className="desk-plane desk-top">
        <div className="desk-shadow" aria-hidden />
        {/* the trophy's contact shadow, on the desk under its base (desk-top
            px are box x + 1052.5 across, z + 269 out from the wall) */}
        <div className="desk-award-shadow" aria-hidden style={{
          left: `calc(${AWARD.x + 1052.5} * var(--u))`, top: `calc(${AWARD.z + 269} * var(--u))`,
          "--w": AWARD_W,
        } as React.CSSProperties} />
        <nav className="desk-cases" aria-label="Case files">
          {CASES.map((c) => (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className={c.img === "envelope" ? "desk-card desk-card--env" : c.img ? "desk-card desk-card--ref" : "desk-card"}
              tabIndex={-1}
              style={{
                left: `calc(${c.x} * var(--u))`, top: `calc(${c.y} * var(--u))`,
                "--w": c.w, "--h": c.h, "--r": `${c.r}deg`,
              } as React.CSSProperties}
            >
              {c.img === "envelope" ? (
                <Envelope />
              ) : c.img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/scene/desk3d/placeholders/${c.img}.webp`} alt="" draggable={false} />
                  <span className="desk-card__label">Placeholder · {c.title}</span>
                </>
              ) : (
                <>
                  <div className="desk-card__cover" />
                  <div className="desk-card__body">
                    <div className="desk-card__tags">&nbsp;</div>
                    <h2>{c.title}</h2>
                  </div>
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="desk-award" src="/items/davey-trophy-v2.webp" alt="" aria-hidden draggable={false}
        style={{
          left: `calc(${AWARD.x - AWARD_W / 2} * var(--u))`, top: `calc(${656 - AWARD.h} * var(--u))`,
          width: `calc(${AWARD_W} * var(--u))`, height: `calc(${AWARD.h} * var(--u))`,
          transform: `translateZ(calc(${AWARD.z} * var(--u)))`,
        }}
      />
      <div className="desk-plane desk-ply" aria-hidden />
      <div className="desk-plane desk-under" aria-hidden />
    </div>
  );
}

/** The flat caption over the desk while it is in view: how to move along
 *  it, and which of the files is in front of you. Outside the 3D world
 *  (and outside .scene-cam, whose transform would capture position: fixed). */
export function DeskHint() {
  return (
    <div className="desk-hint" aria-hidden>
      <span>← scroll →</span>
      <span className="desk-counter">1 / {CASES.length}</span>
    </div>
  );
}

/** Drives the camera: toggles html[data-desk], keeps the lens shift that puts
 *  the camera's axis in the middle of the window, and owns the URL. */
export function useDeskCamera(cam: React.RefObject<HTMLDivElement | null>) {
  const open = useRef<View | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const el = cam.current;
    if (!el) return;
    root.dataset.deskReady = "1";

    // The lens shift: how far the scene must slide for the camera's principal
    // point (560, 226 of the box) to land in the middle of the window.
    // Measured on the stage, not on .scene-cam: the camera's own shift is a
    // transform on .scene-cam, so its rect would include the shift it sets.
    const measure = () => {
      const r = (el.parentElement ?? el).getBoundingClientRect();
      const u = r.width / 1118;
      el.style.setProperty("--dx", `${innerWidth / 2 - (r.left + 560 * u)}px`);
      el.style.setProperty("--dy", `${innerHeight / 2 - (r.top + 226 * u)}px`);
    };

    const cards = () => el.querySelectorAll<HTMLAnchorElement>(".desk-card");

    // ── The pan: the camera slides along the desk (desk px, 0 … max) ──
    // Wheel (either axis), a drag of the desk, arrow keys, and focus all
    // move a target; a spring eases the camera onto it. Live only once the
    // camera has arrived — until then the move's own transition is running.
    let pan = 0, target = 0, raf = 0, arrived = false;
    const u = () => el.getBoundingClientRect().width / 1118;
    const maxPan = () => Math.max(0, ROW_END - (VIEW_X + (innerWidth / 2) / (SPD * u())));
    const clamp = (v: number) => Math.min(maxPan(), Math.max(0, v));
    const counter = document.querySelector<HTMLElement>(".desk-counter");
    const paint = () => {
      el.style.setProperty("--pan", pan.toFixed(2));
      if (counter) {
        const centre = VIEW_X + pan + 120 / SPD;
        let best = 0;
        CASES.forEach((c, i) => { if (Math.abs(c.x - centre) < Math.abs(CASES[best].x - centre)) best = i; });
        counter.textContent = `${best + 1} / ${CASES.length}`;
      }
    };
    const tick = () => {
      pan += (target - pan) * 0.16;
      if (Math.abs(target - pan) < 0.2) pan = target;
      paint();
      raf = pan === target ? 0 : requestAnimationFrame(tick);
    };
    const go = (v: number) => { target = clamp(v); if (!raf) raf = requestAnimationFrame(tick); };

    // only the desk pans; the wall is one still frame
    const panning = () => arrived && open.current === "files";
    const onWheel = (e: WheelEvent) => {
      if (!panning()) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      go(target + d / (SPD * u()));
    };
    let dragX: number | null = null, dragFrom = 0, dragged = false;
    const onDown = (e: PointerEvent) => {
      if (!panning() || e.button !== 0) return;
      dragX = e.clientX; dragFrom = target; dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 5) dragged = true;
      if (dragged) go(dragFrom - dx / (SPD * u()));
    };
    const onUp = () => { dragX = null; };
    // a drag that ends on a card is not a click on it
    const onClick = (e: MouseEvent) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } };
    const onFocus = (e: FocusEvent) => {
      const a = (e.target as HTMLElement).closest?.(".desk-card");
      if (!a || !panning()) return;
      const i = [...cards()].indexOf(a as HTMLAnchorElement);
      if (i >= 0) go(CASES[i].x - VIEW_X - 120 / SPD);
    };
    const world = el.querySelector<HTMLElement>(".desk-world");
    const onArrive = (e: TransitionEvent) => {
      if (e.target !== world || e.propertyName !== "transform" || !open.current) return;
      arrived = true; root.dataset.deskArrived = "1";
    };
    world?.addEventListener("transitionend", onArrive);
    const set = (v: View | null) => {
      if (v === open.current) return;
      if (v && !open.current) window.scrollTo({ top: 0 });
      if (v) measure();
      open.current = v;
      // leaving the desk (home, or on to the wall): the pan unwinds with the
      // rest of the move
      arrived = false; delete root.dataset.deskArrived;
      cancelAnimationFrame(raf); raf = 0; pan = target = 0; paint();
      root.dataset.desk = v ? STATE[v] : "closed";
      document.body.style.overflow = v ? "hidden" : "";
      cards().forEach((a) => (a.tabIndex = v === "files" ? 0 : -1));
    };

    // Opened by us, it has a history entry of its own and closing is Back.
    // Arrived at /#case-files directly, there is nothing behind it on this
    // site, so closing rewrites the URL instead of leaving.
    let pushed = false;
    const close = () => {
      if (pushed) { pushed = false; history.back(); }
      else { history.replaceState(null, "", "/"); set(null); }
    };
    // Its own link again closes a view; the other one's moves straight across,
    // in the same history entry.
    const toggle = (v: View) => {
      if (open.current === v) close();
      else if (open.current) { history.replaceState({ desk: 1 }, "", `/${HASH[v]}`); set(v); }
      else { history.pushState({ desk: 1 }, "", `/${HASH[v]}`); pushed = true; set(v); }
    };
    const onFiles = () => toggle("files");
    const onAward = () => toggle("award");
    const onPop = () => { pushed = false; set(viewOf(location.hash)); };
    const onKey = (e: KeyboardEvent) => {
      if (!open.current) return;
      if (e.key === "Escape") close();
      else if (panning() && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        go(target + (e.key === "ArrowRight" ? 1 : -1) * 220);
      }
    };
    const onResize = () => { if (open.current) { measure(); go(target); } };

    window.addEventListener(DESK_EVENT, onFiles);
    window.addEventListener(AWARD_EVENT, onAward);
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("focusin", onFocus);
    set(viewOf(location.hash));

    return () => {
      window.removeEventListener(DESK_EVENT, onFiles);
      window.removeEventListener(AWARD_EVENT, onAward);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("focusin", onFocus);
      world?.removeEventListener("transitionend", onArrive);
      cancelAnimationFrame(raf);
      delete root.dataset.deskArrived;
      delete root.dataset.deskReady;
      delete root.dataset.desk;
      document.body.style.overflow = "";
    };
  }, [cam]);
}

/** Whether a click on Case Files should move the camera instead of leaving:
 *  on home, with a plain left click. */
export function shouldOpenDesk(e: React.MouseEvent) {
  const root = document.documentElement;
  return (
    root.dataset.deskReady === "1" &&
    e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
  );
}

