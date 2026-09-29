// Does the WebGL camera see the room where the CSS camera draws it, at
// every stop? Opens the legacy page at each stop, lets the CSS camera
// arrive, and projects every plane of public/room/scene.json with
// lib/room/pose.ts; compares with the page's own getBoundingClientRect.
//
//   node scripts/room/check-stops.mjs http://localhost:3301 [WxH]
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log } from "./cdp.mjs";
import { stopPose, projectToStage } from "../../lib/room/pose.ts";
import { SIG_SRC } from "../../lib/room/sig.ts";
import { collect } from "./collect.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const [W, H] = (process.argv[3] ?? "1600x1000").split("x").map(Number);
const scene = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../public/room/scene.json")));
const b = await launch({ width: W, height: H, dpr: 1 });
const STOPS = [["home", ""], ["files", "#case-files"], ["award", "#recognition"], ["profile", "#profile"], ["offduty", "#off-duty"]];
const report = {};
for (const [view, hash] of STOPS) {
  await b.go(SITE + "/?nointro&gl=0" + hash, 3000);
  await sleep(3200);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const im=[...document.querySelectorAll('.desk-world img')];if(im.every(i=>i.complete)||performance.now()-t0>15000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(500);
  const page = await b.ev(`(()=>{const c=(${collect.toString()})(${JSON.stringify(SIG_SRC)});const cam=document.querySelector('.scene-cam');
    return JSON.stringify({u:c.u, stage:c.stage, units:c.units.map(x=>({cls:x.cls,m:x.m,w:x.w,h:x.h,rect:x.rect})), dx: parseFloat(cam.style.getPropertyValue('--dx'))||0, dy: parseFloat(cam.style.getPropertyValue('--dy'))||0, pan: parseFloat(cam.style.getPropertyValue('--pan'))||0, arrived: document.documentElement.dataset.deskArrived})})()`, 60000).then(JSON.parse);
  const pose = stopPose(view, page.pan, W < 768);
  const shift = view === "home" ? [0, 0] : [page.dx + pose.sx, page.dy + pose.sy];
  const u = page.u;
  // (b) the camera: every plane the page draws, projected by pose.ts
  let worst = 0, n = 0; const bad = [];
  for (const it of page.units) {
    if (!it.rect || it.rect.w < 1) continue;
    const m = it.m;
    const pts = [[0, 0], [it.w, 0], [0, it.h], [it.w, it.h]].map(([x, y]) => projectToStage(pose, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]].map((v) => v / u)));
    if (pts.some((p) => !p)) continue;
    const xs = pts.map((p) => page.stage.left + p[0] * u + shift[0]), ys = pts.map((p) => page.stage.top + p[1] * u + shift[1]);
    if (Math.max(...xs) < 0 || Math.min(...xs) > W || Math.max(...ys) < 0 || Math.min(...ys) > H) continue;
    const r = it.rect;
    const d = Math.max(Math.abs(Math.min(...xs) - r.x), Math.abs(Math.min(...ys) - r.y), Math.abs(Math.max(...xs) - r.x - r.w), Math.abs(Math.max(...ys) - r.y - r.h));
    n++; worst = Math.max(worst, d);
    if (d > 1) bad.push(`${it.cls} ${d.toFixed(1)}`);
  }
  // (a) the room's arrangement: the page's planes at this stop against the bake's
  const seen = new Map(), bakedBy = new Map();
  for (const it of scene.items) { const k = it.cls + "#" + (seen.get(it.cls) ?? 0); seen.set(it.cls, (seen.get(it.cls) ?? 0) + 1); bakedBy.set(k, it); }
  seen.clear();
  let aw = 0; const abad = [];
  for (const it of page.units) {
    const k = it.cls + "#" + (seen.get(it.cls) ?? 0); seen.set(it.cls, (seen.get(it.cls) ?? 0) + 1);
    const bk = bakedBy.get(k); if (!bk || bk.type === "tex") continue;
    const bm = bk.states?.[view]?.m ?? bk.m;
    const dm = it.m.map((v, i) => (i >= 12 && i <= 14 ? v / u : v));
    const d = Math.max(...[12, 13, 14].map((i) => Math.abs(dm[i] - bm[i])));
    aw = Math.max(aw, d);
    if (d > 0.5) abad.push(`${it.cls} ${d.toFixed(1)}u`);
  }
  report[view] = { camera: { checked: n, worst: +worst.toFixed(3), over1px: bad.length, bad: bad.slice(0, 6) }, arrangement: { worstU: +aw.toFixed(2), off: abad.length, bad: abad.slice(0, 8) }, arrived: page.arrived, pan: page.pan };
  log(view, JSON.stringify(report[view]));
}
console.log(JSON.stringify(report, null, 1));
b.close();
