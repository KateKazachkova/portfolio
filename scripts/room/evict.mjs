// What letting a binder spread go would cost (M6 memory pass; nothing is
// evicted by the room itself): its sheets' textures dropped and loaded
// again (window.__room.reload) — how long they take to come back (from the
// HTTP cache, transcoded, uploaded) and what the frames do meanwhile, at
// Profile at rest (the page's panel over it), in the middle of a flight,
// and a turn to it right before leaving (the worst case: WebGL needs it
// for the departure's first frame).
//
//   node scripts/room/evict.mjs http://localhost:3301
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(8000);
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(1):setTimeout(f,20);f()})`, 15000);
const winKey = async (k, n = 1) => { for (let i = 0; i < n; i++) { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)} }))`); await sleep(1400); } };
// every frame's length from now on, in the page
await b.ev(`(()=>{window.__dt=[];let l=performance.now();const f=t=>{window.__dt.push([t,t-l]);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()`);
const frames = (t0, t1) => b.ev(`JSON.stringify((()=>{const d=window.__dt.filter(([t])=>t>=${t0}&&t<=${t1}).map(x=>x[1]).sort((a,b)=>a-b);return {n:d.length,p95:+(d[Math.floor(d.length*.95)]??0).toFixed(1),max:+(d[d.length-1]??0).toFixed(1),over20:d.filter(x=>x>20).length}})())`).then(JSON.parse);
const now = () => b.ev("performance.now()");
// the two sheets of spread 2 and of spread 3 (scene.json order: the leaf's front, then its back)
const FACES = { s2: ["/room/ktx2/073-pf-face.ktx2", "/room/ktx2/074-pf-face--back.ktx2"], s3: ["/room/ktx2/077-pf-face.ktx2", "/room/ktx2/078-pf-face--back.ktx2"] };
const reload = (list) => b.ev(`window.__room.reload(${JSON.stringify(list)}).then(r=>JSON.stringify(r))`, 20000).then(JSON.parse);
const out = { rest: [], flight: [], beforeLeave: [] };

await b.ev(`dispatchEvent(new Event("kate:profile"))`); await arrived(); await sleep(1500);
await winKey("ArrowRight", 3); await sleep(1500);
// 1. at rest at Profile (the page's panel shows the binder)
for (let i = 0; i < 5; i++) {
  const t0 = await now();
  const r = await reload(FACES.s2);
  await sleep(300);
  out.rest.push({ r, frames: await frames(t0, await now()) });
}
// 2. in flight: the camera sets off for Off Duty and the two sheets come back meanwhile
for (let i = 0; i < 3; i++) {
  const t0 = await now();
  await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
  await sleep(600);
  const r = await reload(FACES.s2);
  await arrived(); const t1 = await now();
  out.flight.push({ r, frames: await frames(t0, t1) });
  await sleep(800);
  // (the same flight back without a reload, for comparison)
  const t2 = await now();
  await b.ev(`dispatchEvent(new Event("kate:profile"))`); await arrived();
  out.flight.push({ ref: true, frames: await frames(t2, await now()) });
  await sleep(1500);
}
// 3. a spread whose sheets were let go, turned to, and left at once
for (let i = 0; i < 3; i++) {
  await winKey("ArrowLeft"); // to spread 3
  await b.ev(`window.__room.reload(${JSON.stringify(FACES.s2)}); 1`); // let spread 2 go and come back (in flight to the GPU now)
  const t0 = await now();
  await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))`); // to spread 2
  await sleep(50);
  await b.ev(`dispatchEvent(new Event("kate:off-duty"))`);
  await arrived(); const t1 = await now();
  const shown = JSON.parse(await b.ev("JSON.stringify(window.__room.textures().filter(t=>t.src.includes('073-pf-face')||t.src.includes('074-pf-face')).map(t=>({src:t.src.split('/').pop(),state:t.state,at:t.at})))"));
  out.beforeLeave.push({ t0: Math.round(t0), shown, frames: await frames(t0, t1) });
  await b.ev(`dispatchEvent(new Event("kate:profile"))`); await arrived(); await sleep(1500);
  await winKey("ArrowRight", 2);
}
console.log(JSON.stringify(out, null, 1));
b.close();
