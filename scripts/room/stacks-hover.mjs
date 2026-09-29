// The award stacks under the pointer while none is in focus (M6 group 6b):
// the page's :hover (postcards a little way out, the card nudged, "In
// progress" over it) — legacy (?gl=0) against WebGL (?gl=1) at Case Files,
// 1512 × 860 @2: over8 % of the desk at rest and over each stack, and how
// much the hover itself changes the frame in each; then the pointer off
// again (back as at rest), and a click on a hovered stack (laid out as ever).
//
//   node scripts/room/stacks-hover.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/stacks-hover");
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const SLUGS = ["bulksource", "onsisoft", "waypro"];
const run = async (gl) => {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}#case-files`, 3000);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const g=${gl}?window.__room&&window.__room.stats().pending===0&&document.querySelector('.room-hit--case:not([hidden])'):true;if(g&&document.documentElement.dataset.deskArrived||performance.now()-t0>25000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(2500);
  const mouse = (x, y) => b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  const el = (s) => gl ? `document.querySelector('.room-hit[data-hit="case-${s}"]')` : `document.querySelector('.desk-card--stack[data-slug="${s}"]')`;
  const res = {};
  await mouse(5, 5); await sleep(600);
  await b.shot(path.join(OUT, `rest-${gl ? "gl" : "css"}.png`));
  const bring = async (s) => {
    // the desk panned (the wheel, as a visitor would) until the stack is well in the frame
    for (let k = 0; k < 30; k++) {
      const cx = await b.ev(`(()=>{const r=${el(s)}.getBoundingClientRect();return r.left+r.width/2})()`);
      if (cx > 520 && cx < 1300) return;
      await b.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 900, y: 500, deltaX: 0, deltaY: cx >= 1300 ? 160 : -160 });
      await sleep(250);
    }
  };
  for (const s of SLUGS) {
    await bring(s); await mouse(5, 5); await sleep(1200);
    await b.shot(path.join(OUT, `rest-${s}-${gl ? "gl" : "css"}.png`));
    // (the stack's middle, a little up: over the card, clear of the others)
    const [x, y] = JSON.parse(await b.ev(`JSON.stringify((()=>{const r=${el(s)}.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height*0.4]})())`));
    await mouse(x, y); await sleep(1100);
    await b.shot(path.join(OUT, `hover-${s}-${gl ? "gl" : "css"}.png`));
    await mouse(5, 5); await sleep(1100);
  }
  await b.shot(path.join(OUT, `after-${gl ? "gl" : "css"}.png`));
  // hovered, then clicked: laid out
  await bring("waypro"); await sleep(800);
  const [x, y] = JSON.parse(await b.ev(`JSON.stringify((()=>{const r=${el("waypro")}.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height*0.4]})())`));
  await mouse(x, y); await sleep(500);
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await sleep(2500);
  res.focus = await b.ev("document.documentElement.dataset.deskFocus ?? null");
  await mouse(5, 5); await sleep(800);
  await b.shot(path.join(OUT, `clicked-${gl ? "gl" : "css"}.png`));
  b.close();
  return res;
};
const css = await run(false), gl = await run(true);
const over8 = (a, c) => +execFileSync("python3", ["-c", `
import sys
from PIL import Image
import numpy as np
A=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int);B=np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(int)
A=A[:, int(A.shape[1]*0.28):]; B=B[:, int(B.shape[1]*0.28):]
print(round(float((np.abs(A-B).max(2)>8).mean()*100),2))`, a, c]).toString();
const p = (n, m) => path.join(OUT, `${n}-${m}.png`);
const rep = { css, gl, parity: {}, hoverEffect: {} };
for (const n of ["rest", ...SLUGS.map((s) => `hover-${s}`), "after", "clicked"]) rep.parity[n] = over8(p(n, "css"), p(n, "gl"));
for (const s of SLUGS) {
  rep.parity[`rest-${s}`] = over8(p(`rest-${s}`, "css"), p(`rest-${s}`, "gl"));
  rep.hoverEffect[s] = { css: over8(p(`rest-${s}`, "css"), p(`hover-${s}`, "css")), gl: over8(p(`rest-${s}`, "gl"), p(`hover-${s}`, "gl")) };
}
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(rep, null, 1));
log(JSON.stringify(rep));
