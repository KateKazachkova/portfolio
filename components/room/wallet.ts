/**
 * Off Duty's CD wallet and player in the WebGL room (M6), as OffDutyShelf
 * draws them: the open spread's discs in their pockets, under the sleeves'
 * film; the steps of the sleeves left to turn standing out past each
 * sleeve; a sleeve turning over the spine (TURN_MS: it folds flat to the
 * pegs, .32 s, and the next opens out of them, .32 s); a disc flying to the
 * player (FLY_MS) and lying on its spindle; a disc under the pointer lifting
 * toward it (the page's hover tilt). What it shows is the room's state
 * (state.ts: series, spread, turn, flying, picked), so the page's controls
 * and WebGL never disagree, at rest or in flight.
 *
 * The bake (scripts/room/bake.mjs, scene.json `wallet`) gives the sleeves
 * without their discs, their film, one plane per step of the stack, the
 * pockets' and the spindle's geometry, and a disc's layers (grooves, sheen,
 * hub, rim) on their own. A disc is drawn here onto a canvas from its label
 * (the series' `disc` picture) and those layers: in the wallet's plain
 * alpha (globals.css .od-disc), or the player's blends (.cd-grooves overlay,
 * .cd-sheen screen).
 */
import * as THREE from "three";
import { bezier } from "@/lib/room/pose";
import { FLY_MS, PER_SPREAD, TURN_MS, discAt, discOut, onRoom, roomState, spreads, type RoomState, type Series } from "./state";

type Box = { m: number[]; w: number; h: number };
type Layer = { src: string; x: number; y: number; w: number; h: number };
export type WalletData = {
  hangs: { l: Box; r: Box };
  discs: (Box & { side: "l" | "r"; i: number })[];
  layers: Partial<Record<"grooves" | "sheen" | "hub" | "edge", Layer>>;
  steps: number;
  bay: Box;
  screen: Box;
};
/** a baked plane of the room the wallet draws with (engine.ts's Placed) */
export type Host = { meshes: THREE.Mesh[]; shown: () => boolean; m: number[]; w: number; h: number; k: number; tex: () => THREE.Texture; watch: (mat: THREE.ShaderMaterial) => void };
export type WalletCtx = {
  scene: THREE.Scene;
  data: WalletData;
  /** the sleeves (baked without discs), their films, their stack steps */
  under: { l: Host; r: Host }; film: { l: Host; r: Host }; steps: { l: Host[]; r: Host[] };
  /** the player's base (the spindle's disc goes with it) */
  base: Host;
  material: (map: THREE.Texture, opts: { opacity?: number; alphaTest?: number; depthTest?: boolean; depthWrite?: boolean }) => THREE.ShaderMaterial;
  lifted: (m: number[], k: number) => number[];
  liftCount: (m: number[]) => number;
  redraw: () => void;
  upload: (t: THREE.Texture) => void;
};

const PAD = 16;         // u of canvas round a disc, for its shadow
const CPX = 384;        // a disc's canvas, px (its body 115 u, ~3 px per u at the corner)
const N = 6;            // a disc's quad, cut N × N so the hover tilt stays true
const TILT = { dur: 350, ease: bezier(0.2, 0.7, 0.2, 1) }; // .cd-body's transition
const FOLD = bezier(0.5, 0, 0.7, 0.4), UNFOLD = bezier(0.3, 0.6, 0.5, 1), FLY = bezier(0.5, 0, 0.3, 1);

// (a plane the page flattened into another has no z column: its normal)
const m4 = (a: number[]) => {
  const m = new THREE.Matrix4().fromArray(a);
  if (Math.hypot(a[8], a[9], a[10]) < 1e-9) {
    const z = new THREE.Vector3(a[0], a[1], a[2]).cross(new THREE.Vector3(a[4], a[5], a[6])).normalize();
    m.elements[8] = z.x; m.elements[9] = z.y; m.elements[10] = z.z;
  }
  return m;
};

// ── a disc on a canvas ────────────────────────────────────────────────────
type Look = "wallet" | "hover" | "player";
const SHADOW: Record<Look, [number, number, number]> = { wallet: [1.5, 3, 0.35], hover: [5, 8, 0.4], player: [0, 2, 0.25] }; // y, blur (u), alpha
const imgs = new Map<string, Promise<HTMLImageElement | null>>();
const load = (src: string) => {
  let p = imgs.get(src);
  if (!p) {
    p = new Promise((res) => { const im = new Image(); im.decoding = "async"; im.onload = () => im.decode().catch(() => {}).then(() => res(im)); im.onerror = () => res(null); im.src = src; });
    imgs.set(src, p);
  }
  return p;
};
function paintDisc(c: HTMLCanvasElement, label: HTMLImageElement | null, title: string, look: Look, body: number, layers: Partial<Record<string, [HTMLImageElement, Layer]>>) {
  const k = CPX / (body + 2 * PAD), B = body * k, P = PAD * k;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  // its box-shadow: outside the circle only (none shows through the hole)
  const [sy, blur, sa] = SHADOW[look];
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${sa})`; ctx.shadowBlur = blur * k; ctx.shadowOffsetY = sy * k;
  ctx.beginPath(); ctx.arc(P + B / 2, P + B / 2, B / 2, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath(); ctx.arc(P + B / 2, P + B / 2, B / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // the label, cover, the hole punched out (.cd-face's mask)
  const f = document.createElement("canvas"); f.width = f.height = Math.ceil(B);
  const fc = f.getContext("2d")!;
  if (label) {
    const s = Math.max(B / label.naturalWidth, B / label.naturalHeight);
    const w = label.naturalWidth * s, h = label.naturalHeight * s;
    fc.drawImage(label, (B - w) / 2, (B - h) / 2, w, h);
  } else {
    fc.fillStyle = "#ece6da"; fc.fillRect(0, 0, B, B);
    fc.fillStyle = "#2C263F"; fc.font = `900 ${B * 0.1}px system-ui, sans-serif`; fc.textAlign = "center"; fc.textBaseline = "middle";
    fc.fillText(title.toUpperCase(), B / 2, B / 2, B * 0.72);
  }
  const g = fc.createRadialGradient(B / 2, B / 2, 0, B / 2, B / 2, B / 2);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.106, "rgba(0,0,0,0)"); g.addColorStop(0.114, "#000");
  g.addColorStop(0.98, "#000"); g.addColorStop(0.992, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0)");
  fc.globalCompositeOperation = "destination-in"; fc.fillStyle = g; fc.fillRect(0, 0, B, B);
  ctx.drawImage(f, P, P);
  // grooves, sheen, hub, rim: the wallet's plain alpha, or the player's blends
  const lay = (name: string, op: GlobalCompositeOperation, a: number) => {
    const l = layers[name]; if (!l) return;
    const [im, box] = l;
    ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a;
    ctx.drawImage(im, P + box.x * B, P + box.y * B, box.w * B, box.h * B);
    ctx.restore();
  };
  if (look === "player") { lay("grooves", "overlay", 1); lay("sheen", "screen", 0.75); }
  else { lay("grooves", "source-over", 0.55); lay("sheen", "source-over", look === "hover" ? 0.9 : 0.5); }
  lay("hub", "source-over", 1); lay("edge", "source-over", 1);
}

function gridGeometry() {
  const g = new THREE.BufferGeometry();
  const st: number[] = [], idx: number[] = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) st.push(i / N, j / N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; idx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2); }
  g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((N + 1) * (N + 1) * 3), 3));
  g.setAttribute("st", new THREE.Float32BufferAttribute(st, 2));
  g.setIndex(idx);
  return g;
}

/** the hover tilt as the page draws it: .od-disc's perspective (900 u, at
 *  its centre) of .cd-body's translateZ(6 u) rotateX(py · −14°) rotateY(px · 16°),
 *  flattened into the sleeve; `e` 0…1 of the way there */
function tiltVertices(g: THREE.BufferGeometry, size: number, px: number, py: number, e: number) {
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const a = (-14 * py * e * Math.PI) / 180, b = (16 * px * e * Math.PI) / 180, tz = 6 * e, d = 900;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const x = (i / N - 0.5) * size, y = (j / N - 0.5) * size;
    // rotateY, then rotateX, then translateZ (CSS: y down, z toward the viewer)
    const x1 = x * cb, z1 = -x * sb;
    const y2 = y * ca - z1 * sa, z2 = y * sa + z1 * ca + tz;
    const s = d / (d - z2);
    pos.setXYZ(j * (N + 1) + i, x1 * s, y2 * s, 0);
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
}

type Disc = { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; geo: THREE.BufferGeometry; title: string | null; look: Look };

export function makeWallet(o: WalletCtx) {
  const D = o.data;
  const body = D.discs[0]?.w ?? 115;
  const size = body + 2 * PAD;
  const EMPTY = new THREE.DataTexture(new Uint8Array(4), 1, 1); EMPTY.needsUpdate = true;
  const layers: Partial<Record<string, [HTMLImageElement, Layer]>> = {};
  let layersIn = false;
  Promise.all(Object.entries(D.layers).map(([k, l]) => load(l!.src).then((im) => { if (im) layers[k] = [im, l!]; }))).then(() => { layersIn = true; for (const t of texes.keys()) repaint(t); });

  // the discs' canvases, by title and look; the spreads near the open one kept
  const texes = new Map<string, { c: HTMLCanvasElement; t: THREE.CanvasTexture; used: number }>();
  const keyOf = (s: Series, look: Look) => `${look}|${s.title}`;
  const repaint = (key: string) => {
    const e = texes.get(key); if (!e) return;
    const [look, ...rest] = key.split("|"); const title = rest.join("|");
    const s = roomState().series.find((x) => x.title === title) ?? roomState().picked ?? roomState().flying?.item;
    const src = s?.disc ?? s?.poster;
    (src ? load(src) : Promise.resolve(null)).then((im) => {
      paintDisc(e.c, im, title, look as Look, body, layers);
      e.t.needsUpdate = true; o.upload(e.t); o.redraw();
    });
  };
  const texOf = (s: Series, look: Look) => {
    const key = keyOf(s, look);
    let e = texes.get(key);
    if (!e) {
      const c = document.createElement("canvas"); c.width = c.height = CPX;
      const t = new THREE.CanvasTexture(c);
      t.premultiplyAlpha = true; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
      e = { c, t, used: 0 };
      texes.set(key, e);
      if (layersIn) repaint(key);
    }
    e.used = performance.now();
    return e.t;
  };

  // ── meshes ──
  // paint order, as the page's: a sleeve, its discs, its film (three would
  // sort them by their middles); the turning copy the same, over them
  const discMesh = (depthTest = true, order = 1): Disc => {
    const geo = gridGeometry();
    tiltVertices(geo, size, 0, 0, 0);
    const mat = o.material(EMPTY, { alphaTest: 0.002, depthWrite: false, depthTest });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.renderOrder = order;
    o.scene.add(mesh);
    return { mesh, mat, geo, title: null, look: "wallet" };
  };
  const setDisc = (d: Disc, s: Series | null, look: Look) => {
    if (!s) { d.mesh.visible = false; d.title = null; return; }
    if (d.title !== s.title || d.look !== look) { d.mat.uniforms.map.value = texOf(s, look); d.title = s.title; d.look = look; }
    d.mesh.visible = true;
  };
  // a disc's plane: its pocket's box, grown by the pad, lifted between the
  // sleeve and its film (the film is the plane after the sleeve's)
  const centred = (m: number[], w: number, h: number, k = 1) => m4(m).multiply(new THREE.Matrix4().makeTranslation(w / 2, h / 2, 0)).multiply(new THREE.Matrix4().makeScale(k, k, 1));
  const pocket = D.discs.map((b) => ({ ...b, at: centred(o.lifted(b.m, o.under[b.side].k + 0.5), b.w, b.h) }));
  const inPocket = pocket.map(() => discMesh());

  // the turn: a copy of a sleeve (its plane and film) and its four discs,
  // folding about its pegs 1 → 2 u off the lining
  const hangM = { l: m4(D.hangs.l.m), r: m4(D.hangs.r.m) };
  const hangInv = { l: hangM.l.clone().invert(), r: hangM.r.clone().invert() };
  const quadOf = (h: Host) => m4(h.m).multiply(new THREE.Matrix4().makeTranslation(h.w / 2, h.h / 2, 0)).multiply(new THREE.Matrix4().makeScale(h.w, h.h, 1));
  const geoQuad = (o.under.l.meshes[0].geometry as THREE.BufferGeometry);
  for (const side of ["l", "r"] as const) for (const m of o.film[side].meshes) m.renderOrder = 2;
  const copyOf = (h: Host, order: number) => {
    const mat = o.material(h.tex(), { alphaTest: 0.004, depthWrite: false });
    h.watch(mat);
    const mesh = new THREE.Mesh(geoQuad, mat); mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.renderOrder = order; o.scene.add(mesh);
    return mesh;
  };
  const turners = (["l", "r"] as const).map((side) => ({
    side,
    planes: [o.under[side], o.film[side]].map((h, k) => ({ mesh: copyOf(h, k ? 5 : 3), local: hangInv[side].clone().multiply(quadOf(h)) })),
    discs: pocket.filter((p) => p.side === side).map((p) => ({ d: discMesh(true, 4), local: hangInv[side].clone().multiply(centred(p.m, p.w, p.h)), i: p.i })),
  }));
  // M_hang · T(pegs) · translateZ(dz) · scaleX(s) · T(−pegs)
  const foldM = (side: "l" | "r", s: number, dz: number) => {
    const ox = side === "l" ? D.hangs.l.w : 0, oy = D.hangs[side].h / 2;
    return hangM[side].clone().multiply(new THREE.Matrix4().makeTranslation(ox, oy, dz))
      .multiply(new THREE.Matrix4().makeScale(Math.max(s, 1e-4), 1, 1)).multiply(new THREE.Matrix4().makeTranslation(-ox, -oy, 0));
  };

  // the player's spindle and the disc in flight
  const bay = { at: centred(o.lifted(D.bay.m, o.liftCount(D.bay.m)), D.bay.w, D.bay.h, D.bay.w / body) };
  const onBay = discMesh();
  const flyer = discMesh(false, 10);

  // ── the hover tilt (hits.ts: room:disc-tilt) ──
  const tilt = pocket.map(() => ({ px: 0, py: 0, e: 0, e0: 0, t0: 0, to: 0 }));
  const onTilt = (ev: Event) => {
    const d = (ev as CustomEvent<{ i: number; px: number; py: number } | { i: number; off: true }>).detail;
    const t = tilt[d.i]; if (!t) return;
    const now = performance.now();
    const cur = t.e0 + (t.to - t.e0) * TILT.ease(Math.min(1, (now - t.t0) / TILT.dur));
    if ("off" in d) { t.e0 = cur; t.to = 0; t.t0 = now; }
    else {
      // a new point under the pointer: the page's transition starts again
      // from where the disc is toward it
      if (t.to === 0 || d.px !== t.px || d.py !== t.py) { t.e0 = t.to === 0 ? cur : 0.4 + 0.6 * cur; t.to = 1; t.t0 = now; }
      t.px = d.px; t.py = d.py;
    }
    o.redraw();
  };
  addEventListener("room:disc-tilt", onTilt);

  // the textures of the spreads around the open one (and the player's disc)
  const prepare = (s: RoomState) => {
    const n = spreads(s), keep = new Set<string>();
    for (let sp = Math.max(0, s.spread - 1); sp <= Math.min(n - 1, s.spread + 1); sp++)
      for (let i = 0; i < PER_SPREAD; i++) { const d = s.series[sp * PER_SPREAD + i]; if (d) { texOf(d, "wallet"); keep.add(keyOf(d, "wallet")); } }
    for (const d of [s.picked, s.flying?.item]) if (d) { texOf(d, "player"); keep.add(keyOf(d, "player")); }
    for (const [k, e] of texes) if (!keep.has(k) && !k.startsWith("hover|") && performance.now() - e.used > 5000) { e.t.dispose(); texes.delete(k); }
  };
  const off = onRoom((s) => { prepare(s); o.redraw(); });
  prepare(roomState());

  const under = (spread: number, side: "l" | "r") => (side === "r" ? spreads() - 1 - spread : spread);
  /** lays everything as the state is at `now`; true while something moves */
  const frame = (now: number) => {
    const s = roomState();
    const shown = o.under.l.shown() || o.under.r.shown();
    const out = discOut(s);
    let moving = false;
    const turn = s.turn, tk = turn ? Math.min(1, (now - turn.t0) / TURN_MS) : 1;
    // under a turning sleeve the halves already show where it goes on the
    // side it leaves, and where it came from on the side it lands on
    const at = { l: turn && turn.dir === -1 ? turn.to : s.spread, r: turn && turn.dir === 1 ? turn.to : s.spread };
    for (const side of ["l", "r"] as const) {
      const n = under(at[side], side);
      o.steps[side].forEach((h, j) => { const v = h.shown() && j < n; for (const m of h.meshes) m.visible = v; });
    }
    pocket.forEach((p, k) => {
      const d = inPocket[k];
      const item = s.series[at[p.side] * PER_SPREAD + p.i] ?? null;
      const t = tilt[k];
      const e = t.e0 + (t.to - t.e0) * TILT.ease(Math.min(1, (now - t.t0) / TILT.dur));
      if (now - t.t0 < TILT.dur) moving = true;
      const hovered = t.to === 1 && !turn && e > 0;
      setDisc(d, shown && item && item.title !== out ? item : null, hovered ? "hover" : "wallet");
      if (d.mesh.visible) {
        if (e > 0 || d.geo.userData.e) { tiltVertices(d.geo, size, t.px, t.py, e); d.geo.userData.e = e; }
        d.mesh.matrix.copy(p.at); d.mesh.matrixWorldNeedsUpdate = true;
      }
    });
    // the turning sleeves
    for (const tr of turners) {
      const folding = turn && (turn.dir === 1 ? tr.side === "r" : tr.side === "l");
      let sx = 0, dz = 2;
      if (turn && shown) {
        const ms = tk * TURN_MS;
        if (folding) { const e = FOLD(Math.min(1, ms / (TURN_MS / 2))); sx = 1 - e; dz = 1 + e; }
        else { const e = UNFOLD(Math.min(1, Math.max(0, (ms - TURN_MS / 2) / (TURN_MS / 2)))); sx = e; }
        moving = true;
      }
      const vis = !!turn && shown && sx > 1e-3;
      const M = vis ? foldM(tr.side, sx, dz) : null;
      for (const pl of tr.planes) { pl.mesh.visible = vis; if (M) { pl.mesh.matrix.copy(M).multiply(pl.local); pl.mesh.matrixWorldNeedsUpdate = true; } }
      const spread = turn ? (folding ? s.spread : turn.to) : 0;
      for (const td of tr.discs) {
        const item = vis ? s.series[spread * PER_SPREAD + td.i] ?? null : null;
        setDisc(td.d, item && item.title !== out ? item : null, "wallet");
        if (M && td.d.mesh.visible) { td.d.mesh.matrix.copy(M).multiply(td.local); td.d.mesh.matrixWorldNeedsUpdate = true; }
      }
    }
    // the player's disc, and the one on its way to it
    const baseShown = o.base.shown();
    setDisc(onBay, baseShown ? s.picked : null, "player");
    if (onBay.mesh.visible) { onBay.mesh.matrix.copy(bay.at); onBay.mesh.matrixWorldNeedsUpdate = true; }
    const f = s.flying;
    const p0 = f ? pocket.find((p) => p.i === f.from) : null;
    if (f && p0 && baseShown) {
      const e = FLY(Math.min(1, (now - f.t0) / FLY_MS));
      flyer.mesh.matrix.copy(flight(p0.at, e)); flyer.mesh.matrixWorldNeedsUpdate = true;
      setDisc(flyer, f.item, "player");
      moving = true;
    } else setDisc(flyer, null, "player");
    return moving;
  };
  // from the pocket to the spindle, laying itself flat and turning 200° on the way
  const pA = new THREE.Vector3(), qA = new THREE.Quaternion(), sA = new THREE.Vector3();
  const pB = new THREE.Vector3(), qB = new THREE.Quaternion(), sB = new THREE.Vector3();
  const flight = (from: THREE.Matrix4, e: number) => {
    from.decompose(pA, qA, sA); bay.at.decompose(pB, qB, sB);
    const q = qA.clone().slerp(qB, e).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (200 * e * Math.PI) / 180));
    return new THREE.Matrix4().compose(pA.clone().lerp(pB, e), q, sA.clone().lerp(sB, e));
  };
  return {
    frame,
    dispose() {
      off(); removeEventListener("room:disc-tilt", onTilt);
      for (const e of texes.values()) e.t.dispose();
    },
  };
}
