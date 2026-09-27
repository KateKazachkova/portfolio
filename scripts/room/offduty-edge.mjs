// The DVD screen's DOM↔WebGL boundary with a disc in (M6), frame by frame:
// the compositor's frames over the player's screen while the camera is
// still — in the 0.2 s it waits before leaving the corner (the page's panel
// goes, WebGL's screen shows the poster, drifting where the panel's was)
// and after it lands there again (the panel back over it, its picture not
// started over). The clip is taken off the panel first: YouTube's player is
// not what either draws once the camera leaves, and it would drown the
// poster. Also the wallet: a spread turned and the disc left out of its
// pocket must look the same after the round trip.
//
//   node scripts/room/offduty-edge.mjs http://localhost:3301 [OUTDIR]   (+NIGHT=1, LAMP=off)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, `webgl-m6/offduty-edge${process.env.NIGHT ? "-night" : ""}${process.env.LAMP === "off" ? "-torch" : ""}`);
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
const key = async (k, code = k) => {
  await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: { ArrowRight: 39, Enter: 13 }[k] ?? 0, ...(k === "Enter" ? { text: "\r" } : {}) });
  await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: { ArrowRight: 39, Enter: 13 }[k] ?? 0 });
};
// the screen's box on screen at the corner (the panel's), css px
const screenBox = () => b.ev(`JSON.stringify(document.querySelector('.room-hit--dvd').getBoundingClientRect())`).then(JSON.parse);
const legs = [];
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
await arrived(); await sleep(1500);
// a spread on, a disc in (the first of it), its clip off the panel
await key("ArrowRight"); await sleep(900);
await b.ev(`document.querySelector('.room-hit--disc:not([hidden])').focus()`);
await key("Enter"); await sleep(2600);
await b.ev("document.activeElement?.blur(); document.querySelector('.room-hit--dvd iframe')?.remove(); 1");
await sleep(400);
const box = await screenBox();
const walletBefore = await b.ev("JSON.stringify(window.__room ? 1 : 0)");
void walletBefore;
await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
await sleep(500);
let t = await now();
await b.ev("history.back()");
await sleep(3400);
legs.push({ label: "leaving the corner, a disc in", kind: "departure", t0: t, t1: t + 0.17 });
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
t = await arrived();
await sleep(1200);
legs.push({ label: "back at the corner", kind: "arrival", t0: t, t1: t + 1.0 });
// leaving while a sleeve turns, and while a disc flies: what WebGL alone
// draws, so no frame may stand out from both its neighbours
t = await now();
await key("ArrowRight"); await sleep(250);
await b.ev("history.back()"); await sleep(3400);
legs.push({ label: "leaving mid-turn", kind: "flash", t0: t, t1: t + 3.2 });
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`); await arrived(); await sleep(1200);
await b.ev(`document.querySelector('.room-hit--disc:not([hidden])').focus()`);
t = await now();
await key("Enter"); await sleep(300);
await b.ev("history.back()"); await sleep(3400);
legs.push({ label: "leaving mid-flight of a disc", kind: "flash", t0: t, t1: t + 3.2 });
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`); await arrived(); await sleep(1500);
await b.send("Page.stopScreencast");
await sleep(400);
const st = JSON.parse(await b.ev("JSON.stringify({ discs: [...document.querySelectorAll('.room-hit--disc:not([hidden])')].map(e => e.getAttribute('aria-label')), dvd: document.querySelector('.room-hit--dvd').textContent })"));
b.close();
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify({ frames, legs, box }));
log("frames", frames.length);
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1])); fr=d['frames']; bx=d['box']
def crop(i):
  im=Image.open(fr[i]['f']).convert('RGB'); s=im.size[0]/1512
  return np.asarray(im.crop((int(bx['left']*s),int(bx['top']*s),int(bx['right']*s),int(bx['bottom']*s))),np.float32)
out=[]
small=lambda i: np.asarray(Image.open(fr[i]['f']).convert('L').resize((252,144)),np.float32)
for L in d['legs']:
  idx=[i for i,f in enumerate(fr) if L['t0']<=f['t']<=L['t1']]
  if L['kind']=='flash':
    ims=[small(i) for i in idx]; fl=[]
    for k in range(1,len(ims)-1):
      a_=np.abs(ims[k]-ims[k-1]).mean(); b_=np.abs(ims[k]-ims[k+1]).mean(); c_=np.abs(ims[k-1]-ims[k+1]).mean()
      if min(a_,b_)>6 and min(a_,b_)>3*c_: fl.append(idx[k])
    jump=max([float(np.abs(ims[k]-ims[k-1]).mean()) for k in range(1,len(ims))] or [0])
    out.append({'leg':L['label'],'kind':'flash','frames':len(idx),'flashes':fl,'maxJump':round(jump,1)}); continue
  worst=0; at=None
  for a,b in zip(idx,idx[1:]):
    x=np.abs(crop(a)-crop(b)).max(2); v=float((x>16).mean()*100)
    if v>worst: worst,at=v,b
  out.append({'leg':L['label'],'kind':L['kind'],'frames':len(idx),'worst_over16_pct':round(worst,3),'at':at})
print(json.dumps(out))
`, path.join(OUT, "frames.json")]).toString());
for (const r of res) log(r.leg.padEnd(32), r.kind === "flash" ? `${r.frames} frames, flashes ${JSON.stringify(r.flashes)}, max jump ${r.maxJump}` : `${r.frames} frames, worst ${r.worst_over16_pct}% of the screen over 16 (frame ${r.at})`);
log("after the round trip:", st.discs.length, "discs in the wallet; the player:", st.dvd);
console.log(JSON.stringify({ legs: res, state: st }));
