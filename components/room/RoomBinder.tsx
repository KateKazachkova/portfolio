"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BinderBook, useBinder } from "@/components/profile/Binder";
import { SPREADS } from "@/components/profile/spreads";
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
      if (root.dataset.desk === "profile") setWarm(true);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-arrived"] });
    return () => { removeEventListener("room:pf-host", onHost); mo.disconnect(); };
  }, []);
  const { at, go } = useBinder(SPREADS.length, live);
  // WebGL's binder lies at the same spread (engine.ts), for the flight away
  useEffect(() => { dispatchEvent(new CustomEvent("room:binder-at", { detail: at })); }, [at]);
  if (!host || !warm) return null;
  // the sheets' text selects here (it is what M4 is for); a click that ends
  // a selection is not a click to turn the page
  const keep = (e: React.MouseEvent) => {
    const s = getSelection();
    if (s && !s.isCollapsed && (e.currentTarget as HTMLElement).contains(s.anchorNode)) e.stopPropagation();
  };
  return createPortal(
    <div className="room-binder__hold" onClickCapture={keep}>
      <BinderBook spreads={SPREADS} at={at} go={go} className="room-binder" style={{ width: "100%" }} />
    </div>,
    host,
  );
}
