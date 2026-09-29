// The award ribbons' tilt (M6 group 5): the page's own (legacy, ?gl=0)
// against WebGL's (?gl=1) at Recognition —
//   · at rest and with the pointer over a ribbon (three of them): the
//     ribbon's crop, over8 % legacy vs WebGL (hovered ≈ at rest = the tilt
//     matches; the label under it is DOM in both);
//   · the keyboard: Tab to the first ribbon turns it (WebGL: __room.stats()
//     .ribbons), Tab on turns the next and lets the first back;
//   · leaving mid-tilt: the pointer over a ribbon, 150 ms later Escape sends
//     the camera home — the ribbon's angle every frame (legacy: its computed
//     transform; WebGL: its plane's matrix), no jump over 1°, back at 0.
//
//   node scripts/room/ribbons-gl.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/ribbons-gl");
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()`;
const RIBS = [0, 20, 36];
const sel = (gl, n) => (gl ? `document.querySelector('.room-hit--ribbon[data-hit="ribbon-${n}"]')` : `document.querySelectorAll('.award-ribbon')[${n}]`);
// the ribbon's angle now, in degrees
const ANGLE = (gl, n) => gl
  ? `(()=>{const x0=window.__ribX[${n}];let best=null,d=1e9;for(const m of window.__room.scene.children){if(!m.isMesh||!m.visible||m.renderOrder<100||m.renderOrder>=200)continue;const e=m.matrix.elements;const dd=Math.hypot(e[12]-x0[0],e[13]-x0[1]);if(dd<d){d=dd;best=e}}return best?Math.atan2(best[1],best[0])*180/Math.PI:null})()`
  : `(()=>{const t=getComputedStyle(${sel(false, n)}).transform;if(t==='none')return 0;const m=new DOMMatrix(t);return Math.atan2(m.b,m.a)*180/Math.PI})()`;

const run = async (gl) => {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}#recognition`, 3000);
  await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const g=${gl}?document.documentElement.dataset.glReady&&window.__room&&window.__room.stats().pending===0&&document.querySelector('.room-hit--ribbon:not([hidden])'):true;if(g&&document.documentElement.dataset.deskArrived||performance.now()-t0>25000)r(1);else setTimeout(f,200)};f()})`, 30000);
  await sleep(2500);
  const mouse = (x, y) => b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  const res = { crops: {}, angles: {} };
  const rectOf = async (n) => JSON.parse(await b.ev(`JSON.stringify((()=>{const r=${sel(gl, n)}.getBoundingClientRect();return [r.left,r.top,r.width,r.height]})())`));
  await mouse(5, 5); await sleep(400);
  await b.shot(path.join(OUT, `rest-${gl ? "gl" : "css"}.png`));
  for (const n of RIBS) {
    const [x, y, w, h] = await rectOf(n);
    res.crops[n] = [x, y, w, h];
    await mouse(x + w / 2, y + h * 0.5); await sleep(800);
    await b.shot(path.join(OUT, `hover${n}-${gl ? "gl" : "css"}.png`));
    if (gl) res[`tilted${n}`] = await b.ev("JSON.stringify(window.__room.stats().ribbons)");
    await mouse(5, 5); await sleep(600);
  }
  // the keyboard: to the first ribbon, then the next
  await b.ev("document.activeElement&&document.activeElement.blur(); 1");
  const tab = async () => { await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await sleep(120); };
  const isRib = gl ? `document.activeElement?.classList.contains('room-hit--ribbon')` : `document.activeElement?.classList.contains('award-ribbon')`;
  let k = 0; for (; k < 60 && !(await b.ev(isRib)); k++) await tab();
  await sleep(700);
  const first = await b.ev(gl ? `document.activeElement.dataset.hit` : `[...document.querySelectorAll('.award-ribbon')].indexOf(document.activeElement)`);
  res.key1 = { tabs: k, first, fv: await b.ev("document.activeElement.matches(':focus-visible')"), tilted: gl ? await b.ev("JSON.stringify(window.__room.stats().ribbons)") : await b.ev(ANGLE(false, 0)) };
  await b.shot(path.join(OUT, `focus-${gl ? "gl" : "css"}.png`));
  await tab(); await sleep(700);
  res.key2 = { at: await b.ev(gl ? `document.activeElement.dataset.hit` : `[...document.querySelectorAll('.award-ribbon')].indexOf(document.activeElement)`), tilted: gl ? await b.ev("JSON.stringify(window.__room.stats().ribbons)") : null };
  await b.ev("document.activeElement&&document.activeElement.blur(); 1"); await sleep(600);
  // leaving mid-tilt: over ribbon 20, then home 150 ms later
  const n = 20;
  if (gl) {
    await b.ev(`(()=>{let best=null,d=1e9;const R=window.__room,cam=R.camera,cv=R.renderer.domElement.getBoundingClientRect();const r=${sel(true, n)}.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height*0.4;
      for(const m of R.scene.children){if(!m.isMesh||!m.visible||m.renderOrder<100||m.renderOrder>=200)continue;const v=m.position.clone().setFromMatrixPosition(m.matrix).applyMatrix4(cam.matrixWorldInverse).applyMatrix4(cam.projectionMatrix);const sx=cv.left+(v.x+1)/2*cv.width,sy=cv.top+(1-v.y)/2*cv.height;const dd=Math.hypot(sx-cx,sy-cy);if(dd<d){d=dd;best=m}}
      window.__ribX={${n}:[best.matrix.elements[12],best.matrix.elements[13]]};return d})()`);
  }
  const [x, y, w, h] = await rectOf(n);
  await b.ev(`window.__ang=[];(function f(){window.__ang.push([performance.now(),${ANGLE(gl, n)}]);if(window.__ang.length<200)requestAnimationFrame(f)})();1`);
  await mouse(x + w / 2, y + h / 2);
  await sleep(150);
  await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(2600);
  const ang = await b.ev("JSON.stringify(window.__ang)").then(JSON.parse);
  const vals = ang.map((a) => a[1]).filter((v) => v !== null);
  let jump = 0; for (let i = 1; i < vals.length; i++) jump = Math.max(jump, Math.abs(vals[i] - vals[i - 1]));
  res.leave = { frames: vals.length, peak: Math.min(...vals).toFixed(2), last: vals.at(-1)?.toFixed(2), jump: jump.toFixed(2), desk: await b.ev("document.documentElement.dataset.desk") };
  fs.writeFileSync(path.join(OUT, `angles-${gl ? "gl" : "css"}.json`), JSON.stringify(ang));
  b.close();
  return res;
};

const css = await run(false);
const gl = await run(true);
// the crops: legacy against WebGL, at rest and hovered
const over8 = (a, b, box) => +execFileSync("python3", ["-c", `
import sys
from PIL import Image
import numpy as np
x,y,w,h=[float(v) for v in sys.argv[3].split(',')]
box=(int((x-30)*2),int((y-30)*2),int((x+w+30)*2),int((y+h+60)*2))
A=np.asarray(Image.open(sys.argv[1]).convert('RGB').crop(box)).astype(int);B=np.asarray(Image.open(sys.argv[2]).convert('RGB').crop(box)).astype(int)
print(round(float((np.abs(A-B).max(2)>8).mean()*100),2))`, a, b, box.join(",")]).toString();
const rep = { css, gl, crops: {} };
for (const n of RIBS) rep.crops[n] = {
  rest: over8(path.join(OUT, "rest-css.png"), path.join(OUT, "rest-gl.png"), gl.crops[n]),
  hover: over8(path.join(OUT, `hover${n}-css.png`), path.join(OUT, `hover${n}-gl.png`), gl.crops[n]),
  // how much the tilt itself changes the crop (legacy)
  tilt: over8(path.join(OUT, "rest-css.png"), path.join(OUT, `hover${n}-css.png`), gl.crops[n]),
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(rep, null, 1));
log(JSON.stringify(rep.crops));
log("css", JSON.stringify({ key1: css.key1, key2: css.key2, leave: css.leave }));
log("gl ", JSON.stringify({ tilted: RIBS.map((n) => gl[`tilted${n}`]), key1: gl.key1, key2: gl.key2, leave: gl.leave }));
