"use client";

import { useEffect, useEffectEvent, useId } from "react";
import { OFFDUTY_EVENT } from "./BikeComputer";

// What the Off Duty corner's things share. Box px: x across, y down to the
// desk line (656), z out from the case's plane; 26 cm is 280 px.
export const CM = 280 / 26;
export const WALL = -269;
export const px = (n: number) => `calc(${n} * var(--u))`;
/** A cover as a background-image: on the shelf its .sm.webp copy (lib/
 *  content.ts thumb); taken off it, the full poster over that copy, so the
 *  copy shows until the full one is in. */
export const coverOf = (it: { poster: string | null; thumb?: string | null }, open: boolean) =>
  !it.poster ? undefined : !it.thumb ? `url("${it.poster}")` : open ? `url("${it.poster}"), url("${it.thumb}")` : `url("${it.thumb}")`;
/** the camera is at the corner */
export const here = () => document.documentElement.dataset.desk === "offduty";
/** from elsewhere in the room, a click brings the camera over */
export const come = () => {
  if (!here()) dispatchEvent(new Event(OFFDUTY_EVENT));
};

const TAKE = "kate:offduty-take";

/** what is out and its card: a press on it is not a press elsewhere (the
 *  WebGL room's control for it carries data-open too) */
const OUT = ".bs-book[data-open], .vt-tape[data-open], .od-comic[data-open], .room-hit[data-open]";

/** One thing off the shelf at a time. While `open`, taking anything else
 *  (a book, a tape, the comic) puts this one back, as do a press anywhere
 *  but on it (Kate, 28.09), Escape (before the room takes Escape to leave
 *  the corner) and the camera leaving. */
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
    const onPress = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.(OUT)) putBack(); };
    const mo = new MutationObserver(() => { if (!here()) putBack(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-desk"] });
    addEventListener(TAKE, onTake);
    addEventListener("keydown", onKey, true);
    addEventListener("pointerdown", onPress, true);
    return () => {
      removeEventListener(TAKE, onTake);
      removeEventListener("keydown", onKey, true);
      removeEventListener("pointerdown", onPress, true);
      mo.disconnect();
    };
  }, [open, id]);
}
