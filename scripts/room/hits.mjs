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
  // Off Duty: the bike computer, a way down to it; down over it, the unit
  // (a click anywhere: the next screen) and its three buttons over it
  { type: "bike", sel: ".bike", at: ["offduty"], kind: "button", action: "offduty-bike" },
  { type: "bike-unit", sel: ".bike", at: ["bike"], kind: "button", action: "bike-next", tab: false },
  { type: "bike-prev", sel: ".bike__btn", i: 0, at: ["bike"], kind: "button", action: "bike-prev" },
  { type: "bike-strava", sel: ".bike__btn", i: 1, at: ["bike"], kind: "link" },
  { type: "bike-next", sel: ".bike__btn", i: 2, at: ["bike"], kind: "button", action: "bike-next" },
  { type: "trophy", sel: "img.desk-award", at: ["home", "files"], kind: "button", action: "recognition", mask: true, name: "The Davey Awards trophy — Recognition" },
];
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
    const hit = {
      id: p.all ? `${p.type}-${j.i}` : p.type, type: p.type, kind, at: p.at, ...(p.action ? { action: p.action } : {}), ...(p.tab === false ? { tab: false } : {}),
      label: p.name ?? j.name, hover: j.hover, href: kind === "link" ? j.href : null, target: kind === "link" ? j.target : null,
      of: { sel: p.sel, i: j.i },
      w: j.w / u, h: j.h / u, m: j.m.map((v, i) => (i >= 12 && i <= 14 ? v / u : v)),
    };
    if (p.mask && j.src) {
      // the silhouette, 64 px across, as 0/1 per px
      const file = path.join(path.resolve(import.meta.dirname, "../../public"), new URL(j.src).pathname);
      hit.mask = JSON.parse(execFileSync("python3", ["-c", `import json;from PIL import Image;im=Image.open(${JSON.stringify(file)}).convert('RGBA');w=64;h=max(1,round(im.height*w/im.width));a=im.resize((w,h)).getchannel('A');print(json.dumps({'w':w,'h':h,'bits':''.join('1' if v>96 else '0' for v in a.getdata())}))`]).toString());
    }
    hits.push(hit);
  }
}
fs.writeFileSync(OUT, JSON.stringify({ hits }));
const n = {};
for (const h of hits) n[h.type] = (n[h.type] ?? 0) + 1;
log("hits", Object.entries(n).map(([k, v]) => `${k} ${v}`).join(", "));
b.close();
