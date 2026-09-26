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
 * object is not meant to be used.
 *
 * Where an outline is not a quad (the trophy's silhouette) the control
 * takes no pointer itself: a ray from the pointer into the scene decides,
 * against a small alpha mask of the picture, and hands the click to it.
 */
import * as THREE from "three";
import { projectToStage, type Pose, type View } from "@/lib/room/pose";

export type Hit = {
  id: string; type: string; kind: "link" | "button" | "span"; at: View[]; action?: string;
  label?: string; hover?: string | null; href?: string | null; target?: string | null;
  /** the legacy element it was read off (scripts/room/hits-test.mjs holds
   *  the two side by side) */
  of: { sel: string; i: number };
  w: number; h: number; m: number[];
  mask?: { w: number; h: number; bits: string };
};

// a plain click: with a modifier it is the browser's (a new tab, a download)
const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

const ACTIONS: Record<string, () => void> = {
  recognition: () => { if (document.documentElement.dataset.desk !== "award") dispatchEvent(new Event("kate:recognition")); },
  "offduty-bike": () => {
    const root = document.documentElement;
    if (root.dataset.desk !== "offduty") dispatchEvent(new Event("kate:off-duty"));
    else root.dataset.deskFocus = "bike";
  },
};

export type HitLayer = {
  /** lay the controls over the room for this camera, or hide them (null) */
  place(state: { view: View; pose: Pose; shift: [number, number]; u: number } | null): void;
  dispose(): void;
};

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
  const els = new Map<string, HTMLElement>();
  const labels = new Map<string, HTMLElement>();
  for (const h of o.hits) {
    const el = document.createElement(h.kind === "button" ? "button" : h.kind === "link" ? "a" : "span") as HTMLElement;
    el.className = `room-hit room-hit--${h.type}`;
    el.dataset.hit = h.id;
    if (el instanceof HTMLButtonElement) el.type = "button";
    if (el instanceof HTMLAnchorElement && h.href) {
      el.href = h.href;
      if (h.target) { el.target = h.target; el.rel = "noopener noreferrer"; }
    }
    el.setAttribute("aria-label", h.label || h.id);
    el.tabIndex = -1;
    el.hidden = true;

    if (h.action) el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); ACTIONS[h.action!]?.(); });
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

  return {
    place(state) {
      active = state?.view ?? null;
      for (const h of o.hits) {
        const el = els.get(h.id)!;
        const lab = labels.get(h.id);
        const on = !!state && h.at.includes(state.view);
        el.hidden = !on;
        if (lab) lab.hidden = !on;
        el.tabIndex = on ? 0 : -1;
        if (!on || !state) continue;
        const { pose, shift, u } = state;
        const pts = [[0, 0], [h.w, 0], [h.w, h.h], [0, h.h]].map(([x, y]) => {
          const m = h.m;
          const s = projectToStage(pose, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]]);
          return s ? [s[0] * u + shift[0], s[1] * u + shift[1]] : [NaN, NaN];
        });
        if (pts.some((p) => !Number.isFinite(p[0]))) { el.hidden = true; el.tabIndex = -1; continue; }
        const x0 = Math.min(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1]));
        const x1 = Math.max(...pts.map((p) => p[0])), y1 = Math.max(...pts.map((p) => p[1]));
        Object.assign(el.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
        el.style.clipPath = `polygon(${pts.map((p) => `${(p[0] - x0).toFixed(1)}px ${(p[1] - y0).toFixed(1)}px`).join(", ")})`;
        // the label, centred under it, its type at the object's own scale
        if (lab) {
          const k = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / (h.w * u);
          Object.assign(lab.style, { left: `${(x0 + x1) / 2}px`, top: `${y1 + h.h * u * k * 0.04}px` });
          lab.style.setProperty("--k", String(k));
        }
      }
      if (!state) { over = null; document.documentElement.classList.remove("room-pointer"); }
      o.redraw();
    },
    dispose() {
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick, true);
      document.documentElement.classList.remove("room-pointer");
      layer.remove();
    },
  };
}
