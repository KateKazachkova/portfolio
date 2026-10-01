"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SINGLE_Q } from "@/lib/room/pose";
import { useMedia } from "@/lib/useMedia";
import "./Binder.css";

/** The Profile, filed: a saffron ring binder lying open, one document per
 *  sleeve (public/profile/binder/, cut from one generated photograph).
 *
 *  Each sleeve is a leaf hinged on the rings. Its front shows on the right
 *  while it waits, its back on the left once turned, so spread k is the back
 *  of leaf k beside the front of leaf k + 1. The first leaf starts turned —
 *  the binder opens on the CV and the photograph, never on an empty cover.
 *  The punched strip turns with its sleeve; only the rings (the metal cut out
 *  of the photograph) lie on top, so a turning sleeve goes through them.
 *  Each leaf is three bands hinged one on the next (Band), so it can bend as
 *  it turns; every band carries its slice of both faces.
 *
 *  Two callers: home's desk, where it lies in front of the certificate and
 *  the camera comes down over it (DeskScene, #profile), and /about, the same
 *  binder flat on the page with a pager under it.
 */
/** tab: a divider tab on the sleeve that opens this spread, standing above
 *  the others (its logo), a click on it goes straight there */
/** hang: something hung on the rings over the left-hand sleeve (not in it);
 *  several are turned over one by one,
 *  its holes on the rings — turned with that sleeve */
/** over: laid on the sleeve itself rather than on its sheet, so it can run
 *  past the sleeve's edge (a clip over it):
 *  left on the sleeve turned to the left, right on the one on the right */
export type Spread = { label: string; left: React.ReactNode; right?: React.ReactNode; tab?: { src: string; alt: string; bg?: string }; hang?: React.ReactNode | React.ReactNode[];
  over?: { left?: React.ReactNode; right?: React.ReactNode } };

/** Under 1024 px the binder is one-sided (Kate, 01.10; SINGLE_Q): every
 *  document on a sleeve of its own, on the right, a turned sleeve empty on
 *  the left, so the camera looks at one page at a time. A section's divider
 *  tab, what hangs on its rings and the clip over its sleeve go with its
 *  first page. */
export function singleOf(spreads: Spread[]): Spread[] {
  return spreads.flatMap((s) => [
    ...(s.left != null ? [{ label: s.label, left: null, right: s.left, tab: s.tab, hang: s.hang, over: s.over?.left ? { right: s.over.left } : undefined }] : []),
    ...(s.right != null ? [{ label: s.label, left: null, right: s.right }] : []),
  ]);
}

/** The one-sided binder's way through it (Kate, 01.10): a swipe across the
 *  window turns the page (not while a pinch has the camera zoomed in), and a
 *  pill under it, the case files' (DeskHint), says which page this is, its
 *  arrows turning too. Shown at Profile once the camera is there (Binder.css). */
function BinderNav({ at, n, go, live }: { at: number; n: number; go: (to: number) => void; live: boolean }) {
  const atNow = useRef(at);
  useEffect(() => { atNow.current = at; }, [at]);
  useEffect(() => {
    if (!live) return;
    let sw: { x: number; y: number } | null = null, swiped = false;
    const zoomed = () => !!document.querySelector<HTMLElement>(".scene-cam")?.style.scale;
    // (not in the menu, open over the page)
    const down = (e: PointerEvent) => {
      swiped = false;
      sw = e.isPrimary && e.button === 0 && !zoomed() && !(e.target as HTMLElement).closest?.("header") ? { x: e.clientX, y: e.clientY } : null;
    };
    // (a second finger makes it a pinch)
    const more = (e: PointerEvent) => { if (!e.isPrimary) sw = null; };
    const up = (e: PointerEvent) => {
      if (!sw || e.type !== "pointerup") { sw = null; return; }
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      sw = null;
      // (a print being carried is not a swipe)
      if (Math.abs(dx) < 50 || Math.abs(dx) < 1.5 * Math.abs(dy) || (e.target as HTMLElement).closest?.("[data-drag]")) return;
      swiped = true;
      go(atNow.current + (dx < 0 ? 1 : -1));
    };
    // the click a swipe ends in is not a tap on the page
    const click = (e: MouseEvent) => { if (swiped) { swiped = false; e.preventDefault(); e.stopPropagation(); } };
    addEventListener("pointerdown", down);
    addEventListener("pointerdown", more);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
    addEventListener("click", click, true);
    return () => {
      removeEventListener("pointerdown", down); removeEventListener("pointerdown", more);
      removeEventListener("pointerup", up); removeEventListener("pointercancel", up); removeEventListener("click", click, true);
    };
  }, [go, live]);
  // (only ever rendered on the client: `single` is read from the window)
  return createPortal(
    <nav className="desk-hint pf-nav" aria-label="Profile pages">
      <button type="button" onClick={() => go(at - 1)} disabled={at === 1} aria-label="Previous page">←</button>
      <span className="desk-hint__swipe" aria-hidden>swipe</span>
      <button type="button" onClick={() => go(at + 1)} disabled={at === n} aria-label="Next page">→</button>
      <span aria-live="polite">{at} / {n}</span>
    </nav>,
    document.body,
  );
}

/** at = turned leaves (1 … spreads.length); spread on show = at - 1. A
 *  binder of another length (one-sided or not) opens at its start again. */
export function useBinder(n: number, live = true) {
  const [at, setAt] = useState(1);
  const [len, setLen] = useState(n);
  if (len !== n) { setLen(n); setAt(1); }
  const go = useCallback((to: number) => setAt(Math.max(1, Math.min(n, to))), [n]);
  useEffect(() => {
    if (!live) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [at, go, live]);
  return { at, go };
}

/** the binder's spreads, or its one-sided pages under 1024 px, and where it is */
export function useBinderPages(spreads: Spread[], singles: Spread[], live: boolean) {
  const single = useMedia(SINGLE_Q);
  const pages = single ? singles : spreads;
  return { single, pages, ...useBinder(pages.length, live) };
}

const TURN = 1150; // ms, the leaf's transition in Binder.css

/** One band of a leaf and, inside it, the rest: band k shows columns k of the
 *  front and 2 - k of the back (the back is seen mirrored once turned). */
function Band({ k, front, back }: { k: number; front: React.ReactNode; back: React.ReactNode }) {
  return (
    <div className="pf-seg">
      <div className="pf-face">
        <div className="pf-face__full" style={{ "--c": k } as React.CSSProperties}>{front && <div className="pf-sheet">{front}</div>}</div>
      </div>
      <div className="pf-face pf-face--back">
        <div className="pf-face__full" style={{ "--c": 2 - k } as React.CSSProperties}>{back && <div className="pf-sheet">{back}</div>}</div>
      </div>
      {k < 2 && <Band k={k + 1} front={front} back={back} />}
    </div>
  );
}

export function BinderBook({ spreads, at, go, className = "", style, onClick, single = false, live = false }: {
  spreads: Spread[]; at: number; go: (to: number) => void;
  className?: string; style?: React.CSSProperties;
  /** one-sided (singleOf): what goes with a page — its tab, what hangs on
   *  the rings over it, the clip — lies on its sleeve's front, on the right */
  single?: boolean;
  /** one-sided, it brings its pager (BinderNav), live while this is true */
  live?: boolean;
  /** return true to take the click instead of turning a page */
  onClick?: () => boolean;
}) {
  const n = spreads.length;
  const tail = spreads[n - 1].right != null;
  // (one-sided, a page's own things are on the sleeve whose front it is)
  const own = (i: number) => (single ? (i > 0 ? spreads[i - 1] : undefined) : i < n ? spreads[i] : undefined);
  const leaves = Array.from({ length: n + (tail ? 1 : 0) }, (_, i) => ({
    front: i > 0 ? spreads[i - 1].right : null,
    back: i < n ? spreads[i].left : null,
    tab: own(i)?.tab,
    hang: [own(i)?.hang ?? []].flat(),
    overFront: i > 0 ? spreads[i - 1].over?.right : undefined,
    overBack: i < n ? spreads[i].over?.left : undefined,
  }));
  // which leaves are in the air, and which way: set when `at` moves, cleared
  // once the turn is over so the next one restarts the bend
  const prev = useRef(at);
  const [flying, setFlying] = useState<{ dir: "f" | "b"; from: number; to: number } | null>(null);
  // hung certificates turned over on their own onto the right-hand page,
  // "leaf.item", in the order they went over (the last lies on top)
  const [flipped, setFlipped] = useState<string[]>([]);
  useEffect(() => {
    if (at === prev.current) return;
    const f = at > prev.current;
    setFlying({ dir: f ? "f" : "b", from: Math.min(at, prev.current), to: Math.max(at, prev.current) });
    prev.current = at;
    setFlipped([]);
    const t = setTimeout(() => setFlying(null), TURN + 80 * 4);
    return () => clearTimeout(t);
  }, [at]);
  return (
    <div
      className={`pf-binder ${className}`}
      style={style}
      data-single={single || undefined}
      role="group"
      aria-roledescription="binder"
      aria-label={`Profile binder, ${single ? "page" : "spread"} ${at} of ${n}: ${spreads[at - 1].label}`}
      onClick={(e) => {
        if (onClick?.()) return;
        const t = e.target as HTMLElement;
        if (t.closest("a")) return;                      // a link on a sheet
        if (t.closest("[data-drag]")) return;            // prints to pick up
        const hung = t.closest<HTMLElement>("[data-hang]");
        if (hung) { const k = hung.dataset.hang!; setFlipped((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k])); return; }
        const tab = t.closest<HTMLElement>("[data-tab]");
        // (a tab opens the spread whose sleeve it is on: one-sided, its front)
        if (tab) { go(Number(tab.dataset.tab) + (single ? 0 : 1)); return; }
        const b = e.currentTarget.getBoundingClientRect();
        go(at + (e.clientX > b.left + b.width / 2 ? 1 : -1));
      }}
      // the hung sheets and the tabs are buttons in all but name: Enter or
      // Space on one is a click on it, which the handler above reads
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const t = (e.target as HTMLElement).closest<HTMLElement>('[role="button"]');
        if (!t) return;
        e.preventDefault();
        t.click();
      }}
    >
      {/* on the desk it has a body: the board's edges, and the rings standing
          up out of the sleeves (edge-on from above, so only seen from the side) */}
      {["front", "back", "left", "right"].map((e) => <span key={e} className={`pf-edge pf-edge--${e}`} aria-hidden />)}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-binder__base" src="/profile/binder/binder-2.webp" alt="" draggable={false} />
      {[14.84, 47.66, 81.55].map((y) => (
        <svg key={y} className="pf-hoop" style={{ top: `${y}%` }} viewBox="0 0 60 28" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`pf-steel-${y}`} x1="0" x2="1">
              <stop offset="0" stopColor="#8d9096" /><stop offset=".45" stopColor="#e9ebee" /><stop offset=".6" stopColor="#b7bac0" /><stop offset="1" stopColor="#7c7f85" />
            </linearGradient>
          </defs>
          <path d="M3 28 C3 3 57 3 57 28" fill="none" stroke={`url(#pf-steel-${y})`} strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      ))}
      {leaves.map((l, i) => {
        const air = flying && i >= flying.from && i < flying.to;
        // a jump of several spreads lets them go one after another
        const lag = air ? (flying.dir === "f" ? i - flying.from : flying.to - 1 - i) * 80 : 0;
        return (
          <div
            key={i}
            className="pf-leaf"
            data-turned={i < at || undefined}
            data-dir={air ? flying.dir : undefined}
            data-flying={air || undefined}
            // a certificate turned over onto the right lies above that stack
            style={{ zIndex: flipped.some((k) => k.startsWith(`${i}.`)) ? 59 : i < at ? i + 1 : leaves.length - i + 1, "--z": i < at ? i + 1 : leaves.length - i + 1, transitionDelay: `${lag}ms`, "--lag": `${lag}ms` } as React.CSSProperties}
            // drawn: the two on show and the one under each, which a turning
            // leaf uncovers
            data-hidden={(i < at - 2 || i > at + 1) || undefined}
            aria-hidden={!(i === at - 1 || i === at)}
          >
            {/* at rest the leaf is one piece (bands would show their seams);
                the bands take over only while it is in the air */}
            <div className="pf-whole">
              <div className="pf-face"><div className="pf-face__full">{l.front && <div className="pf-sheet">{l.front}</div>}</div></div>
              <div className="pf-face pf-face--back"><div className="pf-face__full">{l.back && <div className="pf-sheet">{l.back}</div>}</div></div>
            </div>
            {air && <Band k={0} front={l.front} back={l.back} />}
            {l.hang.map((h, k) => {
              // hung on the rings, not in the sleeve: it turns with its sleeve,
              // and on its own about the rings when clicked; its back is plain
              // paper, the print showing faintly through
              const key = `${i}.${k}`, o = flipped.indexOf(key);
              return (
                <div key={k} className="pf-hangleaf" data-flipped={o >= 0 || undefined} style={{ "--o": o } as React.CSSProperties}>
                  <div className="pf-hangleaf__side">
                    <div className="pf-hang">
                      <div className="pf-hang__face" data-hang={key} role="button" tabIndex={0} aria-label="Turn over">{h}</div>
                      <div className="pf-hang__face pf-hang__face--rev" data-hang={key} aria-hidden>{h}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {l.overFront && <div className="pf-over">{l.overFront}</div>}
            {l.overBack && <div className="pf-over pf-over--back">{l.overBack}</div>}
            {l.tab && (
              <span className="pf-tab" data-tab={i} role="button" tabIndex={0} aria-label={`Open ${l.tab.alt}`}
                // dividers step along the top edge, so each tab shows
                style={{ left: `${40 + 15 * leaves.slice(0, i).filter((x) => x.tab).length}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="pf-tab__face" style={{ background: l.tab.bg }}><img src={l.tab.src} alt="" draggable={false} /></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="pf-tab__face pf-tab__face--back" style={{ background: l.tab.bg }}><img src={l.tab.src} alt="" draggable={false} /></span>
              </span>
            )}
          </div>
        );
      })}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-binder__rings" src="/profile/binder/rings-2.webp" alt="" draggable={false} />
      {single && <BinderNav at={at} n={n} go={go} live={live} />}
    </div>
  );
}

export default function Binder({ spreads }: { spreads: Spread[] }) {
  const { at, go } = useBinder(spreads.length);
  return (
    <div className="pf">
      <BinderBook spreads={spreads} at={at} go={go} />

      <nav className="pf-pager" aria-label="Binder pages">
        <button type="button" onClick={() => go(at - 1)} disabled={at === 1} aria-label="Previous spread">←</button>
        <ol>
          {spreads.map((s, i) => (
            <li key={s.label}>
              <button type="button" aria-current={i === at - 1 || undefined} onClick={() => go(i + 1)}>
                <span>{String(i + 1).padStart(2, "0")}</span> {s.label}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => go(at + 1)} disabled={at === spreads.length} aria-label="Next spread">→</button>
      </nav>

      {/* phones: the same documents, taken out of the binder and stacked */}
      <div className="pf-stack">
        {spreads.flatMap((s) => [s.left, s.right]).filter(Boolean).map((p, i) => (
          <div key={i} className="pf-sheet">{p}</div>
        ))}
      </div>
    </div>
  );
}
