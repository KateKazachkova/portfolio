// Accessibility, the WebGL room against the legacy one: axe-core at home and
// at every stop (a desktop and a phone), and what a screen reader meets —
// the canvas hidden, every shown room control named, nothing focusable
// inside aria-hidden. Violations the WebGL room has that legacy has not are
// the ones that count.
//   node scripts/room/a11y.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const SIZES = { desktop: { w: 1512, h: 860, mobile: false }, phone: { w: 390, h: 844, mobile: true } };
const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };
let fails = 0;
const out = {};

async function audit(size, gl) {
  const s = SIZES[size];
  const b = await launch({ width: s.w, height: s.h });
  await b.send("Emulation.setDeviceMetricsOverride", { width: s.w, height: s.h, deviceScaleFactor: 2, mobile: s.mobile });
  await b.go(`${SITE}/?nointro&gl=${gl ? 1 : 0}`, 4500);
  await b.ev(AXE);
  const res = {};
  for (const stop of ["home", ...Object.keys(EV)]) {
    if (stop !== "home") { await b.ev(`dispatchEvent(new Event('${EV[stop]}'))`); await sleep(3400); }
    const r = JSON.parse(await b.ev(`axe.run(document, { resultTypes: ["violations"] }).then(r => JSON.stringify(r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0, 3).map(n => n.target.join(" ")) }))))`, 120000));
    const sr = JSON.parse(await b.ev(`JSON.stringify((() => {
      const c = document.querySelector(".room-canvas");
      const shown = [...document.querySelectorAll(".room-hit")].filter(e => !e.hidden && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden");
      const nameOf = e => (e.getAttribute("aria-label") || e.textContent || e.getAttribute("title") || "").trim();
      const focusable = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";
      const hiddenFocus = [...document.querySelectorAll("[aria-hidden='true']")].flatMap(h => [...h.querySelectorAll(focusable)].filter(e => !e.closest("[inert]") && e.getAttribute("tabindex") !== "-1" && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden").map(e => (e.className || e.tagName).toString().slice(0, 50)));
      return { canvasHidden: c ? c.getAttribute("aria-hidden") === "true" : null, controls: shown.length, unnamed: shown.filter(e => e.getAttribute("aria-hidden") !== "true" && !nameOf(e)).map(e => e.dataset.hit), hiddenFocus: hiddenFocus.slice(0, 5), hiddenFocusN: hiddenFocus.length };
    })())`));
    res[stop] = { axe: r, sr };
  }
  b.close();
  return res;
}

for (const size of Object.keys(SIZES)) {
  const gl = await audit(size, true), css = await audit(size, false);
  out[size] = { gl, css };
  for (const stop of Object.keys(gl)) {
    const legacy = new Map(css[stop].axe.map((v) => [v.id, v.n]));
    const extra = gl[stop].axe.filter((v) => (v.impact === "serious" || v.impact === "critical") && v.n > (legacy.get(v.id) ?? 0));
    const sr = gl[stop].sr;
    const bad = extra.length > 0 || sr.canvasHidden === false || sr.unnamed.length > 0 || sr.hiddenFocusN > css[stop].sr.hiddenFocusN;
    if (bad) fails++;
    log(bad ? "FAIL" : "ok  ", size, stop, "axe gl", JSON.stringify(gl[stop].axe.map((v) => `${v.id}:${v.impact}:${v.n}`)), "css", JSON.stringify(css[stop].axe.map((v) => `${v.id}:${v.impact}:${v.n}`)),
      "| canvas hidden", sr.canvasHidden, "controls", sr.controls, "unnamed", JSON.stringify(sr.unnamed), "hidden-focusable gl/css", sr.hiddenFocusN, css[stop].sr.hiddenFocusN);
    for (const v of extra) log("     +", v.id, v.impact, v.n, JSON.stringify(v.t));
    if (sr.hiddenFocusN) log("     hidden focusable:", JSON.stringify(sr.hiddenFocus));
  }
}
fs.mkdirSync(path.join(TESTS, "a11y"), { recursive: true });
fs.writeFileSync(path.join(TESTS, "a11y", "a11y.json"), JSON.stringify(out, null, 1));
log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
