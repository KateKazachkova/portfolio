/**
 * Ukrainska 15's folder in WebGL (M6), wherever the page's own folder (the
 * flat panel at Case Files, RoomU15.tsx) is not over it: its parts as the
 * bake split them (scene.json items with `u15`: the back, each print, the
 * library card, the tag, the front, the player), each laid where the
 * panel's element is at this moment — the card's matrix (the panel's own,
 * hits.json `u15panel`, for the case in focus) × each link of the part's
 * chain from .env down (its layout offset, baked in u, and its transform
 * now, about its origin) × the picture's offset in its element. So the
 * folder opening or closing (U15File's .48 s spill, .8 s spread), prints
 * and the card where they were dragged, and the order they lie in (their
 * z-index, as it switches) carry on in flight exactly as the page left
 * them. The tag's and the standing edges' fades are read the same way, and
 * the player's LCD is drawn from the page's (its title scrolling, its time).
 * Before the panel is first built the parts lie as baked (closed).
 */
import * as THREE from "three";

type Link = { cls: "env" | "stack" | "item"; dx: number; dy: number };
export type U15Part = { meshes: THREE.Mesh[]; w: number; h: number; k: number; u15: { sel: string; key: string; q: [number, number]; chain: Link[] }; mats: THREE.ShaderMaterial[] };
export type U15Edge = { meshes: THREE.Mesh[]; sel: string; mats: THREE.ShaderMaterial[] };
export type U15Ctx = {
  scene: THREE.Scene;
  parts: U15Part[];
  edges: U15Edge[];
  /** the card's matrix now (u), or null while there is no panel */
  card: () => number[] | null;
  lcd: { x: number; y: number; w: number; h: number } | null;
  material: (map: THREE.Texture, opts: { alphaTest?: number; depthWrite?: boolean }) => THREE.ShaderMaterial;
  shown: (p: U15Part) => boolean;
  /** the next free lift in the plane of m (engine: planes lifted in page order) */
  liftTop: (m: number[]) => number;
};

const px = (v: string) => parseFloat(v) || 0;
// (a plane flattened into another has no z column: its normal)
const fixZ = (m: THREE.Matrix4) => {
  const e = m.elements;
  if (Math.hypot(e[8], e[9], e[10]) < 1e-9) { const z = new THREE.Vector3(e[0], e[1], e[2]).cross(new THREE.Vector3(e[4], e[5], e[6])).normalize(); e[8] = z.x; e[9] = z.y; e[10] = z.z; }
  return m;
};

export function makeU15(o: U15Ctx) {
  const panel = () => document.querySelector<HTMLElement>(".room-hit--u15panel");
  // the LCD, a canvas over the player (the bake left its screen blank)
  const LCD_PX = 8;
  const player = o.parts.find((p) => p.u15.key === "player");
  let lcdMesh: THREE.Mesh | null = null, lcdTex: THREE.CanvasTexture | null = null, lcdKey = "";
  const lcdC = document.createElement("canvas");
  if (o.lcd && player) {
    lcdC.width = Math.round(o.lcd.w * LCD_PX); lcdC.height = Math.round(o.lcd.h * LCD_PX);
    lcdTex = new THREE.CanvasTexture(lcdC);
    lcdTex.premultiplyAlpha = true; lcdTex.colorSpace = THREE.NoColorSpace; lcdTex.generateMipmaps = true; lcdTex.minFilter = THREE.LinearMipmapLinearFilter;
    lcdMesh = new THREE.Mesh(player.meshes[0].geometry, o.material(lcdTex, { alphaTest: 0.002, depthWrite: false }));
    lcdMesh.matrixAutoUpdate = false; lcdMesh.visible = false;
    o.scene.add(lcdMesh);
  }
  const paintLcd = (lcd: HTMLElement, u: number) => {
    const cs = getComputedStyle(lcd);
    const title = lcd.querySelector<HTMLElement>(".desk-player__title span");
    const time = lcd.querySelector<HTMLElement>(".desk-player__time");
    const ts = title ? getComputedStyle(title).transform : "";
    const key = `${cs.backgroundColor}|${cs.color}|${title?.textContent}|${ts}|${time?.textContent}`;
    if (key === lcdKey) return false;
    lcdKey = key;
    const ctx = lcdC.getContext("2d")!, k = LCD_PX / u, W = lcdC.width, H = lcdC.height;
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.scale(k, k);
    ctx.fillStyle = cs.backgroundColor;
    const r = px(cs.borderTopLeftRadius);
    ctx.beginPath(); ctx.roundRect(0, 0, lcd.offsetWidth, lcd.offsetHeight, r); ctx.fill(); ctx.clip();
    for (const el of [title, time]) {
      if (!el) continue;
      const s = getComputedStyle(el);
      ctx.font = s.font; ctx.fillStyle = s.color;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = s.letterSpacing === "normal" ? "0px" : s.letterSpacing;
      // (the title's scroll: its span's own translateX; the rest is layout)
      const off = el === title && ts && ts !== "none" ? new DOMMatrix(ts).m41 : 0;
      const box = (el === title ? el.parentElement! : el);
      const x = box.offsetLeft + (el === title ? px(s.paddingLeft) + off : 0), y = box.offsetTop;
      const t = (el.textContent ?? "").toUpperCase();
      const mt = ctx.measureText(t);
      ctx.fillText(t, x, y + (box.offsetHeight + mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2);
    }
    ctx.restore();
    lcdTex!.needsUpdate = true;
    return true;
  };

  const T = new THREE.Matrix4(), M = new THREE.Matrix4(), N = new THREE.Vector3();
  /** each link's matrix now: offset · origin · transform · −origin (u) */
  const linkM = (el: Element, l: Link, u: number) => {
    const cs = getComputedStyle(el);
    // (translate, rotate and scale apply before transform, in that order)
    const t = new DOMMatrix();
    if (cs.translate && cs.translate !== "none") { const [x, y, z] = cs.translate.split(" ").map(px); t.translateSelf(x || 0, y || 0, z || 0); }
    if (cs.rotate && cs.rotate !== "none") t.multiplySelf(new DOMMatrix(`rotate(${cs.rotate})`));
    if (cs.scale && cs.scale !== "none") { const [x, y, z] = cs.scale.split(" ").map(Number); t.scaleSelf(x, y ?? x, z ?? 1); }
    if (cs.transform && cs.transform !== "none") t.multiplySelf(new DOMMatrix(cs.transform));
    const [ox, oy, oz] = cs.transformOrigin.split(" ").map((v) => px(v) / u);
    const m = new THREE.Matrix4().fromArray(Array.from(t.toFloat64Array()));
    m.elements[12] /= u; m.elements[13] /= u; m.elements[14] /= u;
    return new THREE.Matrix4().makeTranslation(l.dx, l.dy, 0).multiply(new THREE.Matrix4().makeTranslation(ox, oy, oz || 0)).multiply(m).multiply(new THREE.Matrix4().makeTranslation(-ox, -oy, -(oz || 0)));
  };
  const zOf = (el: Element) => { const z = parseInt(getComputedStyle(el).zIndex, 10); return Number.isFinite(z) ? z : 0; };

  /** lays the parts where the panel has them; false while there is none */
  const frame = () => {
    const host = panel(), cardM = o.card();
    const card = host?.querySelector<HTMLElement>(".room-u15 > .desk-card--env");
    if (!host || !card || !cardM) return false;
    const u = px(host.style.getPropertyValue("--u"));
    if (!u) return false;
    const env = card.querySelector(".env")!;
    const C = fixZ(new THREE.Matrix4().fromArray(cardM));
    // where each part lies in the stack of things on the folder: its own
    // item's z-index and place in .env, then its place in its stack
    const envKids = [...env.children];
    const placed: { p: U15Part; key: number[]; m: THREE.Matrix4; op: number }[] = [];
    for (const p of o.parts) {
      const el = card.querySelector(p.u15.sel);
      if (!el) continue;
      const nodes: Element[] = [env];
      const top = p.u15.chain.find((l) => l.cls === "stack") ? el.closest(".env__stack")! : el;
      if (top !== el) nodes.push(top);
      nodes.push(el);
      M.copy(C);
      let op = 1;
      nodes.forEach((n, i) => { M.multiply(linkM(n, p.u15.chain[i], u)); op *= +getComputedStyle(n).opacity; });
      M.multiply(T.makeTranslation(p.u15.q[0] + p.w / 2, p.u15.q[1] + p.h / 2, 0)).multiply(new THREE.Matrix4().makeScale(p.w, p.h, 1));
      const inner = top !== el ? [zOf(el), [...top.children].indexOf(el)] : [0, 0];
      placed.push({ p, key: [zOf(top), envKids.indexOf(top), ...inner], m: M.clone(), op });
    }
    placed.sort((a, b) => { for (let i = 0; i < 4; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i]; return 0; });
    let k0 = 0;
    placed.forEach(({ p, m, op }, i) => {
      // lifted off the folder one above the other in that order, as the
      // room's coplanar planes are (engine: lifted)
      // (the engine's own normal: x × y, the way its lift goes)
      N.set(m.elements[0], m.elements[1], m.elements[2]).cross(new THREE.Vector3(m.elements[4], m.elements[5], m.elements[6])).normalize();
      // (from above whatever else lies in that plane now: open, the folder
      // is down on the desk among its papers)
      if (i === 0) k0 = o.liftTop(Array.from(m.elements));
      const lift = (k0 + i) * 0.06;
      m.elements[12] += N.x * lift; m.elements[13] += N.y * lift; m.elements[14] += N.z * lift;
      for (const mesh of p.meshes) { mesh.matrix.copy(m); mesh.matrixWorldNeedsUpdate = true; mesh.renderOrder = 100 + i; }
      for (const mat of p.mats) mat.uniforms.opacity.value = op;
      if (p === player && lcdMesh && o.lcd) {
        // the LCD's box in the player: back from the picture's box to its element, then the LCD's
        const lm = m.clone().multiply(new THREE.Matrix4().makeScale(1 / p.w, 1 / p.h, 1)).multiply(T.makeTranslation(-p.u15.q[0] - p.w / 2, -p.u15.q[1] - p.h / 2, 0))
          .multiply(T.makeTranslation(o.lcd.x + o.lcd.w / 2, o.lcd.y + o.lcd.h / 2, 0.02)).multiply(new THREE.Matrix4().makeScale(o.lcd.w, o.lcd.h, 1));
        lcdMesh.matrix.copy(lm); lcdMesh.matrixWorldNeedsUpdate = true; lcdMesh.renderOrder = 100 + i + 0.5;
        (lcdMesh.material as THREE.ShaderMaterial).uniforms.opacity.value = op;
      }
    });
    if (lcdMesh && player) {
      lcdMesh.visible = o.shown(player) && player.meshes[0].visible;
      const lcd = card.querySelector<HTMLElement>(".desk-player__lcd");
      if (lcd && lcdMesh.visible) paintLcd(lcd, u);
    }
    // the standing edges' fade
    for (const e of o.edges) {
      const el = card.querySelector(e.sel);
      if (el) for (const mat of e.mats) mat.uniforms.opacity.value = px(getComputedStyle(el).opacity);
    }
    return true;
  };
  return { frame, dispose() { lcdTex?.dispose(); } };
}
