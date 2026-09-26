// The WebGL room's controls (components/room/hits.ts), checked against the
// legacy CSS room and on their own: where each lies at its stop (its box
// against the legacy element's, in the same window), pointer (a click
// inside and just outside an outline), hover (labels, the trophy's
// pointer), keyboard (Tab reaches them only at their stop, Enter uses
// them, Escape leaves), and what a screen reader is given (the
// accessibility tree). Screenshots for the report.
//
//   node scripts/room/hits-test.mjs http://localhost:3301 [only]
// only: a comma list of sections (parity, trophy, award, offduty, bike, wallet, files, binder, lcd, flight)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
const rect = (id) => b.ev(`(()=>{const e=document.querySelector('${sel(id)}');if(!e||e.hidden)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,clip:e.style.clipPath,tab:e.tabIndex})})()`).then((r) => (r ? JSON.parse(r) : null));
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
  // (a stop with no controls of its own — Profile, till M4 — has nothing to wait for)
  const view = { closed: "home", open: "files" }[desk] ?? desk;
  const p = HITS.some((h) => h.at.includes(view)) ? await until(PLACED, 3000) : true;
  if (!a || !p) log("  (not there:", desk, JSON.stringify(await st()), await b.ev("JSON.stringify((({view,frames,pending,waits})=>({view,frames,pending,waits,vis:document.visibilityState}))(window.__room.stats()))"), ")");
  await sleep(200);
};
const DESK = { home: "closed", files: "open", award: "award", offduty: "offduty", profile: "profile", bike: "offduty" };
const EVENT = { files: "kate:case-files", award: "kate:recognition", offduty: "kate:off-duty", profile: "kate:profile", bike: "kate:off-duty" };
// the stops below a stop: down over the bike computer
const FOCUS = { bike: "bike" };
// Ukrainska 15's own controls are the page's, on its panel (M6, RoomU15.tsx)
const PANEL = { u15: ".u15-hit", player: ".desk-player", "u15-tag": ".u15-tag" };
const sel = (id) => (PANEL[id] ? `.room-hit--u15panel:not([data-away]) ${PANEL[id]}` : `.room-hit[data-hit="${id}"]`);
const shown = (id) => PANEL[id]
  ? `(e=>!!e&&+getComputedStyle(e).opacity>0.5&&getComputedStyle(e).visibility!=='hidden')(document.querySelector('${sel(id)}'))`
  : `(e=>e&&!e.hidden)(document.querySelector('.room-hit[data-hit="${id}"]'))`;
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
  for (let i = 0; i < n; i++) { await key("Tab"); await sleep(40); seen.push(await b.ev("(a=>a?.dataset?.hit ?? (a?.closest?.('.room-hit--u15panel') ? (a.classList.contains('u15-hit') ? 'u15' : a.classList.contains('desk-player') ? 'player' : a.classList.contains('u15-tag') ? 'u15-tag' : a.className) : a ? a.className : ''))(document.activeElement)")); }
  return seen;
};

// ── parity: each control's box at its stop against the legacy element's ──
// (Case Files once with no case in focus, and once with each laid out)
const FOCI = ["ukrainska-15", "bulksource", "onsisoft", "waypro"];
const layOut = async (gl, f) => {
  if (gl) await b.ev(`document.querySelector('${f === "ukrainska-15" ? sel("u15") : sel(`case-${f}`)}').click()`);
  else if (f === "ukrainska-15") await b.ev("document.querySelector('.u15-hit').click()");
  else await b.ev(`document.querySelector('.desk-card[data-slug="${f}"]').click()`);
  // (the legacy parts slide out over 1.2 s; the WebGL controls are there at once)
  // (Ukrainska 15 slides aside in .6 s in both, its panel back after)
  await sleep(gl ? 1200 : 1800);
};
if (run("parity")) {
  const stops = [...new Set(HITS.flatMap((h) => h.at))];
  for (const stop of stops) for (const f of stop === "files" ? [null, ...FOCI] : [null]) {
    const here = HITS.filter((h) => h.at.includes(stop) && !["dvd", "pf", "u15", "u15-tag", "player"].includes(h.type)
      && (h.focus === undefined || h.focus === f) && (h.notFocus === undefined || h.notFocus !== f));
    const name = f ? `${stop} (${f})` : stop;
    await goto(0, stop);
    if (f) await layOut(0, f);
    const legacy = JSON.parse(await b.ev(`JSON.stringify(${JSON.stringify(here.map((h) => [h.id, h.of.sel, h.of.i]))}.map(([id,s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)return [id,null];const r=e.getBoundingClientRect();return [id,[r.x,r.y,r.width,r.height]]}))`));
    await goto(1, stop);
    if (f) await layOut(1, f);
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
    ok(!missing.length, `parity ${name}: every control there (${here.length})`, missing.join(" "));
    ok(worst <= 2, `parity ${name}: boxes within 2 px of the legacy elements'`, `worst ${worst.toFixed(2)} px (${worstId})`);
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
  ok(order.join() === [...ribbons.map((h) => h.id), "cert", "binder"].join(), "award: Tab goes through the ribbons in order, then the certificate and the binder", `${order.length} stops`);
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
  ok(nodes.some((n) => n === "link: Indigo Design Award – Women in Design, shortlisted 2026 (certificate)"), "award: screen reader gets the certificate");
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
  // the binder in front of the certificate: on to Profile
  const bn = await rect("binder");
  ok(!!bn, "award: the binder is a control", JSON.stringify(bn));
  await b.ev("document.querySelector('.room-hit--binder').focus()"); await sleep(100);
  await key("Enter"); await arrive("profile");
  ok((await st()).desk === "profile", "award: Enter on the binder goes to Profile");
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
  await click(sv.x + sv.w / 2, sv.y + sv.h / 2);
  // (another site: its tab may take a while to say where it is)
  for (let i = 0; i < 50 && !newTabs.slice(before).some((u) => u.includes("strava.com")); i++) await sleep(100);
  ok(newTabs.length > before && newTabs.slice(before).some((u) => u.includes("strava.com")), "bike: Strava opens in a new tab", newTabs.slice(-1)[0] ?? "");
  await b.send("Page.bringToFront"); await sleep(400);
  await key("Escape"); await until(shown("bike"));
  ok((await st()).focus === null, "bike: Escape brings the camera back up");
}
// ── the CD wallet: discs into the player, the spreads turned, the clip's sound ──
if (run("wallet")) {
  const series = await (await fetch(`${SITE}/api/series`)).json();
  series.sort((a, c) => (c.year ?? -1) - (a.year ?? -1) || a.title.localeCompare(c.title));
  // the legacy player with Star City in it, for the picture side by side
  await goto(0, "offduty");
  const lr = JSON.parse(await b.ev(`(()=>{const d=[...document.querySelectorAll('.od-disc')].find(e=>e.getAttribute('aria-label').startsWith('Star City'));d.click();return JSON.stringify(document.querySelector('.od-dvd__screen').getBoundingClientRect())})()`));
  await sleep(2500);
  await b.shot(path.join(OUT, "dvd-legacy.png"), { x: lr.x - 20, y: lr.y - 20, width: lr.width + 40, height: lr.height + 40, scale: 1 });
  await goto(1, "offduty");
  const discs = () => b.ev(`JSON.stringify([...document.querySelectorAll('.room-hit--disc')].filter(e=>!e.hidden&&e.tabIndex===0).map(e=>e.getAttribute('aria-label').replace(' – put it in the player','')))`).then(JSON.parse);
  const d0 = await discs();
  ok(d0.join("|") === series.slice(0, 8).map((x) => x.title).join("|"), "wallet: the open spread's eight discs, in the wallet's order, each a button by its title", d0.length + "");
  ok(!(await b.ev(shown("dvd"))), "wallet: no disc in, no panel over the player's screen (WebGL's NO DISC)");
  // a click on Star City: out of its pocket, into the player
  const sc = HITS.find((h) => h.type === "disc" && h.of.i === d0.indexOf("Star City"));
  const r = await rect(sc.id);
  // (it flies to the player first, FLY_MS; it is in once it lands)
  await click(r.x + r.w / 2, r.y + r.h / 2); await sleep(1100);
  const d1 = await discs();
  ok(!d1.includes("Star City") && d1.length === 7, "wallet: the disc picked is out of its pocket", d1.length + "");
  const dv = JSON.parse(await b.ev(`(()=>{const e=document.querySelector('[data-hit=dvd]');const r=e.getBoundingClientRect();return JSON.stringify({on:!e.hidden,x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent,label:e.getAttribute('aria-label'),role:e.getAttribute('role'),tube:e.querySelector('iframe')?.src??null})})()`));
  ok(dv.on && dv.text.includes("Star City · 2026"), "wallet: the player's screen shows it", dv.text);
  ok(dv.tube?.includes(series.find((x) => x.title === "Star City").clip), "wallet: its clip plays on the screen", dv.tube?.slice(0, 60));
  const dd = Math.max(Math.abs(dv.x - lr.x), Math.abs(dv.y - lr.y), Math.abs(dv.x + dv.w - lr.x - lr.width), Math.abs(dv.y + dv.h - lr.y - lr.height));
  ok(dd <= 2, "wallet: the screen panel lies within 2 px of the legacy screen", `${dd.toFixed(2)} px`);
  await sleep(2500);
  await b.shot(path.join(OUT, "dvd-gl.png"), { x: lr.x - 20, y: lr.y - 20, width: lr.width + 40, height: lr.height + 40, scale: 1 });
  ok(dv.role === "button" && dv.label === "Sound on", "wallet: the screen is a button, Sound on", `${dv.role} ${dv.label}`);
  await click(dv.x + dv.w / 2, dv.y + dv.h / 2); await sleep(300);
  const snd = JSON.parse(await b.ev(`JSON.stringify({label: document.querySelector('[data-hit=dvd]').getAttribute('aria-label'), sound: document.querySelector('[data-hit=dvd] iframe').hasAttribute('data-sound'), osd: document.querySelector('[data-hit=dvd] .od-dvd__osd').textContent})`));
  ok(snd.label === "Sound off" && snd.sound && snd.osd.includes("SOUND ON"), "wallet: a click on the screen gives the clip sound", JSON.stringify(snd));
  await b.ev("document.querySelector('[data-hit=dvd]').focus()"); await sleep(100);
  await key("Enter"); await sleep(300);
  ok((await b.ev("document.querySelector('[data-hit=dvd]').getAttribute('aria-label')")) === "Sound on", "wallet: Enter on it takes the sound away again");
  // the keyboard: Enter on a disc puts it in, and focus goes on to the next disc
  const wb = HITS.find((h) => h.type === "disc" && h.of.i === d0.indexOf("Widow's Bay"));
  await b.ev(`document.querySelector('[data-hit="${wb.id}"]').focus()`); await sleep(100);
  await key("Enter"); await sleep(1100);
  const s1 = await st();
  const nowIn = await b.ev("document.querySelector('[data-hit=dvd]').textContent");
  ok(nowIn.includes("Widow's Bay") && (await discs()).includes("Star City"), "wallet: Enter on another disc swaps them, Star City back in its pocket", nowIn);
  ok(s1.hit && s1.hit.startsWith("disc") && s1.hit !== wb.id, "wallet: focus goes on to the next disc", s1.hit);
  // the spreads: a click on the right sleeve's margin, and ← →
  // a point of the sleeve's own, off its discs: the first on a grid where it is on top
  const margin = (id) => b.ev(`(()=>{const e=document.querySelector('[data-hit="${id}"]');const r=e.getBoundingClientRect();
    for(let fy=0.5;fy<0.95;fy+=0.05)for(let fx=${id === "sleeve-1" ? "0.95;fx>0.05;fx-=0.03" : "0.05;fx<0.95;fx+=0.03"}){const x=r.x+r.width*fx,y=r.y+r.height*fy;if(document.elementFromPoint(x,y)===e)return JSON.stringify([x,y])}return null})()`).then(JSON.parse);
  const sl = await margin("sleeve-1");
  // (a sleeve turns in TURN_MS; another turn waits for it, as the page's)
  await click(sl[0], sl[1]); await sleep(800);
  ok((await discs()).join("|") === series.slice(8, 16).map((x) => x.title).join("|"), "wallet: a click on the right sleeve's margin turns to the next spread", (await discs())[0]);
  await key("ArrowRight"); await sleep(800);
  ok((await discs())[0] === series[16].title, "wallet: → turns on", (await discs())[0]);
  await key("ArrowLeft"); await sleep(800); await key("ArrowLeft"); await sleep(800);
  ok((await discs())[0] === series[0].title && !(await discs()).includes("Widow's Bay"), "wallet: ← back to the first, the disc in the player still out of it");
  const sl0 = await margin("sleeve-0");
  await click(sl0[0], sl0[1]); await sleep(800);
  ok((await discs())[0] === series[0].title, "wallet: the left sleeve at the first spread turns no further");
  const ax = await b.send("Accessibility.getFullAXTree");
  const nodes = (ax.result?.nodes ?? []).filter((x) => !x.ignored).map((x) => `${x.role?.value}: ${x.name?.value ?? ""}`);
  fs.writeFileSync(path.join(OUT, "ax-offduty.txt"), nodes.join("\n"));
  ok(nodes.includes("button: Star City – put it in the player") && nodes.includes("button: Sound on"), "wallet: screen reader gets the discs and the screen's button");
  // leaving the corner: the clip goes, the disc stays in
  await key("Escape"); await arrive("closed");
  ok(!(await b.ev("!!document.querySelector('[data-hit=dvd] iframe')")), "wallet: away from the corner the clip stops");
  await b.ev(`dispatchEvent(new Event('kate:off-duty'))`); await arrive("offduty");
  const back = await b.ev("document.querySelector('[data-hit=dvd]').textContent");
  ok(back.includes("Widow's Bay") && (await b.ev("!!document.querySelector('[data-hit=dvd] iframe')")), "wallet: back at the corner, the disc is still in and its clip plays", back.slice(0, 40));
  await key("Escape"); await arrive("closed");
}
// ── Case Files: the folder, its song, the stacks laid out one at a time ──
if (run("files")) {
  await goto(1, "files");
  const vis = () => b.ev(`JSON.stringify([...[...document.querySelectorAll('.room-hit')].filter(e=>!e.hidden&&!e.hasAttribute('data-away')).map(e=>e.dataset.hit).filter(h=>!['u15','player','u15-tag','u15panel'].includes(h)), ...Object.entries(${JSON.stringify(PANEL)}).filter(([k,s])=>(e=>!!e&&+getComputedStyle(e).opacity>0.5)(document.querySelector('.room-hit--u15panel:not([data-away]) '+s))).map(([k])=>k)])`).then(JSON.parse);
  const attr = (id, a) => b.ev(`document.querySelector('${sel(id)}').getAttribute('${a}')`);
  const pan = () => b.ev("+getComputedStyle(document.querySelector('.scene-cam')).getPropertyValue('--pan')");
  // a point of the control's own, where nothing lies over it (the centre first)
  const clickHit = async (id) => {
    const p = JSON.parse(await b.ev(`(()=>{const e=document.querySelector('${sel(id)}');if(!e||e.hidden)return null;const r=e.getBoundingClientRect();
      const at=(fx,fy)=>{const x=r.x+r.width*fx,y=r.y+r.height*fy;return x>0&&y>0&&x<innerWidth&&y<innerHeight&&e.contains(document.elementFromPoint(x,y))?[x,y]:null};
      let q=at(.5,.5);for(let fy=.1;!q&&fy<.95;fy+=.08)for(let fx=.1;!q&&fx<.95;fx+=.08)q=at(fx,fy);return JSON.stringify(q)})()`));
    if (!p) { log("  (nowhere to click", id, ")"); return; }
    await click(p[0], p[1]);
  };
  // off in the window's edge, or moved aside: focus brings the desk round to it first
  // (the panel is out of sight while the desk pans: wait for it)
  const use = async (id) => { await until(`!!document.querySelector('${sel(id)}')`, 3000); await b.ev(`document.querySelector('${sel(id)}')?.focus()`); await sleep(900); await until(`!!document.querySelector('${sel(id)}')`, 3000); await clickHit(id); };
  let v = await vis();
  ok(["u15", "player", "case-bulksource", "case-onsisoft", "case-waypro"].every((x) => v.includes(x)) && !v.some((x) => /^(row|postcard|jury-tag|u15-tag)/.test(x)), "files: the folder, the player and the three stacks; nothing laid out yet", v.filter((x) => x !== "trophy").join(" "));
  ok((await attr("u15", "aria-label")) === "Open Ukrainska 15" && (await attr("u15", "aria-expanded")) === "false", "files: the folder says it opens");
  // a drag along the desk pans it, and the controls go with it
  const c0 = await rect("case-bulksource");
  const drag = (type, x) => b.send("Input.dispatchMouseEvent", { type, x, y: 800, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  await drag("mouseMoved", 1300); await drag("mousePressed", 1300);
  for (let i = 1; i <= 20; i++) { await drag("mouseMoved", 1300 - i * 30); await sleep(16); }
  await drag("mouseReleased", 700); await sleep(1200);
  const pd = await pan(), c1 = await rect("case-bulksource");
  ok(pd > 100 && c1 && c1.x < c0.x - 100, "files: a drag pans the desk, its controls with it", `pan ${pd.toFixed(0)}, card ${c0.x.toFixed(0)} → ${c1?.x.toFixed(0)}`);
  await goto(1, "files");
  const walk = (await tabWalk(30)).filter((x) => HITS.some((h) => h.id === x && h.at.includes("files")));
  // (the trophy, also a way to Recognition from here, comes first)
  const once = walk.filter((x, i) => walk.indexOf(x) === i && x !== "trophy");
  ok(once.slice(0, 5).join() === "u15,player,case-bulksource,case-onsisoft,case-waypro", "files: Tab goes left to right along the desk", once.join(" "));
  // focus on the far stack pans the desk to it
  await b.ev("document.querySelector('.room-hit[data-hit=\"case-waypro\"]').focus()"); await sleep(900);
  const p1 = await pan();
  ok(p1 > 300, "files: focus on WayPro's stack pans the desk to it", `pan ${p1.toFixed(0)}`);
  // Enter lays it out: its rows, postcards and tags
  await key("Enter"); await until(shown("row-waypro-0"), 3000); await sleep(300);
  let s = await st();
  v = await vis();
  ok(s.focus === "waypro" && !v.includes("case-waypro") && v.filter((x) => x.startsWith("row-waypro")).length === 6 && v.filter((x) => x.startsWith("postcard-waypro")).length === 5 && v.includes("jury-tag-waypro-1"), "files: Enter on it lays it out, its rows, postcards and tags there", `${s.focus} ${v.length}`);
  await b.shot(path.join(OUT, "files-waypro.png"));
  const tw = (await tabWalk(40)).filter((x) => x.includes("waypro"));
  ok(tw.includes("row-waypro-0") && tw.includes("postcard-waypro-4") && tw.includes("jury-tag-waypro-1"), "files: Tab reaches the laid-out case's links", [...new Set(tw)].length + "");
  const before = newTabs.length;
  await clickHit("row-waypro-3"); await sleep(1500);
  ok(newTabs.slice(before).some((u) => u.includes("daveyawards.com")), "files: a row opens its winner page in a new tab", newTabs.slice(-1)[0] ?? "");
  await b.send("Page.bringToFront"); await sleep(400);
  await b.ev("window.__mark = 1");
  await clickHit("jury-tag-waypro-1"); await sleep(2500);
  s = await st();
  ok(s.path === "/work/waypro" && s.mark, "files: its tag opens the case, client-side", s.path);
  await goto(1, "files");
  // another stack: the one laid out goes back
  await use("case-bulksource"); await until(shown("row-bulksource-0"), 3000); await sleep(200);
  await use("case-onsisoft"); await until(shown("row-onsisoft-0"), 3000); await sleep(200);
  v = await vis();
  ok((await st()).focus === "onsisoft" && !v.some((x) => x.startsWith("row-bulksource")) && v.includes("case-bulksource"), "files: a click on another stack lays that one out instead");
  // Put the file away, and Escape
  await b.ev("document.querySelector('.desk-hint__close').click()"); await sleep(400);
  ok((await st()).focus === null && (await vis()).includes("case-onsisoft"), "files: Put the file away puts it back");
  await use("case-onsisoft"); await until(shown("row-onsisoft-0"), 3000);
  await key("Escape"); await sleep(400);
  s = await st();
  ok(s.focus === null && s.desk === "open", "files: Escape puts it back, the camera stays at the desk");
  // Ukrainska 15: open, its tag, its song
  await use("u15"); await until(shown("u15-tag"), 3000); await sleep(300);
  s = await st();
  ok(s.focus === "ukrainska-15" && (await b.ev("document.documentElement.dataset.u15")) === "open", "files: a click opens Ukrainska 15, in focus", s.focus);
  ok((await attr("u15", "aria-label")) === "Put Ukrainska 15 away" && (await attr("u15", "aria-expanded")) === "true", "files: open, the folder says it goes away");
  await b.shot(path.join(OUT, "files-u15.png"));
  await use("player"); await until(`document.querySelector('.room-hit--u15panel .desk-player').getAttribute('aria-pressed')==='true'`, 4000);
  ok((await attr("player", "aria-label")) === "Pause “Still live in my mind”", "files: the player plays the song", await attr("player", "aria-label"));
  await b.ev("document.querySelector('.room-hit--u15panel .desk-player').focus()"); await key("Enter");
  await until(`document.querySelector('.room-hit--u15panel .desk-player').getAttribute('aria-pressed')==='false'`, 3000);
  ok((await attr("player", "aria-pressed")) === "false", "files: Enter on it pauses");
  // another case while it is open: it shuts
  // (the folder gathers its things first, U15File's GATHER_MS, then is shut)
  await use("case-bulksource"); await until(shown("row-bulksource-0"), 3000); await until("!document.documentElement.dataset.u15", 2000); await sleep(300);
  s = await st();
  ok(s.focus === "bulksource" && !(await b.ev("document.documentElement.dataset.u15")) && !(await b.ev(shown("u15-tag"))), "files: another case in focus puts Ukrainska 15 away", s.focus);
  await key("Escape"); await sleep(1200);
  await until(`!!document.querySelector('${sel("u15")}')`, 3000);
  await b.ev("document.querySelector('.room-hit--u15panel .u15-hit').focus()"); await key("Enter"); await until(shown("u15-tag"), 3000);
  await key("Escape"); await until("!document.documentElement.dataset.u15", 2000); await sleep(400);
  s = await st();
  ok(s.focus === null && !(await b.ev("document.documentElement.dataset.u15")) && s.desk === "open", "files: Enter opens it, Escape puts it away");
  // the song stops when the camera leaves the desk
  await use("u15"); await until(shown("player"), 3000); await sleep(300);
  await use("player"); await until(`document.querySelector('.room-hit--u15panel .desk-player').getAttribute('aria-pressed')==='true'`, 4000);
  // (Escape shuts the folder first, as the page's does; once shut, Escape leaves)
  await key("Escape"); await until("!document.documentElement.dataset.u15", 2000); await sleep(300); await key("Escape"); await arrive("closed");
  ok((await b.ev("document.querySelector('.room-hit--u15panel .desk-player').getAttribute('aria-pressed')")) === "false" && !(await b.ev("document.documentElement.dataset.u15")), "files: leaving the desk stops the song and shuts the folder");
  const ax = await b.send("Accessibility.getFullAXTree");
  void ax;
}
// ── Profile: the binder, the page's own DOM laid flat at rest (M4) ──
if (run("binder")) {
  // the legacy binder's box, for where the flat one must lie
  await goto(0, "profile");
  const lb = JSON.parse(await b.ev("JSON.stringify((r=>[r.x,r.y,r.width,r.height])(document.querySelector('.desk-binder').getBoundingClientRect()))"));
  await goto(1, "profile");
  await until("document.querySelector('.room-hit--pf .pf-binder')", 5000);
  const label = () => b.ev("document.querySelector('.room-hit--pf .pf-binder')?.getAttribute('aria-label') ?? ''");
  const pr = await rect("pf");
  const d = pr ? Math.max(Math.abs(pr.x - lb[0]), Math.abs(pr.y - lb[1]), Math.abs(pr.x + pr.w - lb[0] - lb[2]), Math.abs(pr.y + pr.h - lb[1] - lb[3])) : 99;
  ok(!!pr && d <= 2, "binder: the flat binder lies within 2 px of the legacy one", `${d.toFixed(2)} px`);
  ok((await label()).startsWith("Profile binder, spread 1 of 7: CV"), "binder: opens on the CV", await label());
  const away = await b.ev("(()=>{let n=0,v=0;window.__room.scene.traverse(o=>{if(o.isMesh&&o.userData&&o.userData.away){n++;if(o.visible)v++}});return JSON.stringify([n,v])})()");
  ok(JSON.parse(away)[0] > 0 && JSON.parse(away)[1] === 0, "binder: WebGL's binder is put away under it", away);
  // its text is text: a selection of the CV's title
  const sel = await b.ev("(()=>{const t=[...document.querySelectorAll('.room-hit--pf .pf-cv__title')].find(e=>e.offsetParent);const r=document.createRange();r.selectNodeContents(t);getSelection().removeAllRanges();getSelection().addRange(r);return getSelection().toString().trim()})()");
  ok(/curriculum/i.test(sel), "binder: its text selects", sel);
  // a selection by the pointer, and the click that ends it does not turn the page
  const tl = JSON.parse(await b.ev("(()=>{const t=[...document.querySelectorAll('.room-hit--pf .pf-cv__title')].find(e=>e.offsetParent);const r=t.getBoundingClientRect();return JSON.stringify([r.x+4,r.y+r.height*0.3,r.x+r.width*0.8,r.y+r.height*0.3])})()"));
  await b.ev("getSelection().removeAllRanges()");
  const drag = (type, x, y) => b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  await drag("mouseMoved", tl[0], tl[1]); await drag("mousePressed", tl[0], tl[1]);
  for (let i = 1; i <= 10; i++) await drag("mouseMoved", tl[0] + (tl[2] - tl[0]) * i / 10, tl[1]);
  await drag("mouseReleased", tl[2], tl[3]); await sleep(300);
  const picked = (await b.ev("getSelection().toString()")).trim();
  ok(picked.length > 3 && (await label()).includes("spread 1 of 7"), "binder: a drag over the title selects it, the page stays", JSON.stringify(picked));
  await b.ev("getSelection().removeAllRanges()");
  // a click on the right half turns on, the left half back
  const bx = await rect("pf");
  await click(bx.x + bx.w * 0.8, bx.y + bx.h * 0.6); await sleep(300);
  ok((await label()).includes("spread 2 of 7"), "binder: a click on the right half turns the page", await label());
  await b.shot(path.join(OUT, "binder-spread2.png"));
  await click(bx.x + bx.w * 0.2, bx.y + bx.h * 0.6); await sleep(300);
  ok((await label()).includes("spread 1 of 7"), "binder: on the left half turns it back");
  await key("ArrowRight"); await key("ArrowRight"); await sleep(300);
  ok((await label()).includes("spread 3 of 7"), "binder: → turns on", await label());
  await key("ArrowLeft"); await sleep(300);
  ok((await label()).includes("spread 2 of 7"), "binder: ← back");
  // a divider's tab: straight to its section
  const tab = JSON.parse(await b.ev("(()=>{const t=[...document.querySelectorAll('.room-hit--pf .pf-tab')].find(e=>e.getAttribute('aria-label')==='Open БУДЬ');const r=t.getBoundingClientRect();return JSON.stringify([r.x+r.width/2,r.y+r.height*0.25])})()"));
  await click(tab[0], tab[1]); await sleep(300);
  ok((await label()).includes("spread 4 of 7: БУДЬ"), "binder: a click on БУДЬ's tab opens its section", await label());
  await b.shot(path.join(OUT, "binder-bud.png"));
  // Tab and Enter on another tab
  await b.ev("[...document.querySelectorAll('.room-hit--pf .pf-tab')].find(e=>e.getAttribute('aria-label')==='Open IxDF Kharkiv').focus()"); await sleep(100);
  await key("Enter"); await sleep(300);
  ok((await label()).includes("spread 6 of 7: IxDF"), "binder: Enter on IxDF's tab opens its section", await label());
  // the hung certificate turns over by itself, and back
  await b.ev("[...document.querySelectorAll('.room-hit--pf .pf-tab')].find(e=>e.getAttribute('aria-label')==='Open БУДЬ').click()"); await sleep(300);
  const hung = JSON.parse(await b.ev("(()=>{const f=[...document.querySelectorAll('.room-hit--pf .pf-hang__face[role=button]')].find(e=>e.closest('.pf-leaf').hasAttribute('data-turned')&&!e.closest('.pf-leaf').hasAttribute('data-hidden'));if(!f)return null;const c=f.firstElementChild.getBoundingClientRect();return JSON.stringify([c.x+c.width/2,c.y+c.height/2])})()"));
  if (hung) {
    await click(hung[0], hung[1]); await sleep(300);
    const fl = await b.ev("document.querySelectorAll('.room-hit--pf .pf-hangleaf[data-flipped]').length");
    ok(fl === 1, "binder: a click on the hung certificate turns it over", String(fl));
    await b.shot(path.join(OUT, "binder-flipped.png"));
    const vis = await b.ev("(()=>{const l=document.querySelector('.room-hit--pf .pf-hangleaf[data-flipped]');const rev=l.querySelector('.pf-hang__face--rev'),face=l.querySelector('.pf-hang__face:not(.pf-hang__face--rev)');return getComputedStyle(rev).visibility+'/'+getComputedStyle(face).visibility})()");
    ok(vis === "visible/hidden", "binder: over, its back shows, not its face", vis);
  } else ok(false, "binder: a hung certificate to click");
  // a link on a sheet opens in a new tab, and does not turn the page
  const before = newTabs.length, l0 = await label();
  const ln = JSON.parse(await b.ev("(()=>{const a=[...document.querySelectorAll('.room-hit--pf .pf-sheet a[href^=http]')].find(e=>{const r=e.getBoundingClientRect();if(r.width<2)return false;const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return t&&e.contains(t)});if(!a)return null;const r=a.getBoundingClientRect();return JSON.stringify([r.x+r.width/2,r.y+r.height/2,a.href])})()"));
  if (ln) {
    await click(ln[0], ln[1]);
    for (let i = 0; i < 50 && newTabs.length === before; i++) await sleep(100);
    ok(newTabs.length > before && (await label()) === l0, "binder: a link on a sheet opens in a new tab, the page stays", ln[2].slice(0, 50));
    await b.send("Page.bringToFront"); await sleep(400);
  } else ok(false, "binder: a link on the open spread to click");
  // the accessibility tree: the binder, its tabs
  const ax = await b.send("Accessibility.getFullAXTree");
  const nodes = (ax.result?.nodes ?? []).filter((x) => !x.ignored).map((x) => `${x.role?.value}: ${x.name?.value ?? ""}`);
  fs.writeFileSync(path.join(OUT, "ax-profile.txt"), nodes.join("\n"));
  ok(nodes.some((x) => x.startsWith("group: Profile binder, spread")) && nodes.includes("button: Open Kharkiv IT Cluster"), "binder: screen reader gets the binder and its tabs");
  // the hand-over as the camera sets off: the page's binder at БУДЬ, then
  // (Escape, the camera still for its .2 s beat) WebGL's, at the same spread
  // (a certificate turned over by itself WebGL does not show over yet, M6:
  // a turn of the page lays it back first)
  await key("ArrowRight"); await sleep(300);
  await b.ev("[...document.querySelectorAll('.room-hit--pf .pf-tab')].find(e=>e.getAttribute('aria-label')==='Open БУДЬ').click()"); await sleep(1200);
  const box = await rect("pf");
  const clip = { x: box.x, y: box.y, width: Math.min(box.w, 1512 - box.x), height: Math.min(box.h, 860 - box.y), scale: 1 };
  await b.shot(path.join(OUT, "handover-dom.png"), clip);
  await key("Escape"); await sleep(60);
  await b.shot(path.join(OUT, "handover-gl.png"), clip);
  // (at an eighth of the size: the same sheets, whatever the text's own
  // rounding — WebGL's sheets were laid out in the bake's 1600 px window,
  // the page's in this one, and their lines sit a few px apart)
  const hd = JSON.parse(execFileSync("python3", ["-c", `from PIL import Image, ImageChops;a=Image.open(${JSON.stringify(path.join(OUT, "handover-dom.png"))}).convert('L');b=Image.open(${JSON.stringify(path.join(OUT, "handover-gl.png"))}).convert('L').resize(a.size);s=(a.width//8,a.height//8);d=ImageChops.difference(a.resize(s,Image.BOX),b.resize(s,Image.BOX));h=d.histogram();t=sum(h);f=ImageChops.difference(a,b).histogram();print('{"eighth_over32":%.2f,"full_over8":%.2f}'%(sum(h[33:])/t*100,sum(f[9:])/sum(f)*100))`]).toString());
  ok(hd.eighth_over32 < 15, "binder: the page's binder and WebGL's, one frame apart at the hand-over, show the same spread", JSON.stringify(hd));
  await sleep(700);
  const back = await b.ev("(()=>{let v=0;window.__room.scene.traverse(o=>{if(o.isMesh&&o.userData&&!o.userData.away&&o.visible)v++});return JSON.stringify({panel: document.querySelector('.room-hit--pf').hidden, noneAway: (()=>{let n=0;window.__room.scene.traverse(o=>{if(o.isMesh&&o.userData&&o.userData.away)n++});return n})()})})()");
  ok(JSON.parse(back).panel && JSON.parse(back).noneAway === 0, "binder: leaving, the panel goes and WebGL draws the binder again", back);
  await arrive("closed");
}
// ── the bike computer's screen, live (M4): WebGL's against the legacy LCD ──
if (run("lcd")) {
  const shotLcd = async (gl, page, file) => {
    await goto(gl, "bike");
    if (!gl) await sleep(800);
    for (let i = 0; i < page; i++) { await key("ArrowRight"); await sleep(gl ? 300 : 2200); }
    await sleep(600);
    const r = JSON.parse(await b.ev(`JSON.stringify((r=>[r.x,r.y,r.width,r.height])(document.querySelector(${JSON.stringify(gl ? "[data-hit=bike-unit]" : ".bike")}).getBoundingClientRect()))`));
    // the screen, 26–75 % across and 24–69 % down the unit's box, and its middle
    await b.shot(file, { x: r[0] + r[2] * 0.3, y: r[1] + r[3] * 0.28, width: r[2] * 0.42, height: r[3] * 0.38, scale: 1 });
  };
  for (const page of [0, 1]) {
    const L = path.join(OUT, `lcd-legacy-${page}.png`), G = path.join(OUT, `lcd-gl-${page}.png`);
    await shotLcd(0, page, L); await shotLcd(1, page, G);
    const d = JSON.parse(execFileSync("python3", ["-c", `from PIL import Image, ImageChops;a=Image.open(${JSON.stringify(L)}).convert('L');b=Image.open(${JSON.stringify(G)}).convert('L').resize(a.size);s=(max(1,a.width//4),max(1,a.height//4));h=ImageChops.difference(a.resize(s,Image.BOX),b.resize(s,Image.BOX)).histogram();t=sum(h);print('{"quarter_over32":%.2f}'%(sum(h[33:])/t*100))`]).toString());
    ok(d.quarter_over32 < 8, `lcd: screen ${page} (${page ? "the longest ride" : "the totals"}) as the legacy LCD draws it`, JSON.stringify(d));
  }
  const d01 = JSON.parse(execFileSync("python3", ["-c", `from PIL import Image, ImageChops;a=Image.open(${JSON.stringify(path.join(OUT, "lcd-gl-0.png"))}).convert('L');b=Image.open(${JSON.stringify(path.join(OUT, "lcd-gl-1.png"))}).convert('L').resize(a.size);h=ImageChops.difference(a,b).histogram();t=sum(h);print('{"over32":%.2f}'%(sum(h[33:])/t*100))`]).toString());
  ok(d01.over32 > 3, "lcd: WebGL's screen changes with the page", JSON.stringify(d01));
}
// ── in flight: nothing to click or focus ──
if (run("flight")) {
  await goto(1, "home");
  await b.ev(`dispatchEvent(new Event('kate:recognition'))`); await sleep(700);
  // (a panel kept out of sight, [data-away], is not shown: visibility hidden, nothing in it takes focus)
  const mid = await b.ev(`JSON.stringify([...document.querySelectorAll('.room-hit')].filter(e=>!e.hidden&&getComputedStyle(e).visibility!=='hidden').map(e=>e.dataset.hit))`);
  ok(mid === "[]", "flight: no control is shown or focusable while the camera moves", mid);
}
log(fails ? `${fails} FAILED` : "all passed");
b.close();
process.exit(fails ? 1 : 0);
