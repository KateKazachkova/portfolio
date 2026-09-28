"use client";

import { startTransition, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BinderBook, useBinder } from "@/components/profile/Binder";
import { SPREADS } from "@/components/profile/spreads";
import { TUCKED } from "@/components/profile/DeskBinder";
import "./RoomBinder.css";

/**
 * The Profile binder in the WebGL room (M4): at Profile, once the camera is
 * there and still, the binder is the page's own DOM — the same BinderBook
 * and sheets as the CSS room's, so its text reads and selects, its links,
 * tabs, hung certificates and prints work, and ← → turn it — laid flat
 * (RoomBinder.css: a turned sleeve is a mirror about the rings, not a
 * rotation in 3D) on a panel that hits.ts maps onto the binder as WebGL
 * draws it, while WebGL's own binder is put away under it. In flight WebGL
 * draws it. Its sheets are fetched the first time the camera sets off for
 * Profile, as DeskBinder's.
 */
const LEAVES = ["leaf-r", "leaf-l", "leaf-gloss-r", "leaf-gloss-l"];

export function RoomBinder() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [live, setLive] = useState(false);
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const onHost = (e: Event) => setHost((e as CustomEvent<HTMLElement | null>).detail);
    addEventListener("room:pf-host", onHost);
    setHost(document.querySelector<HTMLElement>(".room-hit--pf"));
    const root = document.documentElement;
    const read = () => {
      setLive(root.dataset.desk === "profile" && root.dataset.deskArrived === "1");
      // (its sheets are built as the camera sets off: in slices between
      // frames, not one long task in the flight's first frame)
      if (root.dataset.desk === "profile") startTransition(() => setWarm(true));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-arrived"] });
    return () => { removeEventListener("room:pf-host", onHost); mo.disconnect(); };
  }, []);
  const { at, go } = useBinder(SPREADS.length, live);
  // its pictures decoded while the camera is on its way, off the main thread:
  // decoded at the first paint instead, they cost the landing two slow frames
  useEffect(() => {
    if (!host || !warm) return;
    const imgs = [...host.querySelectorAll("img")];
    // (and the sleeves' own pictures, Binder.css backgrounds: the panel is
    // display none until the camera is there, so they were fetched and
    // decoded on arrival, 30–32 ms each)
    for (const n of LEAVES) { const i = new Image(); i.src = `/profile/binder/${n}.webp`; imgs.push(i); }
    const go = () => imgs.forEach((i) => i.decode().catch(() => {}));
    const id = requestAnimationFrame(go);
    return () => cancelAnimationFrame(id);
  }, [host, warm]);
  // WebGL's binder lies at the same spread (engine.ts), for the flight away;
  // told before the panel paints the new spread, so the room can veil it and
  // draw the turn (binderturn.ts)
  useLayoutEffect(() => { dispatchEvent(new CustomEvent("room:binder-at", { detail: at })); }, [at]);
  if (!host || !warm) return null;
  // the sheets' text selects here (it is what M4 is for); a click that ends
  // a selection is not a click to turn the page
  const keep = (e: React.MouseEvent) => {
    const s = getSelection();
    if (s && !s.isCollapsed && (e.currentTarget as HTMLElement).contains(s.anchorNode)) e.stopPropagation();
  };
  return createPortal(
    <div className="room-binder__hold" onClickCapture={keep}>
      <BinderBook spreads={SPREADS} at={at} go={go} className="room-binder" style={{ width: "100%" }} tucked={TUCKED} />
    </div>,
    host,
  );
}
