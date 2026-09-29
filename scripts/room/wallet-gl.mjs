// Off Duty's wallet and player, the page's CSS room against WebGL's (M6),
// after the same moves in each: as it opens; Star City put in the player
// (Enter on it, the flight over); the next spread (→); back (←). Every
// animation is finished before each shot, as compare.mjs does. Reports,
// per state, the share of px more than 8 / 32 apart in the wallet and on
// the player (its screen left out: the clip is YouTube's own player).
//
//   node scripts/room/wallet-gl.mjs http://localhost:3301 [OUTDIR] [WxH] [dpr]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/wallet-gl");
const [W, H] = (process.argv[4] ?? "1512x860").split("x").map(Number);
const DPR = +(process.argv[5] ?? 2);
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const FREEZE = `(()=>{document.getAnimations().forEach(a=>{try{const t=a.effect&&a.effect.getComputedTiming();if(t&&Number.isFinite(t.endTime))a.finish();else a.pause()}catch(e){}}); return 1})()`;
const STEPS = [
  ["open", null],
  ["star-city", "pick"],
  ["next", "ArrowRight"],
  ["back", "ArrowLeft"],
];

const run = async (gl) => {
  const b = await launch({ width: W, height: H, dpr: DPR });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}#off-duty`, 4000);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const ok=[...document.images].every(i=>i.complete);const g=${gl}?document.documentElement.dataset.glReady&&window.__room&&window.__room.stats().pending===0:true;if(ok&&g&&document.documentElement.dataset.deskArrived||performance.now()-t0>20000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(3000);
  // the screen's box (left out), from the page's own layout
  const screen = gl ? null : await b.ev(`JSON.stringify(document.querySelector('.od-dvd__screen').getBoundingClientRect())`).then(JSON.parse);
  const shots = {};
  for (const [name, act] of STEPS) {
    if (act === "pick") {
      const sel = gl ? `[data-hit][aria-label="Star City – put it in the player"]` : `.od-disc[aria-label="Star City – put it in the player"]`;
      await b.ev(`document.querySelector('${sel}').focus()`);
      await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
      await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await sleep(1600);
      // (the focus ring off the next disc: the page draws it, WebGL does not)
      await b.ev("document.activeElement?.blur(); 1");
    } else if (act) {
      const code = act;
      await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: code, code, windowsVirtualKeyCode: code === "ArrowRight" ? 39 : 37 });
      await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: code, code, windowsVirtualKeyCode: code === "ArrowRight" ? 39 : 37 });
      await sleep(1200);
    }
    await b.ev(FREEZE);
    await sleep(300);
    if (gl) { await b.ev("window.__room.redraw()"); await sleep(300); }
    const f = path.join(OUT, `${name}-${gl ? "gl" : "css"}.png`);
    await b.shot(f);
    shots[name] = f;
  }
  b.close();
  return { shots, screen };
};

const css = await run(false);
const gl = await run(true);
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
a=json.loads(sys.argv[1]); b=json.loads(sys.argv[2]); scr=json.loads(sys.argv[3]); dpr=float(sys.argv[4])
out={}
for k in a:
  A=np.asarray(Image.open(a[k]).convert('RGB'),np.float32); B=np.asarray(Image.open(b[k]).convert('RGB'),np.float32)
  d=np.abs(A-B).max(2)
  s=lambda v:int(round(v*dpr))
  # the wallet, and the player (its screen masked), css px of 1512 × 860
  wal=d[s(270):s(680),s(400):s(870)]
  m=np.ones(d.shape,bool); m[s(scr['top']):s(scr['bottom']),s(scr['left']):s(scr['right'])]=False
  pl=d[s(330):s(660),s(840):s(1150)][m[s(330):s(660),s(840):s(1150)]]
  out[k]={'wallet':[round(float((wal>8).mean()*100),2),round(float((wal>32).mean()*100),2)],'player':[round(float((pl>8).mean()*100),2),round(float((pl>32).mean()*100),2)]}
  Image.fromarray(np.clip(d*4,0,255).astype('uint8')).save(a[k].replace('-css.png','-diff.png'))
print(json.dumps(out))
`, JSON.stringify(css.shots), JSON.stringify(gl.shots), JSON.stringify(css.screen), String(DPR)]).toString());
for (const [k, v] of Object.entries(res)) log(k.padEnd(10), `wallet over8 ${v.wallet[0]}% over32 ${v.wallet[1]}% · player over8 ${v.player[0]}% over32 ${v.player[1]}%`);
console.log(JSON.stringify(res));
