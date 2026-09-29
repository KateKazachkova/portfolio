// What can be used in the legacy CSS room, stop by stop: every link, button
// and focusable element under the stage that is drawn there (its name, role,
// class and box), so the WebGL room's controls can be checked against it.
//
//   node scripts/room/inventory.mjs http://localhost:3301 > inventory.json
import { launch, sleep } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const GL = process.env.GL ? 1 : 0;
const b = await launch({ width: 1512, height: 860, dpr: 1 });
await b.go(`${SITE}/?nointro&gl=${GL}`, 4000);
const LIST = `(()=>{const out=[];const cam=document.querySelector('.scene-cam')||document.body;
 for(const el of cam.querySelectorAll('a[href],button,[role=button],[tabindex],input,summary,[onclick]')){
  const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
  const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.pointerEvents==='none') continue;
  if(r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight) continue;
  const top=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.x+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.y+r.height/2)));
  out.push({tag:el.tagName.toLowerCase(),cls:(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)+'',name:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent.trim().replace(/\\s+/g,' ').slice(0,70),href:el.getAttribute('href'),tab:el.tabIndex,
   box:[r.x,r.y,r.width,r.height].map(Math.round),onTop:!!top&&(el===top||el.contains(top))});}
 return JSON.stringify(out)})()`;
const res = {};
const stops = [["home", null], ["files", "kate:case-files"], ["award", "kate:recognition"], ["offduty", "kate:off-duty"], ["profile", "kate:profile"]];
for (const [v, e] of stops) {
  if (e) { await b.go(`${SITE}/?nointro&gl=${GL}`, 3000); await b.ev(`dispatchEvent(new Event("${e}"))`); await sleep(3500); }
  res[v] = { desk: await b.ev("document.documentElement.dataset.desk||null"), items: JSON.parse(await b.ev(LIST)) };
}
console.log(JSON.stringify(res, null, 1));
b.close();
