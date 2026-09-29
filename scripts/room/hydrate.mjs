// Hydration by date (#418): the build's HTML is made on one day and read on
// another. Opens the page with the browser's clock set to other days and
// reports React errors, the room's start and a stop's arrival.
//   node scripts/room/hydrate.mjs http://localhost:3301              # the matrix below
//   node scripts/room/hydrate.mjs http://localhost:3301 "/?nointro&gl=1#off-duty" 2026-09-23T23:30
import { launch, sleep, log } from "./cdp.mjs";

process.env.ROOM_CLOCK = "real";
const base = process.argv[2] ?? "http://localhost:3301";
const iso = (days, hm) => {
  const d = new Date(Date.now() + days * 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${hm}`;
};
const sat = (6 - new Date().getDay() + 7) % 7 || 7;
const DATES = process.argv[4] ? [process.argv[4]]
  : [iso(-5, "10:30"), iso(-5, "23:30"), iso(0, "10:30"), iso(0, "23:30"), iso(3, "15:30"), iso(sat, "11:00"), iso(sat, "21:00"), iso(40, "08:00")];
const PATHS = process.argv[3] ? [process.argv[3]]
  : ["/?nointro&gl=1", "/?nointro&gl=1#off-duty", "/?nointro&gl=1#profile", "/?nointro&gl=0#case-files", "/?nointro&gl=0#recognition"];

let fails = 0;
for (const at of DATES) for (const path of PATHS) {
  const b = await launch({ width: 1512, height: 860, dpr: 1 });
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(${JSON.stringify(at)}).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()` });
  await b.go(base + path, 4000);
  const hash = path.includes("#");
  for (let i = 0; i < 20; i++) {
    if (await b.ev(`document.documentElement.hasAttribute("data-desk-arrived") || !location.hash`, 15000)) break;
    await sleep(500);
  }
  const raw = await b.ev(`JSON.stringify({ clock: document.querySelector(".flip-clock")?.getAttribute("aria-label") ?? null,
    desk: document.documentElement.dataset.desk ?? null, arrived: document.documentElement.hasAttribute("data-desk-arrived"),
    glReady: document.documentElement.hasAttribute("data-gl-ready"), night: document.documentElement.hasAttribute("data-night") })`, 15000);
  // a page that does not answer (a hung renderer) is a failure, not a crash
  const st = raw ? JSON.parse(raw) : { hung: true };
  const errs = b.console.filter((l) => /error|EXC|418|hydrat|mismatch/i.test(l));
  const bad = !raw || errs.length > 0 || (hash && !st.arrived) || (path.includes("gl=1") && !st.glReady);
  if (bad) fails++;
  log(bad ? "FAIL" : "ok  ", at, path, JSON.stringify(st));
  for (const e of errs) log("    " + e.slice(0, 1200));
  b.close();
}
log(fails ? `FAIL ${fails} of ${DATES.length * PATHS.length}` : `PASS ${DATES.length * PATHS.length}/${DATES.length * PATHS.length}`);
process.exit(fails ? 1 : 0);
