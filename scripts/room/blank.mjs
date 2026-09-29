// The Profile binder on the desk before its first visit: blank sheets, as
// the CSS room's DeskBinder (BLANK spreads until the camera first sets off
// for Profile), its own pages from then on (engine.ts warmBinder). At
// Recognition before and after a visit to Profile, in both rooms: the
// binder's box on screen compared between the two rooms and with itself.
//
//   node scripts/room/blank.mjs http://localhost:3301 [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "blank");
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (label, ok, s) => { if (!ok) fails++; log(ok ? "ok  " : "FAIL", label, s === undefined ? "" : JSON.stringify(s)); };
const go = async (b, ev, ms = 3600) => { await b.ev(`dispatchEvent(new Event("${ev}"))`); await sleep(ms); };
const home = async (b) => { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`); await sleep(3500); };
// the binder's box at Recognition (the page's own .desk-binder is there in
// the CSS room; the same box in both at 1512 × 860)
const BOX = { x: 756, y: 615, width: 756, height: 245 };

const shots = {};
for (const gl of [1, 0]) {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.go(`${SITE}/?nointro&gl=${gl}`, 6000);
  const tag = gl ? "gl" : "css";
  await go(b, "kate:recognition");
  await b.shot(shots[`${tag}-before`] = path.join(OUT, `${tag}-before.png`), BOX);
  if (gl) {
    const t = await b.ev(`window.__room.textures().filter((x) => x.kind === "slot" && /-blank/.test(x.src)).map((x) => x.state)`);
    check("gl: two blank sheets up before the first visit (the spread's faces up)", t.length === 2 && t.every((s) => s === 2), t);
  }
  await home(b);
  await go(b, "kate:profile", 4500);
  await home(b);
  await go(b, "kate:recognition");
  await b.shot(shots[`${tag}-after`] = path.join(OUT, `${tag}-after.png`), BOX);
  if (gl) {
    const t = await b.ev(`window.__room.textures().filter((x) => x.kind === "slot" && /-blank/.test(x.src)).map((x) => x.state)`);
    check("gl: after the visit the blank sheets are off the GPU", t.every((s) => s !== 2), t);
  }
  b.close();
  await sleep(800);
}
// what is on the pages: the share of the binder's box darker than the paper
// and the tiles (the CV's portrait and its dark right-hand page), %
const py = `
import sys, json, numpy as np
from PIL import Image
d = json.loads(sys.argv[1])
out = {}
for k, v in d.items():
    a = np.asarray(Image.open(v).convert("L")).astype(int)
    h, w = a.shape
    out[k] = round(float((a[int(h * .3):int(h * .65), int(w * .15):int(w * .95)] < 90).mean() * 100), 2)
print(json.dumps(out))`;
const r = JSON.parse(execFileSync("python3", ["-c", py, JSON.stringify(shots)]).toString());
log("dark %", JSON.stringify(r));
// (since Recognition looks straight ahead, 29.09, the box also takes in a
// few dark px off the binder: blank is a quarter of filled, not under 1 %)
check("before the first visit: blank pages in both rooms", r["gl-before"] < r["gl-after"] / 3 && r["css-before"] < r["css-after"] / 3, r);
check("after it: the pages filled in both rooms, alike", r["gl-after"] > 10 && r["css-after"] > 10 && Math.abs(r["gl-after"] - r["css-after"]) < 5, r);
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
