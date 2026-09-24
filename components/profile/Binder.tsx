"use client";

import { useCallback, useEffect, useState } from "react";
import "./Binder.css";

/** The Profile, filed: a saffron ring binder lying open, one document per
 *  sleeve (public/profile/binder/, cut from one generated photograph).
 *
 *  Each sleeve is a leaf hinged on the rings. Its front shows on the right
 *  while it waits, its back on the left once turned, so spread k is the back
 *  of leaf k beside the front of leaf k + 1. The first leaf starts turned —
 *  the binder opens on the CV and the photograph, never on an empty cover.
 *  The punched strips and the rings are their own layer on top, so a turning
 *  sleeve passes under the metal, as it would.
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-binder__base" src="/profile/binder/binder.webp" alt="" draggable={false} />
      {leaves.map((l, i) => (
        <div
          key={i}
          className="pf-leaf"
          data-turned={i < at || undefined}
          style={{ zIndex: i < at ? i + 1 : leaves.length - i + 1 }}
          aria-hidden={!(i === at - 1 || i === at)}
        >
          <div className="pf-leaf__face">{l.front && <div className="pf-sheet">{l.front}</div>}</div>
          <div className="pf-leaf__face pf-leaf__face--back">{l.back && <div className="pf-sheet">{l.back}</div>}</div>
        </div>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-binder__spine" src="/profile/binder/spine.webp" alt="" draggable={false} />
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
