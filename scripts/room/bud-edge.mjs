// The БУДЬ prints at the Profile binder's DOM↔WebGL boundary (M6 group 4):
// prints moved in the page's panel must lie in WebGL where they were left,
// with no pop in the frames where the panel goes (the 0.2 s the camera
// waits before it sets off) or comes back (after it lands). The compositor's
// frames (CDP screencast) are compared over the box of the moved prints.
// Legs: two prints dragged (the second over the first) then a plain
// departure; leaving while a print is still held; leaving right after a
// drop; a turn away and back (positions kept); leaving from another spread;
// every arrival back (the DOM where WebGL had them).
//
//   node scripts/room/bud-edge.mjs http://localhost:3301 [OUTDIR]   (+NIGHT=1, LAMP=off)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, `webgl-m6/bud-edge${process.env.NIGHT ? "-night" : ""}${process.env.LAMP === "off" ? "-torch" : ""}`);
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
if (process.env.NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),23,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D; try{localStorage.setItem('lamp','${process.env.LAMP ?? "on"}')}catch(e){} })()` });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(6000);
const now = () => b.ev("(performance.timeOrigin + performance.now()) / 1000");
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"&&document.querySelector('.room-binder .pf-whole .pf-print')?r((performance.timeOrigin+performance.now())/1000):setTimeout(f,5);f()})`, 15000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)} }))`); await sleep(1400); } };
// a print's middle on screen, css px (n: its index in the stack)
const at = (n) => b.ev(`(()=>{const r=document.querySelectorAll('.room-binder .pf-whole .pf-print')[${n}].getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
const mouse = (type, x, y) => b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
const drag = async (n, dx, dy, { release = true } = {}) => {
  const [x, y] = await at(n);
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await mouse("mousePressed", x, y);
  for (let k = 1; k <= 12; k++) { await mouse("mouseMoved", x + (dx * k) / 12, y + (dy * k) / 12); await sleep(16); }
  if (release) await mouse("mouseReleased", x + dx, y + dy);
  return [x + dx, y + dy];
};
// the box the prints lie in (css px), all of them, now
const box = () => b.ev(`(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const e of document.querySelectorAll('.room-binder .pf-whole .pf-print')){const r=e.getBoundingClientRect();x0=Math.min(x0,r.left);y0=Math.min(y0,r.top);x1=Math.max(x1,r.right);y1=Math.max(y1,r.bottom)}return [x0-8,y0-8,x1+8,y1+8]})()`);
const store = () => b.ev(`JSON.stringify([...document.querySelectorAll('.room-binder .pf-whole .pf-print')].map(e=>[e.style.transform,e.style.zIndex]))`);
const legs = [];
let crop = null;
const leave = async (label, extra) => {
  crop = await box();
  const t = await now();
  await b.ev("history.back()");
  if (extra) await extra();
  await sleep(3200);
  legs.push({ label, kind: "departure", t0: t - 0.05, t1: t + 0.17, crop });
};
const arrive = async (label, before) => {
  await b.ev(`dispatchEvent(new Event("kate:profile"))`);
  const t = await arrived();
  await sleep(900);
  const same = before ? (await store()) === before : null;
  legs.push({ label, kind: "arrival", t0: t, t1: t + 0.8, crop: crop ?? (await box()), same });
};

await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
await arrive("home→profile");
await key("ArrowRight", 3);
// the reference: the sheet's own hand-over, nothing moved
await leave("leave untouched (reference)");
await arrive("back untouched", null);
// the top print well away, and another over it
await drag(15, 150, -70);
await drag(4, 140, -40);
let s = await store();
await leave("leave after two drags (plain)");
await arrive("back: DOM where left", s);
// leaving with a print still in hand
await drag(9, -30, -120, { release: false });
s = await store();
await leave("leave while dragging", async () => { await sleep(120); await mouse("mouseReleased", 0, 0); });
await arrive("back after the held drag", null);
// leaving the moment a print is dropped
await drag(2, 90, -150);
s = await store();
await leave("leave right after a drop");
await arrive("back after the drop", s);
// a turn away and back: the prints where they were
s = await store();
await key("ArrowRight"); await key("ArrowLeft");
const kept = (await store()) === s;
await leave("leave after a turn away and back");
await arrive("back after the turn", s);
// from another spread (the БУДЬ sheet turned under)
await key("ArrowRight");
await leave("leave from another spread");
await arrive("back at the other spread", null);
await b.send("Page.stopScreencast");
await sleep(400);
b.close();
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify({ frames, legs }));
log("frames", frames.length, "turn kept", kept);
const res = execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1]))
fr=d['frames']
def crop(i,c):
  im=Image.open(fr[i]['f']).convert('RGB'); w,h=im.size; s=w/1512
  return np.asarray(im.crop((int(c[0]*s),int(c[1]*s),int(c[2]*s),int(c[3]*s))),np.float32)
out=[]
for L in d['legs']:
  idx=[i for i,f in enumerate(fr) if L['t0']<=f['t']<=L['t1']]
  # (a still page sends no frames: the last one before the window is what showed)
  pre=[i for i,f in enumerate(fr) if f['t']<L['t0']]
  if L['kind']=='departure' and pre and (not idx or pre[-1]<idx[0]): idx=[pre[-1]]+idx
  if len(idx)<2: out.append({'leg':L['label'],'frames':len(idx)}); continue
  worst=0; at=None
  for a,b in zip(idx,idx[1:]):
    x=np.abs(crop(a,L['crop'])-crop(b,L['crop'])).max(2); v=float((x>8).mean()*100)
    if v>worst: worst,at=v,b
  x=np.abs(crop(idx[0],L['crop'])-crop(idx[-1],L['crop'])).max(2)
  # the same with the picture free to slide up to 4 device px either way:
  # what stays is not the sheet's own offset at the hand-over (~1.5 css px,
  # the baked binder against the page's) but a print where it was not
  A,B=crop(idx[0],L['crop']),crop(idx[-1],L['crop']); m=np.full(A.shape[:2],1e9,np.float32)
  for dy in range(-4,5):
    for dx in range(-4,5): m=np.minimum(m,np.abs(A-np.roll(np.roll(B,dy,0),dx,1)).max(2))
  m=m[4:-4,4:-4]
  out.append({'leg':L['label'],'kind':L['kind'],'frames':len(idx),'worst_over8_pct':round(worst,3),'first_last_over8_pct':round(float((x>8).mean()*100),3),'slide4_over24_pct':round(float((m>24).mean()*100),3),'at':at,'same':L.get('same')})
print(json.dumps(out,indent=1))
`, path.join(OUT, "frames.json")]).toString();
console.log(res);
console.log(JSON.stringify({ turnKept: kept }));
