// The room in Firefox (M7 cross-browser QA, WebDriver BiDi: bidi.mjs): the
// WebGL room and the CSS room in turn, headed, 1512 × 860 @2, today 10:30
// (NIGHT=1: 23:30). For each: does it start (data-gl-ready / -failed), the
// console, every stop reached from home and back (data-desk-arrived), the
// flight's frame intervals (rAF), a still at each stop; then the WebGL
// stills against the CSS room's (over8: share of pixels off by more than 8
// levels, as compare.mjs).
//
//   node scripts/room/firefox.mjs http://localhost:3301 [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { sleep, log, TESTS } from "./cdp.mjs";
import { launch } from "./cdp.mjs";
import { launchFirefox } from "./bidi.mjs";

// the WebGL layer alone, as the room draws it now: drawn and read in one
// task (the canvas keeps no drawing buffer, and a browser's own screenshot
// may not show it: Firefox's BiDi one does not)
const CANVAS = `(() => { const r = window.__room; r.renderer.render(r.scene, r.camera); return r.renderer.domElement.toDataURL("image/png").split(",")[1]; })()`;
const glShot = async (b, file) => { const d = await b.ev(CANVAS); if (d) fs.writeFileSync(file, Buffer.from(d, "base64")); };

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, `firefox${process.env.NIGHT ? "-night" : ""}`);
fs.mkdirSync(OUT, { recursive: true });
const STOPS = [["files", "kate:case-files", "open"], ["award", "kate:recognition", "award"], ["profile", "kate:profile", "profile"], ["offduty", "kate:off-duty", "offduty"]];
const report = { site: SITE, night: !!process.env.NIGHT };
let fails = 0;
const check = (label, ok, s) => { if (!ok) fails++; log(ok ? "ok  " : "FAIL", label, s === undefined ? "" : JSON.stringify(s)); };

for (const gl of [1, 0]) {
  const b = await launchFirefox({ clock: process.env.NIGHT ? [23, 30] : [10, 30] });
  const r = (report[gl ? "gl" : "css"] = { stops: {} });
  await b.go(`${SITE}/?nointro&gl=${gl}`);
  r.ua = await b.ev("navigator.userAgent");
  const t0 = Date.now();
  let st;
  for (;;) {
    st = await b.ev(`({ ready: document.documentElement.dataset.glReady ?? null, failed: document.documentElement.dataset.glFailed ?? null, zone: document.documentElement.dataset.glZone ?? null, gl: document.documentElement.hasAttribute("data-gl") })`);
    if (!gl || st.failed || (st.ready && st.zone) || Date.now() - t0 > 20000) break;
    await sleep(250);
  }
  r.start = { ...st, ms: Date.now() - t0 };
  if (gl) {
    r.gpu = await b.ev("window.__room ? window.__room.stats().gpu : null");
    check(`firefox gl: the WebGL room starts (${r.gpu})`, !!st.ready && !st.failed, r.start);
  }
  await sleep(4000);
  await b.shot(path.join(OUT, `${gl ? "gl" : "css"}-home.png`));
  for (const [name, evn, desk] of STOPS) {
    await b.ev(`(() => { const T = window.__T = { f: [] }; let l = performance.now(); const t0 = l; const f = (t) => { T.f.push(t - l); l = t; if (t - t0 < 2600) requestAnimationFrame(f); }; requestAnimationFrame(f); dispatchEvent(new Event("${evn}")); })()`);
    let s;
    const ts = Date.now();
    for (;;) {
      await sleep(200);
      s = await b.ev(`({ desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.dataset.deskArrived ?? null })`);
      if ((s.desk === desk && s.arrived) || Date.now() - ts > 6000) break;
    }
    const arriveMs = Date.now() - ts;
    await sleep(Math.max(0, 3000 - arriveMs) + 800);
    const f = (await b.ev("window.__T.f")).slice(1).sort((a, c) => a - c);
    const stat = { arriveMs, frames: f.length, p95: +f[Math.floor(f.length * 0.95)].toFixed(1), max: +f[f.length - 1].toFixed(1), over20: f.filter((x) => x > 20).length };
    r.stops[name] = stat;
    check(`firefox ${gl ? "gl" : "css"}: home→${name} arrives`, s.desk === desk && !!s.arrived, { ...s, ...stat });
    await b.shot(path.join(OUT, `${gl ? "gl" : "css"}-${name}.png`));
    if (gl) await glShot(b, path.join(OUT, `canvas-ff-${name}.png`));
    await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`);
    await sleep(3500);
    const h = await b.ev(`document.documentElement.dataset.desk ?? null`);
    check(`firefox ${gl ? "gl" : "css"}: ${name}→home`, h === "closed" || h === null, h);
  }
  r.console = b.console.filter((l) => /^(error|warn)/.test(l)).slice(0, 30);
  await b.close();
  await sleep(1000);
}
// the same WebGL layer in Chrome (the browser the room was built in), at the same stops
{
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  if (process.env.NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: "localStorage.setItem('lamp','on')" });
  await b.go(`${SITE}/?nointro&gl=1`, 6000);
  for (const [name, evn] of STOPS) {
    await b.ev(`dispatchEvent(new Event("${evn}"))`); await sleep(3800);
    await glShot(b, path.join(OUT, `canvas-cr-${name}.png`));
    await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`); await sleep(3500);
  }
  b.close();
}
// the WebGL stills against the CSS room's
const py = `
import sys, json, numpy as np
from PIL import Image
d = sys.argv[1]; out = {}
for n in ["home", "files", "award", "profile", "offduty"]:
    a = np.asarray(Image.open(f"{d}/gl-{n}.png").convert("RGB")).astype(int)
    b = np.asarray(Image.open(f"{d}/css-{n}.png").convert("RGB")).astype(int)
    if a.shape != b.shape: out[n] = None; continue
    m = np.abs(a - b).max(axis=2)
    out[n] = {"over8": round(float((m > 8).mean() * 100), 2), "over24": round(float((m > 24).mean() * 100), 2)}
for n in ["files", "award", "profile", "offduty"]:
    try:
        a = np.asarray(Image.open(f"{d}/canvas-ff-{n}.png").convert("RGBA")).astype(int)
        b = np.asarray(Image.open(f"{d}/canvas-cr-{n}.png").convert("RGBA")).astype(int)
    except Exception: out["canvas-" + n] = None; continue
    if a.shape != b.shape: out["canvas-" + n] = {"shape": [a.shape, b.shape]}; continue
    m = np.abs(a - b).max(axis=2)
    out["canvas-" + n] = {"over8": round(float((m > 8).mean() * 100), 2), "over24": round(float((m > 24).mean() * 100), 2)}
print(json.dumps(out))`;
report.compare = JSON.parse(execFileSync("python3", ["-c", py, OUT]).toString());
log("compare", JSON.stringify(report.compare));
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
log("console gl", JSON.stringify(report.gl.console));
log("console css", JSON.stringify(report.css.console));
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
