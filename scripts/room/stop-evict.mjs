// What letting one stop's pictures go costs (memory pass 2, 27.09): Off
// Duty's corner goes away from it, Case Files' desk goes at Off Duty, and a
// flight that will show them waits for them and draws its way unseen first.
// On a fresh page: flights that bring each set back — how long the flight
// waited before it set off (the time to arrival against the plain 2.5 s),
// every frame of it (the page's rAF), and whether all that the landing
// shows is in (no preview left on screen).
//
//   node scripts/room/stop-evict.mjs http://localhost:3301 [rounds]
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301", N = +(process.argv[3] ?? 3);
const LEGS = [["kate:off-duty", "offduty"], ["kate:case-files", "open"], ["kate:off-duty", "offduty"], ["back", "closed"], ["kate:off-duty", "offduty"], ["kate:profile", "profile"], ["back", "closed"]];
const out = [];
for (let r = 0; r < N; r++) {
  const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
  await b.go(`${SITE}/?nointro&gl=1`, 0);
  await sleep(9000);
  await b.ev(`(()=>{window.__dt=[];let l=performance.now();const f=t=>{window.__dt.push([t,t-l]);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);return 1})()`);
  for (const [ev, desk] of LEGS) {
    const res = JSON.parse(await b.ev(`new Promise(res=>{const t0=performance.now();const w0=window.__room.stats().waits;
      ${ev === "back" ? "history.back()" : `dispatchEvent(new Event(${JSON.stringify(ev)}))`};
      const f=()=>{const d=document.documentElement.dataset;const ok=${desk === "closed" ? "(!d.desk||d.desk==='closed')&&d.glRest==='home'" : `d.desk===${JSON.stringify(desk)}&&d.deskArrived==='1'`};
        if(ok||performance.now()-t0>8000){const t1=performance.now();const dt=window.__dt.filter(([t])=>t>=t0&&t<=t1).map(x=>x[1]).sort((a,b)=>a-b);
          const tx=window.__room.textures().filter(x=>x.kind==='slot');const s=window.__room.stats();
          res(JSON.stringify({ms:Math.round(t1-t0),waited:s.waits-w0,p95:+(dt[Math.floor(dt.length*.95)]??0).toFixed(1),max:+(dt[dt.length-1]??0).toFixed(1),over20:dt.filter(x=>x>20).length,roomMB:s.roomMB,previewsOn:s.previews,pending:s.pending}))}
        else setTimeout(f,10)};f()})`, 12000));
    out.push({ round: r, leg: `${ev}→${desk}`, ...res });
    log(r, `${ev} → ${desk}`.padEnd(26), JSON.stringify(res));
    await sleep(1500);
  }
  b.close(); await sleep(800);
}
console.log(JSON.stringify(out));
