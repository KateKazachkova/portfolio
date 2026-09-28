/**
 * Off Duty's things in WebGL (M6): the books on the shelf, a comic leaning
 * on the wall, the VHS tapes (a stack lying, a row standing) and the
 * Batman omnibus on the desk. Their state is the page's own: the legacy
 * components (BookShelf.tsx, TapeStacks.tsx, DeskComic.tsx) are mounted
 * under the flag, only not drawn, and the room's controls click them
 * (hits.ts `od-take`), so one taken out, Escape, the camera leaving or
 * taking another one out put it back as on the page (offduty.ts
 * usePutBack). This file reads their `data-open` / `data-drop` and the
 * pointer over the room's controls (`room:od-hover`), and runs the page's
 * CSS transitions between those states (BookShelf.css, TapeStacks.css):
 * each property's list of transform functions, eased, delayed and
 * retargeted as CSS does, turned into each plane's matrix from its thing's
 * frame at rest (scene.json `od`, bake.mjs):
 *
 *   plane = P × outer(t) × body(t) × rel,  P = frame₀ × outer₀⁻¹,  rel = frame₀⁻¹ × plane₀
 *
 * (a book's or a tape's faces sit in its body, which turns it cover out;
 * its card sits in the outer box). A thing at rest is left to the engine's
 * own placing (its rest matrices are the bake's); only one moving or out
 * is laid here, every frame.
 */
import * as THREE from "three";
import { bezier } from "@/lib/room/pose";

type Fn = { k: "t" | "rx" | "ry" | "rz"; v: number[] };
type List = Fn[];
type Rule = { dur: number; delay: number; ease: (x: number) => number };
export type OdThing = { key: string; kind: "book" | "comic" | "tape" | "omnibus"; sel: string; n: number; stand: boolean; v: Record<string, number>; m: number[]; w: number; h: number };
type Plane = { meshes: THREE.Mesh[]; mats: THREE.ShaderMaterial[]; m: number[]; w: number; h: number; k: number; body: boolean; card: boolean; shown: () => boolean; op: () => number;
  /** a card's picture (on the GPU only while its thing is out), or a cover's sharper one then */
  load?: () => void; unload?: () => void };
export type ShelfCtx = {
  things: OdThing[];
  planes: (Plane & { key: string })[];
  lifted: (m: number[], k: number) => number[];
  placed: (m: number[], w: number, h: number) => THREE.Matrix4;
  reduced: () => boolean;
  redraw: () => void;
};

const B1 = bezier(0.3, 0.6, 0.4, 1), DROP = bezier(0.5, 0, 0.7, 1), TURN = bezier(0.4, 0, 0.2, 1), EASE = bezier(0.25, 0.1, 0.25, 1);
const t = (x: number, y: number, z: number): Fn => ({ k: "t", v: [x, y, z] });
const rx = (a: number): Fn => ({ k: "rx", v: [a] });
const ry = (a: number): Fn => ({ k: "ry", v: [a] });
const rz = (a: number): Fn => ({ k: "rz", v: [a] });
const rule = (dur: number, delay: number, ease: (x: number) => number): Rule => ({ dur, delay, ease });
const D2R = Math.PI / 180;

// CSS interpolation of two transform lists of the same primitives, the
// shorter padded with identities
const idOf = (f: Fn): Fn => ({ k: f.k, v: f.v.map(() => 0) });
const lerpList = (a: List, b: List, e: number): List => {
  const n = Math.max(a.length, b.length), out: List = [];
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? idOf(b[i]), y = b[i] ?? idOf(a[i]);
    out.push({ k: x.k, v: x.v.map((v, j) => v + (y.v[j] - v) * e) });
  }
  return out;
};
const sameList = (a: List, b: List) => a.length === b.length && a.every((f, i) => f.k === b[i].k && f.v.every((v, j) => Math.abs(v - b[i].v[j]) < 1e-6));
const M = new THREE.Matrix4();
const apply = (m: THREE.Matrix4, list: List) => {
  for (const f of list) {
    if (f.k === "t") m.multiply(M.makeTranslation(f.v[0], f.v[1], f.v[2]));
    // (the room's matrices are the CSS's own, y down: rotateX/Y/Z(a) = three's)
    else if (f.k === "rx") m.multiply(M.makeRotationX(f.v[0] * D2R));
    else if (f.k === "ry") m.multiply(M.makeRotationY(f.v[0] * D2R));
    else m.multiply(M.makeRotationZ(f.v[0] * D2R));
  }
  return m;
};

/** one CSS property's transition (a list of functions, or a number) */
class Prop<T> {
  from: T; to: T; t0 = 0; dur = 0; delay = 0; ease: (x: number) => number = (x) => x; active = false;
  private shorten = 1;
  constructor(v: T, private lerp: (a: T, b: T, e: number) => T, private same: (a: T, b: T) => boolean) { this.from = v; this.to = v; }
  value(now: number): T {
    if (!this.active) return this.to;
    const k = (now - this.t0 - this.delay) / this.dur;
    if (k <= 0) return this.from;
    if (k >= 1) return this.to;
    return this.lerp(this.from, this.to, this.ease(k));
  }
  tick(now: number) { if (this.active && now - this.t0 - this.delay >= this.dur) this.active = false; return this.active; }
  retarget(v: T, r: Rule, now: number) {
    if (this.same(v, this.to)) return false;
    const cur = this.value(now);
    if (r.dur <= 0 && r.delay <= 0) { this.from = v; this.to = v; this.active = false; return true; }
    let dur = r.dur, delay = r.delay;
    // reversing a running transition: CSS shortens it by how far it had got
    if (this.active && this.same(v, this.from)) {
      const k = Math.min(1, Math.max(0, (now - this.t0 - this.delay) / this.dur));
      const f = Math.min(1, Math.max(0, Math.abs(this.ease(k) * this.shorten + 1 - this.shorten)));
      dur *= f; if (delay < 0) delay *= f;
      this.shorten = f;
    } else this.shorten = 1;
    this.from = cur; this.to = v; this.t0 = now; this.dur = Math.max(1, dur); this.delay = delay; this.ease = r.ease; this.active = true;
    return true;
  }
}
const listProp = (v: List) => new Prop<List>(v, lerpList, sameList);
const numProp = (v: number) => new Prop<number>(v, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-6);

type State = { open: boolean; hover: boolean; drop: boolean; at: boolean };
type Target = { outer: [List, Rule]; translate?: [List, Rule]; rotate?: [List, Rule]; body?: [List, Rule]; card: [number, Rule] };

// the page's rules (BookShelf.css, TapeStacks.css), state by state
function targetOf(o: OdThing, s: State): Target {
  const { z = 0, d = 0, t: th = 0, dy = 0, lean = 0, r = 0, h = 0 } = o.v;
  const lift = s.hover && s.at && !s.open;
  const card: [number, Rule] = s.open ? [1, rule(350, o.kind === "comic" ? 400 : 850, EASE)] : [0, rule(200, 0, EASE)];
  if (o.kind === "book") return {
    outer: [s.open ? [t(130, 80, z + d + 420)] : [t(0, 0, z)], rule(450, s.open ? 0 : 400, B1)],
    // (open, the body's every transition waits .4 s: its delay is one for all three)
    translate: [lift ? [t(0, 0, 16)] : [t(0, 0, 0)], rule(300, s.open ? 400 : 0, EASE)],
    rotate: [lift ? [rx(-4)] : [rx(0)], rule(300, s.open ? 400 : 0, EASE)],
    body: [s.open ? [ry(-90)] : [ry(0)], rule(500, s.open ? 400 : 0, TURN)],
    card,
  };
  if (o.kind === "comic") return {
    outer: [s.open ? [t(-40, -10, z + 480), rx(0)] : [t(0, 0, z), rx(lift ? lean - 10 : lean)], rule(450, 0, B1)],
    card,
  };
  if (o.kind === "tape" && o.stand) return {
    outer: [s.open ? [t(0, dy - 40, z + d + 300), rx(0)] : lift ? [t(0, 0, z + 16), rx(-4)] : [t(0, 0, z), rx(0)], rule(450, s.open || lift ? 0 : 400, B1)],
    body: [s.open ? [ry(-90)] : [ry(0)], rule(550, s.open ? 400 : 0, TURN)],
    card,
  };
  if (o.kind === "tape") {
    const y = s.drop && !s.open ? th : 0;
    return {
      outer: [s.open ? [t(0, dy - 40, z + d + 300)] : [t(0, y, z + (lift ? 14 : 0))],
        s.drop && !s.open ? rule(350, lift ? 0 : 300, DROP) : rule(450, s.open || lift ? 0 : 400, B1)],
      body: [s.open ? [rz(-90), rx(-90)] : [rz(0), rx(0)], rule(550, s.open ? 400 : 0, TURN)],
      card,
    };
  }
  // the omnibus: picked up (its lift a property of its own, ahead of the turn)
  return {
    outer: [s.open ? [t(0, 0, z), rx(0), rz(0)] : [t(0, 0, z), rx(90), rz(r)], rule(600, 0, TURN)],
    translate: [s.open ? [t(0, -(h + 30), 260)] : [t(0, 0, 0)], rule(350, s.open ? 0 : 250, TURN)],
    card,
  };
}
// the transform-origin of each box, u
const outerOrigin = (o: OdThing): [number, number, number] =>
  o.kind === "omnibus" ? [o.w / 2, 0, 0] : o.kind === "comic" || o.kind === "book" || o.stand ? [o.w / 2, o.h, 0] : [o.w / 2, o.h / 2, 0];
const bodyOrigin = (o: OdThing): [number, number, number] => [o.w / 2, o.h / 2, -(o.v.d ?? 0) / 2];

export function makeShelf(c: ShelfCtx) {
  const root = document.documentElement;
  const hovered = new Set<string>();
  type Thing = {
    o: OdThing; el: () => HTMLElement | null; P: THREE.Matrix4; planes: (Plane & { rel: THREE.Matrix4 })[];
    outer: Prop<List>; translate: Prop<List> | null; rotate: Prop<List> | null; body: Prop<List> | null; card: Prop<number>;
    live: boolean;
  };
  const originMat = (list: List, o: [number, number, number], pre?: List | null, pre2?: List | null) => {
    const m = new THREE.Matrix4().makeTranslation(o[0], o[1], o[2]);
    if (pre) apply(m, pre);
    if (pre2) apply(m, pre2);
    apply(m, list);
    return m.multiply(M.makeTranslation(-o[0], -o[1], -o[2]));
  };
  const rest: State = { open: false, hover: false, drop: false, at: false };
  const things: Thing[] = c.things.map((o) => {
    const t0 = targetOf(o, rest);
    const W0 = new THREE.Matrix4().fromArray(o.m);
    // the bake's frame is at rest: P = frame₀ × outer₀⁻¹ (the omnibus's translate, 0, before its transform)
    const L0 = originMat(t0.outer[0], outerOrigin(o), t0.translate && o.kind === "omnibus" ? t0.translate[0] : null);
    const P = W0.clone().multiply(L0.clone().invert());
    const inv = W0.clone().invert();
    const planes = c.planes.filter((p) => p.key === o.key).map((p) => ({ ...p, rel: inv.clone().multiply(new THREE.Matrix4().fromArray(p.m)) }));
    let cached: HTMLElement | null = null;
    return {
      o, P, planes,
      el: () => (cached?.isConnected ? cached : (cached = document.querySelectorAll<HTMLElement>(`.room-od ${o.sel}`)[o.n] ?? null)),
      outer: listProp(t0.outer[0]), translate: t0.translate ? listProp(t0.translate[0]) : null, rotate: t0.rotate ? listProp(t0.rotate[0]) : null,
      body: t0.body ? listProp(t0.body[0]) : null, card: numProp(0), live: false,
    };
  });
  const byKey = new Map(things.map((x) => [x.o.key, x]));
  const stateOf = (x: Thing): State => {
    const el = x.el();
    return { open: !!el?.hasAttribute("data-open"), drop: !!el?.hasAttribute("data-drop"), hover: hovered.has(x.o.key), at: root.dataset.desk === "offduty" };
  };
  const retarget = (now: number) => {
    let any = false;
    const still = c.reduced();
    for (const x of things) {
      const tg = targetOf(x.o, stateOf(x));
      const r = (q: Rule) => (still ? rule(0, 0, q.ease) : q);
      let ch = x.outer.retarget(tg.outer[0], r(tg.outer[1]), now);
      if (x.translate && tg.translate) ch = x.translate.retarget(tg.translate[0], r(tg.translate[1]), now) || ch;
      if (x.rotate && tg.rotate) ch = x.rotate.retarget(tg.rotate[0], r(tg.rotate[1]), now) || ch;
      if (x.body && tg.body) ch = x.body.retarget(tg.body[0], r(tg.body[1]), now) || ch;
      if (x.card.retarget(tg.card[0], r(tg.card[1]), now)) { ch = true; if (tg.card[0] > 0) for (const p of x.planes) p.load?.(); }
      if (ch) { x.live = true; any = true; }
    }
    if (any) c.redraw();
  };
  const onHover = (e: Event) => {
    const d = (e as CustomEvent<{ key: string; on: boolean }>).detail;
    if (!byKey.has(d.key)) return;
    if (d.on) hovered.add(d.key); else hovered.delete(d.key);
    retarget(performance.now());
  };
  addEventListener("room:od-hover", onHover);
  const mo = new MutationObserver(() => retarget(performance.now()));
  // (the page's things, RoomOffDuty.tsx, are mounted once the camera is first at Off Duty)
  mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["data-open", "data-drop"] });
  const mr = new MutationObserver(() => { if (root.dataset.desk !== "offduty") hovered.clear(); retarget(performance.now()); });
  mr.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
  retarget(performance.now());

  const L = new THREE.Matrix4(), B = new THREE.Matrix4(), W = new THREE.Matrix4();
  const lay = (x: Thing, now: number) => {
    const o = x.o, tr = x.translate?.value(now) ?? null;
    L.copy(x.P).multiply(originMat(x.outer.value(now), outerOrigin(o), o.kind === "omnibus" ? tr : null));
    const bodyOn = !!x.body;
    if (bodyOn) B.copy(L).multiply(originMat(x.body!.value(now), bodyOrigin(o), o.kind === "book" ? tr : null, x.rotate?.value(now)));
    const cardOp = x.card.value(now);
    for (const p of x.planes) {
      W.copy(p.body && bodyOn ? B : L).multiply(p.rel);
      const mm = c.placed(c.lifted(Array.from(W.elements), p.k), p.w, p.h);
      const op = p.card ? cardOp : p.op();
      const vis = p.shown() && op > 0.001;
      for (const mesh of p.meshes) { mesh.matrix.copy(mm); mesh.matrixWorldNeedsUpdate = true; mesh.visible = vis; }
      for (const mat of p.mats) mat.uniforms.opacity.value = op;
    }
  };
  /** lays what moves or is out; true while any of it moves */
  const frame = (now: number) => {
    let moving = false;
    for (const x of things) {
      if (!x.live) continue;
      lay(x, now);
      const on = [x.outer.tick(now), x.translate?.tick(now), x.rotate?.tick(now), x.body?.tick(now), x.card.tick(now)].some(Boolean);
      moving ||= on;
      // back at rest and still: the engine's own placing again (the bake's matrices)
      const s = stateOf(x);
      if (!on && !s.open && !s.drop && !(s.hover && s.at)) { x.live = false; for (const p of x.planes) p.unload?.(); }
    }
    return moving;
  };
  /** for tests: how far the composed end state is from the bake's (u) */
  const check = (key: string, open: THREE.Matrix4[] | null) => {
    const x = byKey.get(key);
    if (!x || !open) return null;
    const s: State = { open: true, hover: false, drop: false, at: true }, tg = targetOf(x.o, s);
    const Lx = x.P.clone().multiply(originMat(tg.outer[0], outerOrigin(x.o), x.o.kind === "omnibus" ? tg.translate![0] : null));
    const Bx = tg.body ? Lx.clone().multiply(originMat(tg.body[0], bodyOrigin(x.o), x.o.kind === "book" ? tg.translate![0] : null, tg.rotate?.[0])) : Lx;
    return x.planes.map((p, i) => { const w = (p.body && tg.body ? Bx : Lx).clone().multiply(p.rel).elements; return Math.max(...open[i].elements.map((v, j) => Math.abs(v - w[j]))); });
  };
  const dispose = () => { removeEventListener("room:od-hover", onHover); mo.disconnect(); mr.disconnect(); };
  return { frame, dispose, check, live: () => things.filter((x) => x.live).map((x) => x.o.key), planesOf: (key: string) => byKey.get(key)?.planes ?? [] };
}
