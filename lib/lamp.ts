"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The desk lamp beside the flip clock: a switch the whole site can see.
 *
 * On or off lives on <html data-lamp> (the boot script in app/layout.tsx puts
 * it there before first paint) and in localStorage, so it holds across pages
 * and visits. In the dark it decides the light: on, the room is lit warm from
 * the lamp and every page takes a warmer wash; off, the desk is moonlight and
 * a torch that follows the pointer (components/NightRoom.tsx).
 */

const EVENT = "kate:lamp";

function read(): boolean {
  return document.documentElement.getAttribute("data-lamp") !== "off";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useLamp() {
  // On for the server render and the first client one alike.
  const on = useSyncExternalStore(subscribe, read, () => true);
  const toggle = useCallback(() => {
    const next = read() ? "off" : "on";
    document.documentElement.setAttribute("data-lamp", next);
    try { localStorage.setItem("lamp", next); } catch { /* private mode */ }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { on, toggle };
}
