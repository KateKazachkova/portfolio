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
 * Case Files moves the camera instead of the page: it rises to 1.4 m over the
 * front of the desk and looks almost straight down (84°), the case leaves
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
const CASES = [
  { slug: "ukrainska-15", title: "Ukrainska 15", img: "ukrainska-15", w: 150, h: 200, x: 1450, y: 430, r: -3 },
  { slug: "bulksource", title: "BulkSource", img: "bulksource", w: 210, h: 261, x: 1665, y: 410, r: 4 },
  { slug: "onsisoft", title: "OnsiSoft", img: "onsisoft", w: 190, h: 257, x: 1885, y: 445, r: -2 },
  { slug: "waypro", title: "WayPro · VerDistro", img: "waypro", w: 230, h: 230, x: 1565, y: 705, r: 2 },
  { slug: "my-portfolio2026", title: "Portfolio & My Branding", img: null, w: 180, h: 126, x: 1835, y: 725, r: -1.5 },
] as const;

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
    const set = (on: boolean) => {
      if (on === open.current) return;
      if (on) { window.scrollTo({ top: 0 }); measure(); }
      open.current = on;
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open.current) close(); };
    const onResize = () => { if (open.current) measure(); };

    window.addEventListener(DESK_EVENT, onEvent);
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    if (location.hash === HASH) set(true);

    return () => {
      window.removeEventListener(DESK_EVENT, onEvent);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
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

