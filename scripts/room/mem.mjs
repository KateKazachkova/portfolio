// The room's GPU memory over a full session (M6 memory pass): every stop,
// every case in focus and Ukrainska 15 open, every binder spread and a hung
// certificate turned over, every wallet spread, a disc in the player, the
// bike — and after each step what the room holds (window.__room.textures():
// its slots, the mirrored groups, canvases), so the peak, what each state
// brings in and what nothing shows any more can be read off one run.
//
//   node scripts/room/mem.mjs http://localhost:3301 [OUT.json]
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m6/mem/session.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.go(`${SITE}/?nointro&gl=1`, 0);
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(1):setTimeout(f,20);f()})`, 15000);
const settled = () => b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>window.__room&&window.__room.stats().pending===0||performance.now()-t0>15000?r(1):setTimeout(f,100);f()})`, 20000);
const key = async (k, n = 1, wait = 1400) => { for (let i = 0; i < n; i++) { await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: k === "ArrowRight" ? 39 : 37 }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: k === "ArrowRight" ? 39 : 37 }); await sleep(wait); } };
const winKey = async (k, n = 1) => { for (let i = 0; i < n; i++) { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)} }))`); await sleep(1400); } };
const click = (sel) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 0;e.click();return 1})()`);
const go = async (ev) => { await b.ev(`dispatchEvent(new Event("${ev}"))`); await arrived(); await sleep(1200); };
const steps = [];
const snap = async (name) => {
  await settled(); await sleep(300);
  const t = JSON.parse(await b.ev("JSON.stringify(window.__room.textures())"));
  const s = JSON.parse(await b.ev("JSON.stringify(window.__room.stats())"));
  steps.push({ name, t: Date.now(), textures: t, roomMB: s.roomMB, groupMB: s.groupMB });
  const other = t.filter((x) => x.kind === "other").reduce((a, x) => a + x.bytes, 0) / 2 ** 20;
  log(name.padEnd(28), "room", s.roomMB, "groups", s.groupMB, "other", other.toFixed(1), "total", (s.roomMB + s.groupMB + other).toFixed(1));
};

await sleep(3000);
await snap("home (loaded)");
await sleep(12000);
await snap("home (idle: all zones)");
await go("kate:case-files");
await snap("files");
for (const f of ["bulksource", "onsisoft", "waypro"]) { await click(`.room-hit[data-hit="case-${f}"]`); await sleep(2500); await snap(`files:${f}`); }
await click(".room-hit--u15panel .u15-hit"); await sleep(3000); await snap("files: U15 open");
await click(".room-hit--u15panel .u15-hit"); await sleep(2500);
await go("kate:recognition");
await snap("award");
await go("kate:profile");
await snap("profile pf1");
for (let k = 2; k <= 7; k++) { await winKey("ArrowRight"); await snap(`profile pf${k}`); }
// a hung certificate turned over, where the spread has one
await b.ev("(()=>{const e=[...document.querySelectorAll('.room-binder [data-hang][role=button]')].find(x=>x.getBoundingClientRect().width>0);e&&e.click();return 1})()"); await sleep(1500);
await snap("profile: certificate over");
await winKey("ArrowLeft", 6);
await snap("profile back at pf1");
await go("kate:off-duty");
await snap("offduty");
for (let k = 1; k <= 6; k++) { await key("ArrowRight"); await snap(`offduty wallet ${k}`); }
await key("ArrowLeft", 6, 700);
await b.ev(`(()=>{const e=document.querySelector('[data-hit][aria-label$="put it in the player"]');e&&e.focus();return 1})()`);
await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await sleep(2500);
await snap("offduty: disc in");
await click('.room-hit[data-hit="bike"]'); await sleep(2500);
await snap("bike");
// home: Escape takes the camera back from any stop
for (let i = 0; i < 3; i++) { await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(3500); }
await snap("home again");
fs.writeFileSync(OUT, JSON.stringify(steps));
log("→", OUT);
b.close();
