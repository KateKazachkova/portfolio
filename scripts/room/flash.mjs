// Flashes and pops, frame by frame: records the compositor's own frames
// (CDP screencast) while the camera tours the stops, on the real GPU, and
// lets scripts/room/flashes.py find a frame that differs from both of its
// neighbours (a flash, a hole) or a jump at the moment the DOM hands over
// to WebGL and back.
//
//   node scripts/room/flash.mjs http://localhost:3301 gl|css [dpr]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const MODE = process.argv[3] ?? "gl";
const DPR = +(process.argv[4] ?? 2);
const OUT = path.join(process.env.HOME, `Documents/portfolio-offload/webgl-m1/flash-${MODE}`);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const b = await launch({ headed: true, width: 1512, height: 860, dpr: DPR });
const frames = [];
b.handlers.add((m) => {
  if (m.method !== "Page.screencastFrame") return;
  const i = frames.length;
  const f = path.join(OUT, `f${String(i).padStart(5, "0")}.jpg`);
  fs.writeFileSync(f, Buffer.from(m.params.data, "base64"));
  frames.push({ f, t: m.params.metadata.timestamp });
  b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
});
const marks = [];
const mark = async (label) => marks.push({ label, t: await b.ev("Date.now()/1000"), frame: frames.length });
await b.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 756, maxHeight: 430, everyNthFrame: 1 });
// from the very first paint: the load is a boundary too
await mark("load");
await b.go(`${SITE}/?nointro&gl=${MODE === "gl" ? 1 : 0}`, 0);
await sleep(6000);
const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };
for (const [label, js, wait] of [
  ["home→files", `dispatchEvent(new Event("${EV.files}"))`, 3000],
  ["files→home", "history.back()", 3200],
  ["home→award", `dispatchEvent(new Event("${EV.award}"))`, 3000],
  ["award→offduty", `dispatchEvent(new Event("${EV.offduty}"))`, 3000],
  ["offduty→home", "history.back()", 3200],
  ["home→profile (quick back)", `dispatchEvent(new Event("${EV.profile}"))`, 700],
  ["→home mid-flight", "history.back()", 3200],
  ["home→offduty", `dispatchEvent(new Event("${EV.offduty}"))`, 3000],
  ["offduty→home", "history.back()", 3500],
]) { await mark(label); await b.ev(js); await sleep(wait); }
await mark("end");
await b.send("Page.stopScreencast");
await sleep(500);
b.close();
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify({ frames, marks }));
log("frames", frames.length);
const res = execFileSync("python3", [path.join(import.meta.dirname, "flashes.py"), OUT]).toString();
console.log(res);
