// Home's groups on the way back (M6 group 8): the flip clock, the case and
// the lamp are read off the page when the camera leaves home; a minute spent
// at a stop turns the page's clock on, so on the way back WebGL must draw
// it as it is then, not as it was at departure. Case Files for 62 s, then
// home, screencast: the clock's region in the flight's last frames against
// the page's own once home (over24 %), and the digits the page shows.
//
//   node scripts/room/clock-return.mjs http://localhost:3301
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "webgl-m6/clock-return");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.go(`${SITE}/?nointro&gl=1`, 8000);
const clockBox = JSON.parse(await b.ev(`JSON.stringify((()=>{const r=document.querySelector('.flip-clock-slot').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})())`));
const digits = () => b.ev(`[...document.querySelectorAll('.flip-clock-slot')].map(e=>e.textContent.replace(/\\s+/g,'')).join('')`);
const before = await digits();
await b.ev(`dispatchEvent(new Event("kate:case-files"))`);
await sleep(62000);
const frames = [];
b.handlers.add((m) => { if (m.method !== "Page.screencastFrame") return; frames.push(m.params.data); b.send("Page.screencastFrameAck", { sessionId: m.params.sessionId }); });
await b.send("Page.startScreencast", { format: "png", maxWidth: 756, maxHeight: 430, everyNthFrame: 1 });
await sleep(300);
await b.ev(`history.back()`);
await sleep(4500);
await b.send("Page.stopScreencast");
const after = await digits();
frames.forEach((d, i) => fs.writeFileSync(path.join(OUT, `f${String(i).padStart(4, "0")}.png`), Buffer.from(d, "base64")));
const res = JSON.parse(execFileSync("python3", ["-c", `
import sys, os, json
from PIL import Image
import numpy as np
d = sys.argv[1]; x, y, w, h = [float(v) / 2 for v in sys.argv[2].split(',')]
fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
crop = lambda f: np.asarray(Image.open(os.path.join(d, f)).convert('RGB').crop((int(x), int(y), int(x + w), int(y + h)))).astype(int)
steps = [float((np.abs(crop(fs[i]) - crop(fs[i-1])).max(2) > 24).mean() * 100) for i in range(1, len(fs))]
last = crop(fs[-1])
# the last frame that still moves (the flight's), against the page's still one
moving = [i for i, s in enumerate(steps) if s > 0.5]
print(json.dumps({'frames': len(fs), 'max_step_clock': round(max(steps), 1), 'steps_tail': [round(s, 1) for s in steps[-40:] if s > 0.2]}))`, OUT, clockBox.join(",")]).toString());
log(JSON.stringify({ before, after, ...res }));
b.close();
