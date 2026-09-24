"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
export type Spread = { label: string; left: React.ReactNode; right?: React.ReactNode };

/** at = turned leaves (1 … spreads.length); spread on show = at - 1 */
export function useBinder(n: number, live = true) {
  const [at, setAt] = useState(1);
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

export function BinderBook({ spreads, at, go, className = "", style, onClick }: {
  spreads: Spread[]; at: number; go: (to: number) => void;
  className?: string; style?: React.CSSProperties;
  /** return true to take the click instead of turning a page */
  onClick?: () => boolean;
}) {
  const n = spreads.length;
  const tail = spreads[n - 1].right != null;
  const leaves = Array.from({ length: n + (tail ? 1 : 0) }, (_, i) => ({
    front: i > 0 ? spreads[i - 1].right : null,
    back: i < n ? spreads[i].left : null,
  }));
  // which leaves are in the air, and which way: set when `at` moves, cleared
  // once the turn is over so the next one restarts the bend
  const prev = useRef(at);
  const [flying, setFlying] = useState<{ dir: "f" | "b"; from: number; to: number } | null>(null);
  useEffect(() => {
    if (at === prev.current) return;
    const f = at > prev.current;
    setFlying({ dir: f ? "f" : "b", from: Math.min(at, prev.current), to: Math.max(at, prev.current) });
    prev.current = at;
    const t = setTimeout(() => setFlying(null), TURN + 80 * 4);
    return () => clearTimeout(t);
  }, [at]);
  return (
    <div
      className={`pf-binder ${className}`}
      style={style}
      role="group"
      aria-roledescription="binder"
      aria-label={`Profile binder, spread ${at} of ${n}: ${spreads[at - 1].label}`}
      onClick={(e) => {
        if (onClick?.()) return;
        const b = e.currentTarget.getBoundingClientRect();
        go(at + (e.clientX > b.left + b.width / 2 ? 1 : -1));
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
            style={{ zIndex: i < at ? i + 1 : leaves.length - i + 1, "--z": i < at ? i + 1 : leaves.length - i + 1, transitionDelay: `${lag}ms`, "--lag": `${lag}ms` } as React.CSSProperties}
            data-hidden={!(i === at - 1 || i === at) || undefined}
            aria-hidden={!(i === at - 1 || i === at)}
          >
            {/* at rest the leaf is one piece (bands would show their seams);
                the bands take over only while it is in the air */}
            <div className="pf-whole">
              <div className="pf-face"><div className="pf-face__full">{l.front && <div className="pf-sheet">{l.front}</div>}</div></div>
              <div className="pf-face pf-face--back"><div className="pf-face__full">{l.back && <div className="pf-sheet">{l.back}</div>}</div></div>
            </div>
            {air && <Band k={0} front={l.front} back={l.back} />}
          </div>
        );
      })}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-binder__rings" src="/profile/binder/rings-2.webp" alt="" draggable={false} />
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
