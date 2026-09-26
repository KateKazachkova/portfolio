// Ukrainska 15's folder, the CSS room against WebGL's (M6), on one clock:
// the same moves in each (Case Files; the folder opened; a print dragged
// aside; the camera sent home), the compositor's frames recorded, and the
// frames at the same moments after the camera is sent off compared over
// the folder. Leaving the desk puts the folder away (U15_RESET: everything
// slides back, .8 s) while the camera waits and sets off — the page does it
// in its 3D room, WebGL from the page's hidden panel (u15gl.ts). Before the
// send-off both are the page's own DOM (the panel), so that moment is the
// baseline; the other cases lie differently in WebGL until the award
// stacks are done (M6), and the folder is cut to its own box to keep them
// out as far as it can.
//
//   node scripts/room/u15-gl.mjs http://localhost:3301 [OUTDIR]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m6/u15-gl");
fs.rmSync(OUT, { recursive: true, force: true });
const AT = [-0.1, 0.05, 0.15, 0.3, 0.5, 0.8, 1.2];

const run = async (gl) => {
  const dir = path.join(OUT, gl ? "gl" : "css");
  fs.mkdirSync(dir, { recursive: true });
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 1 });
  const frames = [];
  b.handlers.add((m) => {
    if (m.method !== "Page.screencastFrame") return;
    const f = path.join(dir, `f${String(frames.length).padStart(5, "0")}.png`);
    fs.writeFileSync(f, Buffer.from(m.params.data, "base64"));
    frames.push({ f, t: m.params.metadata.timestamp });
    b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,10,30).getTime()-O.now();
    class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
    window.Date=D;})()` });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}`, 0);
  await sleep(6000);
  const scope = gl ? ".room-hit--u15panel " : ".desk-world ";
  const rectOf = (sel) => b.ev(`JSON.stringify(document.querySelector('${scope}${sel}').getBoundingClientRect())`).then(JSON.parse);
  const press = async (x, y, to) => {
    await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    if (to) for (let k = 1; k <= 8; k++) { await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + (to[0] - x) * k / 8, y: y + (to[1] - y) * k / 8, button: "left", buttons: 1 }); await sleep(16); }
    await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to?.[0] ?? x, y: to?.[1] ?? y, button: "left", clickCount: 1 });
  };
  await b.ev(`dispatchEvent(new Event("kate:case-files"))`);
  await b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(1):setTimeout(f,20);f()})`, 15000);
  await sleep(1500);
  const h = await rectOf(".u15-hit");
  await press(h.x + h.width / 2, h.y + h.height * 0.75); await sleep(2600);
  const pr = await rectOf(`.u15-print[data-item="after-2"]`);
  await press(pr.x + pr.width / 2, pr.y + pr.height / 2, [pr.x + pr.width / 2 + 120, pr.y + pr.height / 2 + 60]);
  await sleep(1200);
  const box = await b.ev(`(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const e of document.querySelectorAll('${scope}.u15-item, ${scope}.u15-print')){const r=e.getBoundingClientRect();if(r.width<1)continue;x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}
    return JSON.stringify({left:Math.max(0,x0),top:Math.max(0,y0),right:Math.min(innerWidth,x1),bottom:Math.min(innerHeight,y1)})})()`).then(JSON.parse);
  await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
  await sleep(500);
  const t0 = await b.ev("(performance.timeOrigin + performance.now()) / 1000");
  await b.ev("history.back()");
  await sleep(1600);
  await b.send("Page.stopScreencast");
  await sleep(300);
  b.close();
  return { frames, t0, box };
};
const css = await run(false), gl = await run(true);
fs.writeFileSync(path.join(OUT, "runs.json"), JSON.stringify({ css, gl, at: AT }));
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1])); bx=d['css']['box']
def at(run,dt):
  fr=run['frames']; t=run['t0']+dt
  i=min(range(len(fr)),key=lambda k:abs(fr[k]['t']-t)); return fr[i]['f'], fr[i]['t']-run['t0']
out=[]
for dt in d['at']:
  a,ta=at(d['css'],dt); b,tb=at(d['gl'],dt)
  A=np.asarray(Image.open(a).convert('RGB').crop((int(bx['left']),int(bx['top']),int(bx['right']),int(bx['bottom']))),np.float32)
  B=np.asarray(Image.open(b).convert('RGB').crop((int(bx['left']),int(bx['top']),int(bx['right']),int(bx['bottom']))),np.float32)
  x=np.abs(A-B).max(2)
  out.append({'dt':dt,'css_t':round(ta,3),'gl_t':round(tb,3),'over16':round(float((x>16).mean()*100),2),'over48':round(float((x>48).mean()*100),2)})
print(json.dumps(out))
`, path.join(OUT, "runs.json")]).toString());
for (const r of res) log(`t ${String(r.dt).padStart(5)} s (css ${r.css_t}, gl ${r.gl_t})`, `over16 ${r.over16}% over48 ${r.over48}%`);
console.log(JSON.stringify(res));
