// Ukrainska 15's DOM↔WebGL boundary (M6), frame by frame: the compositor's
// frames over the folder while the camera is still — after it lands at Case
// Files (WebGL's folder, then the page's panel over it) and in the 0.2 s it
// waits before leaving (the panel goes, WebGL lays the parts where the
// panel had them). Leaving with the folder open and a print dragged aside,
// and leaving while it opens or closes (the transitions run on in WebGL:
// no frame may stand out from both its neighbours). Back at the desk the
// folder is closed again, as the page's (leaving the desk puts it away).
//
//   node scripts/room/u15-edge.mjs http://localhost:3301 [OUTDIR]   (+NIGHT=1, LAMP=off)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, `Documents/portfolio-offload/webgl-m6/u15-edge${process.env.NIGHT ? "-night" : ""}${process.env.LAMP === "off" ? "-torch" : ""}`);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
const frames = [];
b.handlers.add((m) => {
  if (m.method !== "Page.screencastFrame") return;
  const f = path.join(OUT, `f${String(frames.length).padStart(5, "0")}.png`);
  fs.writeFileSync(f, Buffer.from(m.params.data, "base64"));
  frames.push({ f, t: m.params.metadata.timestamp });
  b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
});
if (process.env.NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,23,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D; try{localStorage.setItem('lamp','${process.env.LAMP ?? "on"}')}catch(e){} })()` });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(6000);
const now = () => b.ev("(performance.timeOrigin + performance.now()) / 1000");
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r((performance.timeOrigin+performance.now())/1000):setTimeout(f,5);f()})`, 15000);
const rectOf = (sel) => b.ev(`JSON.stringify(document.querySelector('${sel}').getBoundingClientRect())`).then(JSON.parse);
const press = async (x, y, to) => {
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  if (to) for (let k = 1; k <= 8; k++) { await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + (to[0] - x) * k / 8, y: y + (to[1] - y) * k / 8, button: "left", buttons: 1 }); await sleep(16); }
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to?.[0] ?? x, y: to?.[1] ?? y, button: "left", clickCount: 1 });
};
const toggle = async () => { const r = await rectOf(".room-hit--u15panel .u15-hit"); await press(r.x + r.width / 2, r.y + r.height * 0.75); };
// what the folder covers on screen now (all of its parts)
const area = () => b.ev(`(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const e of document.querySelectorAll('.room-hit--u15panel .u15-item, .room-hit--u15panel .u15-print')){const r=e.getBoundingClientRect();if(r.width<1)continue;x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}
  return JSON.stringify({left:Math.max(0,x0),top:Math.max(0,y0),right:Math.min(innerWidth,x1),bottom:Math.min(innerHeight,y1)})})()`).then(JSON.parse);
const legs = [];
await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
await sleep(300);
// 1. arrival: WebGL's closed folder, then the page's
await b.ev(`dispatchEvent(new Event("kate:case-files"))`);
let t = await arrived();
await sleep(1200);
legs.push({ label: "arriving at Case Files", kind: "still", t0: t, t1: t + 1.0, box: await area() });
// 2. open, a print dragged off its stack, then away
await toggle(); await sleep(2600);
const pr = await rectOf(`.room-hit--u15panel .u15-print[data-item="after-2"]`);
await press(pr.x + pr.width / 2, pr.y + pr.height / 2, [pr.x + pr.width / 2 + 120, pr.y + pr.height / 2 + 60]);
await sleep(1200);
const open = await area();
t = await now();
await b.ev("history.back()"); await sleep(3400);
// (leaving the desk puts the folder away at once: it moves in these frames
// in the page too, so what is looked for is a frame out of line)
legs.push({ label: "leaving it open, a print moved", kind: "flash", t0: t, t1: t + 3.2, box: open });
// 3. back: it is closed (leaving the desk put it away); leave while it opens
await b.ev(`dispatchEvent(new Event("kate:case-files"))`); await arrived(); await sleep(1500);
const closedBack = JSON.parse(await b.ev("JSON.stringify({u15: document.documentElement.dataset.u15 ?? null})"));
t = await now();
await toggle(); await sleep(250);
await b.ev("history.back()"); await sleep(3400);
legs.push({ label: "leaving while it opens", kind: "flash", t0: t, t1: t + 3.2 });
// 4. back, open, and leave while it closes
await b.ev(`dispatchEvent(new Event("kate:case-files"))`); await arrived(); await sleep(1500);
await toggle(); await sleep(2600);
t = await now();
await toggle(); await sleep(300);
await b.ev("history.back()"); await sleep(3400);
legs.push({ label: "leaving while it closes", kind: "flash", t0: t, t1: t + 3.4 });
await b.send("Page.stopScreencast");
await sleep(400);
b.close();
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify({ frames, legs }));
log("frames", frames.length);
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1])); fr=d['frames']
def crop(i,bx):
  im=Image.open(fr[i]['f']).convert('RGB'); s=im.size[0]/1512
  return np.asarray(im.crop((int(bx['left']*s),int(bx['top']*s),int(bx['right']*s),int(bx['bottom']*s))),np.float32)
small=lambda i: np.asarray(Image.open(fr[i]['f']).convert('L').resize((252,144)),np.float32)
out=[]
for L in d['legs']:
  idx=[i for i,f in enumerate(fr) if L['t0']<=f['t']<=L['t1']]
  if L['kind']=='flash':
    ims=[small(i) for i in idx]; fl=[]
    for k in range(1,len(ims)-1):
      a=np.abs(ims[k]-ims[k-1]).mean(); b=np.abs(ims[k]-ims[k+1]).mean(); c=np.abs(ims[k-1]-ims[k+1]).mean()
      if min(a,b)>6 and min(a,b)>3*c: fl.append(idx[k])
    jump=max([float(np.abs(ims[k]-ims[k-1]).mean()) for k in range(1,len(ims))] or [0])
    out.append({'leg':L['label'],'kind':'flash','frames':len(idx),'flashes':fl,'maxJump':round(jump,1)}); continue
  worst=0; at=None
  for a,b in zip(idx,idx[1:]):
    x=np.abs(crop(a,L['box'])-crop(b,L['box'])).max(2); v=float((x>16).mean()*100)
    if v>worst: worst,at=v,b
  out.append({'leg':L['label'],'kind':'still','frames':len(idx),'worst_over16_pct':round(worst,3),'at':at})
print(json.dumps(out))
`, path.join(OUT, "frames.json")]).toString());
for (const r of res) log(r.leg.padEnd(32), r.kind === "flash" ? `${r.frames} frames, flashes ${JSON.stringify(r.flashes)}, max jump ${r.maxJump}` : `${r.frames} frames, worst ${r.worst_over16_pct}% of the folder over 16 (frame ${r.at})`);
log("back at the desk after leaving it open:", JSON.stringify(closedBack));
console.log(JSON.stringify({ legs: res, closedBack }));
