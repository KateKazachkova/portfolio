// A binder spread turned to and left at once (its pictures still coming in:
// the departure waits for them) against the same turn left after a second
// (in already): every frame of the departure, the page's rAF. N rounds each.
//
//   node scripts/room/turn-leave.mjs http://localhost:3301 [N]
import { launch, sleep } from "./cdp.mjs";
const SITE = process.argv[2] ?? "http://localhost:3301", N = +(process.argv[3] ?? 4);
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(8000);
await b.ev(`(()=>{window.__dt=[];let l=performance.now();const f=t=>{window.__dt.push([t,t-l]);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()`);
const now = () => b.ev("performance.now()");
const frames = (t0, t1) => b.ev(`JSON.stringify((()=>{const d=window.__dt.filter(([t])=>t>=${t0}&&t<=${t1});const s=d.map(x=>x[1]).sort((a,b)=>a-b);const big=d.filter(x=>x[1]>20).map(([t,v])=>[Math.round(t-${t0}),+v.toFixed(1)]);return {p95:+(s[Math.floor(s.length*.95)]??0).toFixed(1),max:+(s[s.length-1]??0).toFixed(1),big}})())`).then(JSON.parse);
const arrived = () => b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"?r(1):setTimeout(f,5);f()})`, 15000);
const go = async (ev) => { await b.ev(`dispatchEvent(new Event("${ev}"))`); await arrived(); await sleep(1200); };
const key = (k) => b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)} }))`);
const out = { atOnce: [], after1s: [] };
for (let i = 0; i < N; i++) for (const mode of ["atOnce", "after1s"]) {
  await go("kate:profile");
  // from spread 1 to 4 (three turns), then away
  for (let k = 0; k < 3; k++) await key("ArrowRight");
  await sleep(mode === "atOnce" ? 30 : 1000);
  const t0 = await now();
  await go("kate:off-duty");
  out[mode].push(await frames(t0, await now()));
  await go("kate:profile");
  for (let k = 0; k < 3; k++) await key("ArrowLeft");
  await sleep(1000);
}
console.log(JSON.stringify(out));
b.close();
