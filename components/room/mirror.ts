/**
 * The flat groups that stay DOM at rest — the case, the flip clock, the
 * lamp — read off the live page as a list of quads for the WebGL room to
 * draw while the camera travels (components/room/engine.ts).
 *
 * Every element that shows something becomes a quad in its group's own
 * plane: a picture (<img>, <video>) is drawn from the very element, with
 * its filters as shader uniforms; text is drawn onto a canvas where the
 * page draws it; anything else (gradients, borders, shadows) was baked by
 * scripts/room/bake.mjs and is found by what it looks like (lib/room/sig).
 * Sizes and places are in the group's local u (case box px / 1118).
 */
import { signature } from "@/lib/room/sig";

export type Shadow = { x: number; y: number; blur: number; color: [number, number, number, number] };
export type Look = { brightness: number; saturate: number; blur: number; shadows: Shadow[] };
export type Quad = {
  kind: "img" | "video" | "tex" | "text";
  el: Element;
  /** local u → group u, column-major 2D affine as a 4×4 */
  m: number[];
  w: number; h: number;
  /** the part of the source it shows (object-fit), 0…1 */
  uv: [number, number, number, number];
  src?: string;
  opacity: number;
  blend: string;
  look: Look;
  order: number[];
  text?: TextRun[];
  /** what clips it (overflow, clip-path: inset), in group u: x0, y0, x1, y1 */
  clip?: [number, number, number, number];
};
export type TextRun = { text: string; font: string; color: string; letterSpacing: string; x: number; y: number; w: number; h: number; asc: number };
export type Baked = { sig: string; group: string; src: string; x: number; y: number; w: number; h: number; ew: number; eh: number };

const px = (v: string) => parseFloat(v) || 0;

/** CSS filter list → what the shader and the shadow quads do with it */
export function parseFilter(f: string, u: number): Look {
  const look: Look = { brightness: 1, saturate: 1, blur: 0, shadows: [] };
  if (!f || f === "none") return look;
  const re = /(brightness|saturate|blur|drop-shadow)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
  for (const m of f.matchAll(re)) {
    const [, fn, arg] = m;
    if (fn === "brightness") look.brightness *= parseFloat(arg);
    else if (fn === "saturate") look.saturate *= parseFloat(arg);
    else if (fn === "blur") look.blur = Math.max(look.blur, px(arg) / u);
    else {
      const col = arg.match(/rgba?\(([^)]*)\)/);
      const c = col ? col[1].split(",").map((v) => parseFloat(v)) : [0, 0, 0, 1];
      const nums = arg.replace(/rgba?\([^)]*\)/, "").trim().split(/\s+/).map(px);
      look.shadows.push({ x: nums[0] / u, y: nums[1] / u, blur: (nums[2] || 0) / u, color: [c[0] / 255, c[1] / 255, c[2] / 255, c[3] ?? 1] });
    }
  }
  return look;
}

/** an element's transform in its offset parent's frame, px (as the bake) */
function local(el: HTMLElement): DOMMatrix {
  const cs = getComputedStyle(el);
  const o = cs.transformOrigin.split(" ").map(px);
  let m = new DOMMatrix().translate(el.offsetLeft, el.offsetTop, 0).translate(o[0], o[1], o[2] || 0);
  if (cs.translate && cs.translate !== "none") { const t = cs.translate.split(" ").map(px); m = m.translate(t[0] || 0, t[1] || 0, t[2] || 0); }
  if (cs.rotate && cs.rotate !== "none") { const a = parseFloat(cs.rotate.split(" ").pop()!); m = m.rotate(0, 0, a); }
  if (cs.scale && cs.scale !== "none") { const s = cs.scale.split(" ").map(parseFloat); m = m.scale(s[0], s[1] ?? s[0], 1); }
  if (cs.transform && cs.transform !== "none") m = m.multiply(new DOMMatrix(cs.transform));
  return m.translate(-o[0], -o[1], -(o[2] || 0));
}

/**
 * Where an element is in its group, in px. offsetLeft/Top are whole px, so
 * the translation comes from where the page draws the element (its rect,
 * through the group's own transform); the rotation and scale from its
 * transforms.
 */
function inGroup(el: HTMLElement, root: HTMLElement, rootInv: DOMMatrix): DOMMatrix {
  // the linear part, from the chain of transforms
  let m = new DOMMatrix();
  for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) m = local(n).multiply(m);
  // the translation: the element's own box corner where the page puts it
  const r = el.getBoundingClientRect();
  const lin = new DOMMatrix([m.a, m.b, m.c, m.d, 0, 0]);
  // corners of the box through the linear part, relative to its origin
  const pts = [[0, 0], [el.offsetWidth, 0], [0, el.offsetHeight], [el.offsetWidth, el.offsetHeight]].map(([x, y]) => lin.transformPoint(new DOMPoint(x, y)));
  const minX = Math.min(...pts.map((p) => p.x)), minY = Math.min(...pts.map((p) => p.y));
  const at = rootInv.transformPoint(new DOMPoint(r.left, r.top));
  return new DOMMatrix([m.a, m.b, m.c, m.d, at.x - minX, at.y - minY]);
}

/**
 * The order the page paints a group's elements in: CSS's stacking contexts,
 * simplified — within each, negative z-index first, then what is in flow,
 * then what is positioned (z auto or 0, and anything else that makes a
 * context) in tree order, then positive z-index; an element's own paint
 * before what it holds.
 */
function paintOrder(root: Element): Map<Element, number> {
  const out = new Map<Element, number>();
  let n = 0;
  const paint = (el: Element) => {
    out.set(el, n++);
    const neg: [number, Element][] = [], flow: Element[] = [], pos0: Element[] = [], posZ: [number, Element][] = [];
    for (const c of el.children) {
      const cs = getComputedStyle(c);
      if (cs.display === "none") continue;
      const positioned = cs.position !== "static";
      const z = cs.zIndex === "auto" ? null : parseInt(cs.zIndex, 10);
      const ctx = +cs.opacity < 1 || cs.transform !== "none" || cs.filter !== "none" || cs.mixBlendMode !== "normal" || cs.isolation === "isolate";
      if (positioned && z !== null && z < 0) neg.push([z, c]);
      else if (positioned && z !== null && z > 0) posZ.push([z, c]);
      else if (positioned || ctx) pos0.push(c);
      else flow.push(c);
    }
    neg.sort((x, y) => x[0] - y[0]); posZ.sort((x, y) => x[0] - y[0]);
    for (const [, c] of neg) paint(c);
    for (const c of flow) paint(c);
    for (const c of pos0) paint(c);
    for (const [, c] of posZ) paint(c);
  };
  paint(root);
  return out;
}

/** the box an element clips what it holds to, in its own px, if it does */
function clipBox(el: HTMLElement, self: boolean): [number, number, number, number] | null {
  const cs = getComputedStyle(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  let box: [number, number, number, number] | null = null;
  const cut = (b: [number, number, number, number]) => { box = box ? [Math.max(box[0], b[0]), Math.max(box[1], b[1]), Math.min(box[2], b[2]), Math.min(box[3], b[3])] : b; };
  if (!self && /hidden|clip|auto|scroll/.test(cs.overflow)) cut([0, 0, w, h]);
  const cp = cs.clipPath.match(/^inset\(([^)]*)\)/);
  if (cp) {
    const v = cp[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
    const [t, r, b, l] = [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
    const len = (x: string, of: number) => (x.endsWith("%") ? (parseFloat(x) / 100) * of : px(x));
    cut([len(l, w), len(t, h), w - len(r, w), h - len(b, h)]);
  }
  return box;
}

/** the drawn box of a replaced element (object-fit) and the part of it shown */
function fit(el: HTMLImageElement | HTMLVideoElement, w: number, h: number): { x: number; y: number; w: number; h: number; uv: [number, number, number, number] } {
  const cs = getComputedStyle(el);
  const iw = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
  const ih = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
  const f = cs.objectFit;
  if (!iw || !ih || f === "fill" || !f) return { x: 0, y: 0, w, h, uv: [0, 0, 1, 1] };
  const pos = cs.objectPosition.split(" ").map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : 0.5));
  const s = f === "cover" ? Math.max(w / iw, h / ih) : f === "contain" ? Math.min(w / iw, h / ih) : f === "none" ? 1 : Math.min(1, Math.min(w / iw, h / ih));
  const dw = iw * s, dh = ih * s;
  const dx = (w - dw) * pos[0], dy = (h - dh) * (pos[1] ?? 0.5);
  if (f === "cover") {
    // the picture overflows: keep the box, crop the uv
    const u0 = -dx / dw, v0 = -dy / dh;
    return { x: 0, y: 0, w, h, uv: [u0, v0, u0 + w / dw, v0 + h / dh] };
  }
  return { x: dx, y: dy, w: dw, h: dh, uv: [0, 0, 1, 1] };
}

export function mirror(root: HTMLElement, group: string, baked: Baked[], u: number): Quad[] {
  const out: Quad[] = [];
  const rootRect = root.getBoundingClientRect();
  // the group's flat transform on the page (a 2D scale for the clock and the
  // lamp laid flat at home, none for the case)
  const rm = new DOMMatrix([rootRect.width / (root.offsetWidth || 1), 0, 0, rootRect.height / (root.offsetHeight || 1), rootRect.left, rootRect.top]);
  const rootInv = rm.inverse();
  const all = [root, ...root.querySelectorAll("*")] as Element[];
  const po = paintOrder(root);
  const mine = baked.filter((b) => b.group === group);
  const toU = (m: DOMMatrix, x: number, y: number) => {
    // local u box (x, y, w, h) → group u
    const a = m.a, b = m.b, c = m.c, d = m.d, e = m.e / u, f = m.f / u;
    return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e + a * x + c * y, f + b * x + d * y, 0, 1];
  };
  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || el.tagName === "PICTURE" || el.tagName === "SOURCE") continue;
    let opacity = 1;
    const blend = cs.mixBlendMode;
    for (let n: HTMLElement | null = el; n && n !== root.parentElement; n = n.parentElement) opacity *= +getComputedStyle(n).opacity;
    if (opacity < 0.004) continue;
    if (el.closest(".inktip, .katetalk")) continue;
    // the filters of the element and of what holds it
    let filter = "";
    for (let n: HTMLElement | null = el; n && n !== root.parentElement; n = n.parentElement) { const f = getComputedStyle(n).filter; if (f !== "none") filter = f + " " + filter; }
    const look = parseFilter(filter, u);
    const m = inGroup(el, root, rootInv);
    const order = [po.get(el) ?? 0];
    // what clips it: its own clip-path, its holders' overflow and clip-path
    let clip: [number, number, number, number] | undefined;
    for (let n: HTMLElement | null = el; n && root.contains(n); n = n.parentElement) {
      const b = clipBox(n, n === el);
      if (!b) continue;
      const nm = n === el ? m : inGroup(n, root, rootInv);
      const pts = [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]].map(([x, y]) => nm.transformPoint(new DOMPoint(x, y)));
      const g: [number, number, number, number] = [Math.min(...pts.map((p) => p.x)) / u, Math.min(...pts.map((p) => p.y)) / u, Math.max(...pts.map((p) => p.x)) / u, Math.max(...pts.map((p) => p.y)) / u];
      clip = clip ? [Math.max(clip[0], g[0]), Math.max(clip[1], g[1]), Math.min(clip[2], g[2]), Math.min(clip[3], g[3])] : g;
    }
    if (clip && (clip[2] <= clip[0] || clip[3] <= clip[1])) continue;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) {
      if (el instanceof HTMLVideoElement && el.readyState < 2) continue;
      if (el instanceof HTMLImageElement && (!el.complete || !el.naturalWidth)) continue;
      const b = fit(el, w, h);
      out.push({ kind: el instanceof HTMLVideoElement ? "video" : "img", el, m: toU(m, b.x / u, b.y / u), w: b.w / u, h: b.h / u, uv: b.uv,
        src: el instanceof HTMLImageElement ? el.currentSrc : undefined, opacity, blend, look, order, clip });
      continue;
    }
    // its own paint, baked
    const hit = mine.filter((b) => b.sig === signature(el, u));
    if (hit.length) {
      const bw = w / u, bh = h / u;
      const bk = hit.reduce((p, q) => (Math.abs(q.ew - bw) + Math.abs(q.eh - bh) < Math.abs(p.ew - bw) + Math.abs(p.eh - bh) ? q : p));
      out.push({ kind: "tex", el, m: toU(m, bk.x, bk.y), w: bk.w, h: bk.h, uv: [0, 0, 1, 1], src: bk.src, opacity, blend, look: { brightness: 1, saturate: 1, blur: 0, shadows: [] }, order, clip });
    }
    // its own text, as the page lays it out
    const runs: TextRun[] = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 0.5) continue;
        const p = rootInv.transformPoint(new DOMPoint(r.left, r.top));
        const q = rootInv.transformPoint(new DOMPoint(r.right, r.bottom));
        runs.push({ text: n.textContent.trim(), font: cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, color: cs.color, letterSpacing: cs.letterSpacing, x: p.x / u, y: p.y / u, w: (q.x - p.x) / u, h: (q.y - p.y) / u, asc: 0 });
      }
    }
    if (runs.length && cs.color !== "rgba(0, 0, 0, 0)") {
      const x0 = Math.min(...runs.map((r) => r.x)), y0 = Math.min(...runs.map((r) => r.y));
      const x1 = Math.max(...runs.map((r) => r.x + r.w)), y1 = Math.max(...runs.map((r) => r.y + r.h));
      // runs are in group u; the quad is placed in group u directly
      out.push({ kind: "text", el, m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x0, y0, 0, 1], w: x1 - x0, h: y1 - y0, uv: [0, 0, 1, 1], opacity, blend, look: { brightness: 1, saturate: 1, blur: 0, shadows: [] }, order: [order[0] + 0.5], clip,
        text: runs.map((r) => ({ ...r, x: r.x - x0, y: r.y - y0 })) });
    }
  }
  out.sort((a, b) => {
    for (let i = 0; i < Math.max(a.order.length, b.order.length); i++) {
      const d = (a.order[i] ?? -1) - (b.order[i] ?? -1);
      if (d) return d;
    }
    return 0;
  });
  return out;
}
