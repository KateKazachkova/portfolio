"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { nodeFor, ROOT } from "@/lib/kate-talk";

/**
 * A short conversation with the doll in the niche.
 *
 * Two pieces that have to stay apart: an invisible HOTSPOT over Kate herself,
 * given in the suitcase box's own percentages like every other item on the
 * stage, and the PANEL, parked in the empty strip under the case's right-hand
 * door so it never lands on the case. The hotspot opens the panel on hover and
 * pins it on click; the panel keeps itself open while the pointer is inside it,
 * so the diagonal from Kate down to the panel is walkable.
 *
 * Nothing here moves the hero: both children are absolutely positioned inside
 * .case-stage, so the layout around them is untouched. Below 1100px there is no
 * strip to park in and no hover to speak of, so the whole thing stands down
 * (see .katetalk in globals.css).
 */

/** Kate inside the case box — the lower half of the niche clip, where she sits.
 *  The niche itself is 40.62%/11.43% at 17.46% wide (NicheDoll owns that rect);
 *  this is the part of it that is her rather than the woodwork. */
const HOTSPOT = { left: "42.6%", top: "43%", width: "13.2%", height: "38%" } as const;

const CLOSE_DELAY = 260;

export default function KateTalk({ edition }: { edition: string }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [id, setId] = useState<string>(ROOT);
  const closeTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);

  const node = nodeFor(edition, id);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(resetTimer.current);
  }, []);

  /** Shut it and wind the conversation back to the opening line — but only
   *  after it has faded, so the last answer isn't seen swapping out. */
  const close = useCallback(() => {
    cancelClose();
    setOpen(false);
    setPinned(false);
    resetTimer.current = window.setTimeout(() => setId(ROOT), 360);
  }, [cancelClose]);

  const closeSoon = useCallback(() => {
    if (pinned) return;
    cancelClose();
    closeTimer.current = window.setTimeout(close, CLOSE_DELAY);
  }, [pinned, cancelClose, close]);

  // She goes back to her own opening line when the hour (and so the scene)
  // changes under an open panel.
  useEffect(() => { setId(ROOT); }, [edition]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  // Pinned open: Escape, or a click anywhere else, ends it.
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as globalThis.Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [pinned, close]);

  return (
    <div ref={root}>
      {/* Kate herself. A button, so the keyboard can reach her too; it carries
          no visual of its own — the reaction is the niche brightening, which
          the stage's data-kate-awake drives. */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Kate — say something"
        className="katetalk__hotspot"
        style={{ position: "absolute", ...HOTSPOT, zIndex: 20 }}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={closeSoon}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onBlur={closeSoon}
        onClick={() => { cancelClose(); setOpen(true); setPinned(true); }}
      />

      <div
        className="katetalk"
        data-open={open ? "true" : "false"}
        role="dialog"
        aria-label="Kate"
        aria-hidden={!open}
        onMouseEnter={cancelClose}
        onMouseLeave={closeSoon}
      >
        <p className="katetalk__who t-label">
          Kate<span aria-hidden="true">™</span>
        </p>

        <div className="katetalk__say" aria-live="polite">
          {node.lines.map((line) => (
            <p key={line} className="t-body">{line}</p>
          ))}
        </div>

        <ul className="katetalk__opts">
          {node.options.map((o) => (
            <li key={o.label}>
              {"href" in o ? (
                <Link href={o.href} className="katetalk__opt t-body" onClick={close}>
                  <span>{o.label}</span>
                  <i aria-hidden="true">→</i>
                </Link>
              ) : (
                <button
                  type="button"
                  className="katetalk__opt t-body"
                  onClick={() => {
                    if ("close" in o) { close(); return; }
                    cancelClose();
                    setPinned(true);        // answering is a commitment; stop the hover timer
                    setId(o.to);
                  }}
                >
                  <span>{o.label}</span>
                  {"to" in o && <i aria-hidden="true">→</i>}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
