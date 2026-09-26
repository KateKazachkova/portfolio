"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { U15File } from "@/components/desk/U15File";
import "./RoomU15.css";

/**
 * Ukrainska 15's folder in the WebGL room (M6): at Case Files, once the
 * camera is there and still, the folder is the page's own U15File laid flat
 * (RoomU15.css) on a panel that hits.ts maps onto the folder as WebGL draws
 * it — its opening, its prints and card to drag about, its tag, the award
 * rows' links, the player and its LCD all the page's own, and the camera
 * hears of it as from the CSS room (kate:u15-open / -close / -reset).
 * WebGL's own folder is put away under it. Away from the corner the panel is
 * only out of sight (hits.ts [data-away]), never removed: its transitions
 * run on, and WebGL lays its parts where they are (u15gl.ts), so leaving
 * while the folder opens or closes, or with a print moved, draws no jump.
 * It is built the first time the camera sets off for Case Files.
 */
// where DeskScene's CASES lay it (x for the pan to it when a part of it
// takes focus; r for the drag, turned into the folder's own axes)
const AT = { x: 1370, y: 682.5, r: -3 };

export function RoomU15() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const onHost = (e: Event) => setHost((e as CustomEvent<HTMLElement | null>).detail);
    addEventListener("room:u15-host", onHost);
    setHost(document.querySelector<HTMLElement>(".room-hit--u15panel"));
    const root = document.documentElement;
    const read = () => { if (root.dataset.desk === "open") setWarm(true); };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    return () => { removeEventListener("room:u15-host", onHost); mo.disconnect(); };
  }, []);
  // the folder and its player take the keyboard at Case Files, as
  // DeskScene gives them it in the CSS room (its cards(), when the view
  // changes: this may be built after)
  useEffect(() => {
    if (!host || !warm) return;
    const root = document.documentElement;
    const tab = () => host.querySelectorAll<HTMLElement>(".u15-hit, .desk-player").forEach((e) => (e.tabIndex = root.dataset.desk === "open" ? 0 : -1));
    const id = requestAnimationFrame(tab);
    const mo = new MutationObserver(tab);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    return () => { cancelAnimationFrame(id); mo.disconnect(); };
  }, [host, warm]);
  if (!host || !warm) return null;
  return createPortal(<div className="room-u15"><U15File x={AT.x} y={AT.y} r={AT.r} /></div>, host);
}
