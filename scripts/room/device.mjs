// Phones and tablets, emulated (mobile viewport, touch): the WebGL room
// against the legacy CSS room at the same size. Per profile and room: start,
// console errors, sideways overflow, every stop arrives, a finger's swipe
// (home ⇄ the wall's stops on a phone), drag along Case Files, a tap on a
// case and on the pill that puts it away, a turn of the device at Profile;
// the frames of both rooms compared (over8 %).
//   node scripts/room/device.mjs http://localhost:3301 [profile…]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const PROFILES = {
  "iphone": { w: 390, h: 844, dpr: 3 },
  "iphone-se": { w: 375, h: 667, dpr: 2 },
  "iphone-land": { w: 844, h: 390, dpr: 3 },
  "ipad": { w: 820, h: 1180, dpr: 2 },
  "ipad-land": { w: 1180, h: 820, dpr: 2 },
  "ipad-pro-land": { w: 1366, h: 1024, dpr: 2 },
};
const pick = process.argv.slice(3);
const OUT = path.join(TESTS, "device");
fs.mkdirSync(OUT, { recursive: true });
const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };

async function run(name, p, gl) {
  const b = await launch({ width: p.w, height: p.h, dpr: 1 });
  const metrics = (w, h) => b.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: p.dpr, mobile: true, screenOrientation: w > h ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 } });
  await metrics(p.w, p.h);
  await b.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  const state = async () => JSON.parse(await b.ev(`JSON.stringify({desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.hasAttribute("data-desk-arrived"), focus: document.documentElement.dataset.deskFocus ?? null,
    pan: Math.round(parseFloat(document.querySelector('.scene-cam')?.style.getPropertyValue('--pan'))||0), ready: document.documentElement.hasAttribute("data-gl-ready"), failed: document.documentElement.hasAttribute("data-gl-failed"),
    over: document.documentElement.scrollWidth - innerWidth})`));
  const touch = async (pts, dt = 16) => {
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
    for (const [x, y] of pts.slice(1)) { await sleep(dt); await b.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] }); }
    await sleep(dt);
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const swipe = (x0, x1, y, n = 12) => touch(Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y]));
  const tap = (x, y) => touch([[x, y]], 60);
  const shot = async (k) => { const f = path.join(OUT, `${name}-${gl ? "gl" : "css"}-${k}.png`); await b.shot(f); return f; };
  const r = { steps: {}, shots: {} };
  const step = async (k, wait = 0) => { if (wait) await sleep(wait); r.steps[k] = await state(); };

  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}`, 4500);
  await step("home"); r.shots.home = await shot("home");
  for (const [v, e] of Object.entries(EV)) {
    await b.ev(`dispatchEvent(new Event('${e}'))`);
    await step(v, 3400); r.shots[v] = await shot(v);
  }
  await b.ev(`dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); await step("escape-home", 3400);
  // a phone's swipe: from home to Recognition, and back from there
  await swipe(p.w * 0.8, p.w * 0.2, p.h * 0.55); await step("swipe-left", 3400);
  await swipe(p.w * 0.2, p.w * 0.8, p.h * 0.55); await step("swipe-right", 3400);
  // Case Files: a finger along the desk pans it
  await b.ev(`dispatchEvent(new Event('kate:case-files'))`); await sleep(3400);
  const pan0 = (await state()).pan;
  await swipe(p.w * 0.75, p.w * 0.35, p.h * 0.6, 20);
  await step("drag", 1200); r.steps.drag.moved = r.steps.drag.pan - pan0;
  // a tap on a case lays it out; a tap on the pill puts it away
  const box = JSON.parse(await b.ev(`(() => { const el = ${gl ? `[...document.querySelectorAll('.room-hit[data-hit^="case-"]')].find(e => { const q = e.getBoundingClientRect(); return !e.hidden && q.width > 20 && q.left + q.width / 2 > 0 && q.left + q.width / 2 < innerWidth; })` : `[...document.querySelectorAll('.desk-card[data-slug]:not(.desk-card--env)')].find(e => { const q = e.getBoundingClientRect(); return q.width > 20 && q.left + q.width / 2 > 0 && q.left + q.width / 2 < innerWidth; })`};
    if (!el) return "null"; const q = el.getBoundingClientRect(); return JSON.stringify({ x: q.left + q.width / 2, y: q.top + q.height / 2, id: el.dataset.hit ?? el.dataset.slug }); })()`));
  r.tapped = box?.id ?? null;
  if (box) { await tap(box.x, box.y); await step("tap-case", 2000); r.shots["tap-case"] = await shot("tap-case"); }
  const pill = JSON.parse(await b.ev(`(() => { const el = document.querySelector('.desk-hint__close'); if (!el || !el.offsetWidth) return "null"; const q = el.getBoundingClientRect(); return JSON.stringify({ x: q.left + q.width / 2, y: q.top + q.height / 2 }); })()`));
  if (pill) { await tap(pill.x, pill.y); await step("tap-pill", 1800); }
  // the device turned at Profile
  await b.ev(`dispatchEvent(new Event('kate:profile'))`); await sleep(3400);
  await metrics(p.h, p.w); await step("rotated", 2500); r.shots.rotated = await shot("rotated");
  await metrics(p.w, p.h); await step("rotated-back", 2500);
  r.errors = b.console.filter((l) => /error|EXC/i.test(l)).map((l) => l.slice(0, 300));
  if (gl) r.stats = await b.ev(`window.__room ? JSON.stringify({ p95: __room.stats().p95, max: __room.stats().max, roomMB: __room.stats().roomMB }) : null`);
  b.close();
  return r;
}

const all = {};
for (const [name, p] of Object.entries(PROFILES)) {
  if (pick.length && !pick.includes(name)) continue;
  const gl = await run(name, p, true), css = await run(name, p, false);
  const diff = {};
  for (const k of Object.keys(gl.shots)) if (css.shots[k]) diff[k] = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "diff.py"), css.shots[k], gl.shots[k], path.join(OUT, `${name}-${k}-diff.png`)]).toString()).over8;
  const same = {};
  for (const k of Object.keys(gl.steps)) {
    const a = gl.steps[k], c = css.steps[k];
    same[k] = a.desk === c.desk && a.focus === c.focus && a.arrived === c.arrived ? "=" : `gl ${a.desk}/${a.focus}/${a.arrived} css ${c.desk}/${c.focus}/${c.arrived}`;
  }
  all[name] = { gl, css, diff, same };
  log(name, `${p.w}×${p.h}@${p.dpr}`, "ready", gl.steps.home.ready, "failed", gl.steps.home.failed, "overflow gl/css", gl.steps.home.over, css.steps.home.over);
  log("  states (gl vs css)", JSON.stringify(same));
  log("  gl steps", JSON.stringify(Object.fromEntries(Object.entries(gl.steps).map(([k, s]) => [k, `${s.desk}/${s.focus ?? "-"}/${s.arrived ? "a" : "."}/pan ${s.pan}`]))));
  log("  drag moved gl/css", gl.steps.drag.moved, css.steps.drag.moved, "tapped", gl.tapped, css.tapped);
  log("  over8 vs legacy", JSON.stringify(diff), "gl stats", gl.stats);
  log("  errors gl", JSON.stringify(gl.errors), "css", JSON.stringify(css.errors));
}
fs.writeFileSync(path.join(OUT, "device.json"), JSON.stringify(all, null, 1));
log("→", path.join(OUT, "device.json"));
