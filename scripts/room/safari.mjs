// The room in Safari (M7 cross-browser QA, W3C WebDriver on safaridriver;
// Safari → Settings → Developer → "Allow remote automation" must be on):
// the WebGL room at 1512 × 860 (the window sized until its page is), at
// the real hour (WebDriver cannot fake the clock before the page loads). Does it start, the GPU and the compressed
// formats it offers, every stop reached from home and back, the flight's
// frame intervals (rAF), its WebGL layer at each stop against Chrome's
// (canvas-cr-*.png from firefox.mjs, same size) and a GL error at the end.
//
//   node scripts/room/safari.mjs http://localhost:3301 [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "safari");
const CR = path.join(TESTS, "firefox"); // Chrome's WebGL layer at each stop (firefox.mjs)
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4460 + Math.floor(Math.random() * 30);
const drv = spawn("safaridriver", ["-p", String(PORT)], { stdio: "ignore" });
await sleep(1500);
const api = async (method, p, body) => {
  const r = await fetch(`http://127.0.0.1:${PORT}${p}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (j.value && j.value.error) throw new Error(`${p}: ${j.value.error} ${j.value.message}`);
  return j.value;
};
let fails = 0;
const check = (label, ok, s) => { if (!ok) fails++; log(ok ? "ok  " : "FAIL", label, s === undefined ? "" : JSON.stringify(s)); };
const s = await api("POST", "/session", { capabilities: { alwaysMatch: { browserName: "safari" } } });
const S = `/session/${s.sessionId}`;
const ev = (script, args = []) => api("POST", `${S}/execute/sync`, { script, args });
const evA = (script) => api("POST", `${S}/execute/async`, { script: `const done = arguments[arguments.length - 1]; (async () => { ${script} })().then(done, (e) => done("ERR " + e));`, args: [] });
try {
  // the window's page at 1512 × 860
  await api("POST", `${S}/window/rect`, { width: 1512, height: 960, x: 20, y: 20 });
  await api("POST", `${S}/url`, { url: `${SITE}/?nointro&gl=1` });
  await sleep(1500);
  const inner = await ev("return [innerWidth, innerHeight]");
  await api("POST", `${S}/window/rect`, { width: 1512 + (1512 - inner[0]), height: 960 + (860 - inner[1]) });
  // (the real clock: Safari cannot lay a script in before the page's own)
  await api("POST", `${S}/url`, { url: `${SITE}/?nointro&gl=1` });
  await sleep(8000);
  const size = await ev("return [innerWidth, innerHeight, devicePixelRatio]");
  const st = await ev("return { ready: document.documentElement.dataset.glReady || null, failed: document.documentElement.dataset.glFailed || null, zone: document.documentElement.dataset.glZone || null, night: document.documentElement.hasAttribute('data-night'), ua: navigator.userAgent }");
  const gpu = await ev("const r = window.__room; if (!r) return null; const gl = r.renderer.getContext(); return { gpu: r.stats().gpu, exts: gl.getSupportedExtensions().filter((e) => /compress/i.test(e)) }");
  check(`safari: the WebGL room starts (${size.join("×")})`, !!st.ready && !st.failed, { ...st, ...gpu });
  const STOPS = [["files", "kate:case-files", "open"], ["award", "kate:recognition", "award"], ["profile", "kate:profile", "profile"], ["offduty", "kate:off-duty", "offduty"]];
  for (const [name, evn, desk] of STOPS) {
    const f = await evA(`const t0 = performance.now(); let l = t0; const fr = []; await new Promise((res) => { const step = (t) => { fr.push(t - l); l = t; if (t - t0 < 2600) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); dispatchEvent(new Event("${evn}")); }); return fr;`);
    await sleep(1200);
    const at = await ev("return { desk: document.documentElement.dataset.desk || null, arrived: document.documentElement.dataset.deskArrived || null }");
    const d = f.slice(1).sort((a, b) => a - b);
    const stat = { frames: d.length, p95: +d[Math.floor(d.length * 0.95)].toFixed(1), max: +d[d.length - 1].toFixed(1), over20: d.filter((x) => x > 20).length };
    check(`safari: home→${name} arrives`, at.desk === desk && !!at.arrived, { ...at, ...stat });
    const png = await ev(`const r = window.__room; r.renderer.render(r.scene, r.camera); return r.renderer.domElement.toDataURL("image/png").split(",")[1];`);
    fs.writeFileSync(path.join(OUT, `canvas-sf-${name}.png`), Buffer.from(png, "base64"));
    const shot = await api("GET", `${S}/screenshot`);
    fs.writeFileSync(path.join(OUT, `sf-${name}.png`), Buffer.from(shot, "base64"));
    await ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`);
    await sleep(3500);
  }
  const glErr = await ev("return window.__room ? window.__room.renderer.getContext().getError() : -1");
  check("safari: no GL error after the tour", glErr === 0, glErr);
  const py = `
import sys, json, os, numpy as np
from PIL import Image
out, cr = sys.argv[1], sys.argv[2]; r = {}
for n in ["files", "award", "profile", "offduty"]:
    a, b = os.path.join(out, f"canvas-sf-{n}.png"), os.path.join(cr, f"canvas-cr-{n}.png")
    if not os.path.exists(b): r[n] = None; continue
    x = np.asarray(Image.open(a).convert("RGBA")).astype(int); y = np.asarray(Image.open(b).convert("RGBA")).astype(int)
    if x.shape != y.shape: r[n] = {"shape": [list(x.shape), list(y.shape)]}; continue
    r[n] = round(float((np.abs(x - y).max(axis=2) > 8).mean() * 100), 2)
print(json.dumps(r))`;
  const cmp = JSON.parse(execFileSync("python3", ["-c", py, OUT, CR]).toString());
  log("canvas vs Chrome over8 %", JSON.stringify(cmp));
  const bad = Object.values(cmp).filter((v) => typeof v === "number" && v > 5);
  // Chrome's layer (firefox.mjs, cdp.mjs) is at a faked 10:30; Safari runs
  // on the real clock, so after dark the two are not the same room
  if (st.night) log("skip safari vs Chrome: Safari is at night, Chrome's reference by day", JSON.stringify(cmp));
  else check("safari: WebGL layer as Chrome's (over8 ≤ 5 % at every stop)", !bad.length, cmp);
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ size, st, gpu, cmp, glErr }, null, 1));
} catch (e) {
  fails++; log("FAIL", String(e).slice(0, 400));
} finally {
  try { await api("DELETE", S); } catch {}
  drv.kill();
}
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
