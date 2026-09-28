// The room's textures on other GPUs' compressed formats, in Chrome: the
// transcoder picks ASTC here (Apple GPU); hiding extensions from the page
// makes it pick what other machines get — BC7 (BPTC: Windows, Intel Macs),
// BC1/BC3 (S3TC only: Firefox on a Mac), ETC2 (Android without ASTC) — and
// each stop's WebGL layer is compared with the ASTC one (over8 %: share of
// pixels off by more than 8 levels). A texture the GPU refuses draws black
// or clear, far over any encoding difference.
//
//   node scripts/room/formats.mjs http://localhost:3301 [OUTDIR]
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const OUT = process.argv[3] ?? path.join(TESTS, "formats");
fs.mkdirSync(OUT, { recursive: true });
const STOPS = [["home", null], ["files", "kate:case-files"], ["award", "kate:recognition"], ["profile", "kate:profile"], ["offduty", "kate:off-duty"]];
const HIDE = {
  astc: [],
  bptc: ["WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_pvrtc", "WEBKIT_WEBGL_compressed_texture_pvrtc"],
  s3tc: ["WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_pvrtc", "WEBKIT_WEBGL_compressed_texture_pvrtc", "EXT_texture_compression_bptc"],
  etc2: ["WEBGL_compressed_texture_astc", "EXT_texture_compression_bptc", "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_compressed_texture_pvrtc", "WEBKIT_WEBGL_compressed_texture_pvrtc"],
};
const CANVAS = `(() => { const r = window.__room; r.renderer.render(r.scene, r.camera); return r.renderer.domElement.toDataURL("image/png").split(",")[1]; })()`;
const res = {};
let fails = 0;
for (const [fmt, hide] of Object.entries(HIDE)) {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  if (hide.length) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => { const H = new Set(${JSON.stringify(hide)});
    for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) { const g = C.prototype.getExtension, s = C.prototype.getSupportedExtensions;
      C.prototype.getExtension = function (n) { return H.has(n) ? null : g.call(this, n); };
      C.prototype.getSupportedExtensions = function () { return (s.call(this) || []).filter((n) => !H.has(n)); }; } })()` });
  await b.go(`${SITE}/?nointro&gl=1`, 7000);
  const r = (res[fmt] = { exts: await b.ev(`(() => { const gl = window.__room.renderer.getContext(); return gl.getSupportedExtensions().filter((e) => /compress/i.test(e)); })()`) });
  for (const [name, ev] of STOPS) {
    if (ev) { await b.ev(`dispatchEvent(new Event("${ev}"))`); await sleep(3800); }
    const d = await b.ev(CANVAS);
    fs.writeFileSync(path.join(OUT, `${fmt}-${name}.png`), Buffer.from(d, "base64"));
    if (ev) { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`); await sleep(3500); }
  }
  r.glError = await b.ev("window.__room.renderer.getContext().getError()");
  r.console = b.console.filter((l) => /^error|WebGL/.test(l)).slice(0, 5);
  b.close();
  await sleep(800);
}
const py = `
import sys, json, numpy as np
from PIL import Image
d = sys.argv[1]; out = {}
for f in ["bptc", "s3tc", "etc2"]:
    out[f] = {}
    for n in ["home", "files", "award", "profile", "offduty"]:
        a = np.asarray(Image.open(f"{d}/{f}-{n}.png").convert("RGBA")).astype(int)
        b = np.asarray(Image.open(f"{d}/astc-{n}.png").convert("RGBA")).astype(int)
        m = np.abs(a - b).max(axis=2)
        out[f][n] = round(float((m > 8).mean() * 100), 2)
print(json.dumps(out))`;
const cmp = JSON.parse(execFileSync("python3", ["-c", py, OUT]).toString());
for (const [f, v] of Object.entries(cmp)) {
  const worst = Math.max(...Object.values(v));
  const bad = worst > 5 || res[f].glError;
  if (bad) fails++;
  log(bad ? "FAIL" : "ok  ", f.padEnd(5), JSON.stringify(v), "exts", res[f].exts.join(","), "glError", res[f].glError, res[f].console.join(" | "));
}
fs.writeFileSync(path.join(OUT, "formats.json"), JSON.stringify({ res, cmp }, null, 1));
log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
