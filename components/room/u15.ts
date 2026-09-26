/**
 * Ukrainska 15's folder and its flash player in the WebGL room (M3), as
 * U15File's: a click opens the folder where it lies, and again puts it
 * away; the player plays the site's song and pauses it. The camera hears
 * of it as it does from U15File (kate:u15-open → the desk pans to it and
 * the case is in focus; kate:u15-closed), and asks it back the same way
 * (kate:u15-close: Escape, another case, "Put the file away";
 * kate:u15-reset: leaving the desk, which stops the song too).
 *
 * Not drawn yet (M6): the folder opening, the prints rising out of its
 * pocket and being dragged about, the player's LCD.
 */
import { roomState, setRoom } from "./state";

const OPEN = "kate:u15-open", CLOSE = "kate:u15-close", CLOSED = "kate:u15-closed", RESET = "kate:u15-reset";
const SONG = "/artefacts/ukrainska-15/player/still-live-in-my-mind.mp3";
export const SONG_TITLE = "Still live in my mind";

let audio: HTMLAudioElement | null = null;
export function toggleSong() {
  if (!audio) {
    audio = new Audio(SONG);
    audio.preload = "none";
    audio.addEventListener("play", () => setRoom({ playing: true }));
    audio.addEventListener("pause", () => setRoom({ playing: false }));
  }
  if (audio.paused) audio.play().catch(() => {}); else audio.pause();
}

export function toggleU15() {
  const root = document.documentElement;
  if (!roomState().u15) {
    setRoom({ u15: true });
    root.dataset.u15 = "open";
    dispatchEvent(new Event(OPEN));
  } else close();
}
// (said once the folder is shut, after the move that asked for it: a case
// clicked while this one is open is in focus by then)
function close(quiet = false) {
  if (!roomState().u15) return;
  setRoom({ u15: false });
  delete document.documentElement.dataset.u15;
  if (!quiet) setTimeout(() => dispatchEvent(new Event(CLOSED)), 0);
}

export function startU15() {
  const onClose = () => close();
  const onReset = () => { close(true); audio?.pause(); };
  addEventListener(CLOSE, onClose);
  addEventListener(RESET, onReset);
  return () => {
    removeEventListener(CLOSE, onClose);
    removeEventListener(RESET, onReset);
    audio?.pause();
    delete document.documentElement.dataset.u15;
  };
}
