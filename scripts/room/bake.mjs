// Bakes the CSS room into data for the WebGL room (components/room):
//
//   node scripts/room/bake.mjs http://localhost:3301 [--only=desk|flat] [--limit=N]
//
// Runs the legacy page (the CSS room) in headless Chrome and, for every
// plane of its 3D scene (.desk-world), records the plane's full matrix and
// either the picture it simply shows (an <img>, a background) or a
// screenshot of the plane taken flat and on its own, at the density the
// closest camera needs. The flat groups that stay DOM at rest — the case
// (.case-world), the flip clock, the lamp — are mirrored from the live page
// at runtime; for them only what is not a picture or text is baked, keyed
// by what it looks like (lib/room/sig.ts). Writes public/room/scene.json
// and public/room/tex/*.webp, and lossless masters to ~/Documents/
// portfolio-offload/room-bake/ for the texture pipeline.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";
import { stopPose, projectToStage, stageWidth } from "../../lib/room/pose.ts";
import { SIG_SRC } from "../../lib/room/sig.ts";
import { collect } from "./collect.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OPT = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, "").split("=")));
const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/room");
const MASTER = path.join(process.env.HOME, "Documents/portfolio-offload/room-bake");
const TMP = path.join(MASTER, "tiles");
for (const f of fs.existsSync(path.join(OUT, "tex")) ? fs.readdirSync(path.join(OUT, "tex")) : []) if (f.endsWith(".webp") && (OPT.only !== "flat" || f.startsWith("f"))) fs.unlinkSync(path.join(OUT, "tex", f));
for (const d of [OUT, path.join(OUT, "tex"), MASTER, path.join(MASTER, "png"), TMP]) fs.mkdirSync(d, { recursive: true });

const VW = 1600, VH = 1000;
// the window the densities are worked out for (a 16" MacBook Pro at its
// default scaling); scripts/room/budget re-sizes for others in M2
const REF = { w: 1728, h: 1117, dpr: 2 };
// a weekday morning: the office edition, the room lit as by day
const FIXED = Date.UTC(2026, 8, 23, 8, 30) + new Date().getTimezoneOffset() * 0; // Wed 23 Sep 2026

const BAKE_CSS = `
html.bk *, html.bk *::before, html.bk *::after { transition: none !important; animation-play-state: paused !important; caret-color: transparent !important; }
html.bk * { visibility: hidden !important; }
html.bk .bk-on, html.bk .bk-on * { visibility: visible !important; }
html.bk .bk-on.bk-own * { visibility: hidden !important; }
html.bk .bk-on.bk-own > svg, html.bk .bk-on.bk-own > svg * { visibility: visible !important; }
html.bk .bk-on.bk-flat, html.bk .bk-on.bk-flat * { opacity: 1 !important; mix-blend-mode: normal !important; }
html.bk .bk-on.bk-flat { color: transparent !important; text-shadow: none !important; -webkit-text-stroke-color: transparent !important; }
html.bk .bk-on.bk-flat * { visibility: hidden !important; }
html.bk .bk-on.bk-psb, html.bk .bk-on.bk-psa { background: none !important; border-color: transparent !important; box-shadow: none !important; color: transparent !important; }
html.bk .bk-on.bk-psb *, html.bk .bk-on.bk-psa * { visibility: hidden !important; }
html.bk .bk-on.bk-psb::after, html.bk .bk-on.bk-psa::before { display: none !important; }
html.bk .bk-on.bk-psb::before, html.bk .bk-on.bk-psa::after { mix-blend-mode: normal !important; }
html.bk .bk-on.bk-nops::before, html.bk .bk-on.bk-nops::after { display: none !important; }
html.bk .bike__lcd, html.bk .bike__lcd * { visibility: hidden !important; }
html.bk .od-dvd__screen, html.bk .od-dvd__screen * { visibility: hidden !important; }
html.bk .desk-player__lcd, html.bk .desk-player__lcd * { visibility: hidden !important; }
/* a stack's paper tags show only laid out: baked as they look then */
/* …and a stack in progress, its sticky note over the card (staging 27.09) */
html.bk .stack-note { opacity: 1 !important; }
html.bk .jury-tag { opacity: 1 !important; left: calc(50% - 94 * var(--u)) !important; }
/* Off Duty's cards (what a book, a tape, the comic is) show only taken out: baked as they look then */
html.bk .bs-card { opacity: 1 !important; }
/* a stack's "In progress" shows only under the pointer: baked as it looks then */
html.bk .stack-soon { opacity: 1 !important; }
/* WayPro's moss and fly agarics show their picture from above only over the desk (their sides from the room): baked as they look then */
html.bk :is(.stack-moss, .stack-mush) > img:first-child { opacity: 1 !important; }
html.bk:not(.bk-disc) .od-hang .od-disc, html.bk:not(.bk-disc) .od-hang .od-disc * { visibility: hidden !important; }
html.bk:not(.bk-film) .od-sleeve::after, html.bk:not(.bk-film) .od-sleeve__pockets::after { display: none !important; }
html.bk .od-sleeve { --stack: 0 0 transparent !important; }
html.bk.bk-film .od-sleeve, html.bk.bk-step .od-sleeve { background: none !important; }
html.bk.bk-film .od-sleeve { box-shadow: none !important; }
html.bk.bk-film .od-sleeve__strip, html.bk.bk-step .od-sleeve__strip { visibility: hidden !important; }
/* the БУДЬ sheet's prints are baked on their own, the sheet without them,
   and its sleeve's plastic, which lies over them, on its own too */
html.bk:not(.bk-bud):not(.bk-pfs) .desk-binder .pf-print, html.bk:not(.bk-bud):not(.bk-pfs) .desk-binder .pf-print * { visibility: hidden !important; }
html.bk:not(.bk-gloss):not(.bk-pfs) .desk-binder .pf-face__full:has(.pf-prints)::after { display: none !important; }
html.bk.bk-gloss .desk-binder .pf-face__full:has(.pf-prints) { background: none !important; }
html.bk.bk-gloss .desk-binder .pf-face__full:has(.pf-prints) > .pf-sheet, html.bk.bk-gloss .desk-binder .pf-face__full:has(.pf-prints) > .pf-sheet * { visibility: hidden !important; }
html.bk.bk-bud .desk-binder :is(.pf-face, .pf-face__full, .pf-sheet):has(.pf-prints) { overflow: visible !important; }
html.bk.bk-bud .desk-binder .pf-print { transform: none !important; }
/* the award ribbons tilt on hover: baked on their own, the lattice without them */
html.bk:not(.bk-rib) .award-ribbon, html.bk:not(.bk-rib) .award-ribbon * { visibility: hidden !important; }
html.bk .bk-anc { opacity: 1 !important; mix-blend-mode: normal !important; }
html.bk, html.bk body, html.bk main { background: transparent !important; }
html.bk::before, html.bk::after, html.bk body::before, html.bk body::after { display: none !important; }
html.bk .scene-cam { perspective: none !important; transform: none !important; }
html.bk .desk-world { transform-origin: 0 0 0 !important; }
html.bk .case-world { transform: none !important; }
/* the wall's mirrored picture above its top (globals.css .desk-wall::after) is not baked: it lies above the page, out of any screenshot; the WebGL room mirrors the wall's own planes (engine.ts) */
html.bk .desk-wall::after { display: none !important; }
/* the binder's sheets as they lie before the first visit to Profile: blank (DeskBinder's BLANK spreads keep the sheet, not what is on it) */
html.bk.bk-blank .desk-binder .pf-sheet * { visibility: hidden !important; }
`;

const b = await launch({ width: VW, height: VH, dpr: 1 });
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(2026,8,23,10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()` });
await b.go(SITE + "/?nointro&gl=0", 5000);
// the stops' own pieces are built lazily: visit each, then come home
for (const e of ["kate:case-files", "kate:recognition", "kate:off-duty", "kate:profile"]) { await b.ev(`dispatchEvent(new Event("${e}"))`); await sleep(3200); }
await b.ev("history.back()"); await sleep(3500);
log("unloaded pictures:", JSON.stringify(await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const im=[...document.querySelectorAll('.desk-world img, .case-world img, .flip-clock-slot img, .desk-lamp img')];if(im.every(i=>i.complete&&i.currentSrc&&i.naturalWidth)||performance.now()-t0>30000)r(im.filter(i=>!i.currentSrc).map(i=>i.className));else setTimeout(f,200)};f()})`, 40000)));
await sleep(800);
// Off Duty's covers lie on the shelf in their 520 px .sm.webp copies (staging
// 29.09, offduty.ts coverOf); the camera comes close there, so the room
// bakes them from the full posters: each copy's element wears its poster
// (whichever of .webp / .jpg / .png is there) for the bake
log("full covers:", await b.ev(`(async()=>{
  const load=(u)=>new Promise(r=>{const i=new Image();i.onload=()=>r(u);i.onerror=()=>r(null);i.src=u});
  const known=new Map();
  const full=async(sm)=>{if(!known.has(sm)){let f=null;for(const x of ['.webp','.jpg','.jpeg','.png']){f=await load(sm.replace(/\\.sm\\.webp$/,x));if(f)break}known.set(sm,f)}return known.get(sm)};
  const re=/url\\("([^"]*\\/posters\\/[^"]*\\.sm\\.webp)"\\)/g;
  const swap=async(e)=>{const bg=e.style.backgroundImage||getComputedStyle(e).backgroundImage;let out=bg,n=0;
    for(const [all,sm] of [...bg.matchAll(re)]){const u=await full(new URL(sm,location.href).pathname);if(u){out=out.replace(all,'url("'+u+'")');n++}}
    if(n)e.style.setProperty('background-image',out,'important');return n};
  const els=[...document.querySelectorAll('.desk-world *')].filter(e=>re.test(getComputedStyle(e).backgroundImage)&&!(re.lastIndex=0));
  let n=0;for(const e of els)n+=await swap(e);
  // (a thing taken off the shelf and put back sets its copy again: swapped again)
  new MutationObserver((ms)=>{for(const m of ms)if(re.test(m.target.style.backgroundImage)){re.lastIndex=0;swap(m.target)}else re.lastIndex=0}).observe(document.querySelector('.desk-world'),{subtree:true,attributes:true,attributeFilter:['style']});
  return n+' of '+els.length})()`, 60000));

// ── what there is ────────────────────────────────────────────────────────
const collected = await b.ev(`(${collect.toString()})(${JSON.stringify(SIG_SRC)})`);
const { u, stage, units, flat, groupM } = collected;
// every stop's own arrangement of the room
const STATES = { home: ["closed"], files: ["open", undefined, "1"], award: ["award", undefined, "1"], profile: ["profile", undefined, "1"], offduty: ["offduty", undefined, "1"], bike: ["offduty", "bike", "1"] };
const states = {};
for (const [k, [d, f, a]] of Object.entries(STATES)) states[k] = await b.ev(`JSON.stringify(window.__bkState(${JSON.stringify(d)}, ${JSON.stringify(f)}, ${JSON.stringify(a)}))`).then(JSON.parse);
// …and Case Files with each case in focus (M6, the award stacks): the one
// laid out ("here"), the others moved aside to either side — DeskScene sets
// that on the cards themselves (data-side), so it is set here the same way
// (Ukrainska 15 left of them all: 150 aside, not 240, when it is the one)
for (const f of ["ukrainska-15", "bulksource", "onsisoft", "waypro"]) {
  await b.ev(`(()=>{const all=[...document.querySelectorAll('.desk-card[data-slug]')];const fx=+all.find(c=>c.dataset.slug===${JSON.stringify(f)}).dataset.x;
    all.forEach(c=>{c.dataset.side=c.dataset.slug===${JSON.stringify(f)}?'here':(+c.dataset.x<fx?'left':'right')});return 1})()`);
  states[`files:${f}`] = await b.ev(`JSON.stringify(window.__bkState("open", ${JSON.stringify(f)}, "1"))`).then(JSON.parse);
  await b.ev("document.querySelectorAll('.desk-card[data-slug]').forEach(c=>delete c.dataset.side) || 1");
}
// …and a pointer over each stack while none is in focus (M6: its postcards
// come a little way out, the card is tagged "In progress"): the page's
// :hover, forced by DevTools. (Its filter — brightness(1.05) saturate(1.04),
// the generic card's :hover — would flatten the stack's 3D, the truck's
// standing side and lifted top, into the card: the geometry is read without
// it, and the engine draws the filter itself; each stack's planes carry
// their slug for that.)
await b.send("DOM.enable"); await b.send("CSS.enable");
await b.ev("(()=>{const st=document.createElement('style');st.id='bk-nofilter';st.textContent='.desk-card--stack{filter:none!important}';document.head.appendChild(st);return 1})()");
const docRoot = (await b.send("DOM.getDocument", { depth: 0 })).result.root.nodeId;
for (const f of ["bulksource", "onsisoft", "waypro"]) {
  const nodeId = (await b.send("DOM.querySelector", { nodeId: docRoot, selector: `.desk-card--stack[data-slug="${f}"]` })).result?.nodeId;
  if (!nodeId) { log("no stack", f); continue; }
  await b.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
  states[`files:hover-${f}`] = await b.ev(`JSON.stringify(window.__bkState("open", undefined, "1"))`).then(JSON.parse);
  await b.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
}
await b.ev("document.getElementById('bk-nofilter').remove() || 1");
const stackOf = new Map(JSON.parse(await b.ev(`JSON.stringify([...document.querySelectorAll('.desk-card--stack[data-slug]')].flatMap(c=>[c,...c.querySelectorAll('*')].flatMap(e=>['bk','bkbefore','bkafter'].filter(k=>e.dataset[k]!==undefined).map(k=>[+e.dataset[k],c.dataset.slug]))))`)));
// …and the Profile binder open at each of its spreads (pf2 … pf7; pf1 is
// how it lies anywhere): the WebGL room shows the spread the page's own
// binder was left at (components/room/RoomBinder.tsx), so neither is ahead
// of the other when they hand over. Each spread is set on the leaves
// themselves (Binder.tsx's data-turned), and only its two sheets are on
// show: WebGL turns at once, and the leaves under them, which a turning
// leaf uncovers, would lie over them in its fixed order. Put back after.
const LEAVES = "document.querySelectorAll('.desk-binder .pf-leaf')";
// the binder open at spread k: only its two sheets on show
const spread = (k) => `[...${LEAVES}].forEach((l, i) => { l.toggleAttribute("data-turned", i < ${k}); l.toggleAttribute("data-hidden", !(i === ${k - 1} || i === ${k})); l.removeAttribute("data-flying"); })`;
await b.ev(`(window.__pfWas = [...${LEAVES}].map((l) => [l.hasAttribute("data-turned"), l.hasAttribute("data-hidden"), l.hasAttribute("data-flying")])) && 1`);
const binderN = await b.ev(`${LEAVES}.length`);
for (let k = 2; k <= 7; k++) {
  await b.ev(`${spread(k)} || 1`);
  states[`pf${k}`] = await b.ev(`JSON.stringify(window.__bkState("profile", undefined, "1"))`).then(JSON.parse);
}
// (pf1 too, for the way back to the first spread: only its two sheets)
await b.ev(`${spread(1)} || 1`);
states.pf1 = await b.ev(`JSON.stringify(window.__bkState("profile", undefined, "1"))`).then(JSON.parse);
await b.ev(`[...${LEAVES}].forEach((l, i) => { const [t, h, f] = window.__pfWas[i]; l.toggleAttribute("data-turned", t); l.toggleAttribute("data-hidden", h); l.toggleAttribute("data-flying", f); }) || 1`);
log("binder", binderN, "leaves, 7 spreads");
// …and each leaf's own frame (M6, the turn: components/room/binderturn.ts):
// with its transform off (P) and as it lies now (W0, the page at spread 1),
// its box; and which leaf, face and hung sheet each of its planes is
const leafMeta = JSON.parse(await b.ev(`(()=>{
  const leaves=[...${LEAVES}];
  const W0=leaves.map(l=>window.__bkWorld(l)), s=leaves.map(l=>window.__bkSize(l));
  const st=document.createElement('style');st.textContent='.desk-binder .pf-leaf{transform:none!important;transition:none!important}';document.head.appendChild(st);void document.body.offsetHeight;
  const P=leaves.map(l=>window.__bkWorld(l));
  st.remove();void document.body.offsetHeight;
  const of={};
  leaves.forEach((l,i)=>[...l.querySelectorAll('*')].forEach(e=>['bk','bkbefore','bkafter'].filter(k=>e.dataset[k]!==undefined).forEach(k=>{
    const hl=e.closest('.pf-hangleaf'), face=e.closest('.pf-whole > .pf-face');
    of[e.dataset[k]]={i,part:hl?(e.closest('.pf-hang__face--rev')?'rev':'hang'):face?(face.classList.contains('pf-face--back')?'back':'front'):'rigid',
      ...(hl?{hang:i+'.'+[...l.querySelectorAll(':scope > .pf-hangleaf')].indexOf(hl)}:{})};
  })));
  return JSON.stringify({W0,P,s,of})})()`));
log("leaves", leafMeta.P.length, Object.keys(leafMeta.of).length, "planes");
// …and Off Duty's things each taken off the shelf (M6): a book, a comic, a
// tape (the lying ones over it dropped into its gap), the omnibus picked
// up, as the page's data-open / data-drop have them; each state only for
// that thing's own planes. The engine (components/room/shelf.ts) runs the
// page's transitions between them from each thing's frame and its CSS
// numbers (scene.json `od`); these end states are for the densities (a
// cover faces the camera only taken out) and for tests.
const OD_KINDS = [["book", ".bs-book"], ["comic", ".bs-comic"], ["tape", ".vt-tape"], ["omnibus", ".od-comic"]];
const odObjs = JSON.parse(await b.ev(`JSON.stringify(${JSON.stringify(OD_KINDS)}.flatMap(([kind,sel])=>[...document.querySelectorAll(sel)].map((el,n)=>{
  const cs=getComputedStyle(el), num=(k)=>{const v=cs.getPropertyValue(k).trim();return v===''?null:parseFloat(v)};
  const members=[el,...el.querySelectorAll('*')].flatMap(e=>['bk','bkbefore','bkafter'].filter(k=>e.dataset[k]!==undefined).map(k=>({i:+e.dataset[k],body:!!e.closest('.bs-book__body, .vt-tape__body')})));
  return {key:kind+'-'+n,kind,sel,n,stand:el.hasAttribute('data-stand'),members,
    v:Object.fromEntries(['--z','--d','--w','--h','--t','--dy','--lean','--r'].map(k=>[k.slice(2),num(k)]).filter(([,x])=>x!==null)),
    m:window.__bkWorld(el),s:window.__bkSize(el)}})))`));
for (const o of odObjs) {
  await b.ev(`(()=>{const all=[...document.querySelectorAll(${JSON.stringify(o.sel)})];const el=all[${o.n}];el.setAttribute('data-open','');
    if(${JSON.stringify(o.kind)}==='tape'&&!el.hasAttribute('data-stand'))all.forEach((e,i)=>{if(!e.hasAttribute('data-stand')&&i>${o.n})e.setAttribute('data-drop','')});return 1})()`);
  states[`od:${o.key}`] = await b.ev(`JSON.stringify(window.__bkState("offduty", undefined, "1"))`).then(JSON.parse);
  await b.ev(`(()=>{document.querySelectorAll(${JSON.stringify(o.sel)}).forEach(e=>{e.removeAttribute('data-open');e.removeAttribute('data-drop')});return 1})()`);
}
const odOf = new Map(odObjs.flatMap((o) => o.members.map((x) => [x.i, { key: o.key, body: x.body }])));
log("od", odObjs.length, "things,", odOf.size, "planes");
const sameM = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);
log("u", u.toFixed(4), "units", units.length, "flat", flat.length);

// ── self-check: the matrices put every plane where the CSS draws it ──────
const home = stopPose("home");
let worst = 0; const bad = [];
for (const it of units) {
  const m = it.m, pts = [[0, 0], [it.w, 0], [0, it.h], [it.w, it.h]].map(([x, y]) => {
    const q = [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]].map((v) => v / u);
    const s = projectToStage(home, q);
    return s ? [stage.left + s[0] * u, stage.top + s[1] * u] : null;
  });
  if (pts.some((p) => !p) || !it.rect || it.rect.w < 1) continue;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = Math.max(Math.abs(Math.min(...xs) - it.rect.x), Math.abs(Math.min(...ys) - it.rect.y), Math.abs(Math.max(...xs) - it.rect.x - it.rect.w), Math.abs(Math.max(...ys) - it.rect.y - it.rect.h));
  if (d > worst) worst = d;
  if (d > 1) bad.push(`${it.cls} ${d.toFixed(2)}px`);
}
log("matrix check: worst", worst.toFixed(3), "px;", bad.length, "over 1 px", bad.slice(0, 8).join(", "));

// ── how sharp each plane must be: the most screen px per u any stop asks ──
const uRef = stageWidth(REF.w, REF.h) / 1118;
const views = [["home"], ["files", 0], ["files", 900], ["award"], ["profile"], ["offduty"], ["bike"]];
const needOf = (it, mOver) => {
  let best = 0;
  for (const [v, pan] of views) {
    const pose = stopPose(v, pan);
    const P = (x, y) => { const m = mOver ?? it.m; return projectToStage(pose, [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]].map((c) => c / u)); };
    const N = 6;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const x = (it.w * i) / N, y = (it.h * j) / N, e = Math.max(it.w, it.h) / 200;
      const a = P(x, y), bx = P(x + e, y), by = P(x, y + e);
      if (!a || !bx || !by) continue;
      // in the reference window, roughly: the lens shift centres (560, 226)
      const sx = (a[0] - 560) * uRef + REF.w / 2 + (v === "home" ? 0 : 0), sy = (a[1] - 226) * uRef + REF.h / 2;
      if (v !== "home" && (sx < -50 || sy < -50 || sx > REF.w + 50 || sy > REF.h + 50)) continue;
      const k = Math.max(Math.hypot(bx[0] - a[0], bx[1] - a[1]), Math.hypot(by[0] - a[0], by[1] - a[1])) / (e / u);
      best = Math.max(best, k * uRef * REF.dpr);
    }
  }
  return best; // texture px per u
};
const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6];
for (const it of units) {
  // (a thing off Off Duty's shelf: taken out too, nearer the camera)
  const od = odOf.get(it.i);
  // (only what faces you then: a cover, its card, a comic; not the back or the ends)
  const faces = /(^| )(bs-book__cover|vt-tape__cover|bs-card|bs-comic|od-comic)( |$)/.test(it.cls);
  const out = od && faces && states[`od:${od.key}`]?.[it.i]?.m ? needOf(it, states[`od:${od.key}`][it.i].m) : 0;
  it.need = needOf(it);
  // taken out it wants more: a card shows only then (its need is that one);
  // a cover or a comic keeps the shelf's for its resident picture, and gets a
  // second, sharper one only while out (textures.mjs -out, shelf.ts)
  if (/(^| )bs-card( |$)/.test(it.cls)) it.need = Math.max(it.need, out);
  else if (out > it.need * 1.2) it.needOut = out;
  let rho = Math.max(it.need, it.needOut ?? 0) / u; // texture px per CSS px of the bake page
  rho = STEPS.find((s) => s >= rho * 0.97) ?? STEPS[STEPS.length - 1];
  it.rho = rho;
}

// ── the screenshots ───────────────────────────────────────────────────────
await b.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await b.ev(`(()=>{const s=document.createElement('style');s.id='bk-style';s.textContent=${JSON.stringify(BAKE_CSS)};document.head.appendChild(s);return 1})()`);
await sleep(300);
const pyStitch = path.join(import.meta.dirname, "stitch.py");
const limit = +(OPT.limit ?? 1e9);
let n = 0;
const out = { version: 1, u, stage: { w: stage.width / u, h: stage.height / u }, items: [], flat: [], groups: Object.fromEntries(Object.entries(groupM).map(([k, m]) => [k, toU(m, u)])) };
// what WebGL draws live over the baked room (M4): the bike computer's
// screen, baked blank (BAKE_CSS), its box here for components/room/lcd.ts
const lcdBox = JSON.parse(await b.ev("(()=>{const e=document.querySelector('.bike__lcd');return JSON.stringify({m:window.__bkWorld(e),s:window.__bkSize(e)})})()"));
out.live = [{ id: "bike-lcd", of: ".bike", m: toU(lcdBox.m, u), w: lcdBox.s[0] / u, h: lcdBox.s[1] / u }];
// Off Duty's things (shelf.ts): each one's frame at rest, its size and CSS numbers, u
out.leaves = leafMeta.P.map((P, i) => ({ P: toU(P, u), W0: toU(leafMeta.W0[i], u), w: leafMeta.s[i][0] / u, h: leafMeta.s[i][1] / u }));
out.od = odObjs.map(({ members, m, s, ...o }) => ({ ...o, m: toU(m, u), w: s[0] / u, h: s[1] / u }));
const texName = (it) => `${String(it.i).padStart(3, "0")}-${(it.cls.split(" ").pop() || it.tag).replace(/[^a-z0-9_-]/gi, "").slice(0, 40)}`;

if (OPT.only !== "flat") for (const it of units) {
  const item = { i: it.i, cls: it.cls, anc: it.anc, back: it.back || undefined, tag: it.tag, w: it.w / u, h: it.h / u, m: toU(it.m, u), op: it.op, blend: it.blend, order: it.order, need: +it.need.toFixed(2), ...(it.needOut ? { needOut: +it.needOut.toFixed(2) } : {}), ...(odOf.has(it.i) ? { od: odOf.get(it.i) } : {}), ...(stackOf.has(it.i) ? { stack: stackOf.get(it.i) } : {}), ...(leafMeta.of[it.i] ? { leaf: leafMeta.of[it.i] } : {}) };
  // how it differs at each stop, if it does (the local box stays: the quad's
  // own offset into its box is applied to each state's matrix alike)
  const diff = {};
  for (const [k, list] of Object.entries(states)) {
    if (k.startsWith("pf") && !(it.anc ?? "").split(" ").includes("desk-binder")) continue;
    if (k.startsWith("od:") && odOf.get(it.i)?.key !== k.slice(3)) continue;
    const st = list[it.i]; if (!st) continue;
    const d = {};
    if (st.m && !sameM(st.m, states.home[it.i]?.m ?? it.m)) d.m = st.m;
    if (Math.abs(st.op - (states.home[it.i]?.op ?? it.op)) > 1e-3) d.op = st.op;
    if (st.vis !== (states.home[it.i]?.vis ?? true)) d.vis = st.vis;
    if (Object.keys(d).length) diff[k] = d;
  }
  if (states.home[it.i]) { item.op = states.home[it.i].op; if (!states.home[it.i].vis) item.vis = false; }
  item._diff = diff;
  if (it.kind === "img" || it.kind === "bg") { Object.assign(item, { type: "img", src: it.src }); out.items.push(item); continue; }
  if (it.kind === "grid") { Object.assign(item, { type: "grid", src: it.src, grid: it.grid.map((v) => v / u) }); out.items.push(item); continue; }
  // (Ukrainska 15's folder is baked in its parts, below)
  if (it.cls === "env") { out.items.push(item); continue; }
  if (n++ >= limit) continue;
  // the plane's own frame on screen at 1:1: its local box, grown for ink
  // (shadows, blur, pseudo-elements) and trimmed back to what was drawn
  await b.ev(`window.__bk.pose(${it.i}, ${JSON.stringify(it.mode)})`);
  const r = await b.ev(`window.__bk.bounds(${it.i})`);
  if (!r || r.w < 0.5 || r.h < 0.5) { log("skip empty", it.cls); continue; }
  const grow = Math.ceil(Math.max(8, Math.min(60, Math.max(r.w, r.h) * 0.08)));
  const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
  let rho = it.rho;
  const cap = 4096 / Math.max(box.w, box.h);
  if (rho > cap) rho = STEPS.filter((s) => s <= cap).pop() ?? cap;
  if (it.smooth) rho = Math.min(rho, 0.5);
  const png = await capture(it, box, rho);
  const name = texName(it);
  const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(rho)]).toString());
  if (!res.w) { log("empty after trim", it.cls); continue; }
  // the quad: the trimmed picture's box in the plane's local px, then u
  const ox = box.x + res.x / rho, oy = box.y + res.y / rho, qw = res.w / rho, qh = res.h / rho;
  Object.assign(item, {
    off: [ox, oy],
    type: "tex", src: `/room/tex/${name}.webp`, px: [res.w, res.h], rho,
    w: qw / u, h: qh / u, m: toU(mulLocal(it.m, ox, oy), u),
  });
  out.items.push(item);
  if (n % 10 === 0) log("baked", n);
}

// ── the Profile binder's sheets before its first visit (M7) ───────────────
// DeskBinder lays BLANK spreads (each sheet there, nothing on it) until the
// camera first sets off for Profile; the room does the same (engine.ts
// warmBinder): each sleeve face shown at rest, baked again with what is on
// its sheet hidden — the same box, or it is not used
if (OPT.only !== "flat") {
  await b.ev("document.documentElement.classList.add('bk-blank')");
  for (const x of out.items.filter((x) => x.type === "tex" && /^pf-face\b/.test(x.cls) && (x.anc ?? "").split(" ").includes("desk-binder") && x.vis !== false)) {
    const it = units.find((y) => y.i === x.i);
    await b.ev(`window.__bk.pose(${it.i}, ${JSON.stringify(it.mode)})`);
    const r = await b.ev(`window.__bk.bounds(${it.i})`);
    if (!r) continue;
    const grow = Math.ceil(Math.max(8, Math.min(60, Math.max(r.w, r.h) * 0.08)));
    const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
    const png = await capture({ i: `${it.i}-blank` }, box, x.rho);
    const name = texName(it) + "-blank";
    const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(x.rho)]).toString());
    const ox = box.x + res.x / x.rho, oy = box.y + res.y / x.rho;
    if (!res.w || res.w !== x.px[0] || res.h !== x.px[1] || Math.abs(ox - x.off[0]) > 0.5 || Math.abs(oy - x.off[1]) > 0.5) {
      log("blank: not the sheet's box, not used", x.cls, x.i, JSON.stringify({ px: [res.w, res.h], was: x.px, o: [ox, oy], off: x.off }));
      fs.rmSync(path.join(MASTER, "png", name + ".png"), { force: true }); fs.rmSync(path.join(OUT, "tex", name + ".webp"), { force: true });
      continue;
    }
    x.blank = `/room/tex/${name}.webp`;
  }
  await b.ev("document.documentElement.classList.remove('bk-blank')");
  log("binder blank sheets", out.items.filter((x) => x.blank).length);
}

// ── Off Duty (M6): the wallet's sleeves in layers, the discs apart ────────
// The sleeves above are baked without their discs, their film or the stack
// of sleeves under them (BAKE_CSS). WebGL draws the discs of whatever spread
// is open between a sleeve and its film (engine: wallet), from these layers
// and the series' own labels at runtime; and one step of the stack per
// sleeve left to turn, a plane each, painted as the page's box-shadow is
// (the last under the first, none inside the sleeve's box).
const STEPS_N = 6;
const stepShadow = (j, dir) => { const k = j + 1; return `calc(${dir * k * 3.4} * var(--u)) calc(${k * 1.8} * var(--u)) 0 calc(-.3 * var(--u)) rgba(232, 240, 234, ${(0.78 - j * 0.1).toFixed(2)}), calc(${dir * (k * 3.4 + .8)} * var(--u)) calc(${k * 1.8 + .8} * var(--u)) 0 calc(-.3 * var(--u)) rgba(16, 32, 22, .45)`; };
// one more picture of plane `it`, the page set up for it by `setup` (and put back)
async function bakeAs(it, name, setup, undo) {
  await b.ev(setup);
  await b.ev(`window.__bk.pose(${it.i}, "all")`);
  const r = await b.ev(`window.__bk.bounds(${it.i})`);
  if (!r) { await b.ev(undo); return null; }
  const grow = Math.ceil(Math.max(8, Math.min(60, Math.max(r.w, r.h) * 0.08)));
  const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
  const png = await capture({ i: `${it.i}-${name}` }, box, it.rho);
  const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(it.rho)]).toString());
  await b.ev(undo);
  if (!res.w) return null;
  const ox = box.x + res.x / it.rho, oy = box.y + res.y / it.rho;
  return { ox, oy, r, src: `/room/tex/${name}.webp`, px: [res.w, res.h], rho: it.rho, w: res.w / it.rho / u, h: res.h / it.rho / u };
}
// A step of the stack is the sleeve's box-shadow, drawn only outside its
// box: an L past its far edge and its foot, the rest empty. Two strips then
// (the side, full height; the foot, short of the side), not the whole box
// — a few hundred KB of GPU instead of a megabyte each.
function splitStep(s, name, dir) {
  const master = path.join(MASTER, "png", name + ".png");
  const xs = Math.round(((dir > 0 ? s.r.ex + s.r.ew : s.r.ex) - s.ox) * s.rho), ys = Math.round((s.r.ey + s.r.eh - s.oy) * s.rho);
  const cut = JSON.parse(execFileSync("python3", ["-c", `
import sys,json
from PIL import Image
im=Image.open(sys.argv[1]); W,H=im.size; xs,ys,d=int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4])
xs=max(0,min(W,xs)); ys=max(0,min(H,ys))
parts={'side':(xs,0,W,H) if d>0 else (0,0,xs,H),'foot':(0,ys,xs,H) if d>0 else (xs,ys,W,H)}
out={}
for k,b in parts.items():
  if b[2]-b[0]<1 or b[3]-b[1]<1: continue
  p=sys.argv[5]+'-'+k+'.png'; im.crop(b).save(p); out[k]=[b[0],b[1],p]
print(json.dumps(out))`, master, String(xs), String(ys), String(dir), path.join(TMP, name)]).toString());
  fs.rmSync(master, { force: true }); fs.rmSync(path.join(OUT, "tex", name + ".webp"), { force: true });
  const parts = [];
  for (const [k, [cx, cy, p]] of Object.entries(cut)) {
    const nm = `${name}${k === "side" ? "s" : "f"}`;
    const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", p, path.join(MASTER, "png", nm + ".png"), path.join(OUT, "tex", nm + ".webp"), String(s.rho)]).toString());
    if (!res.w) continue;
    parts.push({ ox: s.ox + (cx + res.x) / s.rho, oy: s.oy + (cy + res.y) / s.rho, src: `/room/tex/${nm}.webp`, px: [res.w, res.h], rho: s.rho, w: res.w / s.rho / u, h: res.h / s.rho / u, k });
  }
  return parts;
}
// (a pose leaves the world turned for the last plane: geometry is read
// with it put back, as collect() read everything else)
const unpose = () => b.ev("document.querySelector('.desk-world').style.removeProperty('transform'); document.querySelector('.case-stage').style.removeProperty('translate'); 1");
if (OPT.only !== "flat") {
  const wallet = { hangs: {}, discs: [], layers: {}, steps: STEPS_N };
  for (const side of ["l", "r"]) {
    const it = units.find((x) => x.cls === `od-hang od-hang--${side}`);
    const at = out.items.findIndex((x) => x.i === it?.i);
    if (!it || at < 0) { log("no sleeve", side); continue; }
    const hang = out.items[at];
    const like = (extra, cls) => ({ ...hang, cls, type: "tex", src: extra.src, px: extra.px, rho: extra.rho, w: extra.w, h: extra.h, off: [extra.ox, extra.oy], m: toU(mulLocal(it.m, extra.ox, extra.oy), u), _diff: hang._diff });
    const sel = `document.querySelector('.od-hang--${side} .od-sleeve')`;
    const film = await bakeAs(it, `od-film-${side}`, "document.documentElement.classList.add('bk-film')", "document.documentElement.classList.remove('bk-film')");
    const steps = [];
    for (let j = 0; j < STEPS_N; j++) {
      const s = await bakeAs(it, `od-step-${side}${j}`,
        `document.documentElement.classList.add('bk-step'); ${sel}.style.setProperty('box-shadow', ${JSON.stringify(stepShadow(j, side === "r" ? 1 : -1))}, 'important'); 1`,
        `document.documentElement.classList.remove('bk-step'); ${sel}.style.removeProperty('box-shadow'); 1`);
      if (s) for (const part of splitStep(s, `od-step-${side}${j}`, side === "r" ? 1 : -1)) steps.push(like(part, `od-step od-step--${side} od-step-${j} od-step--${part.k}`));
    }
    // paint order: the deepest step first, the sleeve, (its discs,) its film
    out.items.splice(at, 1, ...steps.reverse(), hang, ...(film ? [like(film, `od-film od-film--${side}`)] : []));
    // the sleeve's own frame, for the turn (it folds about its pegs)
    await unpose();
    const hs = await b.ev(`JSON.stringify(window.__bkSize(document.querySelector('.od-hang--${side}')))`).then(JSON.parse);
    wallet.hangs[side] = { m: toU(it.m, u), w: hs[0] / u, h: hs[1] / u };
    // the four pockets' discs, as spread 0 lies (pocket 0–3 left, 4–7 right)
    const ds = JSON.parse(await b.ev(`JSON.stringify([...document.querySelectorAll('.od-hang--${side}:not(.od-hang--fold):not(.od-hang--unfold) .od-sleeve__cell')].map((c) => { const e = c.querySelector('.cd-body'); return e ? { m: window.__bkWorld(e), s: window.__bkSize(e) } : null; }))`));
    ds.forEach((d, k) => { if (d) wallet.discs.push({ side, i: (side === "l" ? 0 : 4) + k, m: toU(d.m, u), w: d.s[0] / u, h: d.s[1] / u }); });
  }
  // a disc's layers over its label, each on its own at full strength (the
  // engine lays them in the wallet's plain alpha, or the player's blends)
  const layer0 = ".od-hang--l .od-sleeve__cell .cd-body";
  await unpose();
  const bodyBox = JSON.parse(await b.ev(`JSON.stringify(window.__bkSize(document.querySelector('${layer0}')))`));
  for (const [k, cls] of [["grooves", "cd-grooves"], ["sheen", "cd-sheen"], ["hub", "cd-hub"], ["edge", "cd-edge"]]) {
    const i = 9000 + Object.keys(wallet.layers).length;
    await b.ev(`(()=>{const e=document.querySelector('${layer0} .${cls}');e.dataset.bk=${i};e.style.setProperty('opacity','1','important');e.style.setProperty('mix-blend-mode','normal','important');return 1})()`);
    const rho = 4;
    const got = await bakeAs({ i, rho }, `disc-${k}`, "document.documentElement.classList.add('bk-disc'); 1", "document.documentElement.classList.remove('bk-disc'); 1");
    const bx = JSON.parse(await b.ev(`(()=>{window.__bk.pose(${i}, "all");return JSON.stringify(window.__bk.bounds(${i}))})()`));
    await b.ev(`(()=>{const e=document.querySelector('${layer0} .${cls}');delete e.dataset.bk;e.style.removeProperty('opacity');e.style.removeProperty('mix-blend-mode');return 1})()`);
    if (got) wallet.layers[k] = { src: got.src, px: got.px, x: (got.ox - bx.ex) / bodyBox[0], y: (got.oy - bx.ey) / bodyBox[1], w: got.w * u / bodyBox[0], h: got.h * u / bodyBox[1] };
  }
  // the spindle's disc-sized square on the player's base, and the screen
  await unpose();
  const one = async (s) => JSON.parse(await b.ev(`(()=>{const e=document.querySelector('${s}');return JSON.stringify({m:window.__bkWorld(e),s:window.__bkSize(e)})})()`));
  const bay = await one(".od-dvd__bay"), scr = await one(".od-dvd__screen");
  wallet.bay = { m: toU(bay.m, u), w: bay.s[0] / u, h: bay.s[1] / u };
  wallet.screen = { m: toU(scr.m, u), w: scr.s[0] / u, h: scr.s[1] / u };
  out.wallet = wallet;
  log("wallet", wallet.discs.length, "discs,", Object.keys(wallet.layers).length, "layers,", out.items.filter((x) => /^od-(step|film)/.test(x.cls)).length, "sleeve layers");
}

// ── Ukrainska 15 (M6): the folder in its parts ────────────────────────────
// .env (U15File) is one flat layer, baked above as one picture; its parts
// move apart when it opens and can be dragged, so each is a plane of its
// own here: the back (and its shadow), each print, the library card, the
// tag, the front (the pocket, its print, its stamps), the player (its LCD
// left blank, drawn live) — closed, as the bake page has it. For the engine
// (components/room/u15gl.ts) each carries its chain of elements from .env
// down to it, with their layout offsets in u (constant at any size), so it
// can lay the part where the page's own folder (the flat panel at Case
// Files, RoomU15.tsx) has it now: the card's matrix × each link's offset,
// origin and current transform × the picture's offset in its element.
if (OPT.only !== "flat") {
  const env = units.find((x) => x.cls === "env");
  const at = out.items.findIndex((x) => x.i === env?.i);
  if (!env || at < 0) log("no U15 folder");
  else {
    const envItem = out.items[at];
    const PRINTS = JSON.parse(await b.ev("JSON.stringify([...document.querySelectorAll('.env__print-photo')].map(e=>e.dataset.item))"));
    const PARTS = [
      { key: "back", els: [".env__back", ".env__shadow"] },
      ...PRINTS.map((p) => ({ key: `print-${p}`, els: [`.env__print-photo[data-item="${p}"]`] })),
      { key: "card", els: [".env__card"] },
      { key: "note", els: [".u15-note"], prep: "document.querySelector('.u15-note').style.setProperty('opacity','1','important')", undo: "document.querySelector('.u15-note').style.removeProperty('opacity')" },
      { key: "front", els: [".env > .env__layer:not(.env__back)", ".env__print", ".env__stamps"] },
      { key: "player", els: [".desk-player"] },
    ];
    let idx = 9200;
    const parts = [];
    for (const p of PARTS) {
      const i = idx++;
      await b.ev(`(()=>{document.querySelector(${JSON.stringify(p.els[0])}).dataset.bk=${i}; ${p.prep ?? ""}; return 1})()`);
      await b.ev(`window.__bk.pose(${i}, "all")`);
      await b.ev(`(()=>{${JSON.stringify(p.els.slice(1))}.forEach(s=>document.querySelector(s).classList.add('bk-on'));return 1})()`);
      // what they all draw, in the first one's frame (one flat layer)
      const r = JSON.parse(await b.ev(`(()=>{const base=document.querySelector('.case-stage').getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
        for(const s of ${JSON.stringify(p.els)}){const root=document.querySelector(s);for(const e of [root,...root.querySelectorAll('*')]){const q=e.getBoundingClientRect();if(q.width<.01&&q.height<.01)continue;x0=Math.min(x0,q.left);y0=Math.min(y0,q.top);x1=Math.max(x1,q.right);y1=Math.max(y1,q.bottom)}}
        return JSON.stringify({x:x0-base.left,y:y0-base.top,w:x1-x0,h:y1-y0})})()`));
      const grow = Math.ceil(Math.max(8, Math.min(60, Math.max(r.w, r.h) * 0.08)));
      const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
      const name = `u15-${p.key}`;
      const png = await capture({ i: name }, box, env.rho);
      const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(env.rho)]).toString());
      await b.ev(`(()=>{${JSON.stringify(p.els.slice(1))}.forEach(s=>document.querySelector(s).classList.remove('bk-on'));delete document.querySelector(${JSON.stringify(p.els[0])}).dataset.bk; ${p.undo ?? ""}; return 1})()`);
      if (!res.w) { log("u15 empty", p.key); continue; }
      parts.push({ p, ox: box.x + res.x / env.rho, oy: box.y + res.y / env.rho, res });
    }
    await unpose();
    // each part's chain from .env down to it: every link's layout offset in
    // its parent link, read with every transform in the page off (as
    // collect's measure()), in u
    const chains = JSON.parse(await b.ev(`(()=>{
      const st=document.createElement('style');st.textContent='html.bk-u15flat *, html.bk-u15flat *::before, html.bk-u15flat *::after{transform:none!important;translate:none!important;rotate:none!important;scale:none!important;transition:none!important}';document.head.appendChild(st);
      document.documentElement.classList.add('bk-u15flat');void document.body.offsetHeight;
      const u=document.querySelector('.case-stage').getBoundingClientRect().width/1118;
      const card=document.querySelector('.desk-card--env'), env=card.querySelector('.env');
      const out=${JSON.stringify(parts.map((x) => x.p.els[0]))}.map(s=>{const el=document.querySelector(s);const nodes=[];
        for(let n=el;n&&n!==card;n=n.parentElement)nodes.unshift(n);
        let par=card;return nodes.map(n=>{const a=n.getBoundingClientRect(),q=par.getBoundingClientRect();const l={cls:n===env?'env':(n.classList.contains('env__stack')?'stack':'item'),dx:(a.left-q.left)/u,dy:(a.top-q.top)/u};par=n;return l})});
      document.documentElement.classList.remove('bk-u15flat');st.remove();void document.body.offsetHeight;
      return JSON.stringify(out)})()`));
    const items = [];
    for (const [k, x] of parts.entries()) {
      const el = x.p.els[0];
      const m = JSON.parse(await b.ev(`JSON.stringify(window.__bkWorld(document.querySelector(${JSON.stringify(el)})))`));
      items.push({ ...envItem, cls: `u15p u15p--${x.p.key}`, type: "tex", src: `/room/tex/u15-${x.p.key}.webp`, px: [x.res.w, x.res.h], rho: env.rho,
        w: x.res.w / env.rho / u, h: x.res.h / env.rho / u, off: [x.ox, x.oy], m: toU(mulLocal(m, x.ox, x.oy), u), _diff: envItem._diff,
        u15: { sel: el, key: x.p.key, q: [x.ox / u, x.oy / u], chain: chains[k] } });
    }
    out.items.splice(at, 1, ...items);
    // the LCD's box in the player, u
    const lcd = JSON.parse(await b.ev(`(()=>{const u=document.querySelector('.case-stage').getBoundingClientRect().width/1118;const e=document.querySelector('.desk-player__lcd');const p=e.offsetParent;return JSON.stringify({x:e.offsetLeft/u,y:e.offsetTop/u,w:e.offsetWidth/u,h:e.offsetHeight/u,of:p&&p.className})})()`));
    const card = JSON.parse(await b.ev("JSON.stringify(window.__bkWorld(document.querySelector('.desk-card--env')))"));
    out.u15 = { card: toU(card, u), lcd };
    log("u15", items.length, "parts");
  }
}

// ── the БУДЬ prints (M6): the Profile binder's loose prints apart ──────────
// Any of the sheet's sixteen prints can be dragged (PhotoStack.tsx), so the
// sheet is baked above without them and without its sleeve's plastic, and
// here each print on its own (in its own frame, untransformed: its shadow
// in full) and the plastic on its own (soft, at a lower density). The
// engine (components/room/budgl.ts) lays them on the sheet where the page's
// store has them (translate in % of the stack, rotate, the one on top by
// z-index), cut to the sheet as its overflow is, the plastic over them.
// scene.json's `bud`: the sheet's plane (item i), the stack's box and the
// sheet's in the face's own frame (u), the face picture's offset in it.
if (OPT.only !== "flat") {
  const faceI = +(await b.ev("+(document.querySelector('.desk-binder .pf-prints')?.closest('.pf-face')?.dataset.bk ?? -1)"));
  const fu = units.find((x) => x.i === faceI);
  const at = out.items.findIndex((x) => x.i === faceI);
  if (!fu || at < 0) log("no БУДЬ sheet");
  else {
    const face = out.items[at];
    const N = await b.ev("document.querySelectorAll('.desk-binder .pf-print').length");
    await b.ev("document.documentElement.classList.add('bk-bud') || 1");
    const prints = [];
    for (let n = 0; n < N; n++) {
      const i = 9400 + n;
      await b.ev(`(()=>{document.querySelectorAll('.desk-binder .pf-print')[${n}].dataset.bk=${i};return 1})()`);
      const got = await bakeAs({ i, rho: fu.rho }, `bud-print-${String(n).padStart(2, "0")}`, "1", "1");
      await b.ev(`(()=>{delete document.querySelectorAll('.desk-binder .pf-print')[${n}].dataset.bk;return 1})()`);
      if (!got) { log("bud empty print", n); continue; }
      prints.push({ n, i, got });
    }
    await b.ev("document.documentElement.classList.remove('bk-bud') || 1");
    const gloss = await bakeAs({ i: faceI, rho: 2 }, "bud-gloss", "document.documentElement.classList.add('bk-gloss') || 1", "document.documentElement.classList.remove('bk-gloss') || 1");
    await unpose();
    // the stack's and the sheet's boxes in the face's frame, every transform off
    const geo = JSON.parse(await b.ev(`(()=>{
      const st=document.createElement('style');st.textContent='html.bk-budflat *, html.bk-budflat *::before, html.bk-budflat *::after{transform:none!important;translate:none!important;rotate:none!important;scale:none!important;transition:none!important}';document.head.appendChild(st);
      document.documentElement.classList.add('bk-budflat');void document.body.offsetHeight;
      const u=document.querySelector('.case-stage').getBoundingClientRect().width/1118;
      const f=document.querySelector('[data-bk="${faceI}"]').getBoundingClientRect(), s=document.querySelector('.desk-binder .pf-prints').closest('.pf-sheet').getBoundingClientRect(), p=document.querySelector('.desk-binder .pf-print').getBoundingClientRect();
      const out={box:[(p.left-f.left)/u,(p.top-f.top)/u,p.width/u,p.height/u],sheet:[(s.left-f.left)/u,(s.top-f.top)/u,(s.right-f.left)/u,(s.bottom-f.top)/u]};
      document.documentElement.classList.remove('bk-budflat');st.remove();void document.body.offsetHeight;
      return JSON.stringify(out)})()`));
    const [bx, by] = geo.box;
    const like = (g, cls, i, bud, dx = 0, dy = 0) => ({ ...face, i, cls, type: "tex", src: g.src, px: g.px, rho: g.rho, w: g.w, h: g.h,
      off: [dx * u + g.ox, dy * u + g.oy], m: toU(mulLocal(fu.m, dx * u + g.ox, dy * u + g.oy), u), _diff: face._diff, bud });
    const items = prints.map(({ n, i, got }) => like(got, `pf-print bud-print-${n}`, i, { n, q: [got.ox / u, got.oy / u] }, bx, by));
    if (gloss) items.push(like(gloss, "pf-face__full::after bud-gloss", 9399, { gloss: true, q: [gloss.ox / u, gloss.oy / u] }));
    out.items.splice(at + 1, 0, ...items);
    out.bud = { face: faceI, off: [face.off[0] / u, face.off[1] / u], box: geo.box, sheet: geo.sheet };
    log("bud", prints.length, "prints,", gloss ? "gloss" : "no gloss", JSON.stringify(out.bud));
  }
}

// ── the award ribbons (M6): each its own plane ───────────────────────────
// A ribbon tilts on hover and focus at Recognition (AwardRail.css), so the
// lattice's plane is baked above without them, and here each ribbon on its
// own, untransformed (its drop-shadow in full, as it turns with it). Alike
// ribbons (the same satin, tint and logo) share one picture. The engine
// (components/room/ribbons.ts) lays each from its element's frame, turned
// about its origin as the page's :hover. The paper tags stay in the
// lattice: a tilted ribbon's top stays ≥5 u under its tag's shadow.
if (OPT.only !== "flat") {
  const hung = units.find((x) => (" " + x.cls + " ").includes(" desk-wall--hung "));
  const at = out.items.findIndex((x) => x.i === hung?.i);
  if (!hung || at < 0) log("no award lattice");
  else {
    const lattice = out.items[at];
    const sigs = JSON.parse(await b.ev(`JSON.stringify([...document.querySelectorAll('.award-ribbon')].map(r=>{const l=r.querySelector('.award-ribbon__logo');return r.className+'|'+r.style.getPropertyValue('--tint')+'|'+(l?l.style.getPropertyValue('--logo'):'')+'|'+r.textContent}))`));
    await b.ev("document.documentElement.classList.add('bk-rib') || 1");
    const pics = new Map();
    for (const [n, sg] of sigs.entries()) {
      if (pics.has(sg)) continue;
      const i = 9600 + n;
      await b.ev(`(()=>{document.querySelectorAll('.award-ribbon')[${n}].dataset.bk=${i};return 1})()`);
      const got = await bakeAs({ i, rho: hung.rho }, `ribbon-${String(pics.size).padStart(2, "0")}`, "1", "1");
      await b.ev(`(()=>{delete document.querySelectorAll('.award-ribbon')[${n}].dataset.bk;return 1})()`);
      pics.set(sg, got);
    }
    await b.ev("document.documentElement.classList.remove('bk-rib') || 1");
    await unpose();
    const frames = JSON.parse(await b.ev("JSON.stringify([...document.querySelectorAll('.award-ribbon')].map(r=>({m:window.__bkWorld(r),s:window.__bkSize(r)})))"));
    const items = [];
    for (const [n, sg] of sigs.entries()) {
      const g = pics.get(sg), f = frames[n];
      if (!g || !f.m) { log("ribbon empty", n); continue; }
      items.push({ ...lattice, i: 9600 + n, cls: `award-ribbon ribbon-${n}`, type: "tex", src: g.src, px: g.px, rho: g.rho, w: g.w, h: g.h,
        off: [g.ox, g.oy], m: toU(mulLocal(f.m, g.ox, g.oy), u), _diff: lattice._diff,
        rib: { n, q: [g.ox / u, g.oy / u], w: f.s[0] / u, h: f.s[1] / u } });
    }
    out.items.splice(at + 1, 0, ...items);
    log("ribbons", items.length, "planes,", pics.size, "pictures");
  }
}

// ── the flat groups: their non-picture paint, by signature ─────────────────
if (OPT.only !== "desk") for (const f of flat) {
  if (f.kind !== "tex") continue;
  await b.ev(`window.__bk.flatPose(${f.i})`);
  const r = await b.ev(`window.__bk.bounds(${f.i}, true)`);
  if (!r || r.w < 0.5) continue;
  const rho = Math.min(4, Math.max(2, Math.ceil((REF.dpr * uRef / u) * 2) / 2)) * (f.group === "clock" ? 2 : 1);
  const grow = Math.ceil(Math.max(6, Math.min(40, Math.max(r.w, r.h) * 0.1)));
  const box = { x: Math.floor(r.x - grow), y: Math.floor(r.y - grow), w: Math.ceil(r.w + 2 * grow), h: Math.ceil(r.h + 2 * grow) };
  const png = await capture(f, box, rho, true);
  const name = `f${String(f.i).padStart(3, "0")}-${f.group}`;
  const res = JSON.parse(execFileSync("python3", [pyStitch, "trim", png, path.join(MASTER, "png", name + ".png"), path.join(OUT, "tex", name + ".webp"), String(rho)]).toString());
  if (!res.w) continue;
  // offset of the trimmed picture from the element's own box, in u
  out.flat.push({ sig: f.sig, group: f.group, cls: f.cls, src: `/room/tex/${name}.webp`, px: [res.w, res.h],
    x: (box.x + res.x / rho - r.ex) / u, y: (box.y + res.y / rho - r.ey) / u, w: res.w / rho / u, h: res.h / rho / u, ew: r.ew / u, eh: r.eh / u });
}

// ── the one-sided binder (under 1024 px, Binder.tsx singleOf): one picture
// of the whole binder per page ──────────────────────────────────────────
// Under 1024 the page's binder has every document on a sleeve of its own,
// on the right. The WebGL room draws it as it lies at the page the page's
// binder is at (engine.ts, scene.json items with `pfs`), in flight and
// from the other stops; at Profile at rest the page's own stands in, and
// turns its sleeves itself — so a still per page is all it needs: pfs 1 …
// 13, and 0, the first page blank (before the first visit to Profile, as
// DeskBinder's blank pages). The page is told to lay it out one-sided in
// this wide window (window.__pfSingle); last of all, since its leaves are
// built anew, without the bake's marks.
if (OPT.only !== "flat") {
  const rootIt = out.items.find((x) => (" " + x.cls + " ").includes(" desk-binder ") && !x.leaf);
  const pfSingle = (on) => b.ev(`(window.__pfSingle = ${on}, dispatchEvent(new Event("room:pf-single")), new Promise(r => setTimeout(() => r(1), 600)))`);
  if (!rootIt) log("no binder");
  else {
    await unpose();
    await pfSingle(true);
    const pages = await b.ev(`${LEAVES}.length`) - 1;
    const f = JSON.parse(await b.ev(`(()=>{const e=document.querySelector('.desk-binder');return JSON.stringify({m:window.__bkWorld(e)})})()`));
    const items = [];
    for (let k = 0; k <= pages; k++) {
      const at = Math.max(1, k);
      const setup = `(()=>{document.documentElement.classList.add('bk-pfs'${k === 0 ? ", 'bk-blank'" : ""});${spread(at)};
        document.querySelectorAll('.desk-binder .pf-hangleaf').forEach((h)=>h.removeAttribute('data-flipped'));return 1})()`;
      const undo = "document.documentElement.classList.remove('bk-pfs', 'bk-blank') || 1";
      const got = await bakeAs({ i: rootIt.i, rho: 4 }, `pfs-${String(k).padStart(2, "0")}`, setup, undo);
      if (!got) { log("one-sided page empty", k); continue; }
      items.push({ i: 9700 + k, cls: `pf-binder pfs-${k}`, anc: rootIt.anc, tag: rootIt.tag, type: "tex", src: got.src, px: got.px, rho: got.rho,
        w: got.w, h: got.h, m: toU(mulLocal(f.m, got.ox, got.oy), u), op: 1, blend: "normal", order: rootIt.order, need: 4, vis: false, pfs: k });
    }
    await unpose();
    await pfSingle(false);
    out.items.push(...items);
    log("one-sided binder", items.length, "pages");
  }
}

if (OPT.only === "flat") {
  const prev = JSON.parse(fs.readFileSync(path.join(OUT, "scene.json")));
  out.items = prev.items;
}
for (const item of out.items) {
  const d = item._diff; delete item._diff;
  if (!d || !Object.keys(d).length) continue;
  item.states = {};
  for (const [k, v] of Object.entries(d)) {
    const o = {};
    if (v.m) o.m = toU(item.off ? mulLocal(v.m, item.off[0], item.off[1]) : v.m, u);
    if (v.op !== undefined) o.op = v.op;
    if (v.vis !== undefined) o.vis = v.vis;
    item.states[k] = o;
  }
}
for (const item of out.items) delete item.off;
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(out));
log("wrote", out.items.length, "items,", out.flat.length, "flat; tex", out.items.filter((i) => i.type === "tex").length);
b.close();

// ─────────────────────────────────────────────────────────────────────────
function toU(m, u) { const o = m.slice(); o[12] /= u; o[13] /= u; o[14] /= u; return o; }
function mulLocal(m, x, y) { const o = m.slice(); o[12] += m[0] * x + m[4] * y; o[13] += m[1] * x + m[5] * y; o[14] += m[2] * x + m[6] * y; return o; }

async function capture(it, box, rho, isFlat = false) {
  // tiles of at most 1400 × 900 page px, each brought to (40, 40) of the window
  const TW = 1400, TH = 900, tiles = [];
  for (let ty = 0; ty < box.h; ty += TH) for (let tx = 0; tx < box.w; tx += TW) {
    const w = Math.min(TW, box.w - tx), h = Math.min(TH, box.h - ty);
    await b.ev(`window.__bk.shift(40, 40, ${box.x + tx}, ${box.y + ty})`);
    await b.ev("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const f = path.join(TMP, `t-${it.i}-${tx}-${ty}.png`);
    await b.shot(f, { x: 40, y: 40, width: w, height: h, scale: rho });
    tiles.push({ f, x: Math.round(tx * rho), y: Math.round(ty * rho) });
  }
  const png = path.join(TMP, `u-${isFlat ? "f" : ""}${it.i}.png`);
  execFileSync("python3", [path.join(import.meta.dirname, "stitch.py"), "stitch", png, String(Math.round(box.w * rho)), String(Math.round(box.h * rho)), JSON.stringify(tiles)]);
  return png;
}

// ── page side ─────────────────────────────────────────────────────────────
// Everything hidden but the element being baked (and, for a whole plane,
// what it holds); the page and its paper transparent; nothing moving.

