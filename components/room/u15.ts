/**
 * Ukrainska 15's folder and its flash player in the WebGL room. Since M6
 * they are the page's own U15File, laid flat on a panel at Case Files
 * (RoomU15.tsx): it opens and closes itself, plays the song, and says so to
 * the camera as in the CSS room (kate:u15-open / -closed; it hears
 * kate:u15-close and kate:u15-reset). The room's state only follows it
 * (html[data-u15], which U15File sets); the old controls' actions, should
 * one run, press the panel's own.
 */
import { U15_SONG } from "@/lib/u15Song";
import { setRoom } from "./state";

export const SONG_TITLE = U15_SONG.title;

const press = (sel: string) => document.querySelector<HTMLElement>(`.room-hit--u15panel ${sel}`)?.click();
export const toggleU15 = () => press(".u15-hit");
export const toggleSong = () => press(".desk-player");

export function startU15() {
  const root = document.documentElement;
  const player = () => document.querySelector(".room-hit--u15panel .desk-player");
  const read = () => setRoom({ u15: root.dataset.u15 === "open", playing: !!player()?.hasAttribute("data-playing") });
  const mo = new MutationObserver(read);
  mo.observe(root, { attributes: true, attributeFilter: ["data-u15"] });
  // (the player's own attribute, once the panel is built)
  const mp = new MutationObserver(read);
  const watch = () => { const p = player(); if (p) mp.observe(p, { attributes: true, attributeFilter: ["data-playing"] }); };
  const id = setInterval(() => { if (player()) { watch(); clearInterval(id); } }, 500);
  read();
  return () => { mo.disconnect(); mp.disconnect(); clearInterval(id); };
}
