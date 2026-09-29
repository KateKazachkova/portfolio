/**
 * The Profile binder's turns and its hung certificates turned over, in
 * WebGL (M6). At Profile at rest the binder is the page's own DOM, laid
 * flat (RoomBinder.tsx): there a turn and a certificate going over are
 * instant. So while one runs the room veils that panel (hits.ts `veil`:
 * transparent, still under the pointer and the keyboard, as the page's
 * binder is mid-turn) and draws it here, as Binder.css does it: each leaf
 * turns about the ring line, translateZ(lift + z·.4 binder px) rotateY(−180°), 1.15 s
 * cubic-bezier(.4, 0, .2, 1), 80 ms after the one before in a jump of
 * several; in the air its sheet is three bands, each hinged on the one
 * before, bending (pf-curl: 16° at 35 %, 7° at 70 %) and shaded (pf-shade:
 * .28 at the middle); a certificate hung on the rings goes over by itself,
 * rotateY(180°) translateZ(6 + 2·o u), .9 s. In flight (leaving mid-turn,
 * or with a certificate over) the same, so nothing pops at the hand-over.
 *
 *   plane = P × T(o) · [translateZ(z) rotateY(θ)] · T(−o) × [hung: T(o) · flip · T(−o)] × rel,
 *   rel = W0⁻¹ × plane₀   (P: the leaf's frame, its transform off; W0: as baked, at spread 1)
 */
import * as THREE from "three";
import { bezier } from "@/lib/room/pose";

export type LeafFrame = { P: number[]; W0: number[]; w: number; h: number };
type Part = "front" | "back" | "rev" | "hang" | "rigid";
type Plane = {
  meshes: THREE.Mesh[]; mats: THREE.ShaderMaterial[]; m: number[]; w: number; h: number; k: number;
  leaf: { i: number; part: Part; hang?: string };
  /** whether the bake's spread `at` shows it */
  visAt: (at: number) => boolean;
  /** the engine's own say at this moment: the stop's state and the panel's */
  vis: () => boolean; away: () => boolean; op: () => number;
  /** a material of the plane's picture (a band's), kept in step with its texture */
  watch: (mat: THREE.ShaderMaterial) => void;
};
export type BinderCtx = {
  scene: THREE.Scene;
  leaves: LeafFrame[];
  planes: Plane[];
  lifted: (m: number[], k: number) => number[];
  placed: (m: number[], w: number, h: number) => THREE.Matrix4;
  reduced: () => boolean;
  redraw: () => void;
  /** the page's binder on the panel (its hung sheets' data-flipped, --o) */
  panel: () => HTMLElement | null;
  /** hide the page's panel while WebGL draws a turn at rest (and show it again) */
  veil: (on: boolean) => void;
};

const TURN = 1150, LAG = 80, FLIP = 900, CLEAR = TURN + 80 * 4;
const EASE = bezier(0.4, 0, 0.2, 1);
const D2R = Math.PI / 180;
// keyframes, each stretch eased (an animation's timing function runs per keyframe)
const keyed = (ks: [number, number][]) => (p: number) => {
  if (p <= 0) return ks[0][1];
  if (p >= 1) return ks[ks.length - 1][1];
  for (let j = 1; j < ks.length; j++) if (p <= ks[j][0]) {
    const [a, va] = ks[j - 1], [b, vb] = ks[j];
    return va + (vb - va) * EASE((p - a) / (b - a));
  }
  return 0;
};
const CURL = keyed([[0, 0], [0.35, 16], [0.7, 7], [1, 0]]);
const SHADE = keyed([[0, 0], [0.5, 1], [1, 0]]);

/** a transition of two numbers (a leaf's z and angle, a sheet's turn), as CSS runs one */
class Tr {
  from: number[]; to: number[]; t0 = 0; dur = 0; delay = 0; active = false; private k = 1;
  constructor(v: number[]) { this.from = v; this.to = v; }
  value(now: number) {
    if (!this.active) return this.to;
    const x = (now - this.t0 - this.delay) / this.dur;
    if (x <= 0) return this.from;
    if (x >= 1) return this.to;
    const e = EASE(x);
    return this.from.map((v, i) => v + (this.to[i] - v) * e);
  }
  tick(now: number) { if (this.active && now - this.t0 - this.delay >= this.dur) this.active = false; return this.active; }
  go(v: number[], dur: number, delay: number, now: number) {
    if (v.every((x, i) => Math.abs(x - this.to[i]) < 1e-6)) return false;
    const cur = this.value(now);
    if (dur <= 0) { this.from = v; this.to = v; this.active = false; return true; }
    let d = dur;
    // sent back where it came from: CSS shortens it by how far it had got
    if (this.active && v.every((x, i) => Math.abs(x - this.from[i]) < 1e-6)) {
      const x = Math.min(1, Math.max(0, (now - this.t0 - this.delay) / this.dur));
      const f = Math.min(1, Math.max(0, Math.abs(EASE(x) * this.k + 1 - this.k)));
      d *= f; this.k = f;
    } else this.k = 1;
    Object.assign(this, { from: cur, to: v, t0: now, dur: Math.max(1, d), delay, active: true });
    return true;
  }
}

export function makeBinderTurn(c: BinderCtx) {
  const n = c.leaves.length;
  const zOf = (i: number, at: number) => (i < at ? i + 1 : n - i + 1);
  const origin = (l: LeafFrame) => [-0.093 * l.w, 0.5 * l.h, 0];
  const T = new THREE.Matrix4(), R = new THREE.Matrix4();
  // each leaf's z as baked (the page at spread 1): its lift over the board
  // and the step between leaves (Binder.css .4 × --u, the binder's own px), in u
  const z0s = c.leaves.map((l) => new THREE.Matrix4().fromArray(l.P).invert().multiply(new THREE.Matrix4().fromArray(l.W0)).elements[14]);
  const STEP = n > 2 ? (z0s[1] - z0s[2]) / (zOf(1, 1) - zOf(2, 1)) : 0.2;
  const leaves = c.leaves.map((l, i) => {
    const P = new THREE.Matrix4().fromArray(l.P), W0 = new THREE.Matrix4().fromArray(l.W0);
    const lift = z0s[i] - STEP * zOf(i, 1);
    return { l, P, inv0: W0.clone().invert(), o: origin(l), lift, tr: new Tr([lift + STEP * zOf(i, 1), i < 1 ? -180 : 0]), air: null as null | { dir: 1 | -1; t0: number; lag: number } };
  });
  type Band = { meshes: THREE.Mesh[]; uv: [number, number]; k: number };
  const planes = c.planes.map((p) => {
    const rel = leaves[p.leaf.i].inv0.clone().multiply(new THREE.Matrix4().fromArray(p.m));
    return { ...p, rel, bands: null as Band[] | null, cache: null as THREE.Matrix4 | null };
  });
  // a sheet's bands: three strips of its own picture, made the first time it flies
  const bandsOf = (p: (typeof planes)[number]) => {
    if (p.bands) return p.bands;
    const l = leaves[p.leaf.i].l, r = p.rel.elements;
    // the picture's x to the leaf's (a sheet is not turned in its own plane: x maps alone)
    const a = r[12], b = r[0];
    const e = 1.8; // each band overlaps the next by 2 px of the bake page, as Binder.css's
    p.bands = [0, 1, 2].map((k) => {
      const x0 = (k * l.w) / 3 - e, x1 = ((k + 1) * l.w) / 3 + e;
      const q = [(x0 - a) / b, (x1 - a) / b].sort((u, v) => u - v).map((x) => Math.min(p.w, Math.max(0, x))) as [number, number];
      const meshes = p.meshes.map((m0) => {
        const mat = (m0.material as THREE.ShaderMaterial).clone();
        mat.uniforms.uvRect.value.set(q[0] / p.w, 0, q[1] / p.w, 1);
        p.watch(mat);
        const mesh = new THREE.Mesh(m0.geometry, mat);
        mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.renderOrder = m0.renderOrder;
        c.scene.add(mesh);
        return mesh;
      });
      return { meshes, uv: q, k };
    });
    return p.bands;
  };

  // the turn: from the spread shown to the one asked for
  let at = 1, from = 1, lastTurn = -1e9, flying: { dir: 1 | -1; lo: number; hi: number } | null = null;
  const turnTo = (to: number, now: number) => {
    if (to === at) return;
    const dir: 1 | -1 = to > at ? 1 : -1;
    const lo = Math.min(at, to), hi = Math.max(at, to);
    from = at; at = to; lastTurn = now; flying = { dir, lo, hi };
    const still = c.reduced();
    leaves.forEach((x, i) => {
      const air = i >= lo && i < hi;
      const lag = air ? (dir > 0 ? i - lo : hi - 1 - i) * LAG : 0;
      x.tr.go([x.lift + STEP * zOf(i, at), i < at ? -180 : 0], still ? 0 : TURN, lag, now);
      if (air && !still) { if (!x.air) x.air = { dir, t0: now, lag }; } else x.air = null;
    });
    // (the page's binder puts every certificate back on a turn)
    c.redraw();
  };

  // the hung certificates: over by themselves, as the page's binder has them
  const flips = new Map<string, Tr>();
  const readFlips = (now: number) => {
    const root = c.panel();
    let changed = false;
    const seen = new Set<string>();
    root?.querySelectorAll<HTMLElement>(".pf-leaf").forEach((leaf, i) => leaf.querySelectorAll<HTMLElement>(":scope > .pf-hangleaf").forEach((h, k) => {
      const key = `${i}.${k}`, on = h.hasAttribute("data-flipped"), o = +(h.style.getPropertyValue("--o") || 0);
      seen.add(key);
      let tr = flips.get(key);
      if (!tr) { tr = new Tr([0, 0]); flips.set(key, tr); }
      changed = tr.go(on ? [180, 6 + 2 * o] : [0, 0], c.reduced() ? 0 : FLIP, 0, now) || changed;
    }));
    for (const [key, tr] of flips) if (!seen.has(key)) changed = tr.go([0, 0], c.reduced() ? 0 : FLIP, 0, now) || changed;
    if (changed) c.redraw();
    return changed;
  };
  const flipped = () => [...flips].filter(([, tr]) => tr.to[0] > 0 || tr.active).map(([k]) => k);

  // while anything runs at rest, the page's panel is veiled
  let veiled = false, heldUntil = -1e9;
  const busy = (now: number) => now < heldUntil || leaves.some((x) => x.tr.active || x.air) || [...flips.values()].some((t) => t.active) || now - lastTurn < CLEAR;

  const L = new THREE.Matrix4(), H = new THREE.Matrix4(), W = new THREE.Matrix4(), C = new THREE.Matrix4();
  const leafMat = (x: (typeof leaves)[number], now: number) => {
    const [z, th] = x.tr.value(now), o = x.o;
    return L.copy(x.P).multiply(T.makeTranslation(o[0], o[1], o[2])).multiply(T.makeTranslation(0, 0, z)).multiply(R.makeRotationY(th * D2R)).multiply(T.makeTranslation(-o[0], -o[1], -o[2]));
  };
  const hinge = (m: THREE.Matrix4, x: number, a: number) => m.multiply(T.makeTranslation(x, 0, 0)).multiply(R.makeRotationY(a * D2R)).multiply(T.makeTranslation(-x, 0, 0));
  const put = (mesh: THREE.Mesh, m: THREE.Matrix4, k: number, w: number, h: number, vis: boolean) => {
    mesh.matrix.copy(c.placed(c.lifted(Array.from(m.elements), k), w, h)); mesh.matrixWorldNeedsUpdate = true; mesh.visible = vis;
  };
  /** lays the binder for this frame (after the engine's settle, before the prints); true while it moves */
  const frame = (now: number) => {
    if (flying && now - lastTurn >= CLEAR) { flying = null; for (const x of leaves) x.air = null; }
    const turning = flying !== null;
    const moving = busy(now);
    const fl = flipped();
    // still: every plane as last laid (settle may have put the bake's back:
    // restored, nothing made); a turn or a certificate going over: laid anew
    const still = !moving && !turning;
    for (const p of planes) {
      if (still && p.cache) {
        const i = p.leaf.i;
        let vis = p.vis();
        if (p.leaf.part === "rev") vis = !!p.leaf.hang && fl.includes(p.leaf.hang) && (p.visAt(at) || p.vis() || planes.some((q) => q.leaf.hang === p.leaf.hang && q.leaf.part === "hang" && q.vis()));
        vis = vis && !p.away() && p.op() > 0.001;
        void i;
        for (const mesh of p.meshes) { if (!mesh.matrix.equals(p.cache)) { mesh.matrix.copy(p.cache); mesh.matrixWorldNeedsUpdate = true; } mesh.visible = vis; }
        if (p.bands) for (const bd of p.bands) for (const mesh of bd.meshes) mesh.visible = false;
        continue;
      }
      const x = leaves[p.leaf.i], l = x.l;
      W.copy(leafMat(x, now));
      if (p.leaf.hang) {
        const f = flips.get(p.leaf.hang);
        if (f) { const [a, z] = f.value(now), o = x.o; W.multiply(H.makeTranslation(o[0], o[1], o[2]).multiply(R.makeRotationY(a * D2R)).multiply(T.makeTranslation(0, 0, z)).multiply(T.makeTranslation(-o[0], -o[1], -o[2]))); }
      }
      // what shows: the stop's, and while it turns what either spread shows, and a leaf in the air
      const i = p.leaf.i;
      let vis = p.vis() || (turning && (p.visAt(from) || p.visAt(at) || (!!x.air && (p.visAt(i) || p.visAt(i + 1)))));
      if (p.leaf.part === "rev") vis = !!p.leaf.hang && fl.includes(p.leaf.hang) && (p.visAt(at) || p.vis() || planes.some((q) => q.leaf.hang === p.leaf.hang && q.leaf.part === "hang" && q.vis()));
      vis = vis && !p.away() && p.op() > 0.001;
      const inAir = !!x.air && (p.leaf.part === "front" || p.leaf.part === "back");
      const Wm = W.clone().multiply(p.rel);
      const mm = c.placed(c.lifted(Array.from(Wm.elements), p.k), p.w, p.h);
      p.cache = mm;
      for (const mesh of p.meshes) { mesh.matrix.copy(mm); mesh.matrixWorldNeedsUpdate = true; mesh.visible = vis && !inAir; }
      if (inAir || p.bands) {
        const bands = bandsOf(p);
        const t = x.air ? (now - x.air.t0 - x.air.lag) / TURN : 1;
        const curl = x.air ? CURL(t) * x.air.dir : 0, shade = x.air ? SHADE(t) : 0;
        for (const bd of bands) {
          C.copy(W);
          if (bd.k >= 1) hinge(C, l.w / 3, curl);
          if (bd.k >= 2) hinge(C, (2 * l.w) / 3, curl);
          C.multiply(p.rel).multiply(T.makeTranslation(bd.uv[0], 0, 0));
          for (const mesh of bd.meshes) {
            put(mesh, C, p.k, bd.uv[1] - bd.uv[0], p.h, vis && inAir);
            const u = (mesh.material as THREE.ShaderMaterial).uniforms;
            u.brightness.value = 1 - 0.28 * shade; u.opacity.value = p.op();
          }
        }
      }
    }
    for (const x of leaves) x.tr.tick(now);
    for (const f of flips.values()) f.tick(now);
    return moving;
  };
  /** the prints' sheet (budgl.ts) shows while its leaf is in the air too */
  const shownAir = (i: number) => !!leaves[i]?.air;
  return {
    frame, turnTo, readFlips, flipped, busy, shownAir,
    /** a turn asked for, to start once its pictures are in: busy meanwhile */
    hold(now: number, ms: number) { heldUntil = now + ms; },
    veil(on: boolean) { if (on !== veiled) { veiled = on; c.veil(on); } },
    get veiled() { return veiled; },
    at: () => at,
    /** tests: each leaf plane's say this frame */
    planesNow: () => planes.map((p) => ({ i: p.leaf.i, part: p.leaf.part, vis: p.meshes[0].visible, bands: !!p.bands && p.bands[0].meshes[0].visible, air: !!leaves[p.leaf.i].air, udVis: p.vis(), away: p.away() })),
    /** the spread the last turn left */
    from: () => from,
    /** tests: the composed matrix at spread k against the bake's, u */
    check(k: number, stateM: (p: Plane) => number[]) {
      let worst = 0;
      for (const p of planes) {
        const x = leaves[p.leaf.i];
        const Lk = x.P.clone().multiply(T.makeTranslation(x.o[0], x.o[1], x.o[2])).multiply(T.makeTranslation(0, 0, x.lift + STEP * zOf(p.leaf.i, 1))).multiply(R.makeRotationY((p.leaf.i < k ? -180 : 0) * D2R)).multiply(T.makeTranslation(-x.o[0], -x.o[1], -x.o[2]));
        const w = Lk.multiply(p.rel).elements, s = stateM(p);
        worst = Math.max(worst, ...s.map((v, j) => Math.abs(v - w[j])));
      }
      return worst;
    },
    dispose() { for (const p of planes) for (const b of p.bands ?? []) for (const m of b.meshes) { c.scene.remove(m); (m.material as THREE.Material).dispose(); } },
  };
}
