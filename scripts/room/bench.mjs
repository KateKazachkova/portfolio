// Frame timing of the camera's flights, on the real GPU (headed Chrome):
// the WebGL room (?gl=1) or the legacy CSS room (?gl=0), at a pixel ratio.
//
//   node scripts/room/bench.mjs http://localhost:3301 gl|css [dpr] [WxH] [--cold]
//
// Records every animation frame's interval in the page (rAF), the long
// animation frames the browser reports, and summarises each flight: frames,
// mean, p95, max, how many over 20 and 33 ms.
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const MODE = process.argv[3] ?? "gl";
const DPR = +(process.argv[4] ?? 2);
const [W, H] = (process.argv[5] ?? "1512x860").split("x").map(Number);
const OUT = path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m1/bench");
fs.mkdirSync(OUT, { recursive: true });

const b = await launch({ headed: true, width: W, height: H, dpr: DPR });
await b.go(`${SITE}/?nointro&gl=${MODE === "gl" ? 1 : 0}`, 3000);
// ready: every picture in, and the room's textures on the GPU
const t0 = Date.now();
await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const ok=[...document.images].every(i=>i.complete);const g=${MODE === "gl"}?(window.__room&&window.__room.stats().pending===0):true;if(ok&&g||performance.now()-t0>30000)r(1);else setTimeout(f,100)};f()})`, 40000);
log("ready in", Date.now() - t0, "ms");
await sleep(2500);
const info = MODE === "gl" ? await b.ev("JSON.stringify(window.__room.stats())") : "{}";
log("room", info);

// the frame recorder
await b.ev(`(()=>{window.__ft=[];window.__loaf=[];let l=performance.now();const f=(t)=>{window.__ft.push([t,t-l]);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);
  try{new PerformanceObserver(li=>{for(const e of li.getEntries())window.__loaf.push([e.startTime,e.duration,e.blockingDuration])}).observe({type:'long-animation-frame',buffered:false})}catch(e){}
  return 1})()`);

const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };
const go = (v) => b.ev(v === "home" ? `history.back()` : v === "bike" ? `document.documentElement.dataset.deskFocus='bike'` : v === "unbike" ? `delete document.documentElement.dataset.deskFocus` : `dispatchEvent(new Event("${EV[v]}"))`);
const flights = [];
const flight = async (name, act, ms = 2900) => {
  await b.ev("window.__ft.length=0; window.__loaf.length=0");
  const start = await b.ev("performance.now()");
  await act();
  await sleep(ms);
  const ft = JSON.parse(await b.ev("JSON.stringify(window.__ft)")).map((x) => x[1]).slice(1);
  const loaf = JSON.parse(await b.ev("JSON.stringify(window.__loaf)"));
  const s = [...ft].sort((x, y) => x - y);
  const r = { name, frames: ft.length, mean: +(ft.reduce((a, x) => a + x, 0) / ft.length).toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), p99: +s[Math.floor(s.length * 0.99)].toFixed(2), max: +s[s.length - 1].toFixed(2), over20: ft.filter((x) => x > 20).length, over33: ft.filter((x) => x > 33).length, loaf: loaf.length, loafMax: +Math.max(0, ...loaf.map((l) => l[1])).toFixed(1) };
  flights.push(r);
  log(name.padEnd(22), JSON.stringify(r));
  void start;
};

// the tour: every leg, twice, then quick changes of mind
for (let pass = 0; pass < 2; pass++) {
  await flight(`home→files #${pass}`, () => go("files"));
  await flight(`files→award #${pass}`, () => go("award"));
  await flight(`award→profile #${pass}`, () => go("profile"));
  await flight(`profile→offduty #${pass}`, () => go("offduty"));
  await flight(`offduty→bike #${pass}`, () => go("bike"), 1900);
  await flight(`bike→offduty #${pass}`, () => go("unbike"), 1900);
  await flight(`offduty→profile #${pass}`, () => go("profile"));
  await flight(`profile→home #${pass}`, () => go("home"), 3200);
}
// changes of mind: a new stop 0.6 s into a flight, twice over
await flight("quick files→award→offduty", async () => { await go("files"); await sleep(600); await go("award"); await sleep(600); await go("offduty"); }, 4200);
await flight("quick offduty→profile→files", async () => { await go("profile"); await sleep(500); await go("files"); }, 3600);
await flight("quick files→home→award", async () => { await go("home"); await sleep(700); await go("award"); }, 3800);
await flight("back home", () => go("home"), 3200);
// the pan along the desk
await go("files"); await sleep(3000);
await flight("pan along the desk", async () => { for (let i = 0; i < 10; i++) { await b.ev(`dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}))`); await sleep(120); } }, 2500);

const all = flights.filter((f) => !f.name.startsWith("pan"));
const sum = { mode: MODE, dpr: DPR, size: `${W}x${H}`, room: JSON.parse(info || "{}"), worstP95: Math.max(...all.map((f) => f.p95)), worstMax: Math.max(...all.map((f) => f.max)), over33: all.reduce((a, f) => a + f.over33, 0), flights };
const file = path.join(OUT, `bench-${MODE}-pr${DPR}-${W}x${H}-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}.json`);
fs.writeFileSync(file, JSON.stringify(sum, null, 1));
log("worst p95", sum.worstP95, "worst max", sum.worstMax, ">33ms", sum.over33, "→", file);
b.close();
