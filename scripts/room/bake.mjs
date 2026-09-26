// Bakes the CSS room into data for the WebGL room (components/room):
//
//   node scripts/room/bake.mjs http://localhost:3301 [--only=desk|flat] [--limit=N]
//
// Runs the legacy page (the CSS room) in headless Chrome and, for every
// plane of its 3D scene (.desk-world), records the plane's full matrix and
// either the picture it simply shows (an <img>, a background) or a
// screenshot of the plane taken flat and on its own, at the density the
// closest camera needs. The flat groups that stay DOM at rest — the case
// (.case-world), the flip clock, the lamp — are mirrored from the live page
// at runtime; for them only what is not a picture or text is baked, keyed
// by what it looks like (lib/room/sig.ts). Writes public/room/scene.json
// and public/room/tex/*.webp, and lossless masters to ~/Documents/
// portfolio-offload/room-bake/ for the texture pipeline.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";
import { stopPose, projectToStage, stageWidth } from "../../lib/room/pose.ts";
import { SIG_SRC } from "../../lib/room/sig.ts";
import { collect } from "./collect.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OPT = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, "").split("=")));
const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/room");
const MASTER = path.join(process.env.HOME, "Documents/portfolio-offload/room-bake");
const TMP = path.join(MASTER, "tiles");
for (const f of fs.existsSync(path.join(OUT, "tex")) ? fs.readdirSync(path.join(OUT, "tex")) : []) if (f.endsWith(".webp") && (OPT.only !== "flat" || f.startsWith("f"))) fs.unlinkSync(path.join(OUT, "tex", f));
for (const d of [OUT, path.join(OUT, "tex"), MASTER, path.join(MASTER, "png"), TMP]) fs.mkdirSync(d, { recursive: true });

const VW = 1600, VH = 1000;
// the window the densities are worked out for (a 16" MacBook Pro at its
// default scaling); scripts/room/budget re-sizes for others in M2
const REF = { w: 1728, h: 1117, dpr: 2 };
// a weekday morning: the office edition, the room lit as by day
const FIXED = Date.UTC(2026, 8, 23, 8, 30) + new Date().getTimezoneOffset() * 0; // Wed 23 Sep 2026

const BAKE_CSS = `
html.bk *, html.bk *::before, html.bk *::after { transition: none !important; animation-play-state: paused !important; caret-color: transparent !important; }
html.bk * { visibility: hidden !important; }
html.bk .bk-on, html.bk .bk-on * { visibility: visible !important; }
html.bk .bk-on.bk-own * { visibility: hidden !important; }
html.bk .bk-on.bk-own > svg, html.bk .bk-on.bk-own > svg * { visibility: visible !important; }
html.bk .bk-on.bk-flat, html.bk .bk-on.bk-flat * { opacity: 1 !important; mix-blend-mode: normal !important; }
html.bk .bk-on.bk-flat { color: transparent !important; text-shadow: none !important; -webkit-text-stroke-color: transparent !important; }
html.bk .bk-on.bk-flat * { visibility: hidden !important; }
html.bk .bk-on.bk-psb, html.bk .bk-on.bk-psa { background: none !important; border-color: transparent !important; box-shadow: none !important; color: transparent !important; }
html.bk .bk-on.bk-psb *, html.bk .bk-on.bk-psa * { visibility: hidden !important; }
html.bk .bk-on.bk-psb::after, html.bk .bk-on.bk-psa::before { display: none !important; }
html.bk .bk-on.bk-psb::before, html.bk .bk-on.bk-psa::after { mix-blend-mode: normal !important; }
html.bk .bk-on.bk-nops::before, html.bk .bk-on.bk-nops::after { display: none !important; }
html.bk .bk-anc { opacity: 1 !important; mix-blend-mode: normal !important; }
html.bk, html.bk body, html.bk main { background: transparent !important; }
html.bk::before, html.bk::after, html.bk body::before, html.bk body::after { display: none !important; }
html.bk .scene-cam { perspective: none !important; transform: none !important; }
html.bk .desk-world { transform-origin: 0 0 0 !important; }
html.bk .case-world { transform: none !important; }
`;

const b = await launch({ width: VW, height: VH, dpr: 1 });
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()` });
await b.go(SITE + "/?nointro", 5000);
// the stops' own pieces are built lazily: visit each, then come home
for (const e of ["kate:case-files", "kate:recognition", "kate:off-duty", "kate:profile"]) { await b.ev(`dispatchEvent(new Event("${e}"))`); await sleep(3200); }
await b.ev("history.back()"); await sleep(3500);
log("unloaded pictures:", JSON.stringify(await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const im=[...document.querySelectorAll('.desk-world img, .case-world img, .flip-clock-slot img, .desk-lamp img')];if(im.every(i=>i.complete&&i.currentSrc&&i.naturalWidth)||performance.now()-t0>30000)r(im.filter(i=>!i.currentSrc).map(i=>i.className));else setTimeout(f,200)};f()})`, 40000)));
await sleep(800);

// ── what there is ────────────────────────────────────────────────────────
const collected = await b.ev(`(${collect.toString()})(${JSON.stringify(SIG_SRC)})`);
const { u, stage, units, flat, groupM } = collected;
// every stop's own arrangement of the room
const STATES = { home: ["closed"], files: ["open", undefined, "1"], award: ["award", undefined, "1"], profile: ["profile", undefined, "1"], offduty: ["offduty", undefined, "1"], bike: ["offduty", "bike", "1"] };
const states = {};
for (const [k, [d, f, a]] of Object.entries(STATES)) states[k] = await b.ev(`JSON.stringify(window.__bkState(${JSON.stringify(d)}, ${JSON.stringify(f)}, ${JSON.stringify(a)}))`).then(JSON.parse);
const sameM = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);
log("u", u.toFixed(4), "units", units.length, "flat", flat.length);

// ── self-check: the matrices put every plane where the CSS draws it ──────
const home = stopPose("home");
let worst = 0; const bad = [];
for (const it of units) {
  const m = it.m, pts = [[0, 0], [it.w, 0], [0, it.h], [it.w, it.h]].map(([x, y]) => {
    const q = [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]].map((v) => v / u);
    const s = projectToStage(home, q);
    return s ? [stage.left + s[0] * u, stage.top + s[1] * u] : null;
  });
  if (pts.some((p) => !p) || !it.rect || it.rect.w < 1) continue;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = Math.max(Math.abs(Math.min(...xs) - it.rect.x), Math.abs(Math.min(...ys) - it.rect.y), Math.abs(Math.max(...xs) - it.rect.x - it.rect.w), Math.abs(Math.max(...ys) - it.rect.y - it.rect.h));
  if (d > worst) worst = d;
  if (d > 1) bad.push(`${it.cls} ${d.toFixed(2)}px`);
}
log("matrix check: worst", worst.toFixed(3), "px;", bad.length, "over 1 px", bad.slice(0, 8).join(", "));

// ── how sharp each plane must be: the most screen px per u any stop asks ──
const uRef = stageWidth(REF.w, REF.h) / 1118;
const views = [["home"], ["files", 0], ["files", 900], ["award"], ["profile"], ["offduty"], ["bike"]];
const needOf = (it) => {
  let best = 0;
  for (const [v, pan] of views) {
    const pose = stopPose(v, pan);
    const P = (x, y) => { const m = it.m; return projectToStage(pose, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]].map((c) => c / u)); };
    const N = 6;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const x = (it.w * i) / N, y = (it.h * j) / N, e = Math.max(it.w, it.h) / 200;
      const a = P(x, y), bx = P(x + e, y), by = P(x, y + e);
      if (!a || !bx || !by) continue;
      // in the reference window, roughly: the lens shift centres (560, 226)
      const sx = (a[0] - 560) * uRef + REF.w / 2 + (v === "home" ? 0 : 0), sy = (a[1] - 226) * uRef + REF.h / 2;
      if (v !== "home" && (sx < -50 || sy < -50 || sx > REF.w + 50 || sy > REF.h + 50)) continue;
      const k = Math.max(Math.hypot(bx[0] - a[0], bx[1] - a[1]), Math.hypot(by[0] - a[0], by[1] - a[1])) / (e / u);
      best = Math.max(best, k * uRef * REF.dpr);
    }
  }
  return best; // texture px per u
};
const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6];
for (const it of units) {
  it.need = needOf(it);
  let rho = it.need / u; // texture px per CSS px of the bake page
  rho = STEPS.find((s) => s >= rho * 0.97) ?? STEPS[STEPS.length - 1];
  it.rho = rho;
}

// ── the screenshots ───────────────────────────────────────────────────────
await b.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await b.ev(`(()=>{const s=document.createElement('style');s.id='bk-style';s.textContent=${JSON.stringify(BAKE_CSS)};document.head.appendChild(s);return 1})()`);
await sleep(300);
const pyStitch = path.join(import.meta.dirname, "stitch.py");
const limit = +(OPT.limit ?? 1e9);
let n = 0;
const out = { version: 1, u, stage: { w: stage.width / u, h: stage.height / u }, items: [], flat: [], groups: Object.fromEntries(Object.entries(groupM).map(([k, m]) => [k, toU(m, u)])) };
const texName = (it) => `${String(it.i).padStart(3, "0")}-${(it.cls.split(" ").pop() || it.tag).replace(/[^a-z0-9_-]/gi, "").slice(0, 40)}`;

if (OPT.only !== "flat") for (const it of units) {
  const item = { i: it.i, cls: it.cls, anc: it.anc, back: it.back || undefined, tag: it.tag, w: it.w / u, h: it.h / u, m: toU(it.m, u), op: it.op, blend: it.blend, order: it.order, need: +it.need.toFixed(2) };
  // how it differs at each stop, if it does (the local box stays: the quad's
  // own offset into its box is applied to each state's matrix alike)
  const diff = {};
  for (const [k, list] of Object.entries(states)) {
    const st = list[it.i]; if (!st) continue;
    const d = {};
    if (st.m && !sameM(st.m, states.home[it.i]?.m ?? it.m)) d.m = st.m;
    if (Math.abs(st.op - (states.home[it.i]?.op ?? it.op)) > 1e-3) d.op = st.op;
    if (st.vis !== (states.home[it.i]?.vis ?? true)) d.vis = st.vis;
    if (Object.keys(d).length) diff[k] = d;
  }
  if (states.home[it.i]) { item.op = states.home[it.i].op; if (!states.home[it.i].vis) item.vis = false; }
  item._diff = diff;
  if (it.kind === "img" || it.kind === "bg") { Object.assign(item, { type: "img", src: it.src }); out.items.push(item); continue; }
  if (it.kind === "grid") { Object.assign(item, { type: "grid", src: it.src, grid: it.grid.map((v) => v / u) }); out.items.push(item); continue; }
  if (n++ >= limit) continue;
  // the plane's own frame on screen at 1:1: its local box, grown for ink
  // (shadows, blur, pseudo-elements) and trimmed back to what was drawn
  await b.ev(`window.__bk.pose(${it.i}, ${JSON.stringify(it.mode)})`);
  const r = await b.ev(`window.__bk.bounds(${it.i})`);
  if (!r || r.w < 0.5 || r.h < 0.5) { log("skip empty", it.cls); continue; }
  const grow = Math.ceil(Math.max(8, Math.min(60, Math.max(r.w, r.h) * 0.08)));
  const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
  let rho = it.rho;
  const cap = 4096 / Math.max(box.w, box.h);
  if (rho > cap) rho = STEPS.filter((s) => s <= cap).pop() ?? cap;
  if (it.smooth) rho = Math.min(rho, 0.5);
  const png = await capture(it, box, rho);
  const name = texName(it);
  const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(rho)]).toString());
  if (!res.w) { log("empty after trim", it.cls); continue; }
  // the quad: the trimmed picture's box in the plane's local px, then u
  const ox = box.x + res.x / rho, oy = box.y + res.y / rho, qw = res.w / rho, qh = res.h / rho;
  Object.assign(item, {
    off: [ox, oy],
    type: "tex", src: `/room/tex/${name}.webp`, px: [res.w, res.h], rho,
    w: qw / u, h: qh / u, m: toU(mulLocal(it.m, ox, oy), u),
  });
  out.items.push(item);
  if (n % 10 === 0) log("baked", n);
}

// ── the flat groups: their non-picture paint, by signature ─────────────────
if (OPT.only !== "desk") for (const f of flat) {
  if (f.kind !== "tex") continue;
  await b.ev(`window.__bk.flatPose(${f.i})`);
  const r = await b.ev(`window.__bk.bounds(${f.i}, true)`);
  if (!r || r.w < 0.5) continue;
  const rho = Math.min(4, Math.max(2, Math.ceil((REF.dpr * uRef / u) * 2) / 2)) * (f.group === "clock" ? 2 : 1);
  const grow = Math.ceil(Math.max(6, Math.min(40, Math.max(r.w, r.h) * 0.1)));
  const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
  const png = await capture(f, box, rho, true);
  const name = `f${String(f.i).padStart(3, "0")}-${f.group}`;
  const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(rho)]).toString());
  if (!res.w) continue;
  // offset of the trimmed picture from the element's own box, in u
  out.flat.push({ sig: f.sig, group: f.group, cls: f.cls, src: `/room/tex/${name}.webp`, px: [res.w, res.h],
    x: (box.x + res.x / rho - r.ex) / u, y: (box.y + res.y / rho - r.ey) / u, w: res.w / rho / u, h: res.h / rho / u, ew: r.ew / u, eh: r.eh / u });
}

if (OPT.only === "flat") {
  const prev = JSON.parse(fs.readFileSync(path.join(OUT, "scene.json")));
  out.items = prev.items;
}
for (const item of out.items) {
  const d = item._diff; delete item._diff;
  if (!d || !Object.keys(d).length) continue;
  item.states = {};
  for (const [k, v] of Object.entries(d)) {
    const o = {};
    if (v.m) o.m = toU(item.off ? mulLocal(v.m, item.off[0], item.off[1]) : v.m, u);
    if (v.op !== undefined) o.op = v.op;
    if (v.vis !== undefined) o.vis = v.vis;
    item.states[k] = o;
  }
}
for (const item of out.items) delete item.off;
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(out));
log("wrote", out.items.length, "items,", out.flat.length, "flat; tex", out.items.filter((i) => i.type === "tex").length);
b.close();

// ─────────────────────────────────────────────────────────────────────────
function toU(m, u) { const o = m.slice(); o[12] /= u; o[13] /= u; o[14] /= u; return o; }
function mulLocal(m, x, y) { const o = m.slice(); o[12] += m[0] * x + m[4] * y; o[13] += m[1] * x + m[5] * y; o[14] += m[2] * x + m[6] * y; return o; }

async function capture(it, box, rho, isFlat = false) {
  // tiles of at most 1400 × 900 page px, each brought to (40, 40) of the window
  const TW = 1400, TH = 900, tiles = [];
  for (let ty = 0; ty < box.h; ty += TH) for (let tx = 0; tx < box.w; tx += TW) {
    const w = Math.min(TW, box.w - tx), h = Math.min(TH, box.h - ty);
    await b.ev(`window.__bk.shift(40, 40, ${box.x + tx}, ${box.y + ty})`);
    await b.ev("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const f = path.join(TMP, `t-${it.i}-${tx}-${ty}.png`);
    await b.shot(f, { x: 40, y: 40, width: w, height: h, scale: rho });
    tiles.push({ f, x: Math.round(tx * rho), y: Math.round(ty * rho) });
  }
  const png = path.join(TMP, `u-${isFlat ? "f" : ""}${it.i}.png`);
  execFileSync("python3", [path.join(import.meta.dirname, "stitch.py"), "stitch", png, String(Math.round(box.w * rho)), String(Math.round(box.h * rho)), JSON.stringify(tiles)]);
  return png;
}

// ── page side ─────────────────────────────────────────────────────────────
// Everything hidden but the element being baked (and, for a whole plane,
// what it holds); the page and its paper transparent; nothing moving.

