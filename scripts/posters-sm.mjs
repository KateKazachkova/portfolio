// The posters on Off Duty's shelf (films.md, books.md, comics.md), cut to
// 520 px on the long side as <poster>.sm.webp beside each: what the VHS
// stacks and the books lie at. The full poster is fetched only for the one
// taken off the shelf (lib/content.ts thumbFor). Run again after adding one:
//   node scripts/posters-sm.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const dir = "content/about/films-and-series";
const files = new Set(["films.md", "books.md", "comics.md"].flatMap((f) =>
  fs.readFileSync(path.join(dir, f), "utf8").split("\n")
    .filter((l) => /^poster:/i.test(l.trim()))
    .map((l) => l.trim().replace(/^poster:\s*/i, "").replace(/^\/?posters\//, ""))
    .filter(Boolean)));
for (const f of files) {
  const src = path.join("public/posters", f);
  if (!fs.existsSync(src)) continue;
  const out = src.replace(/\.[^./]+$/, ".sm.webp");
  await sharp(src).resize(520, 520, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  // no copy where it saves nothing: the shelf then wears the poster itself
  if (fs.statSync(out).size >= fs.statSync(src).size) { fs.rmSync(out); console.log(src, "kept as is"); continue; }
  console.log(out, Math.round(fs.statSync(src).size / 1024) + "K →", Math.round(fs.statSync(out).size / 1024) + "K");
}
