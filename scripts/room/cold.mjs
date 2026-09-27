// A cold visit (M2): no cache, the real GPU. What is fetched, in what
// order and how much; when the still, the WebGL room, home's zone and
// everything are in; the first flight straight after home is ready; and
// what the GPU process holds (a memory-infra dump).
//
//   node scripts/room/cold.mjs http://localhost:3301 [gl|css] [dpr] [extra query]
import fs from "node:fs";
import path from "node:path";
import { launch, sleep, log, TESTS } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const MODE = process.argv[3] ?? "gl";
const DPR = +(process.argv[4] ?? 2);
const EXTRA = process.argv[5] ?? "";
const OUT = path.join(TESTS, "webgl-m2");
fs.mkdirSync(OUT, { recursive: true });

const b = await launch({ headed: true, width: 1512, height: 860, dpr: DPR });
await b.send("Network.enable");
await b.send("Network.setCacheDisabled", { cacheDisabled: true });
// SLOW=1: a weak machine on an ordinary line (CPU ×4, 10 Mbit/s, 40 ms)
if (process.env.SLOW) {
  await b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await b.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 10e6 / 8, uploadThroughput: 5e6 / 8 });
}
const req = new Map();
let t0 = 0;
let trace = [], traceDone;
b.handlers.add((m) => {
  if (m.method === "Network.requestWillBeSent") req.set(m.params.requestId, { url: m.params.request.url, start: m.params.timestamp });
  if (m.method === "Network.responseReceived") { const r = req.get(m.params.requestId); if (r) { r.type = m.params.type; r.mime = m.params.response.mimeType; } }
  if (m.method === "Network.loadingFinished") { const r = req.get(m.params.requestId); if (r) { r.bytes = m.params.encodedDataLength; r.end = m.params.timestamp; } }
  if (m.method === "Tracing.dataCollected") trace.push(...m.params.value);
  if (m.method === "Tracing.tracingComplete") traceDone();
});
// when things are there: polled from here (a few ms late at most), from
// the moment of navigation
await b.send("Page.setLifecycleEventsEnabled", { enabled: true });
const times = {};
let navAt = 0;
b.handlers.add((m) => {
  if (m.method === "Page.lifecycleEvent" && navAt) {
    const n = Date.now() - navAt;
    if (m.params.name === "firstContentfulPaint" && !times.fcp) times.fcp = n;
    if (m.params.name === "firstMeaningfulPaint" && !times.fmp) times.fmp = n;
    if (m.params.name === "load" && !times.load) times.load = n;
  }
});
navAt = Date.now();
await b.send("Page.navigate", { url: `${SITE}/?nointro&gl=${MODE === "gl" ? 1 : 0}${EXTRA}` });
for (let i = 0; i < 1200; i++) {
  const r = await b.ev(`(()=>{try{const d=document.documentElement.dataset;const s=window.__room&&window.__room.stats();return JSON.stringify({ready:!!d.glReady,zone:!!d.glZone,poster:!!(s&&s.poster),all:!!(s&&s.pending===0&&s.loaded>=s.slots-s.hidden&&d.glZone)})}catch(e){return "{}"}})()`);
  const n = Date.now() - navAt;
  const st = typeof r === "string" ? JSON.parse(r) : {};
  if (st.ready && !times.glReady) times.glReady = n;
  if (st.zone && !times.homeZone) times.homeZone = n;
  if (st.poster && !times.posterGone) times.posterGone = n;
  if (st.all && !times.all) times.all = n;
  if (MODE === "css" ? times.load && n > 6000 : times.all) break;
  await sleep(20);
}
times.lcp = await b.ev(`new Promise(r=>{let v=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())v=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){};setTimeout(()=>r(Math.round(v)),100)})`);
await sleep(500);
log("times", JSON.stringify(times));
// CSS=…: a rule laid over the page first (to see what one costs)
if (process.env.CSS) await b.ev(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(process.env.CSS)};document.head.appendChild(s);return 1})()`);
// the first flight straight away
await b.ev(`(()=>{window.__ft=[];let l=performance.now();const f=(t)=>{window.__ft.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()`);
await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
await sleep(3200);
const ft = JSON.parse(await b.ev("JSON.stringify(window.__ft)")).slice(1);
const s = [...ft].sort((x, y) => x - y);
const first = { frames: ft.length, p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over33: ft.filter((x) => x > 33).length };
log("first flight", JSON.stringify(first));
const stats = MODE === "gl" ? JSON.parse(await b.ev("JSON.stringify(window.__room.stats())")) : {};
// the GPU process's memory
let gpuMem = null;
try {
  await b.send("Tracing.start", { transferMode: "ReportEvents", traceConfig: { includedCategories: ["disabled-by-default-memory-infra"], memoryDumpConfig: { triggers: [] } } });
  await sleep(300);
  await b.send("Tracing.requestMemoryDump", { deterministic: true, levelOfDetail: "detailed" });
  await sleep(500);
  const done = new Promise((r) => (traceDone = r));
  await b.send("Tracing.end");
  await Promise.race([done, sleep(20000)]);
  const dumps = trace.filter((e) => e.name === "periodic_interval" || e.ph === "v");
  // per process: the gpu process's "gpu" and "shared_image" totals
  const sizeOf = (a) => (a?.attrs?.size ? parseInt(a.attrs.size.value, 16) : 0);
  const out = {};
  for (const d of dumps) {
    const al = d.args?.dumps?.allocators ?? {};
    const pid = d.pid;
    for (const [k, v] of Object.entries(al)) {
      // top-level allocators of every process, and the GPU's own below them
      if (!k.includes("/") || /^gpu\/[^/]+$/.test(k) || /^skia\/[^/]+$/.test(k)) {
        const mb = +(sizeOf(v) / 2 ** 20).toFixed(1);
        if (mb >= 1) out[`${pid}:${k}`] = mb;
      }
    }
  }
  gpuMem = out;
} catch (e) { gpuMem = String(e); }
b.close();
const list = [...req.values()].filter((r) => r.bytes !== undefined);
const kb = (x) => +(x / 1024).toFixed(0);
const by = (f) => { const o = {}; for (const r of list) { const k = f(r); o[k] = (o[k] ?? 0) + r.bytes; } return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, kb(v)]).sort((a, b) => b[1] - a[1])); };
const net = {
  totalKB: kb(list.reduce((a, r) => a + r.bytes, 0)), requests: list.length,
  byKind: by((r) => (r.url.includes("/room/ktx2/") ? "room ktx2" : r.url.includes("/room/tex/") ? "room webp" : r.url.includes("/room/basis") ? "basis transcoder" : r.url.includes("poster-home") ? "room poster" : r.url.includes("scene.json") ? "scene.json" : r.url.includes("three") || /chunks.*\.js/.test(r.url) ? "js" : r.type || "other")),
  // the room's own files in the order they arrived, with when (ms from navigation)
  roomOrder: list.filter((r) => r.url.includes("/room/")).sort((a, b) => a.end - b.end).map((r) => `${Math.round((r.end - list[0].start) * 1000)}ms ${r.url.split("/room/")[1]} ${kb(r.bytes)}KB`),
};
const res = { mode: MODE, dpr: DPR, extra: EXTRA, slow: !!process.env.SLOW, times, first, stats: { roomMB: stats.roomMB, groupMB: stats.groupMB, zones: stats.zones, loaded: stats.loaded, slots: stats.slots, homeMs: stats.homeMs, waits: stats.waits }, gpuMem, net };
const file = path.join(OUT, `cold-${MODE}-pr${DPR}${EXTRA.replace(/[^a-z0-9]/gi, "")}${process.env.SLOW ? "-slow" : ""}${process.env.CSS ? `-${process.env.TAG ?? "css"}` : ""}.json`);
fs.writeFileSync(file, JSON.stringify(res, null, 1));
log("net", net.totalKB, "KB in", net.requests, "requests;", JSON.stringify(net.byKind));
log("gpu", JSON.stringify(gpuMem));
log("→", file);

