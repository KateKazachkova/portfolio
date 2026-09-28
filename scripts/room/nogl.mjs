// The flag on a browser that cannot start the WebGL room (no WebGL, or the
// room failing to start): the page must fall back to the CSS room, which
// then works as it does without the flag — home, a stop, back.
//
//   node scripts/room/nogl.mjs http://localhost:3301 [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "nogl");
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (label, ok, s) => { if (!ok) fails++; log(ok ? "ok  " : "FAIL", label, JSON.stringify(s)); };

const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2, extra: ["--disable-webgl", "--disable-webgl2"] });
const state = async () => JSON.parse(await b.ev(`JSON.stringify({gl: document.documentElement.hasAttribute('data-gl'), failed: document.documentElement.dataset.glFailed ?? null, ready: document.documentElement.dataset.glReady ?? null, desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.dataset.deskArrived ?? null, css3d: !!document.querySelector('.desk-world'), css3dShown: (() => { const w = document.querySelector('.desk-world'); return !!w && getComputedStyle(w).display !== 'none'; })(), canvas: !!document.querySelector('.room-canvas'), hits: !!document.querySelector('.room-hits'), poster: (() => { const p = document.querySelector('.room-poster'); return !!p && getComputedStyle(p).display !== 'none'; })(), away: document.querySelectorAll('.room-away').length, flag: sessionStorage.getItem('room-gl')})`));

await b.go(`${SITE}/?nointro&gl=1`, 4000);
let s = await state();
check("home: the CSS room, no WebGL left over", !s.gl && s.failed === "1" && s.css3dShown && !s.canvas && !s.hits && !s.poster && !s.away, s);
await b.shot(path.join(OUT, "home.png"));
await b.ev("dispatchEvent(new Event('kate:case-files'))"); await sleep(3500);
s = await state();
check("case files: the CSS room's camera arrives", s.desk === "open" && s.arrived === "1" && s.css3dShown, s);
await b.shot(path.join(OUT, "files.png"));
for (const [ev, desk] of [["recognition", "award"], ["profile", "profile"], ["off-duty", "offduty"]]) {
  await b.ev(`dispatchEvent(new Event('kate:${ev}'))`); await sleep(3500);
  s = await state();
  check(`${ev}: arrives`, s.desk === desk && s.arrived === "1" && s.css3dShown, s);
}
await b.ev("dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))"); await sleep(3500);
s = await state();
check("Escape → home", s.desk === "closed" && s.css3dShown, s);
// a reload in the same tab (no ?gl, WebGL by default): the failed start
// kept the tab on the CSS room, so the CSS room from the first paint
await b.go(`${SITE}/?nointro`, 4000);
s = await state();
check("reload: the CSS room, the tab kept off WebGL", !s.gl && s.flag === "0" && s.css3dShown && !s.canvas, s);
const errs = b.console.filter((l) => /^(error|EXC)/.test(l) && !/^error (room|THREE\.WebGLRenderer)/.test(l));
check("no other console errors", errs.length === 0, errs.slice(0, 5));
b.close();

// a WebGL room that runs, then loses its context for good at Recognition
// (WEBGL_lose_context, never restored): after engine.ts's 5 s the CSS room
// takes over there, and moving on works
const c = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
const cstate = async () => JSON.parse(await c.ev(`JSON.stringify({gl: document.documentElement.hasAttribute('data-gl'), failed: document.documentElement.dataset.glFailed ?? null, lost: document.documentElement.dataset.glLost ?? null, desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.dataset.deskArrived ?? null, css3dShown: (() => { const w = document.querySelector('.desk-world'); return !!w && getComputedStyle(w).display !== 'none'; })(), canvas: !!document.querySelector('.room-canvas'), hits: !!document.querySelector('.room-hits'), room: !!window.__room})`));
await c.go(`${SITE}/?nointro&gl=1`, 5000);
await c.ev("dispatchEvent(new Event('kate:recognition'))"); await sleep(3500);
s = await cstate();
check("lost: the WebGL room at Recognition first", s.gl && s.canvas && s.desk === "award" && s.arrived === "1", s);
await c.ev("window.__lose = window.__room.renderer.getContext().getExtension('WEBGL_lose_context'); window.__lose.loseContext()");
await sleep(1500);
s = await cstate();
check("lost: still waiting for it to come back (1.5 s)", s.gl && s.lost === "1", s);
await sleep(5000);
s = await cstate();
check("lost for good: the CSS room at Recognition, no WebGL left", !s.gl && s.failed === "1" && s.css3dShown && !s.canvas && !s.hits && !s.room && s.desk === "award", s);
await c.shot(path.join(OUT, "lost-award.png"));
await c.ev("dispatchEvent(new Event('kate:off-duty'))"); await sleep(3500);
s = await cstate();
check("lost for good: on to Off Duty in the CSS room", s.desk === "offduty" && s.arrived === "1" && s.css3dShown, s);
const cerrs = c.console.filter((l) => /^(error|EXC)/.test(l) && !/^error room/.test(l));
check("lost for good: no other console errors", cerrs.length === 0, cerrs.slice(0, 5));
c.close();
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
