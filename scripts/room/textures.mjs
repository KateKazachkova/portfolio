// The room's textures for the GPU (M2): every picture of public/room/
// scene.json sized to what the closest camera needs of it (the bake's
// `need`, texture px per u in a 1728 × 1117 window at 2×) and never past its
// source, premultiplied, and encoded as KTX2 — UASTC (→ ASTC / BC7 on the
// GPU, near-lossless) where detail and type matter, ETC1S (→ ETC2 / BC1,
// much smaller) where a loss cannot be seen: soft shadows, haze, gradients.
// The sources are never touched: the bake's lossless masters
// (~/Documents/portfolio-offload/room-bake/png) and the site's own pictures
// in public/ are only read. Writes public/room/ktx2/*.ktx2 and adds `k2`,
// `k2px`, `k2mode` and `k2bytes` to scene.json's items.
//
//   node scripts/room/textures.mjs [--force] [--only=NAME]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { encodeToKTX2 } from "ktx2-encoder";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SCENE = path.join(ROOT, "public/room/scene.json");
const OUT = path.join(ROOT, "public/room/ktx2");
const LO = path.join(ROOT, "public/room/lo");
const MASTER = path.join(process.env.HOME, "Documents/portfolio-offload/room-bake/png");
const TMP = path.join(process.env.HOME, "Documents/portfolio-offload/room-bake/raw");
const OPT = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(LO, { recursive: true });
// a preview of every picture, at most 96 px across (WebP, a few KB): what a
// flight shows of a stop whose own textures are not in yet, instead of a hole
const preview = (master, name) => {
  const out = path.join(LO, name + ".webp");
  if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(master).mtimeMs)
    execFileSync("python3", ["-c", `from PIL import Image; im=Image.open(${JSON.stringify(master)}).convert('RGBA'); im.thumbnail((96,96), Image.LANCZOS); im.save(${JSON.stringify(out)}, 'WEBP', quality=70, method=6)`]);
  return `/room/lo/${name}.webp`;
};
fs.mkdirSync(TMP, { recursive: true });

const scene = JSON.parse(fs.readFileSync(SCENE));
// what may lose detail unseen: soft paint (shadows, haze, gradients) and the
// underside of the desk (shrunk by content in prep.py; ETC1S if opaque)
const soft = (it) => it.blend !== "normal" || /shadow|foot|cast|::before|::after|desk-under/.test(it.cls);
const MARGIN = 1.1;
const log = (...a) => process.stderr.write(a.join(" ") + "\n");

const done = new Map(); // src → result (shared pictures)
// --shard=i/n: encode every n-th picture only (run n at once), write no scene
const [shard, shards] = OPT.shard ? String(OPT.shard).split("/").map(Number) : [0, 1];
let idx = -1;
let totalIn = 0, totalOut = 0, gpu = 0;
for (const it of scene.items) {
  if (!it.src) continue;
  if (OPT.only && !it.src.includes(OPT.only)) continue;
  if (done.has(it.src)) { Object.assign(it, done.get(it.src)); continue; }
  idx++;
  if (idx % shards !== shard) { done.set(it.src, {}); continue; }
  const master = it.type === "tex" ? path.join(MASTER, path.basename(it.src).replace(/\.webp$/, ".png")) : path.join(ROOT, "public", it.src);
  if (!fs.existsSync(master)) { log("missing", master); continue; }
  // the size it needs: need × its size in u, a little over, never past the source
  const want = [Math.ceil(it.need * it.w * MARGIN), Math.ceil(it.need * it.h * MARGIN)];
  let mode = soft(it) ? "etc1s" : "uastc";
  const name = path.basename(it.src).replace(/\.[a-z0-9]+$/i, "");
  const out = path.join(OUT, name + ".ktx2");
  const raw = path.join(TMP, name + ".rgba");
  const info = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "prep.py"), master, raw, String(want[0]), String(want[1]), soft(it) ? "soft" : "sharp"]).toString());
  // ETC1S only for what has no alpha: with alpha and mipmaps it comes back
  // from the transcoder opaque black (basis/three as of 26.09.2026); soft
  // paint is tiny once shrunk, so UASTC costs it nothing
  mode = info.soft && info.opaque ? "etc1s" : "uastc";
  if (OPT.force || !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(master).mtimeMs) {
    const t0 = Date.now();
    const data = new Uint8Array(fs.readFileSync(raw));
    // the page's own look: sRGB values passed through as they are (the room
    // draws without colour conversion), so no sRGB transfer in the file
    const k2 = await encodeToKTX2(data, {
      // raw RGBA already: the "decoder" only says how big it is
      imageDecoder: async (buf) => ({ width: info.w, height: info.h, data: buf }),
      isUASTC: mode === "uastc",
      generateMipmap: true,
      // a compressed texture is not flipped on upload, as a picture is: store
      // it bottom row first, so the room reads both the same way
      isYFlip: true,
      isPerceptual: true,
      isSetKTX2SRGBTransferFunc: false,
      needSupercompression: mode === "uastc",
      uastcLDRQualityLevel: 2,
      enableRDO: mode === "uastc",
      rdoQualityLevel: 2.0,
      qualityLevel: 200,
      compressionLevel: 2,
    });
    fs.writeFileSync(out, k2);
    log(name.padEnd(36), mode, `${info.sw}×${info.sh} → ${info.w}×${info.h}`, `${(fs.statSync(out).size / 1024).toFixed(0)} KB`, `${Date.now() - t0} ms`);
  }
  const bytes = fs.statSync(out).size;
  // on the GPU: 1 byte a px for ASTC 4×4 / BC7 / ETC2 RGBA, and a third for mipmaps
  const g = Math.ceil(info.w / 4) * 4 * Math.ceil(info.h / 4) * 4 * (4 / 3);
  const res = { k2: `/room/ktx2/${name}.ktx2`, k2px: [info.w, info.h], k2mode: mode, k2bytes: bytes, lo: preview(master, name) };
  done.set(it.src, res);
  Object.assign(it, res);
  totalIn += fs.statSync(master).size; totalOut += bytes; gpu += g;
}
// the flat groups' baked paint (gradients, windows, shadows): the same way
for (const f of scene.flat ?? []) {
  if (OPT.only && !f.src.includes(OPT.only)) continue;
  const name = path.basename(f.src).replace(/\.webp$/, "");
  const master = path.join(MASTER, name + ".png");
  if (!fs.existsSync(master)) continue;
  idx++;
  if (idx % shards !== shard) continue;
  const out = path.join(OUT, name + ".ktx2"), raw = path.join(TMP, name + ".rgba");
  // drawn at the page's own size at home: the bake's px are what it needs
  const info = JSON.parse(execFileSync("python3", [path.join(import.meta.dirname, "prep.py"), master, raw, "99999", "99999", "sharp"]).toString());
  const mode = info.soft && info.opaque ? "etc1s" : "uastc";
  if (OPT.force || !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(master).mtimeMs) {
    const data = new Uint8Array(fs.readFileSync(raw));
    const k2 = await encodeToKTX2(data, { imageDecoder: async (buf) => ({ width: info.w, height: info.h, data: buf }), isUASTC: mode === "uastc", generateMipmap: true, isYFlip: true, isPerceptual: true,
      isSetKTX2SRGBTransferFunc: false, needSupercompression: mode === "uastc", uastcLDRQualityLevel: 2, enableRDO: mode === "uastc", rdoQualityLevel: 2.0, qualityLevel: 200, compressionLevel: 2 });
    fs.writeFileSync(out, k2);
    log(name.padEnd(36), mode, `${info.sw}×${info.sh} → ${info.w}×${info.h}`, `${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
  Object.assign(f, { k2: `/room/ktx2/${name}.ktx2`, k2px: [info.w, info.h], k2mode: mode });
  gpu += info.w * info.h * (4 / 3); totalOut += fs.statSync(out).size;
}
if (!OPT.only && !OPT.shard) {
  scene.ktx2 = { files: done.size, bytes: totalOut, gpuMB: +(gpu / 2 ** 20).toFixed(1) };
  fs.writeFileSync(SCENE, JSON.stringify(scene));
}
log(`${done.size} textures, ${(totalOut / 2 ** 20).toFixed(1)} MB of KTX2, ~${(gpu / 2 ** 20).toFixed(0)} MB on the GPU`);
