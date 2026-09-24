"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { U15File, U15_CLOSE, U15_CLOSED, U15_OPEN, U15_RESET } from "./desk/U15File";
import AwardRail from "@/components/AwardRail";

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
  { slug: "ukrainska-15", title: "Ukrainska 15", img: "envelope", w: 195, h: 270, x: 1540, y: 575, r: -3 },
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
// The latest certificate (Indigo, Women in Design 2026), framed and
// standing on the desk against the wall at the right end of the awards:
// 30 × 21 cm, its foot 2 cm off the wall and its top leaning back onto it.
const CERT = { x: 2200, w: 322, h: 241, z: -250, lean: 5 };
// how far its shadow falls on the wall, 8 cm behind it (box px)
const CAST = { x: 34, y: 20 };

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
      {/* the wall once more, bare, over both halves of it: what hangs there
          runs across the seam and must not be covered by the extension */}
      <div className="desk-plane desk-wall desk-wall--hung">
        <AwardRail />
      </div>
      <a
        className="desk-cert" href="/artefacts/cert-indigo-women-in-design-2026.webp" target="_blank" rel="noopener noreferrer"
        tabIndex={-1} aria-label="Indigo Design Award — Women in Design, shortlisted 2026 (certificate)"
        style={{
          left: `calc(${CERT.x - CERT.w / 2} * var(--u))`, top: `calc(${656 - CERT.h} * var(--u))`,
          width: `calc(${CERT.w} * var(--u))`, height: `calc(${CERT.h} * var(--u))`,
          transform: `translateZ(calc(${CERT.z} * var(--u))) rotateX(${CERT.lean}deg)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/artefacts/cert-indigo-women-in-design-2026.webp" alt="" draggable={false} />
      </a>
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
          {CASES.map((c) => c.img === "envelope" ? (
            <U15File key={c.slug} x={c.x} y={c.y} r={c.r} />
          ) : (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className={c.img ? "desk-card desk-card--ref" : "desk-card"}
              data-slug={c.slug}
              data-x={c.x}
              tabIndex={-1}
              style={{
                left: `calc(${c.x} * var(--u))`, top: `calc(${c.y} * var(--u))`,
                "--w": c.w, "--h": c.h, "--r": `${c.r}deg`,
              } as React.CSSProperties}
            >
              {c.img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/scene/desk3d/placeholders/${c.img}.webp`} alt="" draggable={false} />
                  <span className="desk-card__label">Placeholder · {c.title}</span>
                  <span className="desk-card__open" aria-hidden>Read the case →</span>
                </>
              ) : (
                <>
                  <div className="desk-card__cover" />
                  <div className="desk-card__body">
                    <div className="desk-card__tags">&nbsp;</div>
                    <h2>{c.title}</h2>
                  </div>
                  <span className="desk-card__open" aria-hidden>Read the case →</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>
      {/* The trophy is a way in too: from home (where it peeks past the case)
          or the desk, a click takes the camera over to it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="desk-award" src="/items/davey-trophy-v2.webp" alt="" aria-hidden draggable={false}
        onClick={() => {
          if (document.documentElement.dataset.desk !== "award") window.dispatchEvent(new Event(AWARD_EVENT));
        }}
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

    const cards = () => el.querySelectorAll<HTMLElement>(".desk-card:not(.desk-card--env), .u15-hit, .desk-player, .u15-tablet");

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

    // ── Focus: one case laid out, the camera on it, the others moved aside
    // to either side (html[data-desk-focus], each card's data-side) ──
    const U15 = "ukrainska-15";
    let focus: string | null = null;
    const setFocus = (slug: string | null) => {
      if (focus === U15 && slug !== U15) dispatchEvent(new Event(U15_CLOSE));
      focus = slug;
      const all = el.querySelectorAll<HTMLElement>(".desk-card[data-slug]");
      const fx = Number([...all].find((c) => c.dataset.slug === slug)?.dataset.x);
      all.forEach((c) => {
        if (!slug) delete c.dataset.side;
        else c.dataset.side = c.dataset.slug === slug ? "here" : Number(c.dataset.x) < fx ? "left" : "right";
      });
      if (slug) root.dataset.deskFocus = slug; else delete root.dataset.deskFocus;
    };

    // only the desk pans; the wall is one still frame
    const panning = () => arrived && open.current === "files";
    const onWheel = (e: WheelEvent) => {
      if (!panning()) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (focus && focus !== U15) setFocus(null);
      go(target + d / (SPD * u()));
    };
    let dragX: number | null = null, dragFrom = 0, dragged = false;
    const onDown = (e: PointerEvent) => {
      if (!panning() || e.button !== 0) return;
      // a print being carried, or a page being turned, is not a pan
      if ((e.target as HTMLElement).closest?.(".u15-item, .u15-print")) return;
      dragX = e.clientX; dragFrom = target; dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 5) dragged = true;
      if (dragged) { if (focus && focus !== U15) setFocus(null); go(dragFrom - dx / (SPD * u())); }
    };
    const onUp = () => { dragX = null; };
    // a drag that ends on a card is not a click on it
    const onClick = (e: MouseEvent) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; return; }
      // the first click on a case brings the camera to it and lays it out;
      // a click on the case in focus goes on to its page
      const a = (e.target as HTMLElement).closest?.<HTMLElement>(".desk-card[data-slug]:not(.desk-card--env)");
      if (!a || !panning() || focus === a.dataset.slug) return;
      e.preventDefault(); e.stopPropagation();
      setFocus(a.dataset.slug!);
      go(Number(a.dataset.x) - VIEW_X);
    };
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
      if (v !== "files") { dispatchEvent(new Event(U15_RESET)); setFocus(null); }
      cancelAnimationFrame(raf); raf = 0; pan = target = 0; paint();
      root.dataset.desk = v ? STATE[v] : "closed";
      document.body.style.overflow = v ? "hidden" : "";
      cards().forEach((a) => (a.tabIndex = v === "files" ? 0 : -1));
      el.querySelectorAll<HTMLAnchorElement>(".award-ribbon, .desk-cert").forEach((a) => (a.tabIndex = v === "award" ? 0 : -1));
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
      if (e.key === "Escape") {
        if (focus === U15) dispatchEvent(new Event(U15_CLOSE));
        else if (focus) setFocus(null);
        else close();
      }
      else if (panning() && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        go(target + (e.key === "ArrowRight" ? 1 : -1) * 220);
      }
    };
    const onResize = () => { if (open.current) { measure(); go(target); } };

    // opening Ukrainska 15's folder lays it out for the camera at pan 0
    const onU15 = () => { if (panning()) { setFocus(U15); go(0); } };
    const onU15Closed = () => { if (focus === U15) setFocus(null); };
    window.addEventListener(U15_OPEN, onU15);
    window.addEventListener(U15_CLOSED, onU15Closed);
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
      window.removeEventListener(U15_OPEN, onU15);
      window.removeEventListener(U15_CLOSED, onU15Closed);
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

