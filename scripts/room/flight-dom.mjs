// What DOM still takes part in the room's picture while the camera travels
// (the M5 check for "flight = WebGL only"): mid-flight, every element in
// the stage, and every fixed layer over the window, that is drawn — not
// display:none, not visibility:hidden, opacity above 0, with a box in the
// window — except the canvas itself and its hidden hosts. The page's own
// chrome (header, index, footer) is listed apart.
//
//   node scripts/room/flight-dom.mjs http://localhost:3301 [night]
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const NIGHT = process.argv[3] === "night";
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 1 });
if (NIGHT) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,23,30).getTime()-O.now();class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}};window.Date=D;})()` });
const LIST = `(()=>{
  const drawn = (el) => { for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || +cs.opacity < 0.002) return false; } const cs = getComputedStyle(el); if (cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight; };
  const paints = (el) => { const cs = getComputedStyle(el); return el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'CANVAS' || el instanceof SVGSVGElement || cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none' || cs.backdropFilter !== 'none' || cs.mixBlendMode !== 'normal' || [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); };
  const name = (el) => el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined && el.className ? '.' + el.className.toString().trim().split(/\\s+/).slice(0, 2).join('.') : el.className && el.className.baseVal ? '.' + el.className.baseVal.split(' ')[0] : '');
  const stage = document.querySelector('.case-stage');
  const room = [...stage.querySelectorAll('*')].filter((e) => !e.closest('canvas') && drawn(e) && paints(e) && e.tagName !== 'CANVAS');
  const fixed = [...document.querySelectorAll('body *')].filter((e) => !stage.contains(e) && getComputedStyle(e).position === 'fixed' && drawn(e));
  const chrome = [...document.querySelectorAll('header, nav, .hero-aside, .desk-hint, footer')].filter(drawn);
  const top = (list) => list.filter((e) => !list.some((o) => o !== e && o.contains(e)));
  return JSON.stringify({ room: top(room).map(name), fixed: top(fixed).map((e) => name(e) + ' blend=' + getComputedStyle(e).mixBlendMode + ' op=' + getComputedStyle(e).opacity), chrome: top(chrome).map((e) => name(e) + (getComputedStyle(e.matches('.hero-aside') ? e : e).backdropFilter !== 'none' ? ' (backdrop-filter)' : '')), glass: [...document.querySelectorAll('*')].filter((e) => drawn(e) && (getComputedStyle(e).backdropFilter !== 'none' || getComputedStyle(e, '::before').backdropFilter !== 'none')).map(name) });
})()`;
await b.go(`${SITE}/?nointro&gl=1`, 2000);
for (let i = 0; i < 80 && !(await b.ev("!!document.documentElement.dataset.glZone")); i++) await sleep(100);
await sleep(3000);
const EV = { files: "kate:case-files", award: "kate:recognition", profile: "kate:profile", offduty: "kate:off-duty" };
for (const [from, to] of [["home", "files"], ["files", "award"], ["award", "profile"], ["profile", "offduty"], ["offduty", "home"]]) {
  await b.ev(to === "home" ? "history.back()" : `dispatchEvent(new Event('${EV[to]}'))`);
  await sleep(1000);
  const r = JSON.parse(await b.ev(LIST));
  log(`${from}→${to} mid-flight (rest: ${await b.ev("document.documentElement.dataset.glRest ?? 'none'")})`);
  log("  room DOM drawn:", r.room.length ? r.room.join(", ") : "none");
  log("  fixed layers:", r.fixed.length ? r.fixed.join(", ") : "none");
  log("  page chrome over the room:", r.chrome.join(", "), "| backdrop-filter:", r.glass.join(", ") || "none");
  await sleep(2500);
}
b.close();
