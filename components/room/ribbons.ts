/**
 * The award ribbons in WebGL (M6): at Recognition a ribbon under the
 * pointer, or with the keyboard's focus, turns on its hook
 * (components/AwardRail.css: `[data-desk="award"] .award-ribbon:hover,
 * :focus-visible { transform: rotate(-4deg) translateY(-2u); z-index: 2 }`
 * about 50% 3%, over .35 s `cubic-bezier(.3, 1.6, .5, 1)`). The lattice is
 * baked without them (bake.mjs); each ribbon is a plane of its own, laid
 * every frame from its element's frame, turned as far as its transition has
 * got. Its controls (hits.ts, `room:ribbon-tilt`) say which is hovered or
 * focused; once the camera leaves Recognition the page's rule no longer
 * matches, and a turned ribbon swings back in flight, as the page's does.
 * They show wherever the lattice shows, just over it (half a lift), each
 * in one blended pass in the page's order, the turned one on top.
 */
import * as THREE from "three";
import { bezier } from "@/lib/room/pose";

type Plane = { meshes: THREE.Mesh[]; mats: THREE.ShaderMaterial[]; m: number[]; w: number; h: number; rib: { n: number; q: [number, number]; w: number; h: number } };
type Ch = { from: number; to: number; t0: number; dur: number; k: number };
export type RibbonCtx = {
  lattice: { meshes: THREE.Mesh[]; k: number };
  ribbons: Plane[];
  lifted: (m: number[], k: number) => number[];
  redraw: () => void;
};

const DUR = 350, EASE = bezier(0.3, 1.6, 0.5, 1);
const TURN = (-4 * Math.PI) / 180, RISE = -2;

export function makeRibbons(o: RibbonCtx) {
  const root = document.documentElement;
  const one = new Map<Plane, THREE.Mesh>();
  for (const p of o.ribbons) {
    one.set(p, p.meshes[p.mats.findIndex((m) => m.transparent)]);
    for (const mat of p.mats) { mat.depthWrite = false; mat.uniforms.alphaMax.value = 2; }
  }
  const by = new Map(o.ribbons.map((p) => [p.rib.n, p]));
  const ch = new Map<Plane, Ch>(o.ribbons.map((p) => [p, { from: 0, to: 0, t0: 0, dur: 0, k: 1 }]));
  const hover = new Set<number>(), focus = new Set<number>();
  const valueOf = (c: Ch, now: number) => {
    if (!c.dur) return c.to;
    const x = (now - c.t0) / c.dur;
    return x >= 1 ? c.to : c.from + (c.to - c.from) * EASE(Math.max(0, x));
  };
  // to where the page's rule has it now, as CSS retargets a transition (a
  // reversal part way takes as long as it had run: the shortening)
  const retarget = (now: number) => {
    const at = root.dataset.desk === "award";
    if (!at) { hover.clear(); focus.clear(); }
    let any = false;
    for (const p of o.ribbons) {
      const c = ch.get(p)!, to = at && (hover.has(p.rib.n) || focus.has(p.rib.n)) ? 1 : 0;
      if (to === c.to) continue;
      const cur = valueOf(c, now);
      const running = c.dur && now - c.t0 < c.dur;
      const f = running && to === c.from ? Math.min(1, Math.max(0, Math.abs(((now - c.t0) / c.dur) * c.k + 1 - c.k))) : 1;
      Object.assign(c, { from: cur, to, t0: now, dur: DUR * f, k: f });
      any = true;
    }
    if (any) o.redraw();
  };
  const onTilt = (e: Event) => {
    const d = (e as CustomEvent<{ i: number; hover?: boolean; focus?: boolean }>).detail;
    if (!by.has(d.i)) return;
    if (d.hover !== undefined) { if (d.hover) hover.add(d.i); else hover.delete(d.i); }
    if (d.focus !== undefined) { if (d.focus) focus.add(d.i); else focus.delete(d.i); }
    retarget(performance.now());
  };
  addEventListener("room:ribbon-tilt", onTilt);
  const mo = new MutationObserver(() => retarget(performance.now()));
  mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });

  const F = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4(), S = new THREE.Matrix4();
  /** lays them for this frame; true while any is still turning */
  const frame = (now: number) => {
    const vis = o.lattice.meshes[0].visible;
    let moving = false;
    // the page's order, the turned (hovered, focused) one over the rest
    const order = o.ribbons.slice().sort((a, b) => ch.get(a)!.to - ch.get(b)!.to || a.rib.n - b.rib.n);
    order.forEach((p, rank) => {
      const c = ch.get(p)!, e = valueOf(c, now);
      if (c.dur && now - c.t0 < c.dur) moving = true;
      // the element's frame, just over the lattice (half a lift up)
      F.fromArray(o.lifted(p.m, o.lattice.k + 0.5)).multiply(T.makeTranslation(-p.rib.q[0], -p.rib.q[1], 0));
      if (e) {
        const ox = p.rib.w * 0.5, oy = p.rib.h * 0.03;
        F.multiply(T.makeTranslation(ox, oy, 0)).multiply(R.makeRotationZ(TURN * e)).multiply(T.makeTranslation(0, RISE * e, 0)).multiply(T.makeTranslation(-ox, -oy, 0));
      }
      F.multiply(T.makeTranslation(p.rib.q[0] + p.w / 2, p.rib.q[1] + p.h / 2, 0)).multiply(S.makeScale(p.w, p.h, 1));
      for (const mesh of p.meshes) { mesh.matrix.copy(F); mesh.matrixWorldNeedsUpdate = true; mesh.renderOrder = 100 + rank; mesh.visible = vis && mesh === one.get(p); }
    });
    return moving;
  };
  const dispose = () => { removeEventListener("room:ribbon-tilt", onTilt); mo.disconnect(); };
  return { frame, dispose, tilted: () => o.ribbons.filter((p) => ch.get(p)!.to > 0).map((p) => p.rib.n) };
}
