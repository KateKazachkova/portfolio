// The БУДЬ prints: where WebGL lays each one against where the page's
// panel has it, at Profile at rest (WebGL's binder is put away there, but
// budgl.ts lays the prints every frame all the same): each print's box on
// screen (css px) against the page's, before and after dragging three of
// them — and the sheet's own box the same way, for what the baked binder
// itself is off the page's (the prints are laid on it).
//
//   node scripts/room/bud-gl.mjs http://localhost:3301
import { launch, sleep, log } from "./cdp.mjs";

const SITE = process.argv[2] ?? "http://localhost:3301";
const b = await launch({ headed: true, width: 1512, height: 860, dpr: 2 });
await b.go(`${SITE}/?nointro&gl=1`, 0);
await sleep(6000);
await b.ev(`dispatchEvent(new Event("kate:profile"))`);
await b.ev(`new Promise(r=>{const f=()=>document.documentElement.dataset.deskArrived==="1"&&document.querySelector('.room-binder .pf-whole .pf-print')?r(1):setTimeout(f,5);f()})`, 15000);
await sleep(1000);
for (let i = 0; i < 3; i++) { await b.ev(`dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))`); await sleep(1400); }
const mouse = (type, x, y) => b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
const drag = async (n, dx, dy) => {
  const [x, y] = await b.ev(`(()=>{const r=document.querySelectorAll('.room-binder .pf-whole .pf-print')[${n}].getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await mouse("mousePressed", x, y);
  for (let k = 1; k <= 10; k++) { await mouse("mouseMoved", x + (dx * k) / 10, y + (dy * k) / 10); await sleep(16); }
  await mouse("mouseReleased", x + dx, y + dy);
};
// (the page's copy of the sheet: the whole leaf's, not a band's)
const MEASURE = `(async()=>{
  const scene=await fetch('/room/scene.json').then(r=>r.json());
  const R=window.__room, cam=R.camera, cv=R.renderer.domElement.getBoundingClientRect();
  const meshes=R.scene.children.filter(m=>m.isMesh);
  const M=meshes[0].matrix.constructor, V=meshes[0].position.constructor;
  const proj=(m,x,y)=>{const v=new V(x,y,0).applyMatrix4(m).applyMatrix4(cam.matrixWorldInverse).applyMatrix4(cam.projectionMatrix);return [cv.left+(v.x+1)/2*cv.width, cv.top+(1-v.y)/2*cv.height]};
  const boxOf=(m,pts)=>{const c=pts.map(([x,y])=>proj(m,x,y)),xs=c.map(p=>p[0]),ys=c.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
  const delta=(gl,r)=>[gl[0]-r.left,gl[1]-r.top,gl[2]-r.right,gl[3]-r.bottom].map(v=>+v.toFixed(2));
  const s=scene.bud.box[2];
  const els=[...document.querySelectorAll('.room-binder .pf-whole .pf-print')];
  // a print's mesh is the one drawn at its rank (budgl.ts: 200 + rank by z-index)
  const rank=els.map((e,i)=>[+e.style.zIndex,i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[1]);
  const prints=scene.items.filter(i=>i.bud&&!i.bud.gloss).map(it=>{
    const n=it.bud.n, mesh=meshes.find(m=>m.material.transparent&&m.renderOrder===200+rank.indexOf(n));
    // the element's box in the picture's quad (centred, unit)
    const u0=-it.bud.q[0]/it.w-.5, v0=-it.bud.q[1]/it.h-.5, u1=(s-it.bud.q[0])/it.w-.5, v1=(s-it.bud.q[1])/it.h-.5;
    return {n, d:delta(boxOf(mesh.matrix,[[u0,v0],[u1,v0],[u0,v1],[u1,v1]]),els[n].getBoundingClientRect())};
  });
  // the face's frame, back from the plastic's quad (laid on it as the prints are)
  const g=scene.items.find(i=>i.bud&&i.bud.gloss), gm=meshes.find(m=>m.renderOrder===300);
  const E=gm.matrix.clone().multiply(new M().makeScale(1/g.w,1/g.h,1)).multiply(new M().makeTranslation(-g.w/2-g.bud.q[0],-g.h/2-g.bud.q[1],0));
  const [x0,y0,x1,y1]=scene.bud.sheet;
  const sheet=delta(boxOf(E,[[x0,y0],[x1,y0],[x0,y1],[x1,y1]]),els[0].closest('.pf-sheet').getBoundingClientRect());
  return JSON.stringify({prints,sheet});
})()`;
const worst = (r) => Math.max(...r.prints.map((p) => Math.max(...p.d.map(Math.abs))));
const before = JSON.parse(await b.ev(MEASURE, 20000));
await drag(15, 150, -70);
await drag(4, 140, -40);
await drag(9, -30, -120);
await sleep(300);
const after = JSON.parse(await b.ev(MEASURE, 20000));
log("sheet (the baked binder against the page's)", JSON.stringify(before.sheet));
log("prints before drags: worst", worst(before).toFixed(2), "px; after:", worst(after).toFixed(2), "px");
console.log(JSON.stringify({ before, after }));
b.close();
