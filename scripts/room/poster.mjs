// The still of the room at home (M2's first paint): the WebGL room drawn
// once, without the case, clock and lamp, over a stage-u rectangle wide and
// tall enough for any window, written as public/room/poster-home.webp. The
// page shows it (components/room/room.css) until WebGL has drawn the room.
//
//   node scripts/room/poster.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
// the rectangle in stage u, and its px per u (a still that is on screen
// for a moment: sharp enough, and light)
export const POSTER = { x: -560, y: -420, w: 2240, h: 1600, k: 0.9 };
const W = Math.round(POSTER.w * POSTER.k), H = Math.round(POSTER.h * POSTER.k);
const b = await launch({ width: 1600, height: 1000, dpr: 1 });
await b.go(`${SITE}/?nointro&gl=1`, 3000);
await b.ev(`new Promise(r=>{const t0=performance.now();const f=()=>{const s=window.__room&&window.__room.stats();if(s&&s.pending===0&&s.loaded===s.slots||performance.now()-t0>30000)r(1);else setTimeout(f,200)};f()})`, 40000);
await sleep(500);
const url = await b.ev(`window.__room.renderRegion(${POSTER.x}, ${POSTER.y}, ${POSTER.w}, ${POSTER.h}, ${W}, ${H})`, 60000);
b.close();
const png = path.join(process.env.HOME, "Documents/portfolio-offload/room-bake/poster-home.png");
fs.writeFileSync(png, Buffer.from(url.split(",")[1], "base64"));
const out = path.resolve(import.meta.dirname, "../../public/room/poster-home.webp");
// its alpha kept: where no plane is, the page's own ground shows, as in the room
execFileSync("python3", ["-c", `from PIL import Image; Image.open(${JSON.stringify(png)}).save(${JSON.stringify(out)}, 'WEBP', quality=72, method=6)`]);
log("poster", `${W}×${H}`, (fs.statSync(out).size / 1024).toFixed(0), "KB");
