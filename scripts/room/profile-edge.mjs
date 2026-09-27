// The Profile binder's DOM↔WebGL boundary, frame by frame, where the tucked
// desk paper, the board and the first sheet meet: the compositor's frames
// (CDP screencast, full size) while the camera is still — after it lands
// (WebGL's binder, then the page's panel over it, then WebGL's put away) and
// in the 0.2 s it waits before it sets off (the panel gone, WebGL's back).
// Any change between two frames there is a pop. Legs: arrival, a plain
// departure, a departure after a page is turned.
//
//   node scripts/room/profile-edge.mjs http://localhost:3301 [OUTDIR]   (+NIGHT=1, LAMP=off)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, `webgl-m6/profile-edge${process.env.NIGHT ? "-night" : ""}${process.env.LAMP === "off" ? "-torch" : ""}`);
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
// the page's own clock (performance.timeOrigin + now = the screencast's epoch)
const now = () => b.ev("(performance.timeOrigin + performance.now()) / 1000");
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r((performance.timeOrigin+performance.now())/1000):setTimeout(f,5);f()})`, 15000);
await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
const legs = [];
const arrive = async (label) => {
  await b.ev(`dispatchEvent(new Event("kate:profile"))`);
  const t = await arrived();
  await sleep(900);
  legs.push({ label, kind: "arrival", t0: t, t1: t + 0.8 });
};
const leave = async (label) => {
  const t = await now();
  await b.ev("history.back()");
  await sleep(3200);
  // the camera waits 0.2 s before it moves: the first 0.17 s are still
  legs.push({ label, kind: "departure", t0: t, t1: t + 0.17 });
};
await arrive("home→profile");
await leave("profile→home (plain)");
await arrive("home→profile again");
await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))`);
await sleep(1400);
await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))`);
await sleep(1400);
await leave("profile→home (after two turns)");
await b.send("Page.stopScreencast");
await sleep(400);
b.close();
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify({ frames, legs }));
log("frames", frames.length);
// the paper's strip over the board and the board's rim above and below it
// at the Profile stop (css px of 1512 × 860), short of the first sheet: its
// text moves at the hand-over (sheets baked at 1600 px, a known separate
// problem) and would drown the paper
const res = execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1]))
fr=d['frames']
def crop(i):
  im=Image.open(fr[i]['f']).convert('RGB'); w,h=im.size; s=w/1512
  return np.asarray(im.crop((int(290*s),int(40*s),int(352*s),int(800*s))),np.float32)
out=[]
for L in d['legs']:
  idx=[i for i,f in enumerate(fr) if L['t0']<=f['t']<=L['t1']]
  if len(idx)<2: out.append({**L,'frames':len(idx)}); continue
  worst=0; at=None
  for a,b in zip(idx,idx[1:]):
    x=np.abs(crop(a)-crop(b)).max(2); v=float((x>8).mean()*100)
    if v>worst: worst,at=v,b
  out.append({'leg':L['label'],'kind':L['kind'],'frames':len(idx),'worst_over8_pct':round(worst,3),'at':at})
print(json.dumps(out,indent=1))
`, path.join(OUT, "frames.json")]).toString();
console.log(res);
