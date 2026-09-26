// The WebGL room's camera follows the page's own navigation: every stop,
// Back and Forward, Escape, the arrow keys' pan, direct visits and resizes.
// Checks html[data-desk…], the URL, the engine's view and that it says it
// has arrived (data-desk-arrived), at each step.
//
//   node scripts/room/nav-test.mjs http://localhost:3301
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const b = await launch({ width: 1440, height: 900, dpr: 1 });
let fails = 0;
const state = async () => JSON.parse(await b.ev(`JSON.stringify({desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.dataset.deskArrived ?? null, focus: document.documentElement.dataset.deskFocus ?? null, hash: location.hash, view: window.__room && window.__room.stats().view, pan: parseFloat(document.querySelector('.scene-cam').style.getPropertyValue('--pan'))||0, css3d: !!document.querySelector('.desk-world'), canvas: !!document.querySelector('.room-canvas')})`));
const expect = async (label, want) => {
  const s = await state();
  const bad = Object.entries(want).filter(([k, v]) => (typeof v === "function" ? !v(s[k]) : s[k] !== v));
  if (bad.length) { fails++; log("FAIL", label, JSON.stringify(s), "wanted", JSON.stringify(want, (k, v) => (typeof v === "function" ? String(v) : v))); }
  else log("ok  ", label, JSON.stringify(s));
};
const key = (k) => b.ev(`dispatchEvent(new KeyboardEvent('keydown',{key:'${k}'}))`);
const ev = (e) => b.ev(`dispatchEvent(new Event('${e}'))`);

await b.go(`${SITE}/?nointro&gl=1`, 3500);
await expect("home", { desk: (d) => d === null || d === "closed", view: "home", hash: "", css3d: false, canvas: true });
await ev("kate:case-files"); await sleep(3000);
await expect("case files", { desk: "open", arrived: "1", view: "files", hash: "#case-files" });
await key("ArrowRight"); await key("ArrowRight"); await sleep(1200);
await expect("pan right", { view: "files", pan: (p) => p > 300 });
await key("ArrowLeft"); await sleep(1200);
await expect("pan left", { pan: (p) => p > 100 && p < 400 });
await ev("kate:recognition"); await sleep(3000);
await expect("to recognition (same entry)", { desk: "award", arrived: "1", view: "award", hash: "#recognition", pan: 0 });
await b.ev("history.back()"); await sleep(3200);
await expect("Back → home", { desk: "closed", view: "home", hash: "", arrived: null });
await b.ev("history.forward()"); await sleep(3200);
await expect("Forward → recognition", { desk: "award", view: "award", arrived: "1" });
await key("Escape"); await sleep(3200);
await expect("Escape → home", { desk: "closed", view: "home" });
await ev("kate:off-duty"); await sleep(3000);
await b.ev("document.documentElement.dataset.deskFocus='bike'"); await sleep(1800);
await expect("bike", { desk: "offduty", focus: "bike", view: "bike" });
await key("Escape"); await sleep(1800);
await expect("Escape → off duty", { desk: "offduty", focus: null, view: "offduty" });
// resize at a stop: the camera stays on it
await b.metrics(1200, 800, 1); await sleep(800);
await expect("resize at off duty", { desk: "offduty", view: "offduty" });
await b.metrics(1440, 900, 1); await sleep(800);
await key("Escape"); await sleep(3200);
await expect("Escape → home", { desk: "closed", view: "home" });
// the KATE™ wordmark from a stop
await ev("kate:profile"); await sleep(3000);
await b.ev(`(()=>{const a=[...document.querySelectorAll('a[href="/"]')][0]; a && a.click(); return !!a})()`); await sleep(3200);
await expect("wordmark → home", { desk: "closed", view: "home" });
// direct visits
for (const [hash, desk, view] of [["#case-files", "open", "files"], ["#recognition", "award", "award"], ["#profile", "profile", "profile"], ["#off-duty", "offduty", "offduty"]]) {
  await b.go(`${SITE}/?nointro&gl=1${hash}`, 3500);
  await expect(`direct ${hash}`, { desk, view, arrived: "1", hash });
  await key("Escape"); await sleep(3200);
  await expect(`direct ${hash} → Escape`, { desk: "closed", view: "home", hash: "" });
}
// the flag off: the legacy room, untouched
await b.go(`${SITE}/?nointro&gl=0`, 3000);
await expect("?gl=0 legacy", { css3d: true, canvas: false });
log(fails ? `${fails} FAILED` : "all passed");
b.close();
process.exit(fails ? 1 : 0);
