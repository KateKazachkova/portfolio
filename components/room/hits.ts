/**
 * What can be clicked in the WebGL room (M3): public/room/hits.json,
 * read off the CSS room by scripts/room/hits.mjs.
 *
 * Each object is a real, flat DOM control — a link or a button, with its
 * accessible name — laid over where the camera draws the object once it is
 * at rest: its projected box, clipped to the projected outline (a quad seen
 * in perspective is not a rectangle), in the stage's own coordinates. So the
 * keyboard, focus, Enter and screen readers work as on any page. Nothing is
 * shown or focusable while the camera travels, nor at a stop where the
 * object is not meant to be used, nor while the room's state has it away
 * (a disc in the player is not in its pocket).
 *
 * Where an outline is not a quad (the trophy's silhouette) the control
 * takes no pointer itself: a ray from the pointer into the scene decides,
 * against a small alpha mask of the picture, and hands the click to it.
 *
 * A surface (the DVD's screen) is a panel with content of its own, mapped
 * onto the object's projected quad whole, by one matrix3d.
 */
import * as THREE from "three";
import { projectToStage, type Pose, type View } from "@/lib/room/pose";
import { makeDvd } from "./dvd";
import { SONG_TITLE, startU15, toggleSong, toggleU15 } from "./u15";
import {
  bikeWords, discAt, loadSeries, loadStrava, onRoom, pickDisc, roomState, stepBike, stravaHref, turnSpread, type RoomState,
} from "./state";

export type Hit = {
  id: string; type: string; kind: "link" | "button" | "span"; at: View[]; action?: string;
  label?: string; hover?: string | null; href?: string | null; target?: string | null;
  /** the legacy element it was read off (scripts/room/hits-test.mjs holds
   *  the two side by side) */
  of: { sel: string; i: number };
  /** false: for the pointer only (what the keyboard reaches another way) */
  tab?: boolean;
  /** the case file it belongs to (Case Files): focus on it pans the desk there */
  slug?: string;
  /** there only while that case is in focus (html[data-desk-focus]), or only while it is not */
  focus?: string; notFocus?: string;
  /** where it lies while a case is in focus, if not at m (a case laid out, the others moved aside) */
  byFocus?: Record<string, number[]>;
  w: number; h: number; m: number[];
  mask?: { w: number; h: number; bits: string };
};

// a plain click: with a modifier it is the browser's (a new tab, a download)
const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

const ACTIONS: Record<string, (h: Hit) => void> = {
  recognition: () => { if (document.documentElement.dataset.desk !== "award") dispatchEvent(new Event("kate:recognition")); },
  profile: () => { if (document.documentElement.dataset.desk !== "profile") dispatchEvent(new Event("kate:profile")); },
  "offduty-bike": () => {
    const root = document.documentElement;
    if (root.dataset.desk !== "offduty") dispatchEvent(new Event("kate:off-duty"));
    else root.dataset.deskFocus = "bike";
  },
  // down over the unit: its buttons page through the screens, and a click
  // anywhere on it goes on to the next
  "bike-next": () => stepBike(1),
  "bike-prev": () => stepBike(-1),
  // the wallet: a disc into the player; a click on a sleeve's margin turns
  // the spread that way (the left sleeve back, the right one on)
  "disc-pick": (h) => { const d = discAt(h.of.i); if (d) pickDisc(d); },
  "sleeve-turn": (h) => turnSpread(h.of.i === 0 ? -1 : 1),
  // Case Files: a case into focus (useDeskCamera lays it out and pans to
  // it); Ukrainska 15's folder opened or put away; its song
  case: (h) => dispatchEvent(new CustomEvent("room:case", { detail: h.slug })),
  "u15-toggle": () => toggleU15(),
  "u15-play": () => toggleSong(),
};

// what changes on a control with the room's state: the Strava button opens
// the ride on screen; a pocket's disc is the open spread's
const BIND: Record<string, (el: HTMLElement, s: RoomState, h: Hit) => void> = {
  "bike-strava": (el, s) => { (el as HTMLAnchorElement).href = stravaHref(s); },
  disc: (el, s, h) => { const d = discAt(h.of.i, s); if (d) el.setAttribute("aria-label", `${d.title} — put it in the player`); },
  u15: (el, s) => { el.setAttribute("aria-label", s.u15 ? "Put Ukrainska 15 away" : "Open Ukrainska 15"); el.setAttribute("aria-expanded", String(s.u15)); },
  player: (el, s) => { el.setAttribute("aria-label", `${s.playing ? "Pause" : "Play"} “${SONG_TITLE}”`); el.setAttribute("aria-pressed", String(s.playing)); },
};
// whether the room's state has it there at all
const SHOWN: Record<string, (s: RoomState, h: Hit) => boolean> = {
  disc: (s, h) => { const d = discAt(h.of.i, s); return !!d && d.title !== s.picked?.title; },
  dvd: (s) => !!s.picked,
};
// what a stop says, as its screen changes (polite: after what is being read)
const LIVE: Partial<Record<View, (s: RoomState) => string>> = {
  bike: bikeWords,
};
// panels with content of their own
type Surface = { corner(on: boolean): void; dispose(): void };
const SURFACE: Partial<Record<string, (el: HTMLElement) => Surface>> = { dvd: makeDvd };

export type HitLayer = {
  /** lay the controls over the room for this camera, or hide them (null) */
  place(state: { view: View; pose: Pose; shift: [number, number]; u: number } | null): void;
  dispose(): void;
};

/** the projective map of the rectangle w × h onto the quad p (tl, tr, br, bl), as CSS matrix3d */
function quadMatrix(w: number, h: number, p: number[][]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].map((v) => +v.toFixed(8)).join(",")})`;
}

export function startHits(o: {
  host: HTMLElement; // .scene-cam: the stage's own coordinates
  hits: Hit[];
  camera: THREE.Camera;
  canvasRect: () => DOMRect;
  redraw: () => void;
  navigate?: (href: string) => void;
}): HitLayer {
  const layer = document.createElement("div");
  layer.className = "room-hits";
  o.host.appendChild(layer);
  const live = document.createElement("div");
  live.className = "room-live";
  live.setAttribute("aria-live", "polite");
  layer.appendChild(live);
  const els = new Map<string, HTMLElement>();
  const labels = new Map<string, HTMLElement>();
  const surfaces = new Map<string, Surface>();
  for (const h of o.hits) {
    const surface = SURFACE[h.type];
    // (for the pointer only: no element a screen reader would list)
    const el = document.createElement(surface || h.tab === false ? "div" : h.kind === "button" ? "button" : h.kind === "link" ? "a" : "span") as HTMLElement;
    el.className = `room-hit room-hit--${h.type}`;
    el.dataset.hit = h.id;
    el.hidden = true;
    if (surface) {
      layer.appendChild(el);
      els.set(h.id, el);
      surfaces.set(h.id, surface(el));
      continue;
    }
    if (el instanceof HTMLButtonElement) el.type = "button";
    if (el instanceof HTMLAnchorElement && h.href) {
      el.href = h.href;
      if (h.target) { el.target = h.target; el.rel = "noopener noreferrer"; }
    }
    if (h.tab === false) el.setAttribute("aria-hidden", "true");
    else { el.setAttribute("aria-label", h.label || h.id); el.tabIndex = -1; }

    if (h.action) el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); ACTIONS[h.action!]?.(h); });
    // a link of the site's own goes on the client, as a Next <Link> does
    else if (h.kind === "link" && h.href?.startsWith("/") && !h.target && o.navigate) el.addEventListener("click", (e) => {
      if (!plain(e)) return;
      e.preventDefault();
      o.navigate!(h.href!);
    });
    // a silhouette is hit-tested by the ray, not by the box
    if (h.mask) el.style.pointerEvents = "none";
    layer.appendChild(el);
    els.set(h.id, el);
    // its label, under it on hover and focus (a sibling: the control is
    // clipped to its outline, the label must not be)
    if (h.hover) {
      const lab = document.createElement("span");
      lab.className = "room-hit__label";
      lab.textContent = h.hover;
      lab.setAttribute("aria-hidden", "true");
      lab.hidden = true;
      layer.appendChild(lab);
      labels.set(h.id, lab);
    }
  }

  // the ray's targets: one quad per object with a mask, never drawn
  const proxies = new THREE.Scene();
  const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  for (const h of o.hits) {
    if (!h.mask) continue;
    // plane (0,0)…(1,1) in the object's own box, y down as in the CSS
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    mesh.matrixAutoUpdate = false;
    mesh.matrix.fromArray(h.m).multiply(new THREE.Matrix4().makeScale(h.w, h.h, 1));
    mesh.matrixWorldNeedsUpdate = true;
    mesh.userData.hit = h;
    proxies.add(mesh);
  }
  proxies.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  let active: View | null = null;
  let over: Hit | null = null;
  let refocus = false;
  const pick = (e: PointerEvent | MouseEvent): Hit | null => {
    if (!active || !proxies.children.length) return null;
    const r = o.canvasRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, o.camera);
    for (const x of ray.intersectObjects(proxies.children, false)) {
      const h = x.object.userData.hit as Hit;
      if (!h.at.includes(active) || !h.mask || !x.uv) continue;
      // the plane's uv is y up; the mask's rows run down
      const mx = Math.min(h.mask.w - 1, Math.floor(x.uv.x * h.mask.w)), my = Math.min(h.mask.h - 1, Math.floor(x.uv.y * h.mask.h));
      if (h.mask.bits[my * h.mask.w + mx] === "1") return h;
    }
    return null;
  };
  // only where no control of the page's own is under the pointer
  const free = (t: EventTarget | null) => !(t instanceof Element && t.closest("a, button, input, [role=button], .scene-hit, .katetalk, .inktip, .room-hit:not(.room-hit--trophy)"));
  const onMove = (e: PointerEvent) => {
    const h = free(e.target) ? pick(e) : null;
    if (h === over) return;
    over = h;
    document.documentElement.classList.toggle("room-pointer", !!h);
  };
  const onClick = (e: MouseEvent) => {
    if (!free(e.target)) return;
    const h = pick(e);
    if (!h) return;
    e.preventDefault(); e.stopPropagation();
    els.get(h.id)?.click();
  };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("click", onClick, true);
  // ← → page the bike computer while the camera is down over it, and turn
  // the wallet's spreads at the corner
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    const d = e.key === "ArrowRight" ? 1 : -1;
    if (active === "bike") stepBike(d);
    else if (active === "offduty") turnSpread(d);
  };
  addEventListener("keydown", onKey);
  if (o.hits.some((h) => h.type.startsWith("bike"))) loadStrava();
  if (o.hits.some((h) => h.type === "disc")) loadSeries();
  const stopU15 = o.hits.some((h) => h.type === "u15") ? startU15() : null;
  // focus on a case's control pans the desk to that case, as focus on a card does
  for (const h of o.hits) if (h.slug) els.get(h.id)!.addEventListener("focus", () => dispatchEvent(new CustomEvent("room:case-focus", { detail: h.slug })));
  const root = document.documentElement;
  const inFocus = (h: Hit) => {
    const f = root.dataset.deskFocus;
    return (h.focus === undefined || f === h.focus) && (h.notFocus === undefined || f !== h.notFocus);
  };

  // where each control lies at the current stop (place), and which of them
  // the room's state has there (refresh, again on every change of it)
  const placed = new Set<string>();
  const refresh = (s: RoomState) => {
    const had = document.activeElement instanceof HTMLElement && layer.contains(document.activeElement) ? document.activeElement : null;
    for (const h of o.hits) {
      const el = els.get(h.id)!;
      const on = placed.has(h.id) && inFocus(h) && (SHOWN[h.type]?.(s, h) ?? true);
      el.hidden = !on;
      const lab = labels.get(h.id);
      if (lab) lab.hidden = !on;
      if (!surfaces.has(h.id) && h.tab !== false) el.tabIndex = on ? 0 : -1;
      BIND[h.type]?.(el, s, h);
    }
    const corner = document.documentElement.dataset.desk === "offduty";
    for (const sf of surfaces.values()) sf.corner(corner);
    const say = active ? LIVE[active] : undefined;
    live.textContent = say ? say(s) : "";
    // what had focus is gone (the disc went into the player): the control
    // after it, or else before it, takes it
    if (had && had.hidden && active) {
      const all = [...layer.querySelectorAll<HTMLElement>(".room-hit")];
      const i = all.indexOf(had);
      const next = [...all.slice(i + 1), ...all.slice(0, i).reverse()].find((e) => !e.hidden && e.tabIndex === 0);
      next?.focus({ preventScroll: true });
    }
  };
  const off = onRoom(refresh);
  // a case in focus (or none) moves what lies on the desk, even where the
  // camera stays (Ukrainska 15 opens at the pan it may be at already)
  let last: Parameters<HitLayer["place"]>[0] = null;
  const mo = new MutationObserver(() => { if (last) layerApi.place(last); });
  mo.observe(root, { attributes: true, attributeFilter: ["data-desk-focus"] });

  const layerApi: HitLayer = {
    place(state) {
      last = state;
      // a control that sent the camera off loses its focus as it goes: the
      // stop it lands at gives it to its first control
      if (!state && layer.contains(document.activeElement)) refocus = true;
      active = state?.view ?? null;
      placed.clear();
      for (const h of o.hits) {
        const el = els.get(h.id)!;
        if (!state || !h.at.includes(state.view)) continue;
        const { pose, shift, u } = state;
        const m = h.byFocus?.[root.dataset.deskFocus ?? ""] ?? h.m;
        const pts = [[0, 0], [h.w, 0], [h.w, h.h], [0, h.h]].map(([x, y]) => {
          const s = projectToStage(pose, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]]);
          return s ? [s[0] * u + shift[0], s[1] * u + shift[1]] : [NaN, NaN];
        });
        if (pts.some((p) => !Number.isFinite(p[0]))) continue;
        placed.add(h.id);
        if (surfaces.has(h.id)) {
          // the panel at the object's own size, mapped onto its quad
          Object.assign(el.style, { left: "0px", top: "0px", width: `${h.w * u}px`, height: `${h.h * u}px`, transform: quadMatrix(h.w * u, h.h * u, pts) });
          el.style.setProperty("--u", `${u}px`);
          continue;
        }
        const x0 = Math.min(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1]));
        const x1 = Math.max(...pts.map((p) => p[0])), y1 = Math.max(...pts.map((p) => p[1]));
        Object.assign(el.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
        el.style.clipPath = `polygon(${pts.map((p) => `${(p[0] - x0).toFixed(1)}px ${(p[1] - y0).toFixed(1)}px`).join(", ")})`;
        // the label, centred under it, its type at the object's own scale
        const lab = labels.get(h.id);
        if (lab) {
          const k = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / (h.w * u);
          Object.assign(lab.style, { left: `${(x0 + x1) / 2}px`, top: `${y1 + h.h * u * k * 0.04}px` });
          lab.style.setProperty("--k", String(k));
        }
      }
      refresh(roomState());
      if (!state) { over = null; document.documentElement.classList.remove("room-pointer"); }
      else if (refocus) {
        refocus = false;
        if (!document.activeElement || document.activeElement === document.body)
          layer.querySelector<HTMLElement>(".room-hit:not([hidden])[tabindex='0']")?.focus({ preventScroll: true });
      }
      o.redraw();
    },
    dispose() {
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick, true);
      removeEventListener("keydown", onKey);
      off();
      mo.disconnect();
      stopU15?.();
      for (const sf of surfaces.values()) sf.dispose();
      document.documentElement.classList.remove("room-pointer");
      layer.remove();
    },
  };
  return layerApi;
}
