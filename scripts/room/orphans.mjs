// Generated room textures nothing points at any more: every file in
// public/room/{ktx2,lo,tex} against every "/room/<dir>/<file>" named in
// scene.json and hits.json (anywhere in them) and in the code (components,
// lib, app, scripts). A bake renumbers its planes when one is added, and
// textures.mjs writes the new names without removing the old ones.
//
//   node scripts/room/orphans.mjs            list them
//   node scripts/room/orphans.mjs --json     the list as JSON
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PUB = path.join(ROOT, "public/room");
const DIRS = ["ktx2", "lo", "tex"];
const refs = new Set();
const scan = (text) => { for (const m of text.matchAll(/\/room\/(ktx2|lo|tex)\/([\w.\-]+)/g)) refs.add(`${m[1]}/${m[2]}`); };
for (const f of ["scene.json", "hits.json"]) scan(fs.readFileSync(path.join(PUB, f), "utf8"));
const code = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|mjs|js|css|py|json)$/.test(e.name)) code.push(p);
  }
};
for (const d of ["components", "lib", "app", "scripts"]) walk(path.join(ROOT, d));
const codeText = code.map((f) => fs.readFileSync(f, "utf8")).join("\n");
scan(codeText);
const orphans = [], kept = [];
for (const d of DIRS) {
  for (const f of fs.readdirSync(path.join(PUB, d))) {
    if (f.startsWith(".")) continue;
    // a bare file name in the code counts as a reference too
    (refs.has(`${d}/${f}`) || codeText.includes(f) ? kept : orphans).push(`${d}/${f}`);
  }
}
if (process.argv.includes("--json")) console.log(JSON.stringify({ kept: kept.length, orphans }, null, 1));
else {
  for (const d of DIRS) console.log(`${d}: ${kept.filter((f) => f.startsWith(d + "/")).length} referenced, ${orphans.filter((f) => f.startsWith(d + "/")).length} orphaned`);
  for (const f of orphans) console.log("  " + f);
}
