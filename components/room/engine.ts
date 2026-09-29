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
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { stopPose, viewOfState, viewMatrix, projectionMatrix, lerpPose, projectToStage, bezier, EASE, CAM, type Pose, type View } from "@/lib/room/pose";
import { mirror, type Quad, type Baked } from "./mirror";
import { makeBlur } from "./blur";
import { startHits, type Hit, type HitLayer } from "./hits";
import { makeLcd, type Lcd } from "./lcd";
import { makeNight, POOL } from "./night";
import { makeWallet, type Host, type WalletData } from "./wallet";
import { makeScreen } from "./screen";
import { makeU15 } from "./u15gl";
import { makeBud, type BudData } from "./budgl";
import { makeRibbons } from "./ribbons";
import { makeShelf, type OdThing } from "./shelf";
import { makeBinderTurn, type LeafFrame } from "./binderturn";

type State = { m?: number[]; op?: number; vis?: boolean };
type Item = {
  i: number; cls: string; anc?: string; type: "img" | "tex" | "grid"; src: string; w: number; h: number; m: number[];
  op: number; vis?: boolean; blend: string; order: number; grid?: number[]; back?: boolean; rho?: number; px?: [number, number];
  /** how it lies at each stop, where that differs from home */
  states?: Partial<Record<View | `pf${number}`, State>>;
  need: number;
  /** the GPU's copy (scripts/room/textures.mjs) */
  k2?: string; k2px?: [number, number]; k2mode?: string; k2bytes?: number;
  /** a preview, a few KB, drawn until the texture is in */
  lo?: string;
  /** a part of Ukrainska 15's folder (bake.mjs, u15gl.ts) */
  u15?: { sel: string; key: string; q: [number, number]; chain: { cls: "env" | "stack" | "item"; dx: number; dy: number }[] };
  /** one of the БУДЬ prints, or their sleeve's plastic (bake.mjs, budgl.ts) */
  bud?: { n?: number; gloss?: boolean; q: [number, number] };
  /** an award ribbon, turned on hover (bake.mjs, ribbons.ts): its picture's offset in its element, the element's size (u) */
  rib?: { n: number; q: [number, number]; w: number; h: number };
  /** one of Off Duty's things' planes (bake.mjs, shelf.ts): its thing, and whether it turns with the thing's body */
  od?: { key: string; body: boolean };
  /** a cover's sharper picture for when its thing is taken out (textures.mjs) */
  k2out?: string;
  /** a Profile binder sheet as it lies before the first visit: blank (bake.mjs, textures.mjs) */
  blank?: string; k2blank?: string;
  /** the award stack it is part of (Case Files: the page's :hover brightens the stack) */
  stack?: string;
  /** a Profile binder leaf's plane (bake.mjs, binderturn.ts): its leaf, which face or hung sheet */
  leaf?: { i: number; part: "front" | "back" | "rev" | "hang" | "rigid"; hang?: string };
};
/** drawn live over the baked room: the bike computer's screen (lcd.ts) */
type Live = { id: string; of: string; m: number[]; w: number; h: number };
type Scene = { u: number; items: Item[]; flat: Baked[]; groups?: Record<string, number[]>; live?: Live[]; wallet?: WalletData; od?: OdThing[]; leaves?: LeafFrame[]; u15?: { card: number[]; lcd: { x: number; y: number; w: number; h: number } }; bud?: BudData };

export type RoomOptions = {
  stage: HTMLElement; // .case-stage
  cam: HTMLElement; // .scene-cam: --dx, --dy, --pan
  before: HTMLElement; // the canvas goes in just before this (.room-home)
  groups: { case: HTMLElement | null; clock: HTMLElement | null; lamp: HTMLElement | null };
  onArrive: () => void;
  sceneUrl?: string;
  /** the room at home as a still, shown until WebGL has drawn it */
  poster?: HTMLElement | null;
  /** a link of the site's own, followed on the client (Next's router) */
  navigate?: (href: string) => void;
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
  /** tests: Off Duty's things' composed end states against the bake's, u */
  odCheck(): Record<string, number>;
  /** tests: the binder's leaves as binderturn.ts composes them, against the bake's spreads, u */
  binderCheck(): Record<string, number> | null;
  binderPlanes(): unknown[];
  /** tests: one of Off Duty's things' meshes (one per plane) */
  odMeshes(key: string): THREE.Mesh[];
  forceGroups(on: boolean): void;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  /** debugging: the camera the room is drawn with */
  camera: THREE.Camera;
  /** debugging: every texture the room holds — its slots, the mirrored groups', and whatever else a mesh draws (canvases) */
  textures(): Record<string, unknown>[];
  /** debugging (memory pass): drop these slots' textures and load them again — how long each takes to come back, and its upload */
  reload(srcs: string[]): Promise<Record<string, unknown>[]>;
  redraw(): void;
  quads(): Record<string, unknown[]>;
  /** the room at home, without the case, clock and lamp, over (x, y, w, h)
   *  of the stage in u, as a W × H PNG (scripts/room/poster.mjs) */
  renderRegion(x: number, y: number, w: number, h: number, W: number, H: number): string;
};

/** how long a lost WebGL context may stay lost before the page gives up on it */
const LOST_MS = 5000;

export async function startRoom(o: RoomOptions): Promise<Room> {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const data: Scene = await (await fetch(o.sceneUrl ?? "/room/scene.json")).json();
  // The wall goes on up past its top, its pictures mirrored above it seam to
  // seam, as the page's .desk-wall::after does (globals.css; not baked: it
  // lies above the page). Each wall plane and its wash again, flipped about
  // its top edge. (In the CSS room it fades on the way down to the desk, to
  // spare the browser a plane behind the camera: nothing to spare here.)
  for (const it of [...data.items]) {
    if (!/^desk-plane desk-wall(?! desk-wall--hung)/.test(it.cls) || /::after/.test(it.cls) || it.m[13] > -100) continue;
    const m = it.m.slice(); for (const k of [4, 5, 6, 7]) m[k] = -m[k];
    data.items.push({ ...it, cls: it.cls + " room-mirror", m, lo: undefined });
  }

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
  // The room's pictures are KTX2 (?tex=webp: the bake's WebP, to compare),
  // each in a slot its materials read from: a transparent pixel until it is
  // in, then the texture, uploaded to the GPU the moment it arrives. They
  // load by zone — what home shows first, then the other stops while the
  // browser is idle — and a flight waits (a beat at most) until what it
  // will see is on the GPU.
  const texCache = new Map<string | Element, THREE.Texture>();
  let pending = 0;
  const useK2 = params.get("tex") !== "webp";
  const ktx2 = new KTX2Loader().setTranscoderPath("/room/basis/").detectSupport(renderer);
  const EMPTY = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  EMPTY.needsUpdate = true;
  type Slot = { src: string; tex: THREE.Texture; mats: Set<THREE.ShaderMaterial>; state: 0 | 1 | 2; prio: number; bytes: number; wait: (() => void)[]; zone: string; lo?: string; loTex?: THREE.Texture; at?: number; upMs?: number };
  const slots = new Map<string, Slot>();
  const bytesOf = (t: THREE.Texture) => {
    const c = t as THREE.CompressedTexture;
    if (c.isCompressedTexture) return (c.mipmaps as { data: ArrayBufferView }[]).reduce((a, m) => a + m.data.byteLength, 0);
    const im = t.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined;
    const w = im?.videoWidth || im?.width || 0, h = im?.videoHeight || im?.height || 0;
    return w * h * 4 * (t.generateMipmaps ? 4 / 3 : 1);
  };
  const slotOf = (src: string) => {
    let sl = slots.get(src);
    if (!sl) { sl = { src, tex: EMPTY, mats: new Set(), state: 0, prio: 9, bytes: 0, wait: [], zone: "" }; slots.set(src, sl); }
    return sl;
  };
  // the previews: all of them first (a few KB each), each drawn until its
  // texture is in, so a flight that cannot wait never shows a hole
  const previews = (list: Slot[]) => Promise.all(list.filter((sl) => sl.lo && !sl.loTex && sl.state !== 2).map((sl) => new Promise<void>((res) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (sl.state !== 2) {
        const t = new THREE.Texture(img);
        t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = true; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
        t.needsUpdate = true; renderer.initTexture(t);
        sl.loTex = t; sl.tex = t;
        for (const m of sl.mats) m.uniforms.map.value = t;
        dirty = true; kick();
      }
      res();
    };
    img.onerror = () => res();
    img.src = sl.lo!;
  })));
  const arrive = (sl: Slot, tex: THREE.Texture) => {
    tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = aniso;
    if ((tex as THREE.CompressedTexture).isCompressedTexture) { tex.premultiplyAlpha = false; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = false; }
    else { tex.premultiplyAlpha = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; }
    tex.needsUpdate = true;
    const t0 = performance.now();
    renderer.initTexture(tex);
    sl.upMs = performance.now() - t0;
    sl.tex = tex; sl.state = 2; sl.bytes = bytesOf(tex); sl.at = performance.now();
    for (const m of sl.mats) m.uniforms.map.value = tex;
    if (sl.loTex) { sl.loTex.dispose(); sl.loTex = undefined; }
    for (const f of sl.wait.splice(0)) f();
    afterArrive?.(sl);
    dirty = true; kick();
  };
  // (the binder lets a picture go that came in after its spread was left: below)
  let afterArrive: ((sl: Slot) => void) | null = null;
  let inflight = 0;
  const pump = () => {
    while (inflight < 6) {
      let next: Slot | null = null;
      for (const sl of slots.values()) if (sl.state === 0 && sl.prio < 9 && (!next || sl.prio < next.prio)) next = sl;
      if (!next) return;
      const sl = next;
      sl.state = 1; inflight++; pending++;
      const done = () => { inflight--; pending--; pump(); };
      if (sl.src.endsWith(".ktx2")) ktx2.load(sl.src, (t) => { arrive(sl, t); done(); }, undefined, () => { sl.state = 2; for (const f of sl.wait.splice(0)) f(); done(); });
      else {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => img.decode().catch(() => {}).then(() => { const t = new THREE.Texture(img); arrive(sl, t); done(); });
        img.onerror = () => { sl.state = 2; for (const f of sl.wait.splice(0)) f(); done(); };
        img.src = sl.src;
      }
    }
  };
  /** load these now (or sooner than planned); resolves once all are in */
  const want = (list: Slot[], prio: number) => new Promise<void>((res) => {
    let left = 0;
    for (const sl of list) {
      if (sl.prio > prio) sl.prio = prio;
      if (sl.state !== 2) { left++; sl.wait.push(() => { if (--left === 0) res(); }); }
    }
    if (!left) res();
    pump();
  });
  const imageTexture = (src: string) => {
    const sl = slotOf(src);
    if (sl.state === 0) { sl.prio = Math.min(sl.prio, 1); pump(); }
    return sl.tex;
  };
  // three (r1xx) counts a picture's mip levels from img.width — its laid-out
  // size — but allocates it at its natural size: laid out a level larger
  // (the niche's poster, 196 × 504 shown at 204 × 523) the texture asks for
  // one level too many and is refused (INVALID_OPERATION, drawn clear). Such
  // a picture goes to the GPU as a copy at its natural size.
  const naturalSized = (el: HTMLImageElement): HTMLImageElement | HTMLCanvasElement => {
    const nw = el.naturalWidth, nh = el.naturalHeight;
    if (!nw || !nh || Math.floor(Math.log2(Math.max(el.width, el.height))) <= Math.floor(Math.log2(Math.max(nw, nh)))) return el;
    const c = document.createElement("canvas");
    c.width = nw; c.height = nh;
    c.getContext("2d")!.drawImage(el, 0, 0);
    return c;
  };
  const elementTexture = (el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
    let t = texCache.get(el);
    if (t) return t;
    t = el instanceof HTMLVideoElement ? new THREE.VideoTexture(el) : el instanceof HTMLCanvasElement ? new THREE.CanvasTexture(el) : new THREE.Texture(naturalSized(el));
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
  /** how many planes the room lifts in m's plane: the next free height there */
  const liftTop = (m: number[]) => {
    const n = normalOf(m);
    if (!n) return 0;
    return planeCount.get([n.x, n.y, n.z].map((v) => v.toFixed(2)).join() + "|" + Math.round(n.dot(new THREE.Vector3(m[12], m[13], m[14])) * 2) / 2) ?? 0;
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
  type Placed = { meshes: THREE.Mesh[]; item: Item; k: number; slot: Slot; m: Channel<number[]>; op: Channel<number>; mats: THREE.ShaderMaterial[] };
  const room: Placed[] = [];
  for (const it of data.items) {
    if (!it.src) continue;
    const opaque = /\.(jpe?g)$/i.test(it.src) || it.type === "grid";
    const mats: THREE.ShaderMaterial[] = [];
    const slot = slotOf(useK2 && it.k2 ? it.k2 : it.src);
    if (it.lo) slot.lo = it.lo;
    const map = slot.tex;
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
    for (const m of mats) slot.mats.add(m);
    if (slot.state === 2) for (const m of mats) m.uniforms.map.value = slot.tex;
    // (the БУДЬ prints lie on their sheet as budgl.ts lays them, the ribbons
    // on their lattice as ribbons.ts does: no lift of their own)
    // (a mirror's face is turned, its y flipped: lifted the other way, so its
    // wash lies on it as the wall's does, not behind it)
    const k = it.bud || it.rib ? 0 : liftCount(it.m) * (it.cls.endsWith(" room-mirror") ? -1 : 1);
    const meshes = mats.map((mat) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(placed(lifted(it.m, k), it.w, it.h));
      mesh.matrixWorldNeedsUpdate = true;
      mesh.visible = it.vis !== false && it.op > 0.001;
      mesh.name = it.cls;
      // a plane's own ::before (the wall's haze) is painted before anything
      // laid on the plane, as the page paints it: three would sort its big
      // quad by its middle, after the trophy's shadow on the wall
      if (/::before$/.test(it.cls) && /^desk-plane /.test(it.cls)) mesh.renderOrder = -1;
      scene.add(mesh);
      return mesh;
    });
    room.push({ meshes, item: it, k, slot, m: new Channel(it.m, lerpN, sameN), op: new Channel(it.op, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-4), mats: it.type === "grid" ? [] : mats });
  }
  // Off Duty's cards (what a thing taken out is) show only while it is out:
  // their pictures are loaded then, and let go once it is back (shelf.ts)
  const outOnly = new Set(room.filter((p) => /(^| )bs-card( |$)/.test(p.item.cls)).map((p) => p.slot));
  for (const p of room) if (!/(^| )bs-card( |$)/.test(p.item.cls)) outOnly.delete(p.slot);
  // what is drawn live over its object, shown and faded with it: the bike
  // computer's screen, from the room's state, multiplied onto the unit as
  // the page's LCD is (the bake left the unit's own screen blank)
  const lives: { mesh: THREE.Mesh; host: Placed; lcd: Lcd; tex: THREE.CanvasTexture }[] = [];
  for (const lv of data.live ?? []) {
    const host = room.find((p) => p.item.cls.split(" ")[0] === lv.of.replace(/^\./, ""));
    if (!host) continue;
    const lcd = makeLcd(lv.w, lv.h);
    const tex = new THREE.CanvasTexture(lcd.canvas);
    tex.premultiplyAlpha = true; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = aniso;
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    const mat = material(tex, { blend: "multiply", alphaTest: 0.002, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(placed(lifted(lv.m, liftCount(lv.m)), lv.w, lv.h));
    mesh.matrixWorldNeedsUpdate = true;
    scene.add(mesh);
    lcd.onChange(() => { tex.needsUpdate = true; dirty = true; kick(); });
    lives.push({ mesh, host, lcd, tex });
  }
  // Off Duty's wallet and player: the open spread's discs, the turn, the
  // disc's flight to the spindle (wallet.ts), laid from the room's state
  const hostOf = (cls: string): Host | null => {
    const p = room.find((q) => q.item.cls === cls);
    if (!p) return null;
    const ud = p.meshes[0].userData;
    return { meshes: p.meshes, shown: () => ud.vis !== false && !ud.away && p.op.value(performance.now()) > 0.001, m: p.item.m, w: p.item.w, h: p.item.h, k: p.k, tex: () => p.slot.tex, watch: (mat) => { p.slot.mats.add(mat); if (p.slot.state === 2) mat.uniforms.map.value = p.slot.tex; } };
  };
  // (made once the loop is there to draw them: below)
  let wallet: ReturnType<typeof makeWallet> | null = null, screen: ReturnType<typeof makeScreen> | null = null;
  // Ukrainska 15's folder, laid where the page's panel has it (u15gl.ts)
  let u15Hit: Hit | null = null;
  // (its card slides aside as the stacks' do, .6 s, when another case is in focus)
  const u15Card = new Channel<number[]>([], lerpN, (a, b) => a.length === b.length && sameN(a, b));
  const u15CardTo = (rule: Rule, now: number) => { if (u15Hit) { const m = u15Hit.byFocus?.[root.dataset.deskFocus ?? ""] ?? u15Hit.m; if (!u15Card.to.length) u15Card.retarget(m, null, now); else u15Card.retarget(m, rule, now); } };
  const u15 = data.u15 ? makeU15({
    scene,
    parts: room.filter((p) => p.item.u15).map((p) => ({ meshes: p.meshes, w: p.item.w, h: p.item.h, k: p.k, u15: p.item.u15!, mats: p.mats })),
    edges: room.filter((p) => /^env__(edge|player-)/.test(p.item.cls)).map((p) => ({ meshes: p.meshes, sel: `.${p.item.cls.split(" ").pop()}`, mats: p.mats })),
    card: () => (u15Hit ? u15Card.value(performance.now()) : null),
    lcd: data.u15.lcd, material, liftTop,
    shown: (p) => { const ud = p.meshes[0].userData; return ud.vis !== false && !ud.away; },
  }) : null;
  // the binder's turns and its certificates turned over (binderturn.ts)
  const binderTurn = data.leaves?.length ? makeBinderTurn({
    scene, leaves: data.leaves,
    planes: room.filter((p) => p.item.leaf && !p.item.bud).map((p) => {
      const ud = p.meshes[0].userData;
      return {
        meshes: p.meshes, mats: p.mats, m: p.item.m, w: p.item.w, h: p.item.h, k: p.k, leaf: p.item.leaf!,
        visAt: (at: number) => at >= 1 && at <= SPREADS && (p.item.states?.[`pf${at}`]?.vis ?? p.item.vis !== false),
        vis: () => ud.vis !== false, away: () => !!ud.away, op: () => p.op.value(performance.now()),
        watch: (mat: THREE.ShaderMaterial) => { p.slot.mats.add(mat); mat.uniforms.map.value = p.slot.tex; },
      };
    }),
    lifted, placed,
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    redraw: () => { dirty = true; kick(); },
    panel: () => document.querySelector<HTMLElement>(".room-binder"),
    veil: (on) => hitLayer?.veil("pf", on),
  }) : null;
  // the БУДЬ prints, where the page's store has them (budgl.ts)
  const budFace = data.bud ? room.find((p) => p.item.i === data.bud!.face && !p.item.bud) : undefined;
  const budOf = (p: Placed) => ({ meshes: p.meshes, mats: p.mats, w: p.item.w, h: p.item.h, q: p.item.bud!.q });
  const bud = data.bud && budFace ? makeBud({
    face: { meshes: budFace.meshes, w: budFace.item.w, h: budFace.item.h,
      // (its sheet in the air is drawn in bands: the prints lie on it all the same)
      shown: () => budFace.meshes[0].visible || (!!budFace.item.leaf && binderTurn?.shownAir(budFace.item.leaf.i) === true && budFace.meshes[0].userData.vis !== false && !budFace.meshes[0].userData.away) },
    prints: room.filter((p) => p.item.bud && !p.item.bud.gloss).map((p) => ({ ...budOf(p), n: p.item.bud!.n! })),
    gloss: ((p) => (p ? budOf(p) : null))(room.find((p) => p.item.bud?.gloss)),
    data: data.bud,
    redraw: () => { dirty = true; kick(); },
  }) : null;
  // the award ribbons, turned as the page's :hover / :focus-visible (ribbons.ts)
  const latticeP = room.find((p) => (" " + p.item.cls + " ").includes(" desk-wall--hung "));
  const ribbons = latticeP && room.some((p) => p.item.rib) ? makeRibbons({
    lattice: { meshes: latticeP.meshes, k: latticeP.k },
    ribbons: room.filter((p) => p.item.rib).map((p) => ({ meshes: p.meshes, mats: p.mats, m: p.item.m, w: p.item.w, h: p.item.h, rib: p.item.rib! })),
    lifted,
    redraw: () => { dirty = true; kick(); },
  }) : null;
  ribbons?.frame(performance.now());
  // Off Duty's books, comics, tapes and omnibus, taken out and put back as the page's are (shelf.ts)
  const shelf = data.od?.length ? makeShelf({
    things: data.od,
    planes: room.filter((p) => p.item.od).map((p) => ({
      key: p.item.od!.key, body: p.item.od!.body, card: /(^| )bs-card( |$)/.test(p.item.cls),
      meshes: p.meshes, mats: p.mats, m: p.item.m, w: p.item.w, h: p.item.h, k: p.k,
      shown: () => { const ud = p.meshes[0].userData; return ud.vis !== false && !ud.away; },
      op: () => p.op.value(performance.now()),
      ...(outOnly.has(p.slot) ? { load: () => { want([p.slot], 0); }, unload: () => evict(p.slot) }
        // a cover taken out: its sharper picture while out, the shelf's one again after
        : p.item.k2out && useK2 ? ((out: Slot) => ({
          load: () => { for (const m of p.mats) out.mats.add(m); if (out.state === 2) for (const m of p.mats) m.uniforms.map.value = out.tex; else want([out], 0); },
          unload: () => { for (const m of p.mats) { out.mats.delete(m); m.uniforms.map.value = p.slot.tex; } evict(out); },
        }))(slotOf(p.item.k2out)) : {}),
    })),
    lifted, placed,
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    redraw: () => { dirty = true; kick(); },
  }) : null;
  // each plane where the stop puts it
  // the Profile binder's planes lie as the spread the page's binder is at
  // (RoomBinder.tsx, room:binder-at; the bake's pf1 … pf7), wherever the camera is
  const isBinder = (p: Placed) => (p.item.anc ?? "").split(" ").includes("desk-binder");
  const phoneBinder = matchMedia("(max-width: 760px)");
  let binderAt = 1;
  // Case Files with a case in focus lies as the bake's files:<slug> (M6: the
  // one laid out, the others moved aside); what that state leaves out lies
  // as at home
  const focusOf = (v: View) => (v === "files" ? root.dataset.deskFocus : undefined);
  // …and with a pointer over a stack while none is in focus, the bake's
  // files:hover-<slug> (the page's :hover: its postcards a little way out,
  // "In progress" over it)
  let hoverSlug: string | null = null;
  const HOVERS = new Set(data.items.flatMap((it) => Object.keys(it.states ?? {}).filter((k) => k.startsWith("files:hover-")).map((k) => k.slice(12))));
  const stateOf = (p: Placed, v: View) => {
    if (isBinder(p)) return p.item.states?.[`pf${binderAt}`] ?? {};
    const f = focusOf(v);
    if (f) return p.item.states?.[`files:${f}` as View] ?? {};
    if (v === "files" && hoverSlug && HOVERS.has(hoverSlug)) return p.item.states?.[`files:hover-${hoverSlug}` as View] ?? {};
    return p.item.states?.[v] ?? {};
  };
  // What of the binder can show: a spread shows a plane if it is on show
  // there and, a sleeve's face, faces up (the back of a turned-under sleeve
  // never does: 069's front, the certificates' backs). Only the open
  // spread's pictures are kept on the GPU (the memory pass, 26.09): a turn
  // loads the new spread's — its previews standing in meanwhile — and once
  // they are in lets the others go.
  const faceUp = (p: Placed, m: number[]) => !p.item.back || m[2] * m[4] - m[0] * m[6] < 0;
  const binderNeeds = (p: Placed, at: number) => {
    // (a certificate turned over shows its back: binderturn.ts)
    if (p.item.leaf?.part === "rev") return !!p.item.leaf.hang && !!binderTurn?.flipped().includes(p.item.leaf.hang);
    const st = p.item.states?.[`pf${at}`] ?? {}; return (st.vis ?? p.item.vis !== false) && faceUp(p, st.m ?? p.item.m);
  };
  const SPREADS = Math.max(1, ...data.items.flatMap((it) => Object.keys(it.states ?? {}).filter((k) => /^pf\d+$/.test(k)).map((k) => +k.slice(2))));
  const binderOnly = new Set<Slot>();
  { const other = new Set(room.filter((p) => !isBinder(p)).map((p) => p.slot)); for (const p of room) if (isBinder(p) && !other.has(p.slot)) binderOnly.add(p.slot); }
  const binderSlotsAt = (at: number) => new Set(room.filter((p) => isBinder(p) && binderNeeds(p, at)).map((p) => p.slot));
  const never = new Set([...binderOnly].filter((sl) => !Array.from({ length: SPREADS }, (_, k) => binderSlotsAt(k + 1)).some((set) => set.has(sl))));
  /** a picture back to its preview, off the GPU */
  const evict = (sl: Slot) => {
    if (sl.state !== 2) return;
    if (sl.tex !== EMPTY) sl.tex.dispose();
    sl.tex = EMPTY; sl.state = 0; sl.bytes = 0; sl.prio = 9;
    for (const m of sl.mats) m.uniforms.map.value = EMPTY;
    if (sl.lo) previews([sl]);
  };
  // what of the binder stays: the spread at, the one asked for (its turn
  // waits for its pictures), and while a turn runs the one it left
  let binderAsked = binderAt;
  const binderKeep = () => {
    const keep = binderSlotsAt(binderAt);
    if (binderAsked !== binderAt) for (const sl of binderSlotsAt(binderAsked)) keep.add(sl);
    const t = binderTurn;
    if (t && t.busy(performance.now())) for (const sl of binderSlotsAt(t.from())) keep.add(sl);
    return keep;
  };
  const letBinderGo = () => { const keep = binderKeep(); for (const sl of binderOnly) if (!keep.has(sl)) evict(sl); };
  // the binder's sheets before the camera first sets off for Profile: blank,
  // as the page's DeskBinder lays its BLANK spreads until then (Kate, 28.09);
  // from then on its own. The planes stay on their own slots (zones, flights,
  // eviction as ever): only what their materials show is the blank picture
  // until then (warmBinder, evaluate), which then goes
  // (only the faces up at the spread it lies open at: nothing turns it before)
  const blanks = room.filter((p) => (p.item.blank || p.item.k2blank) && binderNeeds(p, binderAt)).map((p) => ({ p, sl: slotOf(useK2 && p.item.k2blank ? p.item.k2blank : p.item.blank!) }));
  const blankSlots = new Set(blanks.map((b) => b.sl));
  let binderWarm = !blanks.length || root.dataset.desk === "profile";
  if (!binderWarm) {
    for (const { p, sl } of blanks) for (const m of p.mats) { p.slot.mats.delete(m); sl.mats.add(m); m.uniforms.map.value = sl.tex; }
    want([...blankSlots], 0);
  }
  const warmBinder = () => {
    if (binderWarm) return;
    binderWarm = true;
    for (const { p, sl } of blanks) for (const m of p.mats) { sl.mats.delete(m); p.slot.mats.add(m); m.uniforms.map.value = p.slot.tex; }
    for (const sl of blankSlots) { if (sl.state === 0) sl.prio = 9; evict(sl); }
    dirty = true; kick();
  };
  afterArrive = (sl) => {
    if (binderOnly.has(sl) && !binderKeep().has(sl)) evict(sl);
    if (binderWarm && blankSlots.has(sl)) evict(sl);
  };
  // the page's own transitions when the case in focus changes, per thing:
  // the card slides aside (.6 s), its parts fan out (.7 s), the truck
  // drives (.8 s), a tag fades in once it lies there (.3 s after .35 s)
  const FAN = bezier(0.65, 0, 0.2, 1), EASE_T = bezier(0.25, 0.1, 0.25, 1);
  const focusRule = (p: Placed): { m: Rule; op: Rule } => {
    const c = p.item.cls, a = p.item.anc ?? "";
    if (reduced()) return { m: null, op: null };
    if (/(^| )jury-tag( |$)/.test(c)) return { m: null, op: { dur: 300, delay: 350, ease: EASE_T } };
    if (/(^| )stack-note( |$)/.test(c)) return { m: null, op: { dur: 300, delay: 450, ease: EASE_T } };
    if (/stack-truck/.test(a) || /stack-truck/.test(c)) return { m: { dur: 800, delay: 0, ease: FAN }, op: null };
    if (/^(jury-card|postcard|payslip|calc|stack-moss|stack-mush)/.test(c) || /(^| )(calc|stack-moss|jury-card|postcard|payslip)( |$)/.test(a)) return { m: { dur: 700, delay: 0, ease: FAN }, op: null };
    return { m: { dur: 600, delay: 0, ease: FAN }, op: null };
  };
  // the page's transitions as the pointer comes over a stack or leaves it:
  // its postcards and card as when laid out (.7 s), "In progress" .2 s (after .12 s coming)
  const hoverRule = (p: Placed): { m: Rule; op: Rule } => {
    if (reduced()) return { m: null, op: null };
    if (/(^| )stack-soon( |$)/.test(p.item.cls)) return { m: null, op: { dur: 200, delay: hoverSlug ? 120 : 0, ease: EASE_T } };
    return focusRule(p);
  };
  const onCaseHover = (e: Event) => {
    const d = (e as CustomEvent<{ slug: string; on: boolean }>).detail;
    const was = hoverSlug;
    if (d.on) hoverSlug = d.slug; else if (hoverSlug === d.slug) hoverSlug = null;
    if (hoverSlug === was || view !== "files" || root.dataset.deskFocus || root.dataset.desk !== "open") return;
    arrange("files", hoverRule, performance.now());
    lookTo(performance.now());
    dirty = true; kick();
  };
  addEventListener("room:case-hover", onCaseHover);
  // a postcard under the pointer in a stack laid out comes over the others
  // (the page's .postcard:hover { z-index: 5 }: still under the card, 6):
  // half a lift over the highest it goes over, at once
  const postcards = new Map<string, Placed[]>();
  for (const p of room) if (p.item.stack && /^postcard( |$)/.test(p.item.cls)) postcards.set(p.item.stack, [...(postcards.get(p.item.stack) ?? []), p]);
  const cardK = new Map<Placed, number>();
  const onPostcard = (e: Event) => {
    const d = (e as CustomEvent<{ slug: string; i: number; on: boolean }>).detail;
    const list = postcards.get(d.slug), p = list?.[d.i];
    if (!list || !p) return;
    if (!cardK.has(p)) cardK.set(p, p.k);
    // (each lies at z-index i + 1, AwardStack.tsx; hovered, 5: over those under 5,
    // and over a 5 only if that one comes before it)
    const own = cardK.get(p)!;
    const under = list.filter((q, j) => j !== d.i && (j + 1 < 5 || (j + 1 === 5 && j < d.i))).map((q) => cardK.get(q) ?? q.k);
    p.k = d.on && under.some((k) => k > own) ? Math.max(...under) + 0.5 : own;
    p.meshes[0].userData.dirty = true; dirty = true; kick();
  };
  addEventListener("room:postcard-hover", onPostcard);
  // …and the generic card's :hover filter, brightness(1.05) saturate(1.04), .3 s ease
  const stackLook = new Map<string, Channel<number>>();
  for (const p of room) if (p.item.stack && !stackLook.has(p.item.stack)) stackLook.set(p.item.stack, new Channel(0, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-4));
  const stackPlanes = room.filter((p) => p.item.stack);
  const lookTo = (now: number) => {
    const on = view === "files" && root.dataset.desk === "open" && !root.dataset.deskFocus ? hoverSlug : null;
    for (const [slug, ch] of stackLook) ch.retarget(slug === on ? 1 : 0, reduced() ? null : { dur: 300, delay: 0, ease: EASE_T }, now);
  };
  /** the stacks' filter this frame; true while one changes */
  const stacksLook = (now: number) => {
    let moving = false;
    for (const ch of stackLook.values()) moving ||= ch.active;
    if (!moving && !stackPlanes.some((p) => p.mats[0]?.uniforms.brightness.value !== 1 + 0.05 * stackLook.get(p.item.stack!)!.value(now))) return false;
    for (const p of stackPlanes) { const e = stackLook.get(p.item.stack!)!.value(now); for (const mat of p.mats) { mat.uniforms.brightness.value = 1 + 0.05 * e; mat.uniforms.saturate.value = 1 + 0.04 * e; } }
    for (const ch of stackLook.values()) ch.tick(now);
    return true;
  };
  // Phones (globals.css, max-width 767px): the wall's mirror above its top
  // is for home only; at any stop it fades (.3 s ease) as the stop is asked
  // for, as .desk-wall::after does there
  const phoneWall = matchMedia("(max-width: 767px)");
  const isMirror = (p: Placed) => p.item.cls.endsWith(" room-mirror");
  const arrange = (v: View, rule: Rule | ((p: Placed) => { m: Rule; op: Rule }), now: number, only?: (p: Placed) => boolean) => {
    for (const p of room) {
      if (only && !only(p)) continue;
      const st = stateOf(p, v);
      const r = typeof rule === "function" ? rule(p) : { m: rule, op: rule };
      p.m.retarget(st.m ?? p.item.m, r.m, now);
      if (isMirror(p)) p.op.retarget(phoneWall.matches && v !== "home" ? 0 : st.op ?? p.item.op, rule && !reduced() ? { dur: 300, delay: 0, ease: EASE.ease } : null, now);
      else p.op.retarget(st.op ?? p.item.op, r.op, now);
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
        mesh.visible = ud.vis !== false && !ud.away && op > 0.001;
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
      } else if (q.kind === "tex") map = imageTexture(useK2 && q.k2 ? q.k2 : q.src!);
      else {
        // a text's canvas is kept per element and laid out afresh at each
        // read; if its size changed (the page's text 2 px wider), its texture
        // is a new one — the old one's storage has the old size, and an update
        // into it failed (Safari: texSubImage2D, INVALID_VALUE)
        const c = drawText(q, u);
        const had = texCache.get(c);
        if (had && (had.userData.w !== c.width || had.userData.h !== c.height)) { had.dispose(); texCache.delete(c); }
        const t = elementTexture(c); t.userData.w = c.width; t.userData.h = c.height; t.needsUpdate = true; map = t;
      }
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
    // (a class, not visibility on the group: a child that sets its own
    // visibility — the niche's clip — would still be drawn). By day put away
    // in the frame WebGL has drawn them (draw(), after the render): at the
    // change of state, which can come after this frame's rAF, the page showed
    // the empty room for a frame (1 in 10 day runs). At night at the change
    // of state still: the page's night goes with them there, and a swap
    // inside the rAF let a long first-departure frame show no night at all
    // (2–4 in 5 night runs; HANDOFF §0, 8b)
    const byDay = on && !root.hasAttribute("data-night");
    groupsAwayPending = byDay;
    if (byDay) { dirty = true; kick(); }
    else for (const el of [o.groups.case, o.groups.clock, o.groups.lamp]) el?.classList.toggle("room-away", on);
  };
  let groupsAwayPending = false;

  // …and while they are away, a group that changes on the page (the clock's
  // minute, the TARDIS's charge and jump, the lamp) or runs an animation of
  // its own (flap-fall, tardis-charge, the lamp's fade) is read again each
  // frame until it is still (live, as the CSS room showed them in flight)
  const GROUP_BASE = { lamp: 500, clock: 700, case: 1000 } as const;
  const groupEl = { case: o.groups.case, clock: o.groups.clock, lamp: o.groups.lamp };
  const groupChanged = new Set<keyof typeof GROUP_BASE>();
  const moGroups = new MutationObserver((list) => {
    if (!groupsShown) return;
    for (const r of list) for (const k of Object.keys(groupEl) as (keyof typeof GROUP_BASE)[]) {
      // (not the room's own putting it away and back)
      if (r.target === groupEl[k] && r.attributeName === "class") continue;
      if (groupEl[k]?.contains(r.target)) groupChanged.add(k);
    }
    kick();
  });
  for (const el of Object.values(groupEl)) if (el) moGroups.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "src", "data-flip", "data-lit"] });
  const animating = (el: HTMLElement) => el.getAnimations({ subtree: true }).some((a) => { const t = a.effect?.getComputedTiming(); return a.playState === "running" && !!t && Number.isFinite(t.endTime as number); });
  const liveGroups = () => {
    if (!groupsShown || forced) return false;
    let any = false;
    for (const k of Object.keys(groupEl) as (keyof typeof GROUP_BASE)[]) {
      const el = groupEl[k];
      if (!el || !(groupChanged.has(k) || animating(el))) continue;
      groupChanged.delete(k);
      const away = el.classList.contains("room-away");
      if (away) el.classList.remove("room-away");
      buildGroup(k, el, GROUP_BASE[k]);
      if (away) el.classList.add("room-away");
      for (const m of groupMeshes.get(k) ?? []) m.visible = true;
      any = true;
    }
    if (any) applyGroupOpacity();
    return any;
  };
  // the groups read off the page while it has them put away: shown for the
  // read and put away again in one task, so no frame is drawn in between
  const remirror = () => {
    const els = [o.groups.case, o.groups.clock, o.groups.lamp].filter((e): e is HTMLElement => !!e && e.classList.contains("room-away"));
    for (const el of els) el.classList.remove("room-away");
    buildGroups();
    for (const el of els) el.classList.add("room-away");
    for (const ms of groupMeshes.values()) for (const m of ms) m.visible = true;
    applyGroupOpacity();
    dirty = true;
  };

  // ── the night (night.ts): its layers' opacities, the lamp, the torch and
  // NightCam's pool, timed as globals.css times the page's ──
  const night = makeNight();
  scene.add(night.mesh);
  const lerp1 = (a: number, b: number, e: number) => a + (b - a) * e, same1 = (a: number, b: number) => Math.abs(a - b) < 1e-4;
  const homeOp = new Channel<number>(0, lerp1, same1), camOp = new Channel<number>(0, lerp1, same1);
  const lampOp = new Channel<number>(1, lerp1, same1), torchOp = new Channel<number>(0, lerp1, same1);
  const poolCh = new Channel<number[]>([0.3, -0.15, 1.3, 1.2, 1], lerpN, sameN);
  let torchAt = [-1e4, -1e4], torchSeen = false, rest = false;
  const nightActive = () => homeOp.active || camOp.active || lampOp.active || torchOp.active || poolCh.active;
  // (instant: a toggle at rest, which the page's own layers show; a flight
  // runs the page's transitions)
  const nightTo = (v: View, now: number, instant = false) => {
    const on = root.hasAttribute("data-night"), lampOn = root.dataset.lamp !== "off";
    const desk = root.dataset.desk, atHome = !desk || desk === "closed";
    const still = reduced() || instant;
    const E = (dur: number): Rule => (still ? null : { dur, delay: 0, ease: EASE.ease });
    const h = on && atHome ? 1 : 0;
    homeOp.retarget(h, E(h ? 1200 : 600), now);
    camOp.retarget(on && !atHome ? 1 : 0, E(900), now);
    lampOp.retarget(lampOn ? 1 : 0, E(350), now);
    torchOp.retarget(on && !lampOn && torchSeen ? 1 : 0, E(500), now);
    const P0 = POOL[v] ?? POOL.home;
    // (the page's pool jumps there at the click; here it moves over, in the
    // time the layer itself takes to come in)
    poolCh.retarget([...P0.at, ...P0.size, P0.k], E(900), now);
  };
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    torchAt = [e.clientX - r.left, e.clientY - r.top];
    if (!torchSeen) { torchSeen = true; nightTo(view, performance.now(), rest); }
    if (!rest && night.mesh.visible) { dirty = true; kick(); }
  };
  const onPointerOut = (e: PointerEvent) => { if (e.pointerType === "mouse" && !e.relatedTarget) { torchSeen = false; nightTo(view, performance.now(), rest); } };
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("pointerdown", onPointer, { passive: true });
  document.addEventListener("pointerout", onPointerOut);

  // ── the camera ──
  const pose = new Channel<Pose>(stopPose("home"), lerpPose, samePose);
  const shift = new Channel<number[]>([0, 0], lerp2, same2);
  const caseOp = new Channel<number>(1, (a, b, e) => a + (b - a) * e, (a, b) => Math.abs(a - b) < 1e-4);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let view: View = "home";
  let dirty = true;
  let forced = false;
  let first = true;
  let waits = 0;
  const readVar = (name: string) => parseFloat(o.cam.style.getPropertyValue(name)) || 0;
  // a stop's pose as the CSS has it now: the pan along the desk at Case Files,
  // and on a phone at the wall's stops and Profile too (useDeskCamera's --pan)
  const narrow = () => innerWidth < 768;
  const poseOf = (v: View) => stopPose(v, v === "files" || (narrow() && (v === "award" || v === "offduty" || v === "profile")) ? readVar("--pan") : 0, narrow());

  // ── what each stop sees, for loading and for the flights' wait ──
  const seenAt = (it: Item, p: Pose, home: boolean) => {
    const { u, cx, cy, cw, ch } = geom;
    // the window in stage u: the canvas at home, centred on the lens elsewhere
    const W = innerWidth / u, H = innerHeight / u;
    const r = home ? [cx, cy, cx + cw, cy + ch] : [560 + p.sx / u - W * 0.6, 226 + p.sy / u - H * 0.6, 560 + p.sx / u + W * 0.6, 226 + p.sy / u + H * 0.6];
    const m = it.m;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) {
      const x = a * it.w, y = b * it.h;
      const q = projectToStage(p, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]]);
      if (!q) continue;
      any = true; x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
    }
    return any && x1 >= r[0] && x0 <= r[2] && y1 >= r[1] && y0 <= r[3];
  };
  const ZONES: [View, number[]][] = [["home", [0]], ["files", [0, 450, 900]], ["profile", [0]], ["offduty", [0]], ["award", [0]]];
  // (no bike zone: staging reads the bike computer from Off Duty, 27.09)
  const zoneSlots = new Map<View, Set<Slot>>();
  const zones = () => {
    for (const [v, pans] of ZONES) {
      const set = new Set<Slot>();
      // (a binder leaf that only another spread shows loads when it is turned to)
      const shown = (p: Placed) => !outOnly.has(p.slot) && (isBinder(p) ? binderNeeds(p, binderAt) : p.item.vis !== false || Object.keys(p.item.states ?? {}).some((k) => !k.startsWith("pf")));
      for (const p of room) if (shown(p)) for (const pan of pans) if (seenAt(p.item, stopPose(v, pan), v === "home")) { set.add(p.slot); break; }
      zoneSlots.set(v, set);
    }
  };
  const zoneReady = (v: View) => [...(zoneSlots.get(v) ?? [])].every((sl) => sl.state === 2);
  /** what a flight from the camera's pose now to `to` will show */
  const flightSlots = (to: Pose, now: number) => {
    const from = pose.value(now), need = new Set<Slot>();
    for (const k of [0, 0.25, 0.5, 0.75, 1]) {
      const pp = lerpPose(from, to, k);
      for (const p of room) if (!need.has(p.slot) && !outOnly.has(p.slot) && (!isBinder(p) || binderNeeds(p, binderAt)) && seenAt(p.item, pp, false)) need.add(p.slot);
    }
    return [...need];
  };
  let hold = false, waited = false, lastFocus = "";
  // the wallet's sleeves: whether a flight from here to `to` (or the stop) shows them
  const walletPlanes = room.filter((p) => /^od-hang od-hang--/.test(p.item.cls));
  const walletSeen = (to: Pose, now: number) => {
    const from = pose.value(now);
    return [0, 0.25, 0.5, 0.75, 1].some((k) => walletPlanes.some((p) => seenAt(p.item, lerpPose(from, to, k), false)));
  };
  const evaluate = (now: number) => {
    const desk = root.dataset.desk, focus = root.dataset.deskFocus, arrived = root.dataset.deskArrived !== undefined;
    // (setting off for Profile the first time: its sheets filled in, and the
    // flight below waits for them as for any picture it will see)
    if (desk === "profile") warmBinder();
    const v = viewOfState(desk, focus);
    // a move to a stop whose pictures are not on the GPU yet waits for them
    // (at most 1.5 s), as the CSS camera waits its 0.2 s beat
    if (!first && v !== view && !hold && !waited) {
      const to = poseOf(v);
      const missing = flightSlots(to, now).filter((sl) => sl.state !== 2);
      // (the wallet's discs, let go away from Off Duty, painted again first
      // if the flight will show them)
      const discs = wallet?.parked() && walletSeen(to, now) ? wallet.restore() : null;
      if (missing.length || discs) {
        hold = true;
        // once waited, it goes, whatever is still missing (previews stand in)
        const go = () => { if (!hold) return; hold = false; waited = true; evaluate(performance.now()); waited = false; };
        Promise.all([want(missing, 0), discs]).then(() => { if (missing.length) prewarmWay(to); go(); });
        setTimeout(go, 1500);
        waits++;
        if (view === "home" && !groupsShown) { buildGroups(); setGroupsShown(true); }
        return;
      }
    }
    if (hold) return;
    // setting off: what the stop ahead lets go and this flight will not show goes now
    if (!first && v !== view) { const need = new Set(flightSlots(poseOf(v), now)); for (const sl of RELEASE.get(v) ?? []) if (!need.has(sl)) evict(sl); }
    const leaving = view === "home" && v !== "home";
    if (leaving && !groupsShown) { buildGroups(); setGroupsShown(true); }
    const prevView = view;
    view = v;
    // setting off home from a stop: the case, clock and lamp read off the page
    // again (a minute may have gone: the clock would change at the hand-over)
    if (!first && v === "home" && prevView !== "home" && groupsShown && !forced) remirror();
    // (away from Case Files no stack is under the pointer: its control is gone)
    if (v !== "files") hoverSlug = null;
    lookTo(now);
    const still = reduced();
    const def: Rule = still ? null : { dur: CAM.t, delay: CAM.wait, ease: EASE.cam };
    const poseRule: Rule = still ? null : arrived && desk === "offduty" ? { dur: CAM.bikeT, delay: 0, ease: EASE.bike } : arrived ? null : def;
    pose.retarget(poseOf(v), poseRule, now);
    const sh = v === "home" ? [0, 0] : [readVar("--dx"), readVar("--dy")];
    shift.retarget(sh, def, now);
    // the case fades out at the desk and at Profile, as .case-world does
    // there (globals.css: opacity .6s ease .7s); from above the desk, panned
    // along it, it would otherwise stand in the frame
    const opT = v === "profile" || v === "files" || v === "bike" ? 0 : 1;
    const opRule: Rule = still ? null
      : arrived && desk === "offduty" ? { dur: 400, delay: 0, ease: EASE.ease }
      : arrived ? null
      : v === "profile" || v === "files" ? { dur: 600, delay: 700, ease: EASE.ease }
      : v === "bike" ? { dur: 400, delay: 0, ease: EASE.ease }
      : { dur: 600, delay: 150, ease: EASE.ease };
    caseOp.retarget(opT, opRule, now);
    nightTo(v, now);
    // (at Case Files, a new case in focus: the stacks' own transitions)
    const f = focusOf(v) ?? "";
    const refocus = !first && prevView === "files" && v === "files" && f !== lastFocus;
    lastFocus = f;
    arrange(v, first ? null : refocus ? focusRule : poseRule ?? def, now);
    u15CardTo(refocus && !reduced() ? { dur: 600, delay: 0, ease: FAN } : null, now);
    first = false;
    dirty = true;
    kick();
  };

  // ── where the canvas is and what it covers ──
  let geom = { u: 1, cx: 0, cy: 0, cw: 1, ch: 1, w: 1, h: 1 };
  let stageSize = [1118, 745];
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
    stageSize = [r.width, r.height];
    dirty = true;
  };
  layout();
  zones();
  // What only one stop sees (memory pass 2, 27.09): Off Duty's corner —
  // staging's shelf, books, tapes, helmet and comic, and what else only it
  // shows — stays on the GPU only at Off Duty and on the way there or back;
  // what only Case Files shows (the stacks, U15's parts) goes while the
  // camera is at Off Duty. Each back to its preview; a flight that will show
  // them waits for them (flightSlots), as for any picture not in, and draws
  // its way once unseen before it sets off.
  const localTo = (v: View) => {
    const others = [...zoneSlots].filter(([w]) => w !== v).map(([, set]) => set);
    return new Set([...(zoneSlots.get(v) ?? [])].filter((sl) => !binderOnly.has(sl) && !others.some((set) => set.has(sl))));
  };
  const RELEASE = new Map<View, Set<Slot>>();
  {
    const od = localTo("offduty");
    for (const v of ["home", "files", "award", "profile"] as View[]) RELEASE.set(v, od);
    // (at Off Duty: what Case Files shows that Off Duty does not — the desk's
    // cases are seen from home too, so they are not Case Files' alone)
    const here = zoneSlots.get("offduty") ?? new Set<Slot>();
    RELEASE.set("offduty", new Set([...(zoneSlots.get("files") ?? [])].filter((sl) => !here.has(sl) && !binderOnly.has(sl))));
  }
  let released: View | null = null;
  const letStopGo = (v: View) => { released = v; for (const sl of RELEASE.get(v) ?? []) evict(sl); };

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
    // the night: WebGL's while the camera travels, the page's at rest
    const ho = homeOp.value(now), co = camOp.value(now);
    night.mesh.visible = !rest && (ho > 0.001 || co > 0.001);
    if (night.mesh.visible) {
      const nu = night.u, prr = renderer.getPixelRatio();
      nu.res.value.set(geom.w * prr, geom.h * prr); nu.pr.value = prr;
      nu.stage.value.set(-geom.cx * u, -geom.cy * u, stageSize[0], stageSize[1]);
      nu.view.value.set(scrollX, scrollY, innerWidth, innerHeight);
      nu.homeOp.value = ho; nu.camOp.value = co; nu.lamp.value = lampOp.value(now); nu.torchOp.value = torchOp.value(now);
      nu.torch.value.set(torchAt[0], torchAt[1]);
      const pl = poolCh.value(now);
      nu.pool.value.set(pl[0], pl[1], pl[2], pl[3]); nu.poolK.value = pl[4];
    }
    // Phones (Binder.css, max-width 760px): the page has no binder, on the
    // desk or anywhere (.pf-binder display: none)
    if (phoneBinder.matches) for (const m of binderMeshes) m.visible = false;
    for (const l of lives) {
      l.mesh.visible = l.host.meshes[0].visible;
      (l.mesh.material as THREE.ShaderMaterial).uniforms.opacity.value = l.host.op.value(now);
    }
    renderer.render(scene, camera);
    if (groupsAwayPending && groupsShown) { groupsAwayPending = false; for (const el of [o.groups.case, o.groups.clock, o.groups.lamp]) el?.classList.add("room-away"); }
    // the still of the room goes the frame WebGL has drawn it all
    if (o.poster && !posterGone && zoneReady(view) && (binderWarm || [...blankSlots].every((sl) => sl.state === 2))) { posterGone = true; o.poster.style.visibility = "hidden"; }
  };
  let posterGone = false;
  let placedKey = "";

  let raf = 0;
  const loop = (now: number) => {
    // while this frame runs, a kick must not start a second loop
    raf = -1;
    if (lastT) frameTimes.push(now - lastT);
    if (frameTimes.length > 2000) frameTimes.splice(0, 1000);
    lastT = now;
    // the pan and the lens shift change without a change of state
    if (view !== "home") {
      const want = poseOf(view);
      if (!samePose(want, pose.to)) evaluate(now);
      const sh = [readVar("--dx"), readVar("--dy")];
      if (!same2(sh, shift.to)) evaluate(now);
    }
    const objects = settle(now);
    const moving = pose.active || shift.active || caseOp.active || objects;
    // (what takes the controls and the page's panels away: the camera moving —
    // not a stack fanning out at Case Files, which the page does under its
    // own controls; Ukrainska 15 sliding aside takes only its own panel,
    // WebGL drawing the slide)
    const travelling = pose.active || shift.active || caseOp.active;
    hitLayer?.suspend("u15panel", u15Card.active);
    const arrivedNow = pose.tick(now);
    shift.tick(now); caseOp.tick(now);
    if (arrivedNow && view !== "home") o.onArrive();
    // home and still: the page's own case, clock and lamp again — not while
    // a departure waits for its pictures (hold): evaluate has handed the
    // groups to WebGL already, and handing them back for the wait left the
    // page's night off (it goes with data-desk) and WebGL's not drawn — the
    // rare bright first departure at night (HANDOFF §10)
    if (view === "home" && !hold && !pose.active && !shift.active && !caseOp.active) {
      if (groupsShown && !forced) setGroupsShown(false);
      for (const p of room) { const ud = p.meshes[0].userData; if (ud.hideAtHome) { ud.hideAtHome = false; ud.vis = false; ud.dirty = true; dirty = true; } }
      if (dirty) settle(now);
    }
    // the controls: laid over the room when the camera is still, gone while it moves
    if (hitLayer) {
      if (travelling || hold) { if (placedKey !== "moving") { hitLayer.place(null); placedKey = "moving"; } }
      else {
        const s = shift.value(now), p = pose.to;
        const key = `${view}|${p.rx}|${p.t.join()}|${s.join()}|${geom.u}|${geom.cx}|${geom.cy}`;
        if (key !== placedKey) { placedKey = key; hitLayer.place({ view, pose: p, shift: [s[0] + p.sx, s[1] + p.sy], u: geom.u }); }
      }
    }
    const video = groupsShown && [...(groupMeshes.get("case") ?? [])].some((m) => m.visible && (m.material as THREE.ShaderMaterial).uniforms.map.value instanceof THREE.VideoTexture);
    // at rest (home and still, with the page's case; or a stop, its controls
    // laid) the page's own night layers draw the night, not WebGL's
    // (home: exactly while the page's case is shown, the frame it comes back)
    const restNow = view === "home" ? !groupsShown : !(travelling || hold);
    if (restNow !== rest) {
      rest = restNow;
      if (rest) root.dataset.glRest = view === "home" ? "home" : "stop"; else delete root.dataset.glRest;
      dirty = true;
    }
    // at rest where no disc shows (home, where the corner is hidden; a stop
    // that does not see it), the discs' canvases go (painted again before a
    // flight that shows them: evaluate)
    if (travelling || hold) released = null;
    else if (released !== view && (view !== "home" || !groupsShown)) { letStopGo(view); dirty = true; }
    if (wallet && !wallet.parked() && !(travelling || hold) && view !== "offduty" && view !== "bike" && (view === "home" ? !groupsShown : !walletPlanes.some((p) => seenAt(p.item, pose.to, false)))) wallet.release();
    const nightMoving = nightActive();
    homeOp.tick(now); camOp.tick(now); lampOp.tick(now); torchOp.tick(now); poolCh.tick(now);
    // (the wallet's own movements neither hide the controls nor count as the camera's)
    const walletMoving = (wallet ? wallet.frame(now) : false) || (screen ? screen.frame(now) : false) || u15Card.active;
    u15Card.tick(now);
    // (only while the panel is out of sight: at rest at Case Files it is the folder)
    if (u15 && document.querySelector(".room-hit--u15panel[data-away]")) u15.frame();
    // (after the controls are laid: the binder's panel may have just taken over, or given back)
    const binderMoving = binderTurn ? binderTurn.frame(now) : false;
    // the page's panel veiled while a turn runs at rest, shown again once it is over
    if (binderTurn?.veiled && !binderMoving && !binderTurn.busy(now)) binderTurn.veil(false);
    bud?.frame();
    const ribMoving = ribbons ? ribbons.frame(now) : false;
    const shelfMoving = (shelf ? shelf.frame(now) : false) || stacksLook(now) || liveGroups();
    if (moving || dirty || video || arrivedNow || nightMoving || walletMoving || ribMoving || shelfMoving || binderMoving) { draw(now); dirty = false; }
    if (moving || video || view !== "home" || pending > 0 || nightMoving || walletMoving || ribMoving || shelfMoving || binderMoving) raf = requestAnimationFrame(loop);
    else { raf = 0; lastT = 0; }
  };
  const kick = () => { if (raf === 0) raf = requestAnimationFrame(loop); };

  const hosts = ["od-hang od-hang--l", "od-hang od-hang--r", "od-film od-film--l", "od-film od-film--r", "od-dvd__base"].map(hostOf);
  // (each step two strips: its side and its foot)
  const stepsOf = (side: string) => Array.from({ length: data.wallet?.steps ?? 0 }, (_, j) => ["side", "foot"].map((k) => { const h = hostOf(`od-step od-step--${side} od-step-${j} od-step--${k}`); return h && { ...h, j }; })).flat().filter(Boolean) as Host[];
  wallet = data.wallet && hosts.every(Boolean) ? makeWallet({
    scene, data: data.wallet,
    under: { l: hosts[0]!, r: hosts[1]! }, film: { l: hosts[2]!, r: hosts[3]! }, steps: { l: stepsOf("l"), r: stepsOf("r") }, base: hosts[4]!,
    material, lifted, liftCount,
    redraw: () => { dirty = true; kick(); },
    upload: (t) => renderer.initTexture(t),
  }) : null;
  const lidHost = hostOf("od-dvd__lid");
  screen = data.wallet && lidHost ? makeScreen({
    scene, box: data.wallet.screen, lid: lidHost, material, lifted, liftCount,
    redraw: () => { dirty = true; kick(); },
    upload: (t) => renderer.initTexture(t),
  }) : null;

  // (the binder's sheets once a turn is over: the spread's own kept, the rest let go)
  const binderSettled = (at: number) => { const t = () => { if (binderAt !== at) return; if (binderTurn?.busy(performance.now())) { setTimeout(t, 200); return; } letBinderGo(); }; t(); };
  const onBinder = (e: Event) => {
    const at = (e as CustomEvent<number>).detail;
    if (at === binderAsked) return;
    binderAsked = at;
    // at rest the page's panel has turned at once: veiled at once (this is
    // the page's layout effect, before it paints), WebGL draws the turn
    binderTurn?.hold(performance.now(), 200);
    if (binderTurn && hitLayer && view === "profile" && rest) binderTurn.veil(true);
    // the turn starts once the new spread's pictures are in (at most 150 ms):
    // the leaf it uncovers would otherwise show its preview for a few frames
    let started = false;
    const start = () => {
      if (started || binderAsked !== at) return;
      started = true;
      const now = performance.now();
      binderAt = at;
      arrange(view, null, now, isBinder);
      binderTurn?.turnTo(at, now);
      binderSettled(at);
      dirty = true; kick();
    };
    if (!binderTurn) { start(); want([...binderSlotsAt(at)], 0); return; }
    want([...binderSlotsAt(at)], 0).then(start);
    setTimeout(start, 150);
    dirty = true; kick();
  };
  // a certificate on the rings turned over (or back) in the page's panel
  const moFlip = new MutationObserver(() => {
    if (!binderTurn || !binderTurn.readFlips(performance.now())) return;
    if (hitLayer && view === "profile" && rest) binderTurn.veil(true);
    want([...binderSlotsAt(binderAt)], 0);
    dirty = true; kick();
  });
  // (data-flipped only: the page sets a certificate's --o in the same render,
  // and a watch on every style change cost the flight to Profile a frame
  // as the page's binder was built)
  moFlip.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-flipped"] });
  addEventListener("room:binder-at", onBinder);
  const mo = new MutationObserver(() => evaluate(performance.now()));
  mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-focus", "data-desk-arrived"] });
  // the night, the lamp: toggled at rest (the page's layers show it), kept for the flight
  const moNight = new MutationObserver(() => { nightTo(view, performance.now(), rest); dirty = true; kick(); });
  moNight.observe(root, { attributes: true, attributeFilter: ["data-night", "data-lamp"] });
  // a phone turned across either width: the binder and the wall's mirror as the page's then
  const binderMeshes = room.filter(isBinder).flatMap((p) => p.meshes);
  const onPhone = () => {
    const now = performance.now();
    for (const p of room) if (isBinder(p)) p.meshes[0].userData.dirty = true;
    arrange(view, null, now, isMirror);
    dirty = true; kick();
  };
  phoneBinder.addEventListener("change", onPhone);
  phoneWall.addEventListener("change", onPhone);
  const onResize = () => { layout(); kick(); };
  addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(o.stage);
  // (a context the browser does not give back — a GPU reset it gave up on,
  // too many losses — would leave the room empty: after LOST_MS the page is
  // told, and RoomGL puts the CSS room in its place)
  let lostTimer = 0;
  const onLost = (e: Event) => {
    e.preventDefault(); root.dataset.glLost = "1";
    clearTimeout(lostTimer); lostTimer = window.setTimeout(() => { if (root.dataset.glLost) dispatchEvent(new Event("room:lost")); }, LOST_MS);
  };
  const onRestored = () => { clearTimeout(lostTimer); delete root.dataset.glLost; dirty = true; kick(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  // start where the page is (a direct visit to /#off-duty lands there)
  const v0 = viewOfState(root.dataset.desk, root.dataset.deskFocus);
  if (v0 !== "home") {
    pose.retarget(poseOf(v0), null, 0);
    shift.retarget([readVar("--dx"), readVar("--dy")], null, 0);
    caseOp.retarget(v0 === "profile" || v0 === "files" || v0 === "bike" ? 0 : 1, null, 0);
    view = v0;
    buildGroups(); setGroupsShown(true);
    // there already: say so, as the CSS camera does when its move ends
    setTimeout(() => o.onArrive(), 0);
  }
  evaluate(performance.now());
  // A texture uploaded is not yet drawn: the GPU may still place it the
  // first time it is sampled (a one-off frame of 70–230 ms, measured on the
  // first arrival at Profile). So each stop, once its pictures are in, is
  // drawn once, small and unseen, from where its camera will be.
  const warmRT = new THREE.WebGLRenderTarget(64, 64, { depthBuffer: true });
  const warmCam = new THREE.PerspectiveCamera();
  warmCam.matrixAutoUpdate = false; warmCam.matrixWorldAutoUpdate = false;
  const prewarm = (v: View) => prewarmAt(stopPose(v, 0));
  // (a flight that waited for its pictures: its way, a few poses along it)
  const prewarmWay = (to: Pose) => { const from = pose.value(performance.now()); for (const k of [0.33, 0.66, 1]) prewarmAt(lerpPose(from, to, k)); };
  const prewarmAt = (p: Pose) => {
    warmCam.matrixWorldInverse.fromArray(viewMatrix(p)); warmCam.matrixWorld.copy(warmCam.matrixWorldInverse).invert();
    const { u } = geom;
    const W = innerWidth / u, H = innerHeight / u;
    warmCam.projectionMatrix.fromArray(projectionMatrix(560 - W / 2, 226 - H / 2, W, H, 560 + p.sx / u, 226 + p.sy / u)); warmCam.projectionMatrixInverse.copy(warmCam.projectionMatrix).invert();
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(warmRT);
    renderer.render(scene, warmCam);
    renderer.setRenderTarget(prev);
  };
  // what the first view shows, now; the rest once it is in, while idle
  const t0 = performance.now();
  let homeAt = 0;
  previews([...slots.values()].filter((sl) => !never.has(sl))).then(() => { root.dataset.glPreviews = "1"; });
  want([...(zoneSlots.get(view) ?? [])], 0).then(() => {
    homeAt = performance.now() - t0;
    root.dataset.glZone = "1";
    let prio = 2;
    const later = ZONES.map(([v]) => v).filter((v) => v !== view);
    const nextZone = () => {
      const v = later.shift();
      if (!v) return;
      want([...(zoneSlots.get(v) ?? [])], prio++).then(() => idle(() => { prewarm(v); if (!pose.active && !hold) letStopGo(view); idle(nextZone); }));
    };
    idle(nextZone);
  });
  // the flat groups' pictures to the GPU before the first move
  // (and every baked look of theirs, not only what shows now: the TARDIS's
  // glow is out at idle and lit when she sends it off, maybe as the camera goes)
  // (the night's shader too: compiled the first time it drew, it cost the
  // first flight away from home at night a frame of 25–34 ms)
  const warm = () => {
    const nv = night.mesh.visible; night.mesh.visible = true; night.u.homeOp.value = night.u.camOp.value = 0.5;
    const prev = renderer.getRenderTarget(); renderer.setRenderTarget(warmRT); renderer.render(scene, camera); renderer.setRenderTarget(prev);
    night.mesh.visible = nv;
    for (const f of data.flat) imageTexture(useK2 && f.k2 ? f.k2 : f.src); if (!groupsShown) { buildGroups(); for (const ms of groupMeshes.values()) for (const m of ms) { const t = (m.material as THREE.ShaderMaterial).uniforms.map.value; if (t) renderer.initTexture(t); } } };
  const idle = (cb: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 500));
  idle(warm);
  kick();

  // what can be clicked (public/room/hits.json)
  let hitLayer: HitLayer | null = null;
  fetch("/room/hits.json").then((r) => r.json()).then((d: { hits: Hit[] }) => {
    u15Hit = d.hits.find((h) => h.id === "u15panel") ?? null;
    u15CardTo(null, performance.now());
    hitLayer = startHits({
      host: o.cam, hits: d.hits, camera, canvasRect: () => canvas.getBoundingClientRect(), redraw: () => {}, navigate: o.navigate,
      // a plane the page's own DOM stands in for at rest (the Profile binder)
      away: (cls, on) => {
        for (const p of room) {
          if (!(p.item.anc ?? "").split(" ").includes(cls)) continue;
          const ud = p.meshes[0].userData;
          if (!!ud.away === on) continue;
          ud.away = on; ud.dirty = true; dirty = true;
          // this frame's settle() has run already (place() comes after it):
          // show or hide now, or the frame drawn next has neither the panel
          // nor WebGL's binder
          const op = p.op.value(performance.now());
          for (const mesh of p.meshes) mesh.visible = ud.vis !== false && !on && op > 0.001;
        }
      },
    });
    placedKey = "";
    kick();
  }).catch(() => {});

  return {
    renderer, scene, camera,
    redraw() { dirty = true; kick(); },
    quads: () => lastQuads,
    renderRegion(x, y, w, h, W, H) {
      const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true, colorSpace: THREE.NoColorSpace, samples: 4 });
      const cam2 = new THREE.PerspectiveCamera();
      cam2.matrixAutoUpdate = false; cam2.matrixWorldAutoUpdate = false;
      const hp = stopPose("home");
      cam2.matrixWorldInverse.fromArray(viewMatrix(hp)); cam2.matrixWorld.copy(cam2.matrixWorldInverse).invert();
      cam2.projectionMatrix.fromArray(projectionMatrix(x, y, w, h, 560, 226)); cam2.projectionMatrixInverse.copy(cam2.projectionMatrix).invert();
      const shown = groupRoot.visible;
      groupRoot.visible = false;
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, cam2);
      const px = new Uint8Array(W * H * 4);
      renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
      renderer.setRenderTarget(null);
      groupRoot.visible = shown;
      rt.dispose();
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      const img = ctx.createImageData(W, H);
      // rows bottom up, and premultiplied: back to a plain picture
      for (let r = 0; r < H; r++) {
        const src = (H - 1 - r) * W * 4, dst = r * W * 4;
        for (let i = 0; i < W * 4; i += 4) {
          const a = px[src + i + 3];
          img.data[dst + i + 3] = a;
          for (let k = 0; k < 3; k++) img.data[dst + i + k] = a ? Math.min(255, Math.round((px[src + i + k] * 255) / a)) : 0;
        }
      }
      ctx.putImageData(img, 0, 0);
      dirty = true; kick();
      return c.toDataURL("image/png");
    },
    // (tests: each Off Duty thing's end state as shelf.ts composes it against the bake's, u)
    odCheck() {
      const out: Record<string, number> = {};
      for (const o of data.od ?? []) {
        const mine = data.items.filter((it) => it.od?.key === o.key && it.src);
        const got = shelf?.check(o.key, mine.map((it) => new THREE.Matrix4().fromArray(it.states?.[`od:${o.key}` as View]?.m ?? it.m)));
        if (got) out[o.key] = +Math.max(0, ...got).toFixed(4);
      }
      return out;
    },
    binderCheck: () => binderTurn ? Object.fromEntries(Array.from({ length: SPREADS }, (_, k) => [`pf${k + 1}`, +binderTurn.check(k + 1, (p) => { const it = room.find((q) => q.meshes === p.meshes)!.item; return it.states?.[`pf${k + 1}` as View]?.m ?? it.m; }).toFixed(4)])) : null,
    binderPlanes: () => binderTurn?.planesNow() ?? [],
    odMeshes: (key: string) => shelf?.planesOf(key).map((p) => p.meshes[0]) ?? [],
    forceGroups(on) { forced = on; if (on) buildGroups(); setGroupsShown(on); dirty = true; kick(); },
    async reload(srcs) {
      const list = srcs.map((s) => slots.get(s)).filter((sl): sl is Slot => !!sl);
      const t0 = performance.now();
      for (const sl of list) { if (sl.tex !== EMPTY) sl.tex.dispose(); sl.tex = EMPTY; sl.state = 0; sl.bytes = 0; for (const m of sl.mats) m.uniforms.map.value = EMPTY; }
      await want(list, 0);
      return list.map((sl) => ({ src: sl.src, ms: Math.round((sl.at ?? 0) - t0), upMs: +(sl.upMs ?? 0).toFixed(2), bytes: sl.bytes }));
    },
    textures() {
      const size = (t: THREE.Texture) => { const im = (t.image ?? {}) as { width?: number; height?: number; videoWidth?: number; videoHeight?: number }; return [im.videoWidth || im.width || 0, im.videoHeight || im.height || 0]; };
      const seen = new Set<THREE.Texture>();
      const out: Record<string, unknown>[] = [];
      for (const sl of slots.values()) { seen.add(sl.tex); out.push({ kind: "slot", src: sl.src, bytes: sl.bytes, state: sl.state, prio: sl.prio, at: sl.at ? Math.round(sl.at) : null, lo: !!sl.loTex }); }
      for (const [el, t] of texCache) { seen.add(t); out.push({ kind: "group", src: el instanceof Element ? `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}${(el as HTMLImageElement).currentSrc ? " " + (el as HTMLImageElement).currentSrc.split("/").pop() : ""}` : String(el), bytes: bytesOf(t), wh: size(t) }); }
      scene.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        const t = mat?.uniforms?.map?.value as THREE.Texture | undefined;
        if (!t || seen.has(t) || t === EMPTY) return;
        seen.add(t);
        out.push({ kind: "other", src: t.constructor.name + " " + size(t).join("x"), bytes: bytesOf(t), wh: size(t), order: (o as THREE.Mesh).renderOrder });
      });
      return out;
    },
    stats() {
      const ft = frameTimes.slice();
      const sorted = [...ft].sort((a, b) => a - b);
      return { frames: ft.length, pending, textures: renderer.info.memory.textures, calls: renderer.info.render.calls, tris: renderer.info.render.triangles,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0, max: sorted[sorted.length - 1] ?? 0, gpu: gl.getParameter(gl.RENDERER), pr: renderer.getPixelRatio(), view, groupsShown,
        nightNow: { vis: night.mesh.visible, ho: +homeOp.value(performance.now()).toFixed(3), co: +camOp.value(performance.now()).toFixed(3), rest, hold, away: !!o.groups.case?.classList.contains("room-away"), shown: groupsShown },
        ribbons: ribbons?.tilted() ?? [], od: shelf?.live() ?? [], binder: binderTurn ? { at: binderTurn.at(), busy: binderTurn.busy(performance.now()), veiled: binderTurn.veiled, flipped: binderTurn.flipped() } : null,
        k2: useK2, slots: slots.size, loaded: [...slots.values()].filter((sl) => sl.state === 2).length,
        // pictures nothing shows (a binder's leaves under the open spread)
        hidden: [...slots.values()].filter((sl) => sl.state === 0 && sl.prio === 9).length,
        roomMB: +([...slots.values()].reduce((a, sl) => a + sl.bytes, 0) / 2 ** 20).toFixed(1),
        groupMB: +([...texCache.values()].reduce((a, t) => a + bytesOf(t), 0) / 2 ** 20).toFixed(1),
        zones: Object.fromEntries([...zoneSlots].map(([v, set]) => [v, { n: set.size, ready: zoneReady(v), MB: +([...set].reduce((a, sl) => a + sl.bytes, 0) / 2 ** 20).toFixed(1) }])),
        homeMs: Math.round(homeAt), waits, poster: posterGone, previews: [...slots.values()].filter((sl) => sl.loTex).length };
    },
    dispose() {
      clearTimeout(lostTimer);
      if (raf > 0) cancelAnimationFrame(raf);
      raf = -2;
      mo.disconnect(); ro.disconnect(); moNight.disconnect();
      wallet?.dispose(); screen?.dispose(); u15?.dispose(); bud?.dispose(); ribbons?.dispose(); shelf?.dispose(); binderTurn?.dispose(); moFlip.disconnect(); moGroups.disconnect();
      removeEventListener("pointermove", onPointer); removeEventListener("pointerdown", onPointer);
      document.removeEventListener("pointerout", onPointerOut);
      delete root.dataset.glRest;
      removeEventListener("room:binder-at", onBinder);
      removeEventListener("room:case-hover", onCaseHover);
      removeEventListener("room:postcard-hover", onPostcard);
      for (const l of lives) { l.lcd.dispose(); l.tex.dispose(); }
      hitLayer?.dispose();
      removeEventListener("resize", onResize);
      phoneBinder.removeEventListener("change", onPhone);
      phoneWall.removeEventListener("change", onPhone);
      setGroupsShown(false);
      for (const t of texCache.values()) t.dispose();
      for (const sl of slots.values()) sl.tex.dispose();
      warmRT.dispose();
      ktx2.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
