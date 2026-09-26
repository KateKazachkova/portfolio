// Case Files' award stacks, the CSS room against WebGL's (M6), at rest
// with each case in focus: none; each stack laid out (its card left, its
// postcards fanned right, its things moved, its tags out; the other cases
// aside, 240 either way); Ukrainska 15 open (the stacks 150 aside). Every
// animation finished first (compare.mjs's FREEZE). Reports the share of px
// more than 8 / 32 apart over the desk's row of cases.
//
//   node scripts/room/stacks-gl.mjs http://localhost:3301 [OUTDIR]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m6/stacks-gl");
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(2026,8,23,10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const FREEZE = `(()=>{document.querySelectorAll('video').forEach(v=>{v.pause()});document.getAnimations().forEach(a=>{try{const t=a.effect&&a.effect.getComputedTiming();if(t&&Number.isFinite(t.endTime))a.finish();else a.pause()}catch(e){}}); return 1})()`;
const FOCI = [null, "bulksource", "onsisoft", "waypro", "ukrainska-15"];

const run = async (gl) => {
  const shots = {};
  for (const f of FOCI) {
    const b = await launch({ width: 1512, height: 860, dpr: 2 });
    await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
    await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}#case-files`, 4000);
    await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const ok=[...document.images].every(i=>i.complete);const g=${gl}?document.documentElement.dataset.glReady&&window.__room&&window.__room.stats().pending===0:true;if(ok&&g&&document.documentElement.dataset.deskArrived||performance.now()-t0>20000)r(1);else setTimeout(f,200)};f()})`, 30000);
    await sleep(2000);
    if (f) {
      const sel = f === "ukrainska-15" ? (gl ? ".room-hit--u15panel .u15-hit" : ".desk-world .u15-hit") : (gl ? `.room-hit[data-hit="case-${f}"]` : `.desk-card[data-slug="${f}"]`);
      await b.ev(`document.querySelector('${sel}').click()`);
      await sleep(3500);
    }
    await b.ev(FREEZE); await sleep(300);
    if (gl) { await b.ev("window.__room.redraw()"); await sleep(300); }
    const file = path.join(OUT, `${f ?? "none"}-${gl ? "gl" : "css"}.png`);
    await b.shot(file);
    shots[f ?? "none"] = { file, pan: await b.ev("+getComputedStyle(document.querySelector('.scene-cam')).getPropertyValue('--pan')"), focus: await b.ev("document.documentElement.dataset.deskFocus ?? null") };
    b.close();
  }
  return shots;
};
const css = await run(false), gl = await run(true);
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
a=json.loads(sys.argv[1]); b=json.loads(sys.argv[2]); out={}
for k in a:
  A=np.asarray(Image.open(a[k]['file']).convert('RGB'),np.float32); B=np.asarray(Image.open(b[k]['file']).convert('RGB'),np.float32)
  # the desk under the index column's paper and to the right (css px 1512 × 860, @2)
  d=np.abs(A-B).max(2)[0:1720, 700:3024]
  out[k]={'over8':round(float((d>8).mean()*100),2),'over32':round(float((d>32).mean()*100),2),'pan':[a[k]['pan'],b[k]['pan']],'focus':[a[k]['focus'],b[k]['focus']]}
  Image.fromarray(np.clip(np.abs(A-B).max(2)*4,0,255).astype('uint8')).save(a[k]['file'].replace('-css.png','-diff.png'))
print(json.dumps(out))
`, JSON.stringify(css), JSON.stringify(gl)]).toString());
for (const [k, v] of Object.entries(res)) log(k.padEnd(13), `over8 ${v.over8}% over32 ${v.over32}%  pan ${v.pan.map((x) => x.toFixed(0)).join("/")} focus ${v.focus.join("/")}`);
console.log(JSON.stringify(res));
