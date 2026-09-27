// The Profile binder's turn and a hung certificate going over (M6 group 7):
// the page's own (legacy, ?gl=0) against WebGL's (?gl=1, which veils its
// flat panel and draws the turn: binderturn.ts), at Profile, 1512 × 860 @2,
// headed, each recorded as a screencast from the key press / click:
//   · → (spread 1 → 2), then ← back, then a tab jump (several leaves);
//   · a certificate turned over, and back;
//   · leaving Profile mid-turn (to Off Duty).
// Per leg: frames at the same times after the start, over16 % legacy vs
// WebGL; flashes by flashes.py on the WebGL run (a frame unlike both its
// neighbours); the panel shown again after (opacity), and the frame then
// against the frame just before (the hand-over: nothing jumps).
//
//   node scripts/room/binder-turn.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/binder-turn");
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const LEGS = [
  { name: "turn-on", act: `dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}))`, ms: 1900 },
  { name: "turn-back", act: `dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft"}))`, ms: 1900 },
  // (a divider tab further on: several leaves go, 80 ms apart)
  { name: "tab-jump", act: `(SEL('[data-tab]:not([data-tab="0"])')||{click(){}}).click()`, ms: 2300 },
  { name: "back-to-1", act: `(SEL('[data-tab="0"]')||{click(){}}).click()`, ms: 2300 },
  // to the spread with a certificate hung, then turn it over and back
  { name: "to-cert", act: `(()=>{const h=SELALL('.pf-hangleaf');const leaf=h.length?h[0].closest('.pf-leaf'):null;const i=leaf?SELALL('.pf-leaf').indexOf(leaf):-1;window.__certAt=i;const at=SELALL('.pf-leaf[data-turned]').length;for(let k=at;k<i+1;k++)dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}))})()`, ms: 2600 },
  { name: "cert-over", act: `SELALL('.pf-leaf')[window.__certAt].querySelector(':scope > .pf-hangleaf [data-hang]').click()`, ms: 1500 },
  { name: "cert-back", act: `SELALL('.pf-leaf')[window.__certAt].querySelector(':scope > .pf-hangleaf [data-hang]').click()`, ms: 1500 },
  { name: "leave-mid-turn", act: `dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}));setTimeout(()=>dispatchEvent(new Event("kate:off-duty")),300)`, ms: 2800 },
];

const run = async (gl) => {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}#profile`, 3000);
  const scope = gl ? ".room-binder" : ".desk-binder";
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const g=${gl}?window.__room&&window.__room.stats().pending===0&&document.querySelector('.room-binder .pf-leaf'):document.querySelector('.desk-binder .pf-leaf');if(g&&document.documentElement.dataset.deskArrived||performance.now()-t0>25000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(2500);
  await b.ev(`window.SEL=(s)=>document.querySelector('${scope} '+s);window.SELALL=(s)=>[...document.querySelectorAll('${scope} '+s)];1`);
  const res = {};
  let frames = [];
  b.handlers.add((m) => {
    if (m.method !== "Page.screencastFrame") return;
    frames.push({ t: m.params.metadata.timestamp * 1000, data: m.params.data });
    b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  });
  await b.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 756, maxHeight: 430, everyNthFrame: 1 });
  await sleep(500);
  for (const leg of LEGS) {
    const dir = path.join(OUT, `${leg.name}-${gl ? "gl" : "css"}`);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    frames = [];
    await sleep(300);
    const t0 = (await b.ev("Date.now === undefined ? 0 : performance.timeOrigin + performance.now()"));
    await b.ev(`${leg.act};1`);
    await sleep(leg.ms);
    const fr = frames.slice();
    fr.forEach((f, i) => fs.writeFileSync(path.join(dir, `f${String(i).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64")));
    fs.writeFileSync(path.join(dir, "frames.json"), JSON.stringify({ frames: fr.map((f, i) => ({ i, t: f.t - t0 })), marks: [] }));
    res[leg.name] = { frames: fr.length, veil: gl ? await b.ev("document.querySelector('.room-hit--pf')?.style.opacity ?? null") : null, desk: await b.ev("document.documentElement.dataset.desk") };
    if (leg.name === "leave-mid-turn") break;
  }
  await b.send("Page.stopScreencast");
  b.close();
  return res;
};

const css = await run(false);
const gl = await run(true);
const PY = `
import sys, json, os
from PIL import Image
import numpy as np
a, g = sys.argv[1], sys.argv[2]
fa = json.load(open(os.path.join(a, 'frames.json')))['frames']; fg = json.load(open(os.path.join(g, 'frames.json')))['frames']
load = lambda d, i: np.asarray(Image.open(os.path.join(d, 'f%05d.jpg' % i)).convert('RGB')).astype(int)
out = {}
for t in [0.1, 0.3, 0.5, 0.8, 1.2, 1.8]:
  ms = t * 1000
  if not fa or not fg or ms > fa[-1]['t']: continue
  ia = min(fa, key=lambda f: abs(f['t'] - ms))['i']; ig = min(fg, key=lambda f: abs(f['t'] - ms))['i']
  A, G = load(a, ia), load(g, ig)
  if A.shape != G.shape: continue
  out[str(t)] = round(float((np.abs(A - G).max(2) > 16).mean() * 100), 1)
# the WebGL run's own steps: frame to frame, the largest (a pop is one far over its neighbours)
steps = []
for i in range(1, len(fg)):
  steps.append(float((np.abs(load(g, fg[i]['i']) - load(g, fg[i-1]['i'])).max(2) > 24).mean() * 100))
pop = 0
for i in range(1, len(steps) - 1):
  near = max(steps[i-1], steps[i+1], 0.5)
  pop = max(pop, steps[i] / near)
print(json.dumps({'vs_page_over16': out, 'max_step': round(max(steps) if steps else 0, 1), 'pop_ratio': round(pop, 2)}))`;
const rep = { css, gl, legs: {} };
for (const leg of LEGS) {
  const a = path.join(OUT, `${leg.name}-css`), g = path.join(OUT, `${leg.name}-gl`);
  if (!fs.existsSync(path.join(g, "frames.json")) || !fs.existsSync(path.join(a, "frames.json"))) continue;
  rep.legs[leg.name] = JSON.parse(execFileSync("python3", ["-c", PY, a, g]).toString());
  try { rep.legs[leg.name].flashes = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "flashes.py"), g]).toString()).flashes; } catch { rep.legs[leg.name].flashes = "n/a"; }
}
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(rep, null, 1));
for (const [k, v] of Object.entries(rep.legs)) log(k.padEnd(16), JSON.stringify(v));
log("css", JSON.stringify(css)); log("gl ", JSON.stringify(gl));
