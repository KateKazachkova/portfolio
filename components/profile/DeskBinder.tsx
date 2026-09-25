"use client";

import { useEffect, useState } from "react";
import { BinderBook, useBinder } from "./Binder";
import { SPREADS } from "./spreads";

export const PROFILE_EVENT = "kate:profile";

// On the desk in front of the certificate, square to the camera so it reads
// straight from overhead. An open A4 binder
// is ~52 × 30 cm, so 560 desk px across (1075 per metre) at the photograph's
// aspect. x, y are its centre on the desk plane from its left/back corner.
const BINDER = { x: 3031, y: 290, w: 560, r: 0 };
const H = Math.round(BINDER.w * 2136 / 3717);

/** The Profile binder where it lies on home's desk. From anywhere else in
 *  the room a click brings the camera down over it (Profile in the index does
 *  the same); once the camera is there, clicks and the arrow keys turn it. */
export default function DeskBinder() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setLive(root.dataset.desk === "profile" && root.dataset.deskArrived === "1");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-arrived"] });
    return () => mo.disconnect();
  }, []);
  const { at, go } = useBinder(SPREADS.length, live);
  return (
    <BinderBook
      spreads={SPREADS} at={at} go={go}
      className="desk-binder"
      style={{
        left: `calc(${BINDER.x - BINDER.w / 2} * var(--u))`, top: `calc(${BINDER.y - H / 2} * var(--u))`,
        width: `calc(${BINDER.w} * var(--u))`, transform: `rotate(${BINDER.r}deg) translateZ(.1px)`,
      }}
      onClick={() => {
        if (live) return false;
        if (document.documentElement.dataset.desk !== "profile") dispatchEvent(new Event(PROFILE_EVENT));
        return true;
      }}
    />
  );
}
