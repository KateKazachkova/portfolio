// The room's interactive objects for the WebGL room's DOM layer (M3):
// what each is (a link, a button), what it says (its accessible name, its
// hover label), where it lies (its matrix, in u, at each stop) and, for
// the trophy, a small alpha mask to hit-test its silhouette with. Read off
// the legacy CSS room; writes public/room/hits.json.
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
// the M3 spike's three objects (+ the trophy): a plain link, a hoverable
// one with a label, and two with hit areas that are not rectangles
const PICK = [
  { id: "cert", sel: "a.desk-cert", at: ["award"], kind: "link" },
  { id: "ribbon", sel: ".award-ribbon", at: ["award"], kind: "hover" },
  { id: "bike", sel: ".bike", at: ["offduty"], kind: "button", action: "offduty-bike" },
  { id: "trophy", sel: "img.desk-award", at: ["home", "files"], kind: "button", action: "recognition", mask: true },
];
const b = await launch({ width: 1600, height: 1000, dpr: 1 });
await b.go(SITE + "/?nointro&gl=0", 4000);
for (const e of ["kate:case-files", "kate:recognition", "kate:off-duty", "kate:profile"]) { await b.ev(`dispatchEvent(new Event("${e}"))`); await sleep(3200); }
await b.ev("history.back()"); await sleep(3500);
await b.ev(`(${collect.toString()})(${JSON.stringify(SIG_SRC)}) && 1`);
const u = await b.ev("document.querySelector('.case-stage').getBoundingClientRect().width / 1118");
const hits = [];
for (const p of PICK) {
  const info = await b.ev(`(()=>{const el=document.querySelector(${JSON.stringify(p.sel)}); if(!el) return null;
    const a=getComputedStyle(el,'::after'); const m=window.__bkWorld(el); const s=window.__bkSize(el);
    return JSON.stringify({m, w:s[0], h:s[1], href: el.getAttribute('href'), target: el.getAttribute('target'), label: el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim().slice(0,80),
      after: a.content && a.content!=='none' ? a.content.replace(/^"|"$/g,'') : null, src: el.currentSrc || null})})()`);
  if (!info) { log("missing", p.sel); continue; }
  const j = JSON.parse(info);
  const hit = { ...p, label: j.label || j.after, hover: j.after, href: j.href, target: j.target, w: j.w / u, h: j.h / u, m: j.m.map((v, i) => (i >= 12 && i <= 14 ? v / u : v)) };
  delete hit.sel;
  if (p.mask && j.src) {
    // the silhouette, 64 px across, as 0/1 per px
    const file = path.join(path.resolve(import.meta.dirname, "../../public"), new URL(j.src).pathname);
    hit.mask = JSON.parse(execFileSync("python3", ["-c", `import json;from PIL import Image;im=Image.open(${JSON.stringify(file)}).convert('RGBA');w=64;h=max(1,round(im.height*w/im.width));a=im.resize((w,h)).getchannel('A');print(json.dumps({'w':w,'h':h,'bits':''.join('1' if v>96 else '0' for v in a.getdata())}))`]).toString());
  }
  hits.push(hit);
}
fs.writeFileSync(OUT, JSON.stringify({ hits }));
log("hits", hits.map((h) => h.id).join(", "));
b.close();
