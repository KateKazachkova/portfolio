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
 * Case Files moves the camera instead of the page: it rises to 1 m over the
 * front of the desk and looks almost straight down (84°), the case leaves
 * past the top of the frame, and the case files are lying there. The URL
 * becomes /#case-files, so Back, Escape or Case Files again bring it home.
 * Only in the dark theme, where the desk exists; in the light one the link
 * goes to /work as it always did. The prototype this came from is
 * public/proto/desk.html.
 */

// The /work grid's cards, exactly as it shows them — titles and tags only.
const CASES = [
  { slug: "bulksource", title: "BulkSource", tags: ["UX", "UI"] },
  { slug: "ukrainska-15", title: "Ukrainska 15", tags: ["2024 — 2026"] },
  { slug: "my-portfolio2026", title: "Portfolio & My Branding", tags: [] },
  { slug: "onsisoft", title: "OnsiSoft", tags: [] },
  { slug: "waypro", title: "WayPro", tags: ["2024"] },
] as const;

// Where each lies on the desk plane (desk px from its left/back corner) and
// how far it is turned: 3 + 2 around where the camera's axis lands (y 636).
const SPOTS: [number, number, number][] = [
  [1507, 563, -2.2], [1712, 556, 1.4], [1917, 566, -0.8], [1610, 712, 1.9], [1815, 706, -1.6],
];

export const DESK_EVENT = "kate:case-files";
const HASH = "#case-files";

export function DeskPlanes() {
  return (
    <div className="desk-world">
      <div className="desk-plane desk-wall" aria-hidden />
      <div className="desk-plane desk-top">
        <div className="desk-shadow" aria-hidden />
        <nav className="desk-cases" aria-label="Case files">
          {CASES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className="desk-card"
              tabIndex={-1}
              style={{
                left: `calc(${SPOTS[i][0]} * var(--u))`, top: `calc(${SPOTS[i][1]} * var(--u))`,
                "--r": `${SPOTS[i][2]}deg`, "--i": i,
              } as React.CSSProperties}
            >
              <div className="desk-card__cover" />
              <div className="desk-card__body">
                <div className="desk-card__tags">{c.tags.length ? c.tags.join(" · ") : " "}</div>
                <h2>{c.title}</h2>
              </div>
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
    const measure = () => {
      const r = el.getBoundingClientRect();
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
    if (location.hash === HASH && root.dataset.theme === "dark") set(true);

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
 *  home, dark theme (the desk only exists there), a plain left click. */
export function shouldOpenDesk(e: React.MouseEvent) {
  const root = document.documentElement;
  return (
    root.dataset.deskReady === "1" &&
    root.dataset.theme === "dark" &&
    e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
  );
}

