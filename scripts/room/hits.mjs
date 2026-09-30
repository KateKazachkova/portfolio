// The room's interactive objects for the WebGL room's DOM layer (M3):
// what each is (a link, a button), what it says (its accessible name, its
// hover label), where it lies (its matrix, in u, at each stop) and, for
// the trophy, a small alpha mask to hit-test its silhouette with. Read off
// the legacy CSS room; writes public/room/hits.json.
//
// Each names the legacy element it was read off (`of`), for the parity check
// in hits-test.mjs; under the flag the legacy room is not rendered at all.
//
//   node scripts/room/hits.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";
import { SIG_SRC } from "../../lib/room/sig.ts";
import { collect } from "./collect.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = path.resolve(import.meta.dirname, "../../public/room/hits.json");
// type: the control's class (room-hit--<type>); all: every match, ids
// <type>-<i>; kind: link | button | span (a focusable name with a label,
// for what has no link yet)
const PICK = [
  // Recognition: every ribbon on the lattice, then the certificate
  { type: "ribbon", sel: ".award-ribbon", all: true, at: ["award"], label: "data-label" },
  { type: "cert", sel: "a.desk-cert", at: ["award"], kind: "link" },
  // the Profile binder, lying in front of the certificate: a way to Profile
  // (at Profile itself it is the page's own flat DOM, M4)
  { type: "binder", sel: ".desk-binder", at: ["award"], kind: "button", action: "profile", name: "Profile binder — Profile" },
  // …and at Profile, the panel the page's own binder is laid flat on (M4)
  { type: "pf", sel: ".desk-binder", at: ["profile"], kind: "button" },
  // Off Duty: the bike computer, read from there (staging 27.09: no camera
  // down over it): the unit (a click anywhere: the next screen) and its
  // three buttons over it
  { type: "bike-unit", sel: ".bike", at: ["offduty"], kind: "button", action: "bike-next", tab: false },
  { type: "bike-prev", sel: ".bike__btn", i: 0, at: ["offduty"], kind: "button", action: "bike-prev" },
  { type: "bike-strava", sel: ".bike__btn", i: 1, at: ["offduty"], kind: "link" },
  { type: "bike-next", sel: ".bike__btn", i: 2, at: ["offduty"], kind: "button", action: "bike-next" },
  // the CD wallet: its two sleeves (a click on a margin turns the spread),
  // the open spread's eight discs over them, and the player's screen
  { type: "sleeve", sel: ".od-hang", all: true, at: ["offduty"], kind: "button", action: "sleeve-turn", tab: false },
  { type: "disc", sel: ".od-disc", all: true, at: ["offduty"], kind: "button", action: "disc-pick" },
  { type: "dvd", sel: ".od-dvd__screen", at: ["offduty"], kind: "button" },
  // Off Duty's shelf (M6): each book, comic and tape, and the omnibus on the
  // desk — a click takes it out (the page's own button, BookShelf.tsx …),
  // again puts it back; taken out, the control is over what shows then (a
  // book's or a tape's cover, the rest themselves)
  { type: "od-book", sel: ".bs-book", all: true, at: ["offduty"], kind: "button", action: "od-take", open: ".bs-book__cover" },
  { type: "od-comic", sel: ".bs-comic", all: true, at: ["offduty"], kind: "button", action: "od-take", open: "" },
  { type: "od-tape", sel: ".vt-tape", all: true, at: ["offduty"], kind: "button", action: "od-take", open: ".vt-tape__cover" },
  { type: "od-omnibus", sel: ".od-comic", all: true, at: ["offduty"], kind: "button", action: "od-take", open: "" },
  { type: "trophy", sel: "img.desk-award", at: ["home", "files"], kind: "button", action: "recognition", mask: true, name: "The Davey Awards trophy — Recognition" },
  // …the case files on the desk in front, each a way to Case Files, as the
  // page's .desk-cases > * are (DeskScene: a click from home)
  { type: "case-home", sel: ".desk-cases > *", all: true, at: ["home"], kind: "button", action: "files", name: "Case Files", tab: false },
  // …and on the left the player's edge, the way to Off Duty
  { type: "dvd-way", sel: ".od-dvd__lid > img", at: ["home"], kind: "button", action: "offduty", mask: true, name: "KATE™ DVD player — Off Duty" },
  // Case Files, left to right: Ukrainska 15's folder, its tag to the case
  // (out of the pocket once open) and its player; then each stack of
  // awards — the card, a way to lay it out, and laid out, its card's rows,
  // the juries' postcards and its tags
  // …and the panel the page's own folder lies on at Case Files (M6,
  // RoomU15.tsx): its box, the card's
  { type: "u15panel", sel: ".desk-card--env", at: ["files"], kind: "button", slug: "ukrainska-15" },
  { type: "u15", sel: ".u15-hit", at: ["files"], kind: "button", action: "u15-toggle", slug: "ukrainska-15" },
  { type: "u15-tag", sel: ".u15-note__btn", at: ["files"], kind: "link", slug: "ukrainska-15", here: true },
  { type: "player", sel: ".desk-player", at: ["files"], kind: "button", action: "u15-play", slug: "ukrainska-15" },
  ...["bulksource", "onsisoft", "waypro"].flatMap((slug) => {
    const card = `.desk-card--stack[data-slug="${slug}"]`;
    return [
      { type: "case", sel: card, at: ["files"], kind: "button", action: "case", slug, aside: true },
      { type: "row", sel: `${card} a.jury-card__row`, all: true, at: ["files"], kind: "link", slug, here: true },
      { type: "postcard", sel: `${card} .postcard`, all: true, at: ["files"], kind: "link", slug, here: true },
      { type: "jury-tag", sel: `${card} .jury-tag`, all: true, at: ["files"], kind: "link", slug, here: true },
    ];
  }),
];
// the case files laid out one at a time (html[data-desk-focus]), for where
// everything on the desk lies then
const FOCI = ["ukrainska-15", "bulksource", "onsisoft", "waypro"];
const b = await launch({ width: 1600, height: 1000, dpr: 1 });
await b.go(SITE + "/?nointro&gl=0", 4000);
for (const e of ["kate:case-files", "kate:recognition", "kate:off-duty", "kate:profile"]) { await b.ev(`dispatchEvent(new Event("${e}"))`); await sleep(3200); }
await b.ev("history.back()"); await sleep(3500);
await b.ev(`(${collect.toString()})(${JSON.stringify(SIG_SRC)}) && 1`);
const u = await b.ev("document.querySelector('.case-stage').getBoundingClientRect().width / 1118");
const hits = [];
for (const p of PICK) {
  const list = JSON.parse(await b.ev(`(()=>{const els=[...document.querySelectorAll(${JSON.stringify(p.sel)})].map((el,i)=>[el,i])${p.all ? "" : `.slice(${p.i ?? 0},${(p.i ?? 0) + 1})`};
    return JSON.stringify(els.map(([el,i])=>{const m=window.__bkWorld(el); const s=window.__bkSize(el);
      return {i, m, w:s[0], h:s[1], tag: el.tagName.toLowerCase(), href: el.getAttribute('href'), target: el.getAttribute('target'),
        name: el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim().slice(0,80),
        hover: ${p.label ? `el.getAttribute(${JSON.stringify(p.label)})` : "null"}, src: el.currentSrc || null}}))})()`));
  if (!list.length) { log("missing", p.sel); continue; }
  for (const j of list) {
    const kind = p.kind ?? (j.tag === "a" ? "link" : j.tag === "button" ? "button" : "span");
    const id = [p.type, ...(p.slug && p.type !== "case" && !p.type.startsWith("u15") && p.type !== "player" ? [p.slug] : p.type === "case" ? [p.slug] : []), ...(p.all ? [j.i] : [])].join("-");
    const hit = {
      id, type: p.type, kind, at: p.at, ...(p.action ? { action: p.action } : {}), ...(p.tab === false ? { tab: false } : {}),
      ...(p.slug ? { slug: p.slug } : {}), ...(p.here ? { focus: p.slug } : {}), ...(p.aside ? { notFocus: p.slug } : {}),
      label: p.name ?? j.name, hover: j.hover, href: kind === "link" ? j.href : null, target: kind === "link" ? j.target : null,
      of: { sel: p.sel, i: j.i },
      w: j.w / u, h: j.h / u, m: j.m.map((v, i) => (i >= 12 && i <= 14 ? v / u : v)),
    };
    if (p.mask && j.src) {
      // the silhouette, 64 px across, as 0/1 per px
      const file = path.join(path.resolve(import.meta.dirname, "../../public"), new URL(j.src).pathname);
      hit.mask = JSON.parse(execFileSync("python3", ["-c", `import json;from PIL import Image;im=Image.open(${JSON.stringify(file)}).convert('RGBA');w=64;h=max(1,round(im.height*w/im.width));a=im.resize((w,h)).getchannel('A');print(json.dumps({'w':w,'h':h,'bits':''.join('1' if v>96 else '0' for v in a.getdata())}))`]).toString());
    }
    if (p.open !== undefined) Object.defineProperty(hit, "openSel", { value: p.open, enumerable: false });
    hits.push(hit);
  }
}
// ── Case Files, each case laid out in turn: where its parts lie then, and
// where the rest have moved aside to ──
const files = hits.filter((h) => h.at.includes("files") && h.slug);
await b.ev(`dispatchEvent(new Event("kate:case-files"))`); await sleep(3500);
const read = async () => JSON.parse(await b.ev(`JSON.stringify(${JSON.stringify(files.map((h) => [h.id, h.of.sel, h.of.i]))}.map(([id,s,i])=>[id, window.__bkWorld(document.querySelectorAll(s)[i])]))`));
const near = (a, c) => a.every((v, i) => Math.abs(v - c[i]) < 0.01);
for (const f of FOCI) {
  if (f === "ukrainska-15") await b.ev(`document.querySelector('.u15-hit').click()`);
  else await b.ev(`document.querySelector('.desk-card[data-slug="${f}"]').click()`);
  await sleep(1800);
  const focus = await b.ev("document.documentElement.dataset.deskFocus");
  if (focus !== f) log("focus did not take", f, focus);
  for (const [id, m0] of await read()) {
    const h = hits.find((x) => x.id === id);
    const m = m0.map((v, i) => (i >= 12 && i <= 14 ? v / u : v));
    // laid out, a case's own parts lie there; the rest, where they move to
    if (h.focus === f) h.m = m;
    else if (!h.focus && !near(m, h.m)) (h.byFocus ??= {})[f] = m;
  }
  await b.ev(`dispatchEvent(new Event("kate:desk-put-away"))`); await sleep(1800);
}
// ── Off Duty, each thing taken out in turn: where what shows then lies ──
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`); await sleep(3500);
for (const h of hits.filter((x) => x.openSel !== undefined)) {
  const el = `document.querySelectorAll(${JSON.stringify(h.of.sel)})[${h.of.i}]`;
  await b.ev(`${el}.click() || 1`); await sleep(1700);
  if (!(await b.ev(`${el}.hasAttribute('data-open')`))) { log("did not come out", h.id); continue; }
  const g = JSON.parse(await b.ev(`(()=>{const e=${h.openSel ? `${el}.querySelector(${JSON.stringify(h.openSel)})` : el};return JSON.stringify({m:window.__bkWorld(e),s:window.__bkSize(e)})})()`));
  h.open = { m: g.m.map((v, i) => (i >= 12 && i <= 14 ? v / u : v)), w: g.s[0] / u, h: g.s[1] / u };
  await b.ev(`${el}.click() || 1`); await sleep(1500);
}
fs.writeFileSync(OUT, JSON.stringify({ hits }));
const n = {};
for (const h of hits) n[h.type] = (n[h.type] ?? 0) + 1;
log("hits", Object.entries(n).map(([k, v]) => `${k} ${v}`).join(", "));
b.close();
