// Off Duty's things (M6 group 6): the page's own (legacy, ?gl=0) against
// WebGL's (?gl=1) at Off Duty, 1512 × 860 @2, headed —
//   · states: at rest; the pointer over a book, a lying tape, a standing
//     tape, a comic if any; each of a book, a lying tape, a standing tape,
//     the omnibus taken out (1.8 s later): over8 % of the corner, legacy vs
//     WebGL (≈ at rest = the thing lies where the page has it);
//   · the page's rules: another taken out puts the first back; Escape puts
//     it back; the camera leaving puts it back (WebGL: the thing's planes
//     every frame — no jump over 8 u between frames, back at rest);
//   · the keyboard: Tab reaches the things, Enter takes one out.
//
//   node scripts/room/od-gl.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/od-gl");
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
// [kind, index] of what is tried: a book, a lying tape, a standing tape, the omnibus
const THINGS = [["book", 0], ["book", 4], ["tape", 3], ["tape", 12], ["omnibus", 0]];
const SEL = { book: ".bs-book", tape: ".vt-tape", comic: ".bs-comic", omnibus: ".od-comic" };
const legacy = (k, n) => `document.querySelectorAll('.desk-world ${SEL[k]}')[${n}]`;
const control = (k, n) => `document.querySelector('.room-hit--od-${k}[data-hit="od-${k}-${n}"]')`;
const key = (e) => ({ type: "keyDown", key: e, code: e, windowsVirtualKeyCode: e === "Escape" ? 27 : e === "Tab" ? 9 : 13, ...(e === "Enter" ? { text: "\r" } : {}) });

const run = async (gl) => {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}`, 2500);
  await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const g=${gl}?window.__room&&window.__room.stats().pending===0&&document.querySelector('.room-hit--od-book:not([hidden])'):document.querySelector('.desk-world .bs-book');if(g&&document.documentElement.dataset.deskArrived||performance.now()-t0>25000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(2500);
  const el = gl ? control : legacy;
  const mouse = (x, y) => b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  const press = async (e) => { await b.send("Input.dispatchKeyEvent", key(e)); const { text, ...up } = key(e); void text; await b.send("Input.dispatchKeyEvent", { ...up, type: "keyUp" }); };
  const mid = async (k, n) => JSON.parse(await b.ev(`JSON.stringify((()=>{const r=${el(k, n)}.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})())`));
  const res = {};
  await mouse(5, 5); await sleep(500);
  await b.shot(path.join(OUT, `rest-${gl ? "gl" : "css"}.png`));
  for (const [k, n] of [["book", 0], ["tape", 3], ["tape", 12]]) {
    const [x, y] = await mid(k, n);
    await mouse(x, y); await sleep(900);
    await b.shot(path.join(OUT, `hover-${k}${n}-${gl ? "gl" : "css"}.png`));
    await mouse(5, 5); await sleep(900);
  }
  for (const [k, n] of THINGS) {
    await b.ev(`${el(k, n)}.click() || 1`); await sleep(1900);
    res[`open-${k}${n}`] = await b.ev(`${legacy(k, n).replace(".desk-world", gl ? ".room-od" : ".desk-world")}.hasAttribute('data-open')`);
    await b.shot(path.join(OUT, `open-${k}${n}-${gl ? "gl" : "css"}.png`));
    await b.ev(`${el(k, n)}.click() || 1`); await sleep(1600);
  }
  const lg = (k, n) => legacy(k, n).replace(".desk-world", gl ? ".room-od" : ".desk-world");
  // one at a time: book 0 out, then tape 3 — the book goes back
  await b.ev(`${el("book", 0)}.click() || 1`); await sleep(1500);
  await b.ev(`${el("tape", 3)}.click() || 1`); await sleep(1500);
  res.oneAtATime = { book: await b.ev(`${lg("book", 0)}.hasAttribute('data-open')`), tape: await b.ev(`${lg("tape", 3)}.hasAttribute('data-open')`) };
  await press("Escape"); await sleep(1500);
  res.escape = { tape: await b.ev(`${lg("tape", 3)}.hasAttribute('data-open')`), desk: await b.ev("document.documentElement.dataset.desk"), live: gl ? await b.ev("JSON.stringify(window.__room.stats().od)") : null };
  // the keyboard: Tab to a thing, Enter
  if (gl) {
    await b.ev("document.activeElement&&document.activeElement.blur(); 1");
    let k = 0; for (; k < 80 && !(await b.ev("!!document.activeElement?.className?.includes?.('room-hit--od-')")); k++) await press("Tab");
    const at = await b.ev("document.activeElement.dataset.hit");
    await press("Enter"); await sleep(1600);
    res.keyboard = { tabs: k, at, open: await b.ev("JSON.stringify(window.__room.stats().od)") };
    await press("Escape"); await sleep(1600);
  }
  // leaving with one out: book 4 out, then to Case Files; its planes each frame
  await b.ev(`${el("book", 4)}.click() || 1`); await sleep(1900);
  if (gl) await b.ev(`window.__trk=[];const ms=window.__room.odMeshes("book-4");(function f(){window.__trk.push(ms.map(x=>[x.matrix.elements[12],x.matrix.elements[13],x.matrix.elements[14]]));if(window.__trk.length<300)requestAnimationFrame(f)})();1`);
  await b.ev(`dispatchEvent(new Event("kate:case-files"))`); await sleep(3200);
  res.leave = { open: await b.ev(`${lg("book", 4)}.hasAttribute('data-open')`), desk: await b.ev("document.documentElement.dataset.desk") };
  if (gl) {
    const trk = JSON.parse(await b.ev("JSON.stringify(window.__trk)"));
    res.leave.frames = trk.length;
    let jump = 0; for (let i = 1; i < trk.length; i++) trk[i].forEach((p, j) => { jump = Math.max(jump, Math.hypot(p[0] - trk[i - 1][j][0], p[1] - trk[i - 1][j][1], p[2] - trk[i - 1][j][2])); });
    res.leave.maxJumpU = +jump.toFixed(2);
    // a pop is a step far over its neighbours' (the slide itself peaks near 23 u a frame)
    let pop = 0; for (let i = 2; i < trk.length - 1; i++) { const st = (a, c) => Math.max(...trk[a].map((p, j) => Math.hypot(p[0] - trk[c][j][0], p[1] - trk[c][j][1], p[2] - trk[c][j][2]))); const here = st(i, i - 1), near = Math.max(st(i - 1, i - 2), st(i + 1, i), 1); pop = Math.max(pop, here / near); }
    res.leave.popRatio = +pop.toFixed(2);
    res.leave.backAtRest = await b.ev(`(()=>{const s=window.__room.odMeshes("book-4");return s.length>0})()`);
    res.leave.od = await b.ev("JSON.stringify(window.__room.stats().od)");
  }
  b.close();
  return res;
};

const css = await run(false);
const gl = await run(true);
const over8 = (a, c) => +execFileSync("python3", ["-c", `
import sys
from PIL import Image
import numpy as np
A=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int);B=np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(int)
# the corner: right of the index column
A=A[:, int(A.shape[1]*0.28):]; B=B[:, int(B.shape[1]*0.28):]
print(round(float((np.abs(A-B).max(2)>8).mean()*100),2))`, a, c]).toString();
const rep = { css, gl, over8: {} };
const shots = fs.readdirSync(OUT).filter((f) => f.endsWith("-css.png")).map((f) => f.replace(/-css\.png$/, ""));
for (const s of shots) if (fs.existsSync(path.join(OUT, `${s}-gl.png`))) rep.over8[s] = over8(path.join(OUT, `${s}-css.png`), path.join(OUT, `${s}-gl.png`));
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(rep, null, 1));
log("over8", JSON.stringify(rep.over8));
log("css", JSON.stringify(css));
log("gl ", JSON.stringify(gl));
