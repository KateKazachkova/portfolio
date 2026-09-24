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
 * front of the desk and looks almost straight down (84°), then pans along it, the case leaves
 * past the top of the frame, and the case files — lying on the desk all
 * along, slivers in front of the case — fill the view. The URL
 * becomes /#case-files, so Back, Escape or Case Files again bring it home.
 * The desk is home's scene in every theme. The prototype this came from is
 * public/proto/desk.html.
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
  { slug: "ukrainska-15", title: "Ukrainska 15", img: "ukrainska-15", w: 150, h: 200, x: 1559, y: 575, r: -3 },
  { slug: "bulksource", title: "BulkSource", img: "bulksource", w: 210, h: 261, x: 1809, y: 548, r: 3 },
  { slug: "onsisoft", title: "OnsiSoft", img: "onsisoft", w: 190, h: 257, x: 2079, y: 570, r: -2 },
  { slug: "waypro", title: "WayPro · VerDistro", img: "waypro", w: 230, h: 230, x: 2359, y: 552, r: 2 },
  { slug: "my-portfolio2026", title: "Portfolio & My Branding", img: null, w: 180, h: 126, x: 2634, y: 580, r: -1.5 },
] as const;
const ROW_END = 2724 + 70;         // right edge of the last object, plus a margin
const VIEW_X = 1612.5;             // desk x under the camera's axis at pan 0
const SPD = 2150 / 860;            // screen px per desk px at the end height (× --u)

export const DESK_EVENT = "kate:case-files";
const HASH = "#case-files";

export function DeskPlanes() {
  return (
    <div className="desk-world">
      <div className="desk-plane desk-wall" aria-hidden />
      <div className="desk-plane desk-top">
        <div className="desk-shadow" aria-hidden />
        <nav className="desk-cases" aria-label="Case files">
          {CASES.map((c) => (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className={c.img ? "desk-card desk-card--ref" : "desk-card"}
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
  const open = useRef(false);

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

    const onWheel = (e: WheelEvent) => {
      if (!arrived) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      go(target + d / (SPD * u()));
    };
    let dragX: number | null = null, dragFrom = 0, dragged = false;
    const onDown = (e: PointerEvent) => {
      if (!arrived || e.button !== 0) return;
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
      if (!a || !arrived) return;
      const i = [...cards()].indexOf(a as HTMLAnchorElement);
      if (i >= 0) go(CASES[i].x - VIEW_X - 120 / SPD);
    };
    const world = el.querySelector<HTMLElement>(".desk-world");
    const onArrive = (e: TransitionEvent) => {
      if (e.target !== world || e.propertyName !== "transform" || !open.current) return;
      arrived = true; root.dataset.deskArrived = "1";
    };
    world?.addEventListener("transitionend", onArrive);
    const set = (on: boolean) => {
      if (on === open.current) return;
      if (on) { window.scrollTo({ top: 0 }); measure(); }
      open.current = on;
      if (!on) {
        // back home: the pan unwinds with the rest of the move
        arrived = false; delete root.dataset.deskArrived;
        cancelAnimationFrame(raf); raf = 0; pan = target = 0; paint();
      }
      root.dataset.desk = on ? "open" : "closed";
      document.body.style.overflow = on ? "hidden" : "";
      cards().forEach((a) => (a.tabIndex = on ? 0 : -1));
    };

    // Opened by us, it has a history entry of its own and closing is Back.
    // Arrived at /#case-files directly, there is nothing behind it on this
    // site, so closing rewrites the URL instead of leaving.
    let pushed = false;
    const close = () => {
      if (pushed) { pushed = false; history.back(); }
      else { history.replaceState(null, "", "/"); set(false); }
    };
    const onEvent = () => {
      if (open.current) close();
      else { history.pushState({ desk: 1 }, "", `/${HASH}`); pushed = true; set(true); }
    };
    const onPop = () => { pushed = false; set(location.hash === HASH); };
    const onKey = (e: KeyboardEvent) => {
      if (!open.current) return;
      if (e.key === "Escape") close();
      else if (arrived && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        go(target + (e.key === "ArrowRight" ? 1 : -1) * 220);
      }
    };
    const onResize = () => { if (open.current) { measure(); go(target); } };

    window.addEventListener(DESK_EVENT, onEvent);
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("focusin", onFocus);
    if (location.hash === HASH) set(true);

    return () => {
      window.removeEventListener(DESK_EVENT, onEvent);
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

