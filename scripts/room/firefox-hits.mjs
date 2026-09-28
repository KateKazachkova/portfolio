// The WebGL room's controls in Firefox (M7 cross-browser QA, bidi.mjs): real
// pointer clicks and keys, a few of hits-test.mjs's checks — Case Files'
// folder opening and a stack laid out, Profile's binder turned, Off Duty's
// disc into the player and a book taken out, Recognition's ribbon link, and
// Escape home — each read off the page's own state.
//
//   node scripts/room/firefox-hits.mjs http://localhost:3301
import { sleep, log } from "./cdp.mjs";
import { launchFirefox } from "./bidi.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const b = await launchFirefox({ clock: process.env.NIGHT ? [23, 30] : [10, 30] });
let fails = 0;
const ok = (c, label, x) => { if (!c) fails++; log(c ? "ok  " : "FAIL", label, x === undefined ? "" : JSON.stringify(x)); };
const center = (sel) => b.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; const x = Math.min(Math.max(r.left + r.width / 2, r.left + 4), innerWidth - 4), y = Math.min(r.top + r.height / 2, Math.max(r.top + 8, innerHeight - 24)); return { x: Math.round(x), y: Math.round(y) }; })()`);
// (a point of it inside the window: the open folder reaches past the bottom)
const click = async (sel) => {
  const p = await center(sel);
  if (!p) { log("no", sel); return false; }
  await b.send("input.performActions", { context: b.ctx, actions: [{ type: "pointer", id: "m", parameters: { pointerType: "mouse" }, actions: [{ type: "pointerMove", x: p.x, y: p.y }, { type: "pause", duration: 50 }, { type: "pointerDown", button: 0 }, { type: "pause", duration: 40 }, { type: "pointerUp", button: 0 }] }] });
  await b.send("input.releaseActions", { context: b.ctx });
  return true;
};
const key = (k) => b.send("input.performActions", { context: b.ctx, actions: [{ type: "key", id: "k", actions: [{ type: "keyDown", value: k }, { type: "keyUp", value: k }] }] });
const until = async (js, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await b.ev(js)) return true; await sleep(150); } return false; };
const arrived = (desk) => until(`document.documentElement.dataset.desk === "${desk}" && !!document.documentElement.dataset.deskArrived`);
const home = async () => { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`); await until(`document.documentElement.dataset.desk === "closed"`); await sleep(1200); };

await b.go(`${SITE}/?nointro&gl=1`);
await until(`!!document.documentElement.dataset.glReady && !!document.documentElement.dataset.glZone`, 20000);
await sleep(3000);

// Case Files: the folder opens under the pointer, a stack is laid out
await b.ev(`dispatchEvent(new Event("kate:case-files"))`);
ok(await arrived("open"), "files: arrived");
await sleep(600);
await click(".room-hit--u15panel .u15-hit");
ok(await until(`document.querySelector(".room-hit--u15panel .u15-hit")?.getAttribute("aria-expanded") === "true"`, 3000), "files: a click opens Ukrainska 15");
// (the camera pans onto it and its prints spill out: clicked again once still)
await sleep(2500);
await click(".room-hit--u15panel .u15-hit");
ok(await until(`document.querySelector(".room-hit--u15panel .u15-hit")?.getAttribute("aria-expanded") === "false"`, 4000), "files: a second click puts it away");
await sleep(800);
await click(`[data-hit="case-bulksource"]`);
ok(await until(`document.documentElement.dataset.deskFocus === "bulksource"`, 4000), "files: a click lays BulkSource's stack out", await b.ev("document.documentElement.dataset.deskFocus ?? null"));
await home();

// Profile: → turns the binder
await b.ev(`dispatchEvent(new Event("kate:profile"))`);
ok(await arrived("profile"), "profile: arrived");
await sleep(800);
const at0 = await b.ev("window.__room.stats().binder.at");
await key(""); // ArrowRight
ok(await until(`window.__room.stats().binder.at !== ${at0}`, 3000), "profile: → turns a page", { from: at0, to: await b.ev("window.__room.stats().binder.at") });
await sleep(1500);
await home();

// Off Duty: a disc into the player, a book taken out
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
ok(await arrived("offduty"), "offduty: arrived");
await sleep(800);
await click(`[data-hit="disc-0"]`);
ok(await until(`!!document.querySelector(".room-hit--dvd[data-clip]") || !!document.querySelector(".room-hit--dvd:not([hidden])")`, 4000), "offduty: a disc goes into the player (its screen is up)");
await sleep(800);
await click(`[data-hit="od-book-0"]`);
ok(await until(`!!document.querySelector(".room-od .bs-book")?.hasAttribute("data-open")`, 3000), "offduty: a click takes a book out (the page's own data-open)");
await key(""); // Escape: the book back
await sleep(1200);
await home();

// Recognition: a ribbon is a link to its case
await b.ev(`dispatchEvent(new Event("kate:recognition"))`);
ok(await arrived("award"), "award: arrived");
await sleep(600);
const href = await b.ev(`document.querySelector('[data-hit="ribbon-0"]')?.getAttribute("href") ?? document.querySelector('[data-hit="ribbon-0"]')?.tagName`);
ok(!!href, "award: ribbon 0 is there, a link", href);
await home();
ok(await b.ev(`document.documentElement.dataset.desk === "closed"`), "Escape → home");
// (not the page's: a third-party frame's cookie refused by Firefox)
const errs = b.console.filter((l) => /^error/.test(l) && !/PREF/.test(l));
ok(!errs.length, "no console errors", errs.slice(0, 5));
await b.close();
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
