// Case Files' award stacks moving (M6), the CSS room against WebGL's on one
// clock: the compositor's frames while a stack is laid out, another takes
// its place, Ukrainska 15 opens with the stacks aside (150), a stack is
// laid out while the folder is open (the folder shuts and slides aside,
// 240), and the camera is sent home while a stack fans out. The same clicks
// in each; each leg's frames are looked through for a flash (a frame unlike
// both neighbours) in WebGL's, and compared with the page's at the same
// moments after the click.
//
//   node scripts/room/stacks-edge.mjs http://localhost:3301 [OUTDIR]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m6/stacks-edge");
fs.rmSync(OUT, { recursive: true, force: true });

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
  await b.ev(`dispatchEvent(new Event("kate:case-files"))`);
  await b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(1):setTimeout(f,20);f()})`, 15000);
  await sleep(1500);
  const now = () => b.ev("(performance.timeOrigin + performance.now()) / 1000");
  const card = (f) => (f === "ukrainska-15" ? (gl ? ".room-hit--u15panel .u15-hit" : ".desk-world .u15-hit") : (gl ? `.room-hit[data-hit="case-${f}"]` : `.desk-card[data-slug="${f}"]`));
  const legs = [];
  await b.send("Page.startScreencast", { format: "png", maxWidth: 1512, maxHeight: 860, everyNthFrame: 1 });
  await sleep(400);
  for (const [label, f, wait] of [["bulksource laid out", "bulksource", 2600], ["onsisoft instead", "onsisoft", 2600], ["Ukrainska 15 opened, stacks aside", "ukrainska-15", 3000], ["waypro while it is open", "waypro", 3000]]) {
    const t = await now();
    await b.ev(`document.querySelector('${card(f)}').click()`);
    await sleep(wait);
    legs.push({ label, t0: t, t1: t + wait / 1000 - 0.1 });
  }
  const t = await now();
  await b.ev(`document.querySelector('${card("bulksource")}').click()`);
  await sleep(300);
  await b.ev("history.back()");
  await sleep(3300);
  legs.push({ label: "sent home while bulksource fans out", t0: t, t1: t + 3.4 });
  await b.send("Page.stopScreencast");
  await sleep(300);
  b.close();
  return { frames, legs };
};
const css = await run(false), gl = await run(true);
fs.writeFileSync(path.join(OUT, "runs.json"), JSON.stringify({ css, gl }));
const res = JSON.parse(execFileSync("python3", ["-c", `
import json,sys,numpy as np
from PIL import Image
d=json.load(open(sys.argv[1]))
small=lambda f: np.asarray(Image.open(f).convert('L').resize((252,144)),np.float32)
out=[]
for k,(Lc,Lg) in enumerate(zip(d['css']['legs'],d['gl']['legs'])):
  fg=[f for f in d['gl']['frames'] if Lg['t0']<=f['t']<=Lg['t1']]
  ims=[small(f['f']) for f in fg]; fl=[]
  for i in range(1,len(ims)-1):
    a=np.abs(ims[i]-ims[i-1]).mean(); b=np.abs(ims[i]-ims[i+1]).mean(); c=np.abs(ims[i-1]-ims[i+1]).mean()
    if min(a,b)>6 and min(a,b)>3*c: fl.append(round(fg[i]['t']-Lg['t0'],3))
  jump=max([float(np.abs(ims[i]-ims[i-1]).mean()) for i in range(1,len(ims))] or [0])
  # the page's frame and WebGL's at the same moments after the click
  cmp=[]
  for dt in (0.1,0.3,0.5,0.8,1.5):
    pick=lambda run,L: min([f for f in run['frames'] if f['t']>=L['t0']-0.05] or run['frames'],key=lambda f:abs(f['t']-L['t0']-dt))
    A=np.asarray(Image.open(pick(d['css'],Lc)['f']).convert('RGB'),np.float32); B=np.asarray(Image.open(pick(d['gl'],Lg)['f']).convert('RGB'),np.float32)
    x=np.abs(A-B).max(2)[:,350:]; cmp.append(round(float((x>32).mean()*100),1))
  out.append({'leg':Lg['label'],'frames':len(fg),'flashes':fl,'maxJump':round(jump,1),'over32_at_0.1_0.3_0.5_0.8_1.5':cmp})
print(json.dumps(out))
`, path.join(OUT, "runs.json")]).toString());
for (const r of res) log(r.leg.padEnd(38), `${r.frames} frames, flashes ${JSON.stringify(r.flashes)}, max jump ${r.maxJump}; vs page over32 ${r["over32_at_0.1_0.3_0.5_0.8_1.5"].join(" / ")} %`);
console.log(JSON.stringify(res));
