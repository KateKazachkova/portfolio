"use client";

import { useEffect, useState } from "react";

/**
 * Whether the desk's own pictures may load yet. Not with home: they would
 * race the room's first paint (on a phone the desk plate, home's largest
 * paint, waited six seconds behind them). They load once home has, when the
 * browser is idle, or at once if Case Files opens first — the camera takes a
 * couple of seconds to come down, time enough to fetch them. The same rule
 * as Ukrainska 15's prints (U15File).
 */
export function useWarm() {
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => { if (root.dataset.desk === "open") setWarm(true); };
    read();
    const mo = new MutationObserver(read);
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
  }, []);
  return warm;
}
