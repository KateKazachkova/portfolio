// The night in flight (M5): the same moments of the same flights in the
// legacy CSS room and in the WebGL room at 23:30, side by side, and what DOM
// is still drawn over the room while the camera travels (none should be).
//
//   node scripts/room/night-flight.mjs http://localhost:3301 [lamp=on|off]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const LAMP = (process.argv[3] ?? "lamp=on").split("=")[1];
const OUT = path.join(TESTS, `webgl-m5/night-flight-lamp-${LAMP}`);
fs.mkdirSync(OUT, { recursive: true });
const FIX = `(()=>{const O=Date, off=new O(2026,8,23,23,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D; try{localStorage.setItem('lamp','${LAMP}')}catch(e){} })()`;
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 1 });
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: FIX });
await b.send("Emulation.setFocusEmulationEnabled", { enabled: true });
const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };
const LEGS = [["home", "award"], ["award", "offduty"], ["offduty", "home"], ["home", "profile"], ["profile", "files"], ["files", "home"]];
const AT = [300, 900, 1500];
// the page's own layers over the room, and anything else fixed over it
const DOMOVER = `JSON.stringify([...document.querySelectorAll('.night-room, .night-cam')].map(e=>[e.className.baseVal??e.className, getComputedStyle(e).opacity]))`;
const res = [];
for (const gl of [0, 1]) {
  await b.go(`${SITE}/?nointro&gl=${gl}`, 2000);
  if (gl) for (let i = 0; i < 60 && !(await b.ev("!!document.documentElement.dataset.glZone")); i++) await sleep(100);
  await sleep(2500);
  // the pointer where the torch shows (lamp off)
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 760, y: 430 });
  for (const [from, to] of LEGS) {
    const js = to === "home" ? "history.back()" : `dispatchEvent(new Event('${EV[to]}'))`;
    const t0 = Date.now();
    await b.ev(js);
    for (const t of AT) {
      await sleep(Math.max(0, t - (Date.now() - t0)));
      const file = path.join(OUT, `${from}-${to}-${t}-${gl ? "gl" : "css"}.png`);
      await b.shot(file);
      if (gl) res.push({ leg: `${from}→${to}`, t, dom: JSON.parse(await b.ev(DOMOVER)), rest: await b.ev("document.documentElement.dataset.glRest ?? null") });
    }
    await sleep(2600);
  }
}
b.close();
// how far apart: pixels over 8 and over 32, and the mean luminance of each
const py = `import json,sys
from PIL import Image, ImageChops, ImageStat
out=[]
for a,g in json.loads(sys.argv[1]):
  A=Image.open(a).convert('L');G=Image.open(g).convert('L');h=ImageChops.difference(A,G).histogram();t=sum(h)
  out.append([sum(h[9:])/t*100,sum(h[33:])/t*100,ImageStat.Stat(A).mean[0],ImageStat.Stat(G).mean[0]])
print(json.dumps(out))`;
const pairs = [];
for (const [from, to] of LEGS) for (const t of AT) pairs.push([path.join(OUT, `${from}-${to}-${t}-css.png`), path.join(OUT, `${from}-${to}-${t}-gl.png`)]);
const d = JSON.parse(execFileSync("python3", ["-c", py, JSON.stringify(pairs)]).toString());
let k = 0;
for (const r of res) {
  const [o8, o32, lc, lg] = d[k++];
  const over = r.dom.filter(([, op]) => +op > 0.001);
  log(`${r.leg} +${r.t}ms`, `over8 ${o8.toFixed(1)}% over32 ${o32.toFixed(1)}%`, `lum css ${lc.toFixed(1)} gl ${lg.toFixed(1)}`, `DOM night over the room: ${over.length ? JSON.stringify(over) : "none"}`, r.rest ? `(rest ${r.rest})` : "");
}
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ res, d }, null, 1));
