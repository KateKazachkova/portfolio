/**
 * The room in WebGL (?gl=1): the CSS room's planes, baked by
 * scripts/room/bake.mjs into public/room/scene.json, drawn by three.js
 * behind the page's own DOM, with the camera the CSS camera is (lib/room/
 * pose.ts) — driven by the same html[data-desk…] state and scene-cam
 * variables that useDeskCamera already sets, and moving on the same curves.
 *
 * At home, at rest, the case, the flip clock and the lamp are the page's
 * own flat DOM and WebGL draws only the room around them. The moment the
 * camera sets off, they are read off the page (./mirror) and WebGL draws
 * them too, in the same frame the DOM is hidden; once the camera is home
 * and still again, the DOM comes back in the same way.
 */
import * as THREE from "three";
import { stopPose, viewOfState, viewMatrix, projectionMatrix, lerpPose, EASE, CAM, type Pose, type View } from "@/lib/room/pose";
import { mirror, type Quad, type Baked } from "./mirror";
import { makeBlur } from "./blur";

type State = { m?: number[]; op?: number; vis?: boolean };
type Item = {
  i: number; cls: string; anc?: string; type: "img" | "tex" | "grid"; src: string; w: number; h: number; m: number[];
  op: number; vis?: boolean; blend: string; order: number; grid?: number[]; back?: boolean; rho?: number; px?: [number, number];
  /** how it lies at each stop, where that differs from home */
  states?: Partial<Record<View, State>>;
};
type Scene = { u: number; items: Item[]; flat: Baked[]; groups?: Record<string, number[]> };

export type RoomOptions = {
  stage: HTMLElement; // .case-stage
  cam: HTMLElement; // .scene-cam: --dx, --dy, --pan
  before: HTMLElement; // the canvas goes in just before this (.room-home)
  groups: { case: HTMLElement | null; clock: HTMLElement | null; lamp: HTMLElement | null };
  onArrive: () => void;
  sceneUrl?: string;
};

// ── transitions, as CSS runs them ──────────────────────────────────────────
type Rule = { dur: number; delay: number; ease: (x: number) => number } | null;
class Channel<T> {
  from: T; to: T; t0 = 0; dur = 0; delay = 0; ease: (x: number) => number = (x) => x;
  active = false;
  // reversing: CSS shortens a transition sent back to where it came from
  private shorten = 1;
  constructor(v: T, private lerp: (a: T, b: T, e: number) => T, private same: (a: T, b: T) => boolean) { this.from = v; this.to = v; }
  value(now: number): T {
    if (!this.active) return this.to;
    const k = (now - this.t0 - this.delay) / this.dur;
    if (k <= 0) return this.from;
    if (k >= 1) return this.to;
    return this.lerp(this.from, this.to, this.ease(k));
  }
  progress(now: number) { return this.active ? Math.min(1, Math.max(0, (now - this.t0 - this.delay) / this.dur)) : 1; }
  /** returns true when a running transition just finished */
  tick(now: number) { if (this.active && now - this.t0 - this.delay >= this.dur) { this.active = false; return true; } return false; }
  retarget(v: T, rule: Rule, now: number) {
    if (this.same(v, this.to)) return;
    const cur = this.value(now);
    if (!rule || rule.dur <= 0) { this.from = v; this.to = v; this.active = false; return; }
    let dur = rule.dur, delay = rule.delay;
    if (this.active && this.same(v, this.from)) {
      const p = this.ease(this.progress(now));
      const f = Math.min(1, Math.max(0, Math.abs(p * this.shorten + 1 - this.shorten)));
      dur *= f; if (delay < 0) delay *= f;
      this.shorten = f;
    } else this.shorten = 1;
    this.from = cur; this.to = v; this.t0 = now; this.dur = Math.max(1, dur); this.delay = delay; this.ease = rule.ease; this.active = true;
  }
}
const samePose = (a: Pose, b: Pose) => a.rx === b.rx && a.sx === b.sx && a.sy === b.sy && a.t.every((v, i) => Math.abs(v - b.t[i]) < 1e-6);
const lerp2 = (a: number[], b: number[], e: number) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
const same2 = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) < 1e-3 && Math.abs(a[1] - b[1]) < 1e-3;

// ── materials ────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
attribute vec2 st;
uniform mat3 stg;
varying vec2 vST, vG;
void main() { vST = st; vG = (stg * vec3(st, 1.0)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */ `
uniform sampler2D map; uniform float opacity, brightness, saturate, lod; uniform vec4 uvRect; uniform vec4 tint; uniform float shadow; uniform float alphaTest, alphaMax;
uniform vec4 clip;
uniform mat3 yuvFix;
varying vec2 vST, vG;
void main() {
  vec2 st = vST;
  if (vG.x < clip.x || vG.y < clip.y || vG.x > clip.z || vG.y > clip.w) discard;
  vec2 uv = vec2(mix(uvRect.x, uvRect.z, st.x), 1.0 - mix(uvRect.y, uvRect.w, st.y));
  vec4 c = lod > 0.0 ? textureLod(map, uv, lod) : texture2D(map, uv);
  if (shadow > 0.5) c = vec4(tint.rgb * tint.a, tint.a) * c.a;
  else {
    c.rgb = yuvFix * c.rgb;
    c.rgb *= brightness;
    float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c.rgb = mix(vec3(l) , c.rgb, saturate);
  }
  c *= opacity;
  if (c.a < alphaTest || c.a >= alphaMax) discard;
  gl_FragColor = c;
}`;
// the desk's top: its plate, times the tile lines (globals.css, .desk-top)
const GRID_FRAG = /* glsl */ `
uniform sampler2D map; uniform vec2 size; uniform vec4 grid; uniform vec3 line;
varying vec2 vST;
void main() {
  vec4 c = texture2D(map, vec2(vST.x, 1.0 - vST.y));
  vec2 p = vST * size;
  vec2 f = fwidth(p);
  float lx = 1.0 - smoothstep(grid.x, grid.x + f.x, mod(p.x - grid.z, grid.y));
  float ly = 1.0 - smoothstep(grid.x, grid.x + f.y, mod(p.y - grid.w, grid.y));
  c.rgb = mix(c.rgb, c.rgb * line, max(lx, ly));
  gl_FragColor = c;
}`;

// The niche's clips carry no colour tags: the page decodes them as BT.709,
// a video uploaded to WebGL comes out as BT.601. This takes the one to the
// other (measured on the office loop: within 2/255 of the page).
const YUV_FIX = new THREE.Matrix3().set(1.0864, -0.07235, -0.01405, 0.09655, 0.84505, 0.0584, -0.01411, -0.02769, 1.0418);

function blendOf(mat: THREE.ShaderMaterial, blend: string) {
  mat.premultipliedAlpha = true;
  if (blend === "multiply") {
    mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.DstColorFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor;
    mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
  } else if (blend === "screen") {
    mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.OneMinusDstColorFactor; mat.blendDst = THREE.OneFactor;
    mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
  } else {
    mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor;
    mat.blendSrcAlpha = THREE.OneFactor; mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  }
}

function quadGeometry() {
  // centred, so three sorts by the middle of each quad; st: 0…1, y down
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3));
  g.setAttribute("st", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

const m4 = (a: number[]) => new THREE.Matrix4().fromArray(a);
const placed = (m: number[], w: number, h: number, pad = 0) =>
  m4(m).multiply(new THREE.Matrix4().makeTranslation(w / 2, h / 2, 0)).multiply(new THREE.Matrix4().makeScale(w + 2 * pad, h + 2 * pad, 1));

export type Room = {
  dispose(): void;
  stats(): Record<string, unknown>;
  /** debugging: draw the flat groups in WebGL at home too (and hide the DOM) */
  forceGroups(on: boolean): void;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  redraw(): void;
  quads(): Record<string, unknown[]>;
};

export async function startRoom(o: RoomOptions): Promise<Room> {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const data: Scene = await (await fetch(o.sceneUrl ?? "/room/scene.json")).json();

  const canvas = document.createElement("canvas");
  canvas.className = "room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  o.stage.insertBefore(canvas, o.before);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const prParam = params.get("pr");
  const pr = () => (prParam ? +prParam : Math.min(devicePixelRatio, 2));
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const gl = renderer.getContext();

  const scene = new THREE.Scene();
  const geo = quadGeometry();
  const camera = new THREE.PerspectiveCamera();
  camera.matrixAutoUpdate = false;
  camera.matrixWorldAutoUpdate = false;

  // ── textures ──
  const texCache = new Map<string | Element, THREE.Texture>();
  let pending = 0;
  const loaded = new Set<THREE.Texture>();
  const imageTexture = (src: string) => {
    let t = texCache.get(src);
    if (t) return t;
    const tex = new THREE.Texture();
    t = tex;
    tex.colorSpace = THREE.NoColorSpace; tex.premultiplyAlpha = true; tex.anisotropy = aniso;
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    const img = new Image();
    img.decoding = "async";
    pending++;
    img.onload = () => { tex.image = img; tex.needsUpdate = true; loaded.add(tex); pending--; renderer.initTexture(tex); dirty = true; };
    img.onerror = () => { pending--; };
    img.src = src;
    texCache.set(src, tex);
    return tex;
  };
  const elementTexture = (el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
    let t = texCache.get(el);
    if (t) return t;
    t = el instanceof HTMLVideoElement ? new THREE.VideoTexture(el) : el instanceof HTMLCanvasElement ? new THREE.CanvasTexture(el) : new THREE.Texture(el);
    t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = true; t.anisotropy = aniso;
    if (el instanceof HTMLVideoElement) { t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; } else { t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }
    t.needsUpdate = true;
    texCache.set(el, t);
    return t;
  };

  const material = (map: THREE.Texture, opts: { alphaMax?: number; opacity?: number; blend?: string; brightness?: number; saturate?: number; lod?: number; uv?: number[]; shadow?: number[]; alphaTest?: number; back?: boolean; depthTest?: boolean; depthWrite?: boolean }) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: map }, opacity: { value: opts.opacity ?? 1 }, brightness: { value: opts.brightness ?? 1 }, saturate: { value: opts.saturate ?? 1 },
        lod: { value: opts.lod ?? 0 }, uvRect: { value: new THREE.Vector4(...(opts.uv ?? [0, 0, 1, 1])) },
        tint: { value: new THREE.Vector4(...(opts.shadow ?? [0, 0, 0, 0])) }, shadow: { value: opts.shadow ? 1 : 0 }, alphaTest: { value: opts.alphaTest ?? 0 }, alphaMax: { value: opts.alphaMax ?? 2 },
        clip: { value: new THREE.Vector4(-1e9, -1e9, 1e9, 1e9) }, stg: { value: new THREE.Matrix3() },
        yuvFix: { value: map instanceof THREE.VideoTexture ? YUV_FIX.clone() : new THREE.Matrix3() },
      },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      side: opts.back ? THREE.FrontSide : THREE.DoubleSide,
      depthTest: opts.depthTest ?? true, depthWrite: opts.depthWrite ?? true,
    });
    blendOf(mat, opts.blend ?? "normal");
    return mat;
  };

  // ── the room's planes ──
  // Planes that lie in one plane (a plate and what is laid on it) are lifted
  // off it one above the other in page order, by a real distance: a depth
  // bias alone left them fighting for the same pixels.
  const planeCount = new Map<string, number>();
  const normalOf = (m: number[]) => {
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(m[0], m[1], m[2]), new THREE.Vector3(m[4], m[5], m[6]));
    return n.lengthSq() > 1e-12 ? n.normalize() : null;
  };
  const liftCount = (m: number[]) => {
    const n = normalOf(m);
    if (!n) return 0;
    const key = [n.x, n.y, n.z].map((v) => v.toFixed(2)).join() + "|" + Math.round(n.dot(new THREE.Vector3(m[12], m[13], m[14])) * 2) / 2;
    const k = planeCount.get(key) ?? 0;
    planeCount.set(key, k + 1);
    return k;
  };
  const lifted = (m: number[], k: number) => {
    const n = normalOf(m);
    if (!n || !k) return m;
    const out = m.slice(); out[12] += n.x * k * 0.06; out[13] += n.y * k * 0.06; out[14] += n.z * k * 0.06;
    return out;
  };
  const lerpN = (a: number[], b: number[], e: number) => a.map((v, i) => v + (b[i] - v) * e);
  const sameN = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-4);
  // A plane with see-through parts is drawn twice: its solid pixels first,
  // writing depth like any solid thing, then its see-through ones, blended
  // back to front without writing depth — so a film of plastic in front of
  // a page never hides the page behind it.
  const SOLID = 0.95;
  type Placed = { meshes: THREE.Mesh[]; item: Item; k: number; m: Channel<number[]>; op: Channel<number>; mats: THREE.ShaderMaterial[] };
  const room: Placed[] = [];
  for (const it of data.items) {
    if (!it.src) continue;
    const opaque = /\.(jpe?g)$/i.test(it.src) || it.type === "grid";
    const mats: THREE.ShaderMaterial[] = [];
    const map = imageTexture(it.src);
    if (it.type === "grid") {
      const g = it.grid!;
      mats.push(new THREE.ShaderMaterial({
        uniforms: { map: { value: map }, size: { value: new THREE.Vector2(it.w, it.h) }, grid: { value: new THREE.Vector4(g[0], g[1], g[2], g[3]) }, line: { value: new THREE.Color(58 / 255, 60 / 255, 74 / 255) } },
        vertexShader: VERT, fragmentShader: GRID_FRAG, side: THREE.DoubleSide,
      }));
    } else if (opaque) {
      const mat = material(map, { opacity: it.op, back: it.back });
      mat.transparent = false; mat.blending = THREE.NoBlending;
      mats.push(mat);
    } else {
      const soft = it.blend !== "normal" || /shadow|foot|cast|::/.test(it.cls);
      if (!soft) {
        const solid = material(map, { opacity: it.op, back: it.back, alphaTest: SOLID });
        solid.transparent = false; solid.blending = THREE.NoBlending;
        mats.push(solid);
      }
      mats.push(material(map, { opacity: it.op, blend: it.blend, back: it.back, alphaTest: 0.004, alphaMax: soft ? 2 : SOLID, depthWrite: false }));
    }
    const k = liftCount(it.m);
    const meshes = mats.map((mat) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(placed(lifted(it.m, k), it.w, it.h));
      mesh.matrixWorldNeedsUpdate = true;
      mesh.visible = it.vis !== false && it.op > 0.001;
      scene.add(mesh);
      return mesh;
    });
    room.push({ meshes, item: it, k, m: new Channel(it.m, lerpN, sameN), op: new Channel(it.op, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-4), mats: it.type === "grid" ? [] : mats });
  }
  // each plane where the stop puts it
  const arrange = (v: View, rule: Rule, now: number) => {
    for (const p of room) {
      const st = p.item.states?.[v] ?? {};
      p.m.retarget(st.m ?? p.item.m, rule, now);
      p.op.retarget(st.op ?? p.item.op, rule, now);
      const vis = st.vis ?? p.item.vis !== false;
      const ud = p.meshes[0].userData;
      // What home does not show (Off Duty's corner) goes once the camera is
      // home, not as it sets off: the CSS hid it at the click, in view.
      if (v === "home" && !vis && ud.vis !== false) ud.hideAtHome = true;
      else { ud.vis = vis; ud.hideAtHome = false; }
      ud.dirty = true;
    }
  };
  const settle = (now: number) => {
    let moving = false;
    for (const p of room) {
      const ud = p.meshes[0].userData;
      if (!(p.m.active || p.op.active || ud.dirty)) continue;
      const mm = placed(lifted(p.m.value(now), p.k), p.item.w, p.item.h);
      const op = p.op.value(now);
      for (const mesh of p.meshes) {
        mesh.matrix.copy(mm);
        mesh.matrixWorldNeedsUpdate = true;
        mesh.visible = ud.vis !== false && op > 0.001;
      }
      for (const mat of p.mats) mat.uniforms.opacity.value = op;
      p.m.tick(now); p.op.tick(now);
      ud.dirty = p.m.active || p.op.active;
      moving ||= ud.dirty;
    }
    return moving;
  };

  // ── the flat groups, mirrored off the page ──
  const groupRoot = new THREE.Group();
  scene.add(groupRoot);
  const G: Record<string, THREE.Matrix4> = {
    case: new THREE.Matrix4(),
    clock: data.groups?.clock ? m4(data.groups.clock) : new THREE.Matrix4(),
    lamp: data.groups?.lamp ? m4(data.groups.lamp) : new THREE.Matrix4(),
  };
  const textCanvases = new Map<Element, HTMLCanvasElement>();
  const drawText = (q: Quad, u: number) => {
    let c = textCanvases.get(q.el);
    const k = 6; // canvas px per u
    if (!c) { c = document.createElement("canvas"); textCanvases.set(q.el, c); }
    c.width = Math.max(1, Math.ceil(q.w * k)); c.height = Math.max(1, Math.ceil(q.h * k));
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const r of q.text!) {
      ctx.save();
      ctx.font = r.font;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = r.letterSpacing === "normal" ? "0px" : r.letterSpacing;
      ctx.fillStyle = r.color;
      const mt = ctx.measureText(r.text);
      const asc = mt.fontBoundingBoxAscent, desc = mt.fontBoundingBoxDescent;
      // the run's own box on the page, in canvas px: the font's content
      // area fills its height, its advance its width
      const sx = (r.w * k) / Math.max(1e-3, mt.width), sy = (r.h * k) / Math.max(1e-3, asc + desc);
      ctx.translate(r.x * k, r.y * k);
      ctx.scale(sx, sy);
      ctx.fillText(r.text, 0, asc);
      ctx.restore();
    }
    void u;
    return c;
  };
  const groupMeshes = new Map<string, THREE.Mesh[]>();
  let groupsShown = false;
  const blur = makeBlur(renderer);
  const lastQuads: Record<string, unknown[]> = {};
  const buildGroup = (name: "case" | "clock" | "lamp", el: HTMLElement | null, base: number) => {
    const old = groupMeshes.get(name) ?? [];
    for (const m of old) { groupRoot.remove(m); (m.material as THREE.Material).dispose(); }
    const meshes: THREE.Mesh[] = [];
    groupMeshes.set(name, meshes);
    if (!el) return;
    const u = o.stage.getBoundingClientRect().width / 1118;
    const quads = mirror(el, name, data.flat, u);
    lastQuads[name] = quads.map((q) => ({ kind: q.kind, cls: (q.el.className || "").toString().slice(0, 30), src: (q.src || "").split("/").pop(), op: +q.opacity.toFixed(3), order: q.order.join("."), w: +q.w.toFixed(1), h: +q.h.toFixed(1), text: q.text?.map((t) => t.text + "@" + t.font).join("|") }));
    const flatDepth = name === "case" ? { depthTest: false, depthWrite: false } : { depthTest: true, depthWrite: false };
    let n = 0;
    let clip: number[] | undefined;
    const add = (mat: THREE.ShaderMaterial, m: number[], w: number, h: number) => {
      // st → group u, for the clip
      mat.uniforms.stg.value.set(m[0] * w, m[4] * h, m[12], m[1] * w, m[5] * h, m[13], 0, 0, 1);
      if (clip) mat.uniforms.clip.value.set(clip[0], clip[1], clip[2], clip[3]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(G[name].clone().multiply(placed(m, w, h)));
      mesh.matrixWorldNeedsUpdate = true;
      mesh.renderOrder = base + n++;
      mesh.userData.baseOpacity = mat.uniforms.opacity.value;
      meshes.push(mesh); groupRoot.add(mesh);
    };
    // a quad grown by (px, py) u on every side, as for a blur's reach
    const grown = (m: number[], dx: number, dy: number, px: number, py: number) => {
      const o2 = m.slice();
      o2[12] += dx - m[0] * px - m[4] * py; o2[13] += dy - m[1] * px - m[5] * py;
      return o2;
    };
    for (const q of quads) {
      clip = q.clip;
      let map: THREE.Texture;
      let srcW = 0, srcH = 0;
      if (q.kind === "img" || q.kind === "video") {
        map = elementTexture(q.el as HTMLImageElement | HTMLVideoElement);
        const e = q.el as HTMLImageElement & HTMLVideoElement;
        srcW = e.naturalWidth || e.videoWidth; srcH = e.naturalHeight || e.videoHeight;
      } else if (q.kind === "tex") map = imageTexture(q.src!);
      else { const c = drawText(q, u); const t = elementTexture(c); t.needsUpdate = true; map = t; }
      const whole = q.uv[0] === 0 && q.uv[1] === 0 && q.uv[2] === 1 && q.uv[3] === 1;
      // its drop-shadows, under it: its alpha, blurred, in the shadow's colour
      for (const sh of q.look.shadows) {
        const sigma = (sh.blur / 2) * (srcW / q.w);
        const bl = q.kind === "img" && whole && srcW ? blur(map, srcW, srcH, sigma) : null;
        const px = bl ? (bl.pad / srcW) * q.w : 0, py = bl ? (bl.pad / srcH) * q.h : 0;
        const mat = material(bl ? bl.tex : map, { ...flatDepth, uv: bl ? [0, 0, 1, 1] : q.uv, shadow: sh.color, opacity: q.opacity });
        add(mat, grown(q.m, sh.x, sh.y, px, py), q.w + 2 * px, q.h + 2 * py);
      }
      // blur() on the picture itself (the bike's soft silhouettes)
      if (q.look.blur && q.kind === "img" && whole && srcW) {
        const bl = blur(map, srcW, srcH, (q.look.blur / 2) * (srcW / q.w));
        if (bl) {
          const px = (bl.pad / srcW) * q.w, py = (bl.pad / srcH) * q.h;
          const mat = material(bl.tex, { ...flatDepth, opacity: q.opacity, blend: q.blend, brightness: q.look.brightness, saturate: q.look.saturate });
          add(mat, grown(q.m, 0, 0, px, py), q.w + 2 * px, q.h + 2 * py);
          continue;
        }
      }
      add(material(map, { ...flatDepth, uv: q.uv, opacity: q.opacity, blend: q.blend, brightness: q.look.brightness, saturate: q.look.saturate }), q.m, q.w, q.h);
    }
    for (const m of meshes) m.visible = groupsShown;
  };
  const buildGroups = () => {
    buildGroup("lamp", o.groups.lamp, 500);
    buildGroup("clock", o.groups.clock, 700);
    buildGroup("case", o.groups.case, 1000);
  };
  let caseOpacity = 1;
  const applyGroupOpacity = () => {
    for (const m of groupMeshes.get("case") ?? []) {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.opacity.value = m.userData.baseOpacity * caseOpacity;
      m.visible = groupsShown && caseOpacity > 0.001;
    }
  };
  const setGroupsShown = (on: boolean) => {
    groupsShown = on;
    for (const ms of groupMeshes.values()) for (const m of ms) m.visible = on;
    applyGroupOpacity();
    const vis = on ? "hidden" : "";
    for (const el of [o.groups.case, o.groups.clock, o.groups.lamp]) if (el) el.style.visibility = vis;
  };

  // ── the camera ──
  const pose = new Channel<Pose>(stopPose("home"), lerpPose, samePose);
  const shift = new Channel<number[]>([0, 0], lerp2, same2);
  const caseOp = new Channel<number>(1, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-4);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let view: View = "home";
  let dirty = true;
  let forced = false;
  let first = true;
  const readVar = (name: string) => parseFloat(o.cam.style.getPropertyValue(name)) || 0;
  const evaluate = (now: number) => {
    const desk = root.dataset.desk, focus = root.dataset.deskFocus, arrived = root.dataset.deskArrived !== undefined;
    const v = viewOfState(desk, focus);
    const leaving = view === "home" && v !== "home";
    if (leaving && !groupsShown) { buildGroups(); setGroupsShown(true); }
    view = v;
    const still = reduced();
    const def: Rule = still ? null : { dur: CAM.t, delay: CAM.wait, ease: EASE.cam };
    const poseRule: Rule = still ? null : arrived && desk === "offduty" ? { dur: CAM.bikeT, delay: 0, ease: EASE.bike } : arrived ? null : def;
    pose.retarget(stopPose(v, v === "files" ? readVar("--pan") : 0), poseRule, now);
    const sh = v === "home" ? [0, 0] : [readVar("--dx"), readVar("--dy")];
    shift.retarget(sh, def, now);
    const opT = v === "profile" || v === "bike" ? 0 : 1;
    const opRule: Rule = still ? null
      : arrived && desk === "offduty" ? { dur: 400, delay: 0, ease: EASE.ease }
      : arrived ? null
      : v === "profile" ? { dur: 600, delay: 700, ease: EASE.ease }
      : v === "bike" ? { dur: 400, delay: 0, ease: EASE.ease }
      : { dur: 600, delay: 150, ease: EASE.ease };
    caseOp.retarget(opT, opRule, now);
    arrange(v, first ? null : poseRule ?? def, now);
    first = false;
    dirty = true;
    kick();
  };

  // ── where the canvas is and what it covers ──
  let geom = { u: 1, cx: 0, cy: 0, cw: 1, ch: 1, w: 1, h: 1 };
  const layout = () => {
    const r = o.stage.getBoundingClientRect();
    const u = r.width / 1118;
    const main = o.stage.closest("main");
    const mb = main ? main.getBoundingClientRect().bottom + scrollY : innerHeight;
    const w = document.documentElement.clientWidth, h = Math.max(innerHeight, Math.round(mb));
    const left = -r.left - scrollX, top = -r.top - scrollY;
    canvas.style.left = `${left}px`; canvas.style.top = `${top}px`;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    if (renderer.getPixelRatio() !== pr()) renderer.setPixelRatio(pr());
    const sz = renderer.getSize(new THREE.Vector2());
    if (sz.x !== w || sz.y !== h) renderer.setSize(w, h, false);
    geom = { u, cx: left / u, cy: top / u, cw: w / u, ch: h / u, w, h };
    dirty = true;
  };
  layout();

  const V = new THREE.Matrix4(), P = new THREE.Matrix4();
  const frameTimes: number[] = [];
  let lastT = 0;
  const draw = (now: number) => {
    const p = pose.value(now);
    const s = shift.value(now);
    const { u, cx, cy, cw, ch } = geom;
    V.fromArray(viewMatrix(p));
    P.fromArray(projectionMatrix(cx, cy, cw, ch, 560 + (s[0] + p.sx) / u, 226 + (s[1] + p.sy) / u));
    camera.matrixWorldInverse.copy(V);
    camera.matrixWorld.copy(V).invert();
    camera.projectionMatrix.copy(P);
    camera.projectionMatrixInverse.copy(P).invert();
    caseOpacity = caseOp.value(now);
    applyGroupOpacity();
    renderer.render(scene, camera);
  };

  let raf = 0;
  const loop = (now: number) => {
    // while this frame runs, a kick must not start a second loop
    raf = -1;
    if (lastT) frameTimes.push(now - lastT);
    if (frameTimes.length > 2000) frameTimes.splice(0, 1000);
    lastT = now;
    // the pan and the lens shift change without a change of state
    if (view !== "home") {
      const want = stopPose(view, view === "files" ? readVar("--pan") : 0);
      if (!samePose(want, pose.to)) evaluate(now);
      const sh = [readVar("--dx"), readVar("--dy")];
      if (!same2(sh, shift.to)) evaluate(now);
    }
    const objects = settle(now);
    const moving = pose.active || shift.active || caseOp.active || objects;
    const arrivedNow = pose.tick(now);
    shift.tick(now); caseOp.tick(now);
    if (arrivedNow && view !== "home") o.onArrive();
    // home and still: the page's own case, clock and lamp again
    if (view === "home" && !pose.active && !shift.active && !caseOp.active) {
      if (groupsShown && !forced) setGroupsShown(false);
      for (const p of room) { const ud = p.meshes[0].userData; if (ud.hideAtHome) { ud.hideAtHome = false; ud.vis = false; ud.dirty = true; dirty = true; } }
      if (dirty) settle(now);
    }
    const video = groupsShown && [...(groupMeshes.get("case") ?? [])].some((m) => m.visible && (m.material as THREE.ShaderMaterial).uniforms.map.value instanceof THREE.VideoTexture);
    if (moving || dirty || video || arrivedNow) { draw(now); dirty = false; }
    if (moving || video || view !== "home" || pending > 0) raf = requestAnimationFrame(loop);
    else { raf = 0; lastT = 0; }
  };
  const kick = () => { if (raf === 0) raf = requestAnimationFrame(loop); };

  const mo = new MutationObserver(() => evaluate(performance.now()));
  mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-focus", "data-desk-arrived"] });
  const onResize = () => { layout(); kick(); };
  addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(o.stage);
  const onLost = (e: Event) => { e.preventDefault(); root.dataset.glLost = "1"; };
  const onRestored = () => { delete root.dataset.glLost; dirty = true; kick(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  // start where the page is (a direct visit to /#off-duty lands there)
  const v0 = viewOfState(root.dataset.desk, root.dataset.deskFocus);
  if (v0 !== "home") {
    pose.retarget(stopPose(v0, readVar("--pan")), null, 0);
    shift.retarget([readVar("--dx"), readVar("--dy")], null, 0);
    caseOp.retarget(v0 === "profile" || v0 === "bike" ? 0 : 1, null, 0);
    view = v0;
    buildGroups(); setGroupsShown(true);
    // there already: say so, as the CSS camera does when its move ends
    setTimeout(() => o.onArrive(), 0);
  }
  evaluate(performance.now());
  // the flat groups' pictures to the GPU before the first move
  const warm = () => { if (!groupsShown) { buildGroups(); for (const ms of groupMeshes.values()) for (const m of ms) { const t = (m.material as THREE.ShaderMaterial).uniforms.map.value; if (t) renderer.initTexture(t); } } };
  const idle = (cb: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 500));
  idle(warm);
  kick();

  return {
    renderer, scene,
    redraw() { dirty = true; kick(); },
    quads: () => lastQuads,
    forceGroups(on) { forced = on; if (on) buildGroups(); setGroupsShown(on); dirty = true; kick(); },
    stats() {
      const ft = frameTimes.slice();
      const sorted = [...ft].sort((a, b) => a - b);
      return { frames: ft.length, pending, textures: renderer.info.memory.textures, calls: renderer.info.render.calls, tris: renderer.info.render.triangles,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0, max: sorted[sorted.length - 1] ?? 0, gpu: gl.getParameter(gl.RENDERER), pr: renderer.getPixelRatio(), view, groupsShown };
    },
    dispose() {
      cancelAnimationFrame(raf);
      mo.disconnect(); ro.disconnect();
      removeEventListener("resize", onResize);
      setGroupsShown(false);
      for (const t of texCache.values()) t.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
