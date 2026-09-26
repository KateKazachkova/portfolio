"use client";

import { useEffect, useEffectEvent, useId } from "react";
import { OFFDUTY_EVENT } from "./BikeComputer";

// What the Off Duty corner's things share. Box px: x across, y down to the
// desk line (656), z out from the case's plane; 26 cm is 280 px.
export const CM = 280 / 26;
export const WALL = -269;
export const px = (n: number) => `calc(${n} * var(--u))`;
/** the camera is at the corner */
export const here = () => document.documentElement.dataset.desk === "offduty";
/** from elsewhere in the room, a click brings the camera over */
export const come = () => {
  if (!here()) dispatchEvent(new Event(OFFDUTY_EVENT));
};

const TAKE = "kate:offduty-take";

/** One thing off the shelf at a time. While `open`, taking anything else
 *  (a book, a tape, the comic) puts this one back, as do Escape (before the
 *  room takes Escape to leave the corner) and the camera leaving. */
export function usePutBack(open: boolean, close: () => void) {
  const id = useId();
  const putBack = useEffectEvent(close);
  useEffect(() => {
    if (!open) return;
    dispatchEvent(new CustomEvent(TAKE, { detail: id }));
    const onTake = (e: Event) => { if ((e as CustomEvent).detail !== id) putBack(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      putBack();
    };
    const mo = new MutationObserver(() => { if (!here()) putBack(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-desk"] });
    addEventListener(TAKE, onTake);
    addEventListener("keydown", onKey, true);
    return () => {
      removeEventListener(TAKE, onTake);
      removeEventListener("keydown", onKey, true);
      mo.disconnect();
    };
  }, [open, id]);
}
