// The first departure from home after a load, many times over: the leg
// flash.mjs opens with (home→files, 6 s after the load), each run a fresh
// load with the screencast on from the start, as there. Per run: flashes
// (flashes.py; flashAt: screencast frames after setting off), the leg's
// largest jump, the page's frame intervals just after setting off (rAF, ms)
// and the room's state each frame (state.json). Found the rare night frame
// (HANDOFF §10: a first flight's wait for its pictures, fixed 28.09).
//
//   NIGHT=1 node scripts/room/depart.mjs http://localhost:3301 [runs] [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const RUNS = +(process.argv[3] ?? 10);
const OUT = process.argv[4] ?? path.join(TESTS, `depart${process.env.NIGHT ? "-night" : ""}`);
fs.rmSync(OUT, { recursive: true, force: true });
const results = [];
for (let r = 0; r < RUNS; r++) {
  const dir = path.join(OUT, `r${r}`);
  fs.mkdirSync(dir, { recursive: true });
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  const frames = [];
  b.handlers.add((m) => {
    if (m.method !== "Page.screencastFrame") return;
    const f = path.join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    fs.writeFileSync(f, Buffer.from(m.params.data, "base64"));
    frames.push({ f, t: m.params.metadata.timestamp });
    b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  });
  const marks = [];
  const mark = (label) => marks.push({ label, frame: frames.length });
  if (process.env.NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),23,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D; try{localStorage.setItem('lamp','${process.env.LAMP ?? "on"}')}catch(e){} })()` });
  await b.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 756, maxHeight: 430, everyNthFrame: 1 });
  mark("load");
  await b.go(`${SITE}/?nointro&gl=1`, 0);
  await sleep(6000);
  mark("home→files");
  await b.ev(`(() => { const t = window.__dep = [], st = window.__depSt = []; let n = 0; const snap = (x) => { const r = document.documentElement, s = window.__room && window.__room.stats(); st.push({ t: +x.toFixed(1), rest: r.dataset.glRest ?? "-", desk: r.dataset.desk ?? "-", night: s && s.nightNow, view: s && s.view }); }; snap(performance.now()); const f = (x) => { t.push(x); snap(x); if (++n < 30) requestAnimationFrame(f); }; requestAnimationFrame(f); dispatchEvent(new Event("kate:case-files")); })()`);
  await sleep(3000);
  mark("end");
  const ts = await b.ev("window.__dep");
  const st = await b.ev("window.__depSt");
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(st, null, 0).replace(/},{/g, "},\n{"));
  await b.send("Page.stopScreencast");
  await sleep(300);
  b.close();
  fs.writeFileSync(path.join(dir, "frames.json"), JSON.stringify({ frames, marks }));
  const res = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "flashes.py"), dir]).toString());
  const leg = res.legs.find((l) => l.leg === "home→files");
  const dt = ts.slice(1).map((t, i) => +(t - ts[i]).toFixed(1));
  const row = { flashAt: res.flashes.map((x) => x.frame - marks[1].frame), run: r, frames: res.frames, flashes: res.flashes.length, maxJump: leg?.maxJump, dtMax: Math.max(...dt.slice(0, 10)), dt: dt.slice(0, 8) };
  results.push(row);
  log(JSON.stringify(row));
  // keep only the frames of runs worth looking at
  if (!row.flashes && row.maxJump < 20) for (const f of fs.readdirSync(dir)) if (f.endsWith(".jpg")) fs.rmSync(path.join(dir, f));
}
const bad = results.filter((x) => x.flashes || x.maxJump >= 20).length;
const sum = { runs: RUNS, flashRuns: results.filter((x) => x.flashes).length, jump20: bad, maxJump: Math.max(...results.map((x) => x.maxJump)), dtMax: Math.max(...results.map((x) => x.dtMax)), dtMaxMedian: results.map((x) => x.dtMax).sort((a, b) => a - b)[Math.floor(RUNS / 2)] };
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ sum, results }, null, 1));
console.log(JSON.stringify(sum));
