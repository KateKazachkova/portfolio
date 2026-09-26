// The M3 spike's controls, checked: pointer (a click inside and just outside
// each outline), hover (the ribbon's label, the trophy's pointer), keyboard
// (Tab reaches them only at their stop, Enter uses them, Escape leaves), and
// what a screen reader is given (the accessibility tree). Screenshots of the
// focus rings and the label for the report.
//
//   node scripts/room/hits-test.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m3");
fs.mkdirSync(OUT, { recursive: true });
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
let fails = 0;
const ok = (c, label, extra = "") => { if (!c) fails++; log(c ? "ok  " : "FAIL", label, extra); };
const newTabs = [];
await b.send("Target.setDiscoverTargets", { discover: true });
b.handlers.add((m) => { if ((m.method === "Target.targetCreated" || m.method === "Target.targetInfoChanged") && m.params.targetInfo.type === "page" && m.params.targetInfo.url) newTabs.push(m.params.targetInfo.url); });
const mouse = async (type, x, y) => b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1 });
const click = async (x, y) => { await mouse("mouseMoved", x, y); await mouse("mousePressed", x, y); await mouse("mouseReleased", x, y); };
// (Enter carries its text: a button is pressed by the keypress it makes)
const key = async (k, code) => { await b.send("Input.dispatchKeyEvent", { type: "keyDown", ...(k === "Enter" ? { text: "\r", unmodifiedText: "\r" } : {}), key: k, code: code ?? k, windowsVirtualKeyCode: { Tab: 9, Enter: 13, Escape: 27 }[k] }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: code ?? k, windowsVirtualKeyCode: { Tab: 9, Enter: 13, Escape: 27 }[k] }); };
const rect = (id) => b.ev(`(()=>{const e=document.querySelector('.room-hit--${id}');if(!e||e.hidden)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,clip:e.style.clipPath,tab:e.tabIndex})})()`).then((r) => (r ? JSON.parse(r) : null));
const st = () => b.ev(`JSON.stringify({desk:document.documentElement.dataset.desk??null,focus:document.documentElement.dataset.deskFocus??null,arrived:document.documentElement.dataset.deskArrived??null,active:document.activeElement&&document.activeElement.className, ptr: document.documentElement.classList.contains('room-pointer')})`).then(JSON.parse);

await b.go(`${SITE}/?nointro&gl=1`, 4000);
await sleep(1500);
// ── home: the trophy, by its silhouette ──
const tro = await b.ev(`(()=>{const h=window.__room;return 1})()`);
void tro;
const tr = await rect("trophy");
ok(!!tr, "home: trophy control present", JSON.stringify(tr));
if (tr) {
  // the mask's own centre line: the base (bottom tenth, opaque) and a gap
  // in the lattice (top left corner of its box: transparent)
  // (inside the window: the trophy runs past its right edge at this size)
  const bx = Math.min(tr.x + tr.w * 0.5, 1500), by = tr.y + tr.h * 0.93;
  await mouse("mouseMoved", bx, by); await sleep(150);
  ok((await st()).ptr, "home: pointer over the trophy's base shows the hand");
  await mouse("mouseMoved", tr.x + 3, tr.y + 3); await sleep(150);
  ok(!(await st()).ptr, "home: pointer over the transparent corner of its box does not");
  await click(tr.x + 3, tr.y + 3); await sleep(600);
  ok((await st()).desk !== "award", "home: click on the transparent corner does nothing");
  await click(bx, by); await sleep(3200);
  ok((await st()).desk === "award", "home: click on the trophy goes to Recognition");
}
// ── Recognition: the certificate (a link) and a ribbon (hover label) ──
if ((await st()).desk !== "award") { await b.ev(`dispatchEvent(new Event('kate:recognition'))`); await sleep(3200); }
const ce = await rect("cert"), ri = await rect("ribbon");
ok(!!ce && ce.tab === 0, "award: certificate control present and tabbable", JSON.stringify(ce));
ok(!!ri && ri.tab === 0, "award: ribbon control present and tabbable", JSON.stringify(ri));
if (ri) {
  await mouse("mouseMoved", ri.x + ri.w / 2, ri.y + ri.h / 2); await sleep(400);
  const lab = JSON.parse(await b.ev(`(()=>{const l=document.querySelector('.room-hit__label');const r=l.getBoundingClientRect();return JSON.stringify({op:getComputedStyle(l).opacity,x:r.x,y:r.y,w:r.width,text:l.textContent})})()`));
  ok(+lab.op > 0.9 && lab.y > ri.y + ri.h * 0.9, "award: hovering the ribbon shows its label under it", JSON.stringify(lab));
  await b.shot(path.join(OUT, "award-ribbon-hover.png"), { x: ri.x - 150, y: ri.y - 40, width: 340, height: ri.h + 120, scale: 1 });
  await mouse("mouseMoved", 10, 10); await sleep(300);
}
// keyboard: Tab through the page until the certificate has focus, Enter opens it
await b.ev("document.activeElement && document.activeElement.blur(); document.body.focus()");
let reached = [];
for (let i = 0; i < 30; i++) {
  await key("Tab"); await sleep(60);
  const a = await b.ev("document.activeElement ? document.activeElement.className + '|' + (document.activeElement.getAttribute('aria-label')||document.activeElement.textContent.trim().slice(0,30)) : ''");
  reached.push(a);
}
ok(reached.some((a) => a.includes("room-hit--cert")), "award: Tab reaches the certificate", reached.filter((a) => a.includes("room-hit")).join(" → "));
ok(reached.some((a) => a.includes("room-hit--ribbon")), "award: Tab reaches the ribbon on the way");
ok(!reached.some((a) => a.includes("room-hit--bike") || a.includes("room-hit--trophy")), "award: other stops' controls are not in the tab order");
const labF = JSON.parse(await b.ev(`JSON.stringify({op: getComputedStyle(document.querySelector('.room-hit__label')).opacity})`));
await b.shot(path.join(OUT, "award-cert-focus.png"), ce ? { x: ce.x - 20, y: ce.y - 20, width: Math.min(ce.w + 40, 1500 - ce.x), height: ce.h + 40, scale: 1 } : undefined);
await b.ev("document.querySelector('.room-hit--cert').focus()");
const before = newTabs.length;
await key("Enter"); await sleep(1500);
ok(newTabs.length > before && newTabs.some((u) => u.includes("cert-indigo")), "award: Enter on the certificate opens it in a new tab", newTabs.slice(-1)[0] ?? "");
void labF;
// the new tab took the front: bring the page back (a hidden page draws no frames)
await b.send("Page.bringToFront"); await sleep(500);
// ── the accessibility tree: names and roles ──
const ax = await b.send("Accessibility.getFullAXTree");
const nodes = (ax.result?.nodes ?? []).filter((n) => !n.ignored).map((n) => `${n.role?.value}: ${n.name?.value ?? ""}`);
const want = ["link: Indigo Design Award — Women in Design, shortlisted 2026 (certificate)", "link: Ukrainska 15: MUSE Creative Awards"];
for (const w of want) ok(nodes.some((n) => n.startsWith(w)), `award: screen reader gets "${w.slice(0, 60)}…"`);
fs.writeFileSync(path.join(OUT, "ax-award.txt"), nodes.join("\n"));
// Escape leaves the stop
await key("Escape"); await sleep(3200);
ok((await st()).desk === "closed", "award: Escape goes home");
// ── Off Duty: the bike computer, a quad in perspective ──
await b.ev(`dispatchEvent(new Event('kate:off-duty'))`); await sleep(3200);
const bi = await rect("bike");
ok(!!bi && bi.clip.startsWith("polygon"), "offduty: bike control clipped to its projected outline", bi?.clip.slice(0, 80));
if (bi) {
  // its box's corner is outside a rotated quad: a click there does nothing
  await click(bi.x + 2, bi.y + 2); await sleep(700);
  ok((await st()).focus !== "bike", "offduty: click in its box but outside its outline does nothing");
  await click(bi.x + bi.w / 2, bi.y + bi.h / 2); await sleep(1800);
  ok((await st()).focus === "bike", "offduty: click on the unit brings the camera down to it");
  await b.shot(path.join(OUT, "offduty-bike.png"));
  await key("Escape"); await sleep(1800);
  ok((await st()).focus === null, "offduty: Escape brings it back up");
  // the keyboard: focus the unit, Enter
  await b.ev("document.querySelector('.room-hit--bike').focus()");
  await b.shot(path.join(OUT, "offduty-bike-focus.png"), { x: bi.x - 30, y: bi.y - 30, width: bi.w + 60, height: bi.h + 60, scale: 1 });
  await key("Enter"); await sleep(1800);
  ok((await st()).focus === "bike", "offduty: Enter on the focused unit does the same");
}
// ── in flight: nothing to click or focus ──
await key("Escape"); await sleep(1600);
await b.ev(`dispatchEvent(new Event('kate:recognition'))`); await sleep(700);
const mid = await b.ev(`JSON.stringify([...document.querySelectorAll('.room-hit')].filter(e=>!e.hidden).map(e=>e.className))`);
ok(mid === "[]", "flight: no control is shown or focusable while the camera moves", mid);
log(fails ? `${fails} FAILED` : "all passed");
b.close();
process.exit(fails ? 1 : 0);
