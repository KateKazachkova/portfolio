// Screenshots of the legacy CSS room and the WebGL room (?gl=1) at every
// stop, and how far apart they are (scripts/room/diff.py): the share of
// pixels that differ, and the largest local shift between the two.
// Also the swap at home: the page's own case, clock and lamp against
// WebGL's mirror of them (what the eye sees the moment the camera leaves).
//
//   node scripts/room/compare.mjs http://localhost:3301 OUTDIR [WxH] [dpr] [--night]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m1/compare");
const [W, H] = (process.argv[4] ?? "1600x1000").split("x").map(Number);
const DPR = +(process.argv[5] ?? 1);
const NIGHT = process.argv.includes("--night");
fs.mkdirSync(OUT, { recursive: true });
// the same minute of the same day for both: a Wednesday morning (or 23:30)
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),${NIGHT ? "23,30" : "10,30"}).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const STOPS = [["home", ""], ["files", "#case-files"], ["award", "#recognition"], ["profile", "#profile"], ["offduty", "#off-duty"]];
// what moves on its own is stopped, so both shots see the same instant
const FREEZE = `(()=>{document.querySelectorAll('video').forEach(v=>{v.pause();v.currentTime=Math.min(v.duration||0,1)}); document.getAnimations().forEach(a=>{try{const t=a.effect&&a.effect.getComputedTiming();if(t&&Number.isFinite(t.endTime))a.finish();else a.pause()}catch(e){}}); return 1})()`;

const shoot = async (gl, view, hash) => {
  const b = await launch({ width: W, height: H, dpr: DPR });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}${hash}`, 4000);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const im=[...document.images];const ok=im.every(i=>i.complete);const g=${gl}?document.documentElement.dataset.glReady&&window.__room&&window.__room.stats().pending===0:true;if(ok&&g||performance.now()-t0>20000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(3500);
  await b.ev(FREEZE);
  await sleep(400);
  if (gl) { await b.ev("window.__room.redraw()"); await sleep(300); }
  const f = path.join(OUT, `${view}-${gl ? "gl" : "css"}.png`);
  await b.shot(f);
  let f2 = null;
  if (gl && view === "home") {
    // the case, the clock and the lamp as WebGL draws them, the DOM hidden
    await b.ev("window.__room.forceGroups(true)");
    await sleep(600);
    f2 = path.join(OUT, `home-glgroups.png`);
    await b.shot(f2);
  }
  const errs = b.console.filter((l) => /error|EXC/i.test(l));
  b.close();
  return { f, f2, errs };
};

const results = {};
for (const [view, hash] of STOPS) {
  const css = await shoot(false, view, hash);
  const gl = await shoot(true, view, hash);
  const d = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "diff.py"), css.f, gl.f, path.join(OUT, `${view}-diff.png`)]).toString());
  results[view] = { ...d, errors: gl.errs.slice(0, 3) };
  if (gl.f2) results.swap = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "diff.py"), gl.f, gl.f2, path.join(OUT, `swap-diff.png`)]).toString());
  log(view, JSON.stringify(results[view]));
}
log("swap", JSON.stringify(results.swap));
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
