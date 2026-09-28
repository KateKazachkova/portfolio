// WebGL by default (GL_BOOT): no ?gl in any URL here. A fresh tab gets the
// WebGL room; every stop's direct URL and a refresh of it arrive, by day and
// at night; stops, Back / Forward, Escape; ?gl=0 gives the legacy CSS room
// and keeps it for the tab, ?gl=1 brings WebGL back; the first visit's
// intro; the case pages; a browser with no WebGL falls back from the first
// load and stays on the CSS room.
//   node scripts/room/default.mjs http://localhost:3301
import { launch, sleep, log } from "./cdp.mjs";

process.env.ROOM_CLOCK = "real";
const SITE = process.argv[2] ?? "http://localhost:3301";
let fails = 0;
const check = (label, ok, s) => { if (!ok) fails++; log(ok ? "ok  " : "FAIL", label, s === undefined ? "" : JSON.stringify(s)); };
const today = (hm) => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${hm}`; };
const STATE = `JSON.stringify({ gl: document.documentElement.hasAttribute("data-gl"), ready: document.documentElement.hasAttribute("data-gl-ready"),
  failed: document.documentElement.dataset.glFailed ?? null, canvas: !!document.querySelector(".room-canvas"), css3d: !!document.querySelector(".desk-world"),
  desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.hasAttribute("data-desk-arrived"), hash: location.hash,
  night: document.documentElement.hasAttribute("data-night"), flag: (() => { try { return sessionStorage.getItem("room-gl"); } catch { return "x"; } })(),
  view: window.__room ? window.__room.stats().view : null })`;

async function open(at, extra = []) {
  const b = await launch({ width: 1512, height: 860, extra });
  if (at) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(${JSON.stringify(at)}).getTime()-O.now();
    class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}; window.Date=D;})()` });
  b.st = async () => JSON.parse(await b.ev(STATE, 15000) ?? "{}");
  b.arrive = async () => { for (let i = 0; i < 20; i++) { const s = await b.st(); if (s.arrived || !s.hash) return s; await sleep(500); } return b.st(); };
  b.errors = () => b.console.filter((l) => /^(error|EXC)/.test(l));
  return b;
}
const DESK = { "#case-files": "open", "#recognition": "award", "#profile": "profile", "#off-duty": "offduty" };

// 1. a fresh tab, by day and at night: WebGL; each stop's direct URL, then a refresh of it
for (const [when, at] of [["day", today("10:30")], ["night", today("23:30")]]) {
  const b = await open(at);
  await b.go(`${SITE}/?nointro`, 4000);
  let s = await b.st();
  check(`${when}: a fresh tab is WebGL's`, s.gl && s.ready && s.canvas && !s.css3d && s.flag === null && s.night === (when === "night"), s);
  for (const [hash, desk] of Object.entries(DESK)) {
    await b.go(`${SITE}/?nointro${hash}`, 3000);
    s = await b.arrive();
    check(`${when}: direct ${hash}`, s.gl && s.ready && s.desk === desk && s.arrived, s);
    await b.send("Page.reload"); await sleep(3500);
    s = await b.arrive();
    check(`${when}: refresh ${hash}`, s.gl && s.ready && s.desk === desk && s.arrived, s);
  }
  check(`${when}: no console errors`, b.errors().length === 0, b.errors().slice(0, 3));
  b.close();
}

// 2. moving about: stops, Back / Forward, Escape
{
  const b = await open(today("10:30"));
  await b.go(`${SITE}/?nointro`, 4000);
  for (const [ev, desk] of [["case-files", "open"], ["recognition", "award"], ["profile", "profile"], ["off-duty", "offduty"]]) {
    await b.ev(`dispatchEvent(new Event('kate:${ev}'))`); await sleep(3400);
    const s = await b.st();
    check(`stop ${ev}`, s.desk === desk && s.arrived && s.view !== null, s);
  }
  // (from one stop to the next is the same history entry, DeskScene toggle)
  await b.ev("history.back()"); await sleep(3400);
  let s = await b.st(); check("Back → home", s.desk === "closed" && !s.hash && s.gl, s);
  await b.ev("history.forward()"); await sleep(3400);
  s = await b.st(); check("Forward → Off Duty", s.desk === "offduty" && s.hash === "#off-duty" && s.arrived, s);
  await b.ev("dispatchEvent(new Event('kate:recognition'))"); await sleep(3400);
  await b.ev("dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))"); await sleep(3400);
  s = await b.st(); check("Escape → home (from Recognition)", s.desk === "closed" && !s.hash && s.gl, s);
  // a case page and back home: the room again
  await b.go(`${SITE}/work/ukrainska-15`, 2500);
  check("a case page: no room, no errors", !(await b.st()).canvas && b.errors().length === 0, b.errors().slice(0, 3));
  await b.ev("history.back()"); await sleep(4000);
  s = await b.st(); check("back home from a case page: WebGL", s.gl && s.canvas && s.ready, s);
  b.close();
}

// 3. ?gl=0: legacy, kept for the tab; ?gl=1: WebGL again
{
  const b = await open(today("10:30"));
  await b.go(`${SITE}/?nointro&gl=0`, 4000);
  let s = await b.st(); check("?gl=0: the CSS room", !s.gl && s.css3d && !s.canvas && s.flag === "0", s);
  await b.go(`${SITE}/?nointro#recognition`, 3000);
  s = await b.arrive(); check("?gl=0 kept for the tab (no ?gl, a stop)", !s.gl && s.css3d && !s.canvas && s.desk === "award" && s.arrived, s);
  await b.go(`${SITE}/?nointro&gl=1`, 4000);
  s = await b.st(); check("?gl=1: WebGL again", s.gl && s.ready && s.canvas && !s.css3d && s.flag === "1", s);
  check("A/B: no console errors", b.errors().length === 0, b.errors().slice(0, 3));
  b.close();
}

// 4. the first visit's intro (no ?nointro): the room comes up behind it
{
  const b = await open(today("10:30"));
  await b.go(`${SITE}/`, 9000);
  const s = await b.st();
  check("first visit with the intro: WebGL room ready", s.gl && s.ready && s.canvas, s);
  check("intro: no console errors", b.errors().length === 0, b.errors().slice(0, 3));
  b.close();
}

// 5. no WebGL at all, straight from the default URL: the CSS room, and a
//    refresh starts there
{
  const b = await open(today("10:30"), ["--disable-webgl", "--disable-webgl2"]);
  await b.go(`${SITE}/?nointro#case-files`, 4500);
  let s = await b.arrive();
  check("no WebGL: the CSS room at the stop", !s.gl && s.failed === "1" && s.css3d && !s.canvas && s.desk === "open" && s.arrived && s.flag === "0", s);
  await b.send("Page.reload"); await sleep(4000);
  s = await b.arrive();
  check("no WebGL, refresh: the CSS room from the first paint", !s.gl && s.css3d && !s.canvas && s.desk === "open" && s.arrived, s);
  b.close();
}
log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
