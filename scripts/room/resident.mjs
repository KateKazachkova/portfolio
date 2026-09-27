// What the room lets go and paints again (the memory pass, 26.09): the
// binder keeps only its open spread's pictures on the GPU, the wallet's
// discs go away from Off Duty. Checked here, with every frame's length (the
// page's rAF) and the room's own record of what it holds:
//   · the binder turned fast back and forth (no frame > 20 ms, what is on
//     show in at most a preview's time);
//   · turned and left at once (the departure waits for the spread, no hole);
//   · back at a spread let go earlier;
//   · a disc in the player and the wallet at another spread, Off Duty left
//     (its discs go), then back (the same discs, the same spread, the disc
//     still in: the wallet's corner compared at rest before and after).
//
//   node scripts/room/resident.mjs http://localhost:3301 [OUT]   (+NIGHT=1, LAMP=off)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, `Documents/portfolio-offload/webgl-m6/resident${process.env.NIGHT ? "-night" : ""}${process.env.LAMP === "off" ? "-torch" : ""}`);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
if (process.env.NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,23,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D; try{localStorage.setItem('lamp','${process.env.LAMP ?? "on"}')}catch(e){} })()` });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(8000);
await b.ev(`(()=>{window.__dt=[];let l=performance.now();const f=t=>{window.__dt.push([t,t-l]);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()`);
const now = () => b.ev("performance.now()");
const frames = (t0, t1) => b.ev(`JSON.stringify((()=>{const d=window.__dt.filter(([t])=>t>=${t0}&&t<=${t1}).map(x=>x[1]).sort((a,b)=>a-b);return {n:d.length,p95:+(d[Math.floor(d.length*.95)]??0).toFixed(1),max:+(d[d.length-1]??0).toFixed(1),over20:d.filter(x=>x>20).length}})())`).then(JSON.parse);
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(performance.now()):setTimeout(f,5);f()})`, 15000);
const go = async (ev) => { const t = await now(); await b.ev(`dispatchEvent(new Event("${ev}"))`); const a = await arrived(); await sleep(1200); return a - t; };
const key = (k) => b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)} }))`);
const stats = () => b.ev("JSON.stringify(window.__room.stats())").then(JSON.parse);
// the binder's open-spread pictures: in (2), a preview on (lo), or nothing
const binder = () => b.ev(`JSON.stringify((()=>{const t=window.__room.textures().filter(x=>x.kind==='slot'&&/pf-|bud-|desk-paper--tucked/.test(x.src));return {inMB:+(t.filter(x=>x.state===2).reduce((a,x)=>a+x.bytes,0)/1048576).toFixed(1),n:t.filter(x=>x.state===2).length,loading:t.filter(x=>x.state===1).length}})())`).then(JSON.parse);
const res = {};

// 1. fast turns
await go("kate:profile");
let t0 = await now();
for (let i = 0; i < 6; i++) { await key("ArrowRight"); await sleep(120); }
for (let i = 0; i < 6; i++) { await key("ArrowLeft"); await sleep(120); }
for (let i = 0; i < 3; i++) { await key("ArrowRight"); await sleep(60); await key("ArrowLeft"); await sleep(60); }
await sleep(800);
res.fastTurns = { frames: await frames(t0, await now()), binder: await binder() };
// 2. turned and left at once (to a spread whose pictures are not in)
const waits0 = (await stats()).waits;
t0 = await now();
await key("ArrowRight"); await key("ArrowRight"); await key("ArrowRight"); // to spread 4
await sleep(30);
const fly = await go("kate:off-duty");
res.turnLeave = { frames: await frames(t0, await now()), flightMs: Math.round(fly), held: (await stats()).waits - waits0 };
// 3. back to a spread let go earlier (4 was left from; 2 was let go long ago)
t0 = await now();
await go("kate:profile");
await key("ArrowLeft"); await key("ArrowLeft"); await sleep(600);
res.backToLetGo = { frames: await frames(t0, await now()), binder: await binder() };
t0 = await now();
const fly2 = await go("kate:recognition");
res.leaveAfter = { frames: await frames(t0, await now()), flightMs: Math.round(fly2) };

// 4. Off Duty: a disc in, the wallet at spread 2, away and back
await go("kate:off-duty");
const hit = (label) => b.ev(`(()=>{const e=document.querySelector('[data-hit][aria-label$=${JSON.stringify(label)}]');if(!e)return 0;e.focus();return 1})()`);
await hit("put it in the player");
await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await sleep(1800);
await b.ev("document.activeElement?.blur(); 1");
await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await sleep(1500);
const walletState = () => b.ev(`JSON.stringify((()=>{const t=window.__room.textures().filter(x=>x.kind==='other'&&String(x.wh)==='384,384');return {discs:t.length}})())`).then(JSON.parse);
await b.ev("window.__room.redraw()"); await sleep(400);
const shot = async (f) => { await b.shot(path.join(OUT, f)); return path.join(OUT, f); };
const before = await shot("offduty-before.png");
const dBefore = await walletState();
await go("kate:profile");
const dAway = await walletState();
t0 = await now();
const fly3 = await go("kate:off-duty");
const back = { frames: await frames(t0, await now()), flightMs: Math.round(fly3) };
await b.ev("window.__room.redraw()"); await sleep(400);
const after = await shot("offduty-after.png");
const dBack = await walletState();
const diff = execFileSync("python3", ["-c", `
import sys,numpy as np
from PIL import Image
a=np.asarray(Image.open(sys.argv[1]).convert('RGB'),np.float32); b=np.asarray(Image.open(sys.argv[2]).convert('RGB'),np.float32)
x=np.abs(a-b).max(2); print(round(float((x>16).mean()*100),3))`, before, after]).toString().trim();
res.offDuty = { discsBefore: dBefore.discs, discsAway: dAway.discs, discsBack: dBack.discs, back, restOver16pct: +diff };
res.stats = await stats();
delete res.stats.zones;
console.log(JSON.stringify(res, null, 1));
b.close();
