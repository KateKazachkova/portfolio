/**
 * The DVD player's screen in the WebGL room (M3), as OffDutyShelf's: with a
 * disc in, its poster drifting behind the OSD, and its clip over it
 * (YouTube's own player, muted, which a browser lets start by itself); a
 * click on the screen, or Enter, gives it sound, and takes it away again.
 *
 * WebGL cannot draw another site's player, so the screen is a flat DOM
 * panel laid over the lid's screen at the Off Duty stop (hits.ts maps its
 * rectangle onto the projected quad with one matrix3d), and only with a
 * disc in: with none, WebGL's own "NO DISC" is what the legacy screen shows.
 * The clip runs while the camera is at the corner, as it does there.
 */
import { onRoom, roomState, setRoom, type RoomState } from "./state";

export function makeDvd(el: HTMLElement) {
  el.classList.add("od-dvd__screen");
  el.setAttribute("aria-live", "polite");
  let picture = document.createElement("span");
  picture.className = "od-dvd__picture";
  const osd = document.createElement("span");
  osd.className = "od-dvd__osd";
  const title = document.createElement("span");
  title.className = "od-dvd__osd od-dvd__osd--title";
  el.append(picture, osd, title);
  let tube: HTMLIFrameElement | null = null;
  let shownTitle = "";
  let corner = false;

  const tell = (func: string, args: unknown[] = []) =>
    tube?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  const toggle = () => {
    const s = roomState();
    if (!s.picked?.clip || !corner) return;
    // sound on and off in the running player, through the iframe API
    if (s.sound) tell("mute");
    else { tell("unMute"); tell("setVolume", [100]); tell("playVideo"); }
    setRoom({ sound: !s.sound });
  };
  el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });

  const sync = (s: RoomState) => {
    const p = s.picked;
    const clip = corner ? p?.clip ?? null : null;
    el.toggleAttribute("data-on", !!p);
    if (clip) { el.setAttribute("role", "button"); el.setAttribute("aria-label", s.sound ? "Sound off" : "Sound on"); el.dataset.clip = ""; }
    else { el.removeAttribute("role"); el.removeAttribute("aria-label"); delete el.dataset.clip; }
    el.tabIndex = clip ? 0 : -1;
    // a new disc: its picture comes on again (the animation restarts)
    const key = p?.title ?? "";
    if (key !== shownTitle) {
      shownTitle = key;
      const fresh = document.createElement("span");
      fresh.className = "od-dvd__picture";
      fresh.style.backgroundImage = p?.poster ? `url(${p.poster})` : "";
      fresh.hidden = !p?.poster;
      picture.replaceWith(fresh);
      picture = fresh;
    }
    // the clip: a new one for a new disc, gone when the camera leaves
    const want = clip ? `https://www.youtube-nocookie.com/embed/${clip}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&iv_load_policy=3&loop=1&playlist=${clip}&enablejsapi=1` : null;
    if (tube && tube.dataset.src !== want) { tube.remove(); tube = null; }
    if (want && !tube) {
      tube = document.createElement("iframe");
      tube.className = "od-dvd__tube";
      tube.dataset.src = want;
      tube.src = want;
      tube.title = `${p!.title} – clip`;
      tube.allow = "autoplay; encrypted-media; picture-in-picture";
      tube.referrerPolicy = "strict-origin-when-cross-origin";
      el.insertBefore(tube, osd);
    }
    tube?.toggleAttribute("data-sound", s.sound);
    osd.textContent = p ? (clip ? (s.sound ? "▶ PLAY · SOUND ON" : "▶ PLAY · CLICK FOR SOUND") : "▶ PLAY") : "KATE™ DVD";
    title.textContent = p ? `${p.title}${p.year ? ` · ${p.year}` : ""}` : "";
  };
  const off = onRoom(sync);
  sync(roomState());
  return {
    /** the camera is at the Off Duty corner (the clip plays) or not */
    corner(on: boolean) {
      if (on === corner) return;
      corner = on;
      // leaving the corner mutes it again
      if (!on && roomState().sound) setRoom({ sound: false });
      else sync(roomState());
    },
    dispose() { off(); tube?.remove(); },
  };
}
