"use client";

import { useEffect, useState } from "react";
import BookShelf from "@/components/desk/BookShelf";
import TapeStacks from "@/components/desk/TapeStacks";
import DeskComic from "@/components/desk/DeskComic";

/**
 * Off Duty's things in the WebGL room (M6): the page's own shelf, tapes and
 * omnibus, mounted but never drawn (the CSS room is not rendered under the
 * flag), so what is taken out, what drops into its gap, and what puts it
 * back — another taken out, Escape, the camera leaving — are the page's
 * own (offduty.ts usePutBack). The room's controls click their buttons
 * (hits.ts `od-take`) and WebGL draws them as their data-open / data-drop
 * say (shelf.ts). Built as the CSS room builds its corner (DeskScene's
 * useStops): once the page has loaded and the browser is idle, or at once
 * if the camera sets off for Off Duty first (built at the set-off it cost a
 * 25–33 ms frame of the first flight there).
 */
export function RoomOffDuty() {
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (warm) return;
    const root = document.documentElement;
    const check = () => { if (root.dataset.desk === "offduty") setWarm(true); };
    check();
    const mo = new MutationObserver(check);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    let idle = 0;
    const later = () => {
      idle = typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setWarm(true), { timeout: 4000 })
        : window.setTimeout(() => setWarm(true), 400);
    };
    if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
    return () => {
      mo.disconnect(); window.removeEventListener("load", later);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle); else clearTimeout(idle);
    };
  }, [warm]);
  if (!warm) return null;
  return (
    <div className="room-od" hidden>
      <BookShelf />
      <TapeStacks />
      <DeskComic />
    </div>
  );
}
