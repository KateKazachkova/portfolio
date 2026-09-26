// The WebGL room's controls (components/room/hits.ts), checked against the
// legacy CSS room and on their own: where each lies at its stop (its box
// against the legacy element's, in the same window), pointer (a click
// inside and just outside an outline), hover (labels, the trophy's
// pointer), keyboard (Tab reaches them only at their stop, Enter uses
// them, Escape leaves), and what a screen reader is given (the
// accessibility tree). Screenshots for the report.
//
//   node scripts/room/hits-test.mjs http://localhost:3301 [only]
// only: a comma list of sections (parity, trophy, award, offduty, bike, flight)
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const ONLY = process.argv[3]?.split(",");
const run = (s) => !ONLY || ONLY.includes(s);
const OUT = path.join(process.env.HOME, "Documents/portfolio-offload/webgl-m3");
fs.mkdirSync(OUT, { recursive: true });
const HITS = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../public/room/hits.json"), "utf8")).hits;
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.send("Emulation.setFocusEmulationEnabled", { enabled: true });
let fails = 0;
const ok = (c, label, extra = "") => { if (!c) fails++; log(c ? "ok  " : "FAIL", label, extra); };
const newTabs = [];
await b.send("Target.setDiscoverTargets", { discover: true });
b.handlers.add((m) => { if ((m.method === "Target.targetCreated" || m.method === "Target.targetInfoChanged") && m.params.targetInfo.type === "page" && m.params.targetInfo.url) newTabs.push(m.params.targetInfo.url); });
const mouse = async (type, x, y) => b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1 });
const click = async (x, y) => { await mouse("mouseMoved", x, y); await mouse("mousePressed", x, y); await mouse("mouseReleased", x, y); };
const VK = { Tab: 9, Enter: 13, Escape: 27, " ": 32, ArrowLeft: 37, ArrowRight: 39 };
// (Enter carries its text: a button is pressed by the keypress it makes)
const key = async (k, code) => { await b.send("Input.dispatchKeyEvent", { type: "keyDown", ...(k === "Enter" ? { text: "\r", unmodifiedText: "\r" } : {}), key: k, code: code ?? k, windowsVirtualKeyCode: VK[k] }); await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: code ?? k, windowsVirtualKeyCode: VK[k] }); };
const rect = (id) => b.ev(`(()=>{const e=document.querySelector('.room-hit[data-hit="${id}"]');if(!e||e.hidden)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,clip:e.style.clipPath,tab:e.tabIndex})})()`).then((r) => (r ? JSON.parse(r) : null));
const st = () => b.ev(`JSON.stringify({desk:document.documentElement.dataset.desk??null,focus:document.documentElement.dataset.deskFocus??null,arrived:document.documentElement.dataset.deskArrived??null,active:document.activeElement&&document.activeElement.className, hit: document.activeElement?.dataset?.hit ?? null, ptr: document.documentElement.classList.contains('room-pointer'), path: location.pathname + location.hash, mark: !!window.__mark})`).then(JSON.parse);
// until a condition holds in the page (a flight may first wait up to 1.5 s for its pictures)
// (a headed window can still be hidden by the system — another Space, a
// window over it — and a hidden page draws no frames: bring it back)
const front = async () => { if ((await b.ev("document.visibilityState")) === "hidden") { await b.send("Page.bringToFront"); await sleep(300); } };
const until = async (x, ms = 7000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await b.ev(`!!(${x})`)) return true; await front(); await sleep(100); } return false; };
const PLACED = "document.documentElement.dataset.glReady && [...document.querySelectorAll('.room-hit')].some(e=>!e.hidden)";
const arrive = async (desk) => {
  // (home: html[data-desk] is "closed" once the camera has been away, unset before)
  const a = await until(desk === "closed" ? "!document.documentElement.dataset.desk || document.documentElement.dataset.desk === 'closed'" : `document.documentElement.dataset.desk===${JSON.stringify(desk)} && document.documentElement.dataset.deskArrived`);
  const p = await until(PLACED, 3000);
  if (!a || !p) log("  (not there:", desk, JSON.stringify(await st()), await b.ev("JSON.stringify((({view,frames,pending,waits})=>({view,frames,pending,waits,vis:document.visibilityState}))(window.__room.stats()))"), ")");
  await sleep(200);
};
const DESK = { home: "closed", files: "open", award: "award", offduty: "offduty", profile: "profile", bike: "offduty" };
const EVENT = { files: "kate:case-files", award: "kate:recognition", offduty: "kate:off-duty", profile: "kate:profile", bike: "kate:off-duty" };
// the stops below a stop: down over the bike computer
const FOCUS = { bike: "bike" };
const shown = (id) => `(e=>e&&!e.hidden)(document.querySelector('.room-hit[data-hit="${id}"]'))`;
const goto = async (gl, stop) => {
  await b.go(`${SITE}/?nointro&gl=${gl}`, 1500);
  if (gl) await until("document.documentElement.dataset.glZone");
  if (stop !== "home") await b.ev(`dispatchEvent(new Event('${EVENT[stop]}'))`);
  if (gl) await arrive(DESK[stop]); else await sleep(stop === "home" ? 1500 : 3400);
  if (FOCUS[stop]) {
    await b.ev(`document.documentElement.dataset.deskFocus = ${JSON.stringify(FOCUS[stop])}`);
    if (gl) await until(shown(HITS.find((h) => h.at.includes(stop)).id)); else await sleep(1800);
  }
};
// every control whose Tab stop is reached from the page's top, in order
const tabWalk = async (n = 60) => {
  await b.ev("document.activeElement && document.activeElement.blur(); document.body.focus()");
  const seen = [];
  for (let i = 0; i < n; i++) { await key("Tab"); await sleep(40); seen.push(await b.ev("document.activeElement?.dataset?.hit ?? (document.activeElement ? document.activeElement.className : '')")); }
  return seen;
};

// ── parity: each control's box at its stop against the legacy element's ──
if (run("parity")) {
  const stops = [...new Set(HITS.flatMap((h) => h.at))];
  for (const stop of stops) {
    const here = HITS.filter((h) => h.at.includes(stop));
    await goto(0, stop);
    const legacy = JSON.parse(await b.ev(`JSON.stringify(${JSON.stringify(here.map((h) => [h.id, h.of.sel, h.of.i]))}.map(([id,s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)return [id,null];const r=e.getBoundingClientRect();return [id,[r.x,r.y,r.width,r.height]]}))`));
    await goto(1, stop);
    let worst = 0, worstId = "", missing = [];
    for (const [id, l] of legacy) {
      const g = await rect(id);
      if (!l || !g) { missing.push(id); continue; }
      // the part of each inside the window (the legacy box runs on past it)
      const clipX = (x, w) => [Math.max(0, x), Math.min(1512, x + w)], clipY = (y, h) => [Math.max(0, y), Math.min(860, y + h)];
      const [lx0, lx1] = clipX(l[0], l[2]), [ly0, ly1] = clipY(l[1], l[3]), [gx0, gx1] = clipX(g.x, g.w), [gy0, gy1] = clipY(g.y, g.h);
      const d = Math.max(Math.abs(lx0 - gx0), Math.abs(lx1 - gx1), Math.abs(ly0 - gy0), Math.abs(ly1 - gy1));
      if (d > worst) { worst = d; worstId = id; }
    }
    ok(!missing.length, `parity ${stop}: every control there (${here.length})`, missing.join(" "));
    ok(worst <= 2, `parity ${stop}: boxes within 2 px of the legacy elements'`, `worst ${worst.toFixed(2)} px (${worstId})`);
  }
}

await goto(1, "home");
// ── home: the trophy, by its silhouette ──
if (run("trophy")) {
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
    await click(bx, by); await arrive("award");
    ok((await st()).desk === "award", "home: click on the trophy goes to Recognition");
  }
}
// ── Recognition: every ribbon (a link to its case, or just its label) and the certificate ──
if (run("award")) {
  if ((await st()).desk !== "award") { await b.ev(`dispatchEvent(new Event('kate:recognition'))`); await arrive("award"); }
  const ribbons = HITS.filter((h) => h.type === "ribbon");
  const shown = JSON.parse(await b.ev(`JSON.stringify([...document.querySelectorAll('.room-hit--ribbon')].filter(e=>!e.hidden&&e.tabIndex===0).map(e=>[e.dataset.hit,e.tagName,e.getAttribute('href')]))`));
  ok(shown.length === ribbons.length, `award: all ${ribbons.length} ribbons present and tabbable`, `${shown.length}`);
  ok(ribbons.every((h) => shown.some(([id, tag, href]) => id === h.id && tag === (h.kind === "link" ? "A" : "SPAN") && (href ?? null) === (h.href ?? null))), "award: each a link to its case, or a span where there is none");
  // hover: each ribbon's own label, under it
  let labelled = 0;
  for (const h of ribbons) {
    const r = await rect(h.id);
    if (!r) continue;
    await mouse("mouseMoved", r.x + r.w / 2, r.y + r.h / 2);
    // (its fade is .2 s)
    const shownLab = await until(`(l=>+getComputedStyle(l).opacity>0.9 && l.getBoundingClientRect().y > ${r.y + r.h * 0.9} && l.textContent===${JSON.stringify(h.hover)})(document.querySelector('.room-hit[data-hit="${h.id}"] + .room-hit__label'))`, 1500);
    if (shownLab) labelled++; else log("  no label", h.id);
    if (h.id === "ribbon-0") await b.shot(path.join(OUT, "award-ribbon-hover.png"), { x: r.x - 150, y: r.y - 40, width: 340, height: r.h + 120, scale: 1 });
  }
  ok(labelled === ribbons.length, "award: hovering each ribbon shows its own label under it", `${labelled}/${ribbons.length}`);
  await mouse("mouseMoved", 10, 10); await sleep(300);
  const ce = await rect("cert");
  ok(!!ce && ce.tab === 0, "award: certificate control present and tabbable", JSON.stringify(ce));
  // keyboard: the ribbons in their order, then the certificate
  const reached = await tabWalk(70);
  // (once round: the walk may wrap back to the page's top)
  const order = reached.filter((a) => HITS.some((h) => h.id === a)).filter((a, i, all) => all.indexOf(a) === i);
  ok(order.join() === [...ribbons.map((h) => h.id), "cert"].join(), "award: Tab goes through the ribbons in order, then the certificate", `${order.length} stops`);
  ok(!reached.some((a) => a === "bike" || a === "trophy"), "award: other stops' controls are not in the tab order");
  // a focused span shows its label too
  const span = ribbons.find((h) => h.kind === "span");
  if (span) {
    // (focus-visible wants the keyboard: Tab to it)
    await b.ev("document.activeElement && document.activeElement.blur(); document.body.focus()");
    for (let i = 0; i < 70 && (await b.ev("document.activeElement?.dataset?.hit ?? ''")) !== span.id; i++) await key("Tab");
    await sleep(300);
    const lf = JSON.parse(await b.ev(`JSON.stringify({hit: document.activeElement.dataset.hit, op: getComputedStyle(document.querySelector('.room-hit[data-hit="${span.id}"] + .room-hit__label')).opacity})`));
    ok(lf.hit === span.id && +lf.op > 0.9, "award: a ribbon with no case yet, focused by Tab, shows its label", JSON.stringify(lf));
    const r = await rect(span.id);
    await b.shot(path.join(OUT, "award-span-focus.png"), { x: r.x - 150, y: r.y - 40, width: 340, height: r.h + 120, scale: 1 });
    await click(r.x + r.w / 2, r.y + r.h / 2); await sleep(800);
    ok((await st()).path === "/#recognition", "award: clicking it goes nowhere", (await st()).path);
  }
  const shots = await rect("cert");
  await b.shot(path.join(OUT, "award-cert-focus.png"), shots ? { x: shots.x - 20, y: shots.y - 20, width: Math.min(shots.w + 40, 1500 - shots.x), height: shots.h + 40, scale: 1 } : undefined);
  // the accessibility tree: names and roles
  const ax = await b.send("Accessibility.getFullAXTree");
  const nodes = (ax.result?.nodes ?? []).filter((n) => !n.ignored).map((n) => `${n.role?.value}: ${n.name?.value ?? ""}`);
  fs.writeFileSync(path.join(OUT, "ax-award.txt"), nodes.join("\n"));
  ok(nodes.some((n) => n === "link: Indigo Design Award — Women in Design, shortlisted 2026 (certificate)"), "award: screen reader gets the certificate");
  const named = ribbons.filter((h) => h.kind === "link" && nodes.includes(`link: ${h.label}`)).length;
  ok(named === ribbons.filter((h) => h.kind === "link").length, "award: screen reader gets every ribbon link by its name", `${named}`);
  // Enter on the certificate opens it in a new tab
  await b.ev("document.querySelector('.room-hit--cert').focus()");
  const before = newTabs.length;
  await key("Enter"); await sleep(1500);
  ok(newTabs.length > before && newTabs.some((u) => u.includes("cert-indigo")), "award: Enter on the certificate opens it in a new tab", newTabs.slice(-1)[0] ?? "");
  // the new tab took the front: bring the page back (a hidden page draws no frames)
  await b.send("Page.bringToFront"); await sleep(500);
  // a ribbon's link goes to its case on the client (the page is not reloaded)
  await b.ev("window.__mark = 1");
  const r0 = await rect("ribbon-0");
  await click(r0.x + r0.w / 2, r0.y + r0.h / 2); await sleep(2500);
  const s1 = await st();
  ok(s1.path === "/work/ukrainska-15" && s1.mark, "award: a click on a ribbon opens its case, client-side", JSON.stringify({ path: s1.path, same: s1.mark }));
  await b.ev("history.back()"); await arrive("award");
  const s2 = await st();
  ok(s2.desk === "award" && !!(await rect("ribbon-0")), "award: Back returns to the wall, its controls there", s2.path);
  // Enter on a focused ribbon does the same
  await b.ev("window.__mark = 1; document.querySelector('.room-hit[data-hit=\"ribbon-10\"]').focus()");
  await key("Enter"); await sleep(2500);
  const s3 = await st();
  ok(s3.path === "/work/waypro" && s3.mark, "award: Enter on a focused ribbon opens its case, client-side", s3.path);
  await b.go(`${SITE}/?nointro&gl=1#recognition`, 1500); await arrive("award");
  // Escape leaves the stop
  await key("Escape"); await arrive("closed");
  ok((await st()).desk === "closed", "award: Escape goes home");
}
// ── Off Duty: the bike computer, a quad in perspective ──
if (run("offduty")) {
  if ((await st()).desk !== "offduty") { await b.ev(`dispatchEvent(new Event('kate:off-duty'))`); await arrive("offduty"); }
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
    await key("Escape"); await sleep(1600);
  }
}
// ── down over the bike computer: its buttons page through the screens ──
if (run("bike")) {
  await goto(1, "offduty");
  // the keyboard's way down: Enter on the unit, and the first button has focus there
  await b.ev("document.querySelector('.room-hit--bike').focus()"); await sleep(150);
  await key("Enter");
  await until(shown("bike-prev"));
  await sleep(300);
  let s = await st();
  ok(s.focus === "bike" && s.hit === "bike-prev", "bike: Enter on the unit brings the camera down, focus on its first button", JSON.stringify({ focus: s.focus, hit: s.hit }));
  // (the walk starts from where focus was: read it as a loop, from the first)
  const walk = (await tabWalk(40)).filter((a) => a.startsWith("bike"));
  const reached = walk.slice(walk.indexOf("bike-prev")).filter((a, i, all) => all.indexOf(a) === i);
  ok(reached.join() === "bike-prev,bike-strava,bike-next", "bike: Tab goes back, Strava, next (the unit itself is not a stop)", reached.join());
  await until("document.querySelector('.room-live').textContent.startsWith('Totals')");
  const words = () => b.ev("document.querySelector('.room-live').textContent");
  const href = () => b.ev("document.querySelector('.room-hit--bike-strava').href");
  const w0 = await words();
  ok(/^Totals: \d+ km over \d+ rides/.test(w0), "bike: the screen's words for a screen reader, the totals first", w0);
  ok((await href()).endsWith("/athletes/52565503"), "bike: Strava opens the profile on the totals");
  const nx = await rect("bike-next"), pv = await rect("bike-prev");
  await click(nx.x + nx.w / 2, nx.y + nx.h / 2); await sleep(200);
  const w1 = await words();
  ok(/^Longest ride 1 of \d+/.test(w1), "bike: Next shows the longest ride", w1);
  ok(/\/activities\/\d+$/.test(await href()), "bike: Strava opens that ride", await href());
  await click(pv.x + pv.w / 2, pv.y + pv.h / 2); await sleep(200);
  ok((await words()).startsWith("Totals"), "bike: Back returns to the totals");
  await click(pv.x + pv.w / 2, pv.y + pv.h / 2); await sleep(200);
  const n = (await words()).match(/of (\d+)/)?.[1];
  ok(!!n && (await words()).startsWith(`Longest ride ${n} of ${n}`), "bike: Back from the totals wraps to the last ride", await words());
  // a click on the unit, off its buttons, goes on to the next
  const un = await rect("bike-unit");
  await click(un.x + un.w * 0.5, un.y + un.h * 0.35); await sleep(200);
  ok((await words()).startsWith("Totals"), "bike: a click on the screen goes on to the next", await words());
  await key("ArrowRight"); await sleep(100);
  ok((await words()).startsWith("Longest ride 1"), "bike: → pages on");
  await key("ArrowLeft"); await sleep(100);
  ok((await words()).startsWith("Totals"), "bike: ← pages back");
  const ax = await b.send("Accessibility.getFullAXTree");
  const nodes = (ax.result?.nodes ?? []).filter((x) => !x.ignored).map((x) => `${x.role?.value}: ${x.name?.value ?? ""}`);
  fs.writeFileSync(path.join(OUT, "ax-bike.txt"), nodes.join("\n"));
  ok(["button: Previous screen", "link: Open on Strava", "button: Next screen"].every((w) => nodes.includes(w)) && !nodes.some((x) => x.startsWith("button: Off Duty")), "bike: screen reader gets its three buttons, not the unit twice");
  await b.shot(path.join(OUT, "bike-buttons.png"));
  // a click on Strava opens it in a new tab
  const before = newTabs.length;
  const sv = await rect("bike-strava");
  await click(sv.x + sv.w / 2, sv.y + sv.h / 2); await sleep(1500);
  ok(newTabs.length > before && newTabs.slice(before).some((u) => u.includes("strava.com")), "bike: Strava opens in a new tab", newTabs.slice(-1)[0] ?? "");
  await b.send("Page.bringToFront"); await sleep(400);
  await key("Escape"); await until(shown("bike"));
  ok((await st()).focus === null, "bike: Escape brings the camera back up");
}
// ── in flight: nothing to click or focus ──
if (run("flight")) {
  await goto(1, "home");
  await b.ev(`dispatchEvent(new Event('kate:recognition'))`); await sleep(700);
  const mid = await b.ev(`JSON.stringify([...document.querySelectorAll('.room-hit')].filter(e=>!e.hidden).map(e=>e.dataset.hit))`);
  ok(mid === "[]", "flight: no control is shown or focusable while the camera moves", mid);
}
log(fails ? `${fails} FAILED` : "all passed");
b.close();
process.exit(fails ? 1 : 0);
