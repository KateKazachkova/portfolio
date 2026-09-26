/**
 * The DVD player's screen in the WebGL room (M6), as OffDutyShelf's shows
 * it whenever the page's own panel (dvd.ts) is not over it: with no disc,
 * "KATE™ DVD" and "NO DISC" blinking (bike-blink, 1.4 s in two steps); with
 * one, its poster, drifting (od-drift) behind the page's shade and scan
 * lines, and "▶ PLAY" over its title — what the legacy screen shows once
 * the camera leaves the corner and the clip goes. The bake leaves the lid's
 * own screen blank.
 *
 * The text is laid out by the page's CSS in an unseen copy of the lid and
 * its screen (globals.css .od-dvd__*), and drawn where it put it. The
 * poster's drift and fade-in are the page's panel's own animations, read
 * off it while it is out of sight (hits.ts keeps it, [data-away], so they
 * run on): the frame the panel goes, WebGL's picture is where the panel's
 * was.
 */
import * as THREE from "three";
import { onRoom, roomState, type RoomState } from "./state";
import type { Host } from "./wallet";

export type ScreenCtx = {
  scene: THREE.Scene;
  box: { m: number[]; w: number; h: number };
  lid: Host;
  material: (map: THREE.Texture, opts: { opacity?: number; alphaTest?: number; depthWrite?: boolean }) => THREE.ShaderMaterial;
  lifted: (m: number[], k: number) => number[];
  liftCount: (m: number[]) => number;
  redraw: () => void;
  upload: (t: THREE.Texture) => void;
};

const K = 3; // canvas px per u
const BLINK = 700;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function makeScreen(o: ScreenCtx) {
  const { w, h } = o.box;
  // the unseen copy: the lid (the screen is 81.1 × 56 % of it) at 1 u = K px
  const host = document.createElement("div");
  host.className = "od-dvd room-screen";
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", visibility: "hidden", pointerEvents: "none" });
  host.style.setProperty("--u", `${K}px`);
  const lid = document.createElement("div");
  lid.className = "od-dvd__lid";
  Object.assign(lid.style, { left: "0", top: "0", width: `${(w / 0.811) * K}px`, height: `${(h / 0.56) * K}px`, transform: "none" });
  const scr = document.createElement("div");
  scr.className = "od-dvd__screen";
  lid.appendChild(scr); host.appendChild(lid); document.body.appendChild(host);

  // the planes: the poster, the shade over it, the text; one above the other on the lid
  const quad = new THREE.BufferGeometry();
  quad.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3));
  quad.setAttribute("st", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
  quad.setIndex([0, 2, 1, 1, 2, 3]);
  const canvasTex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.premultiplyAlpha = true; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  const EMPTY = new THREE.DataTexture(new Uint8Array(4), 1, 1); EMPTY.needsUpdate = true;
  const layer = (map: THREE.Texture, order: number) => {
    const mat = o.material(map, { alphaTest: 0.002, depthWrite: false });
    const mesh = new THREE.Mesh(quad, mat);
    mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.renderOrder = order;
    const k = o.liftCount(o.box.m);
    mesh.matrix.fromArray(o.lifted(o.box.m, k)).multiply(new THREE.Matrix4().makeTranslation(w / 2, h / 2, 0)).multiply(new THREE.Matrix4().makeScale(w, h, 1));
    // (the screen's box has no z column: the lid's own normal)
    const e = mesh.matrix.elements;
    if (Math.hypot(e[8], e[9], e[10]) < 1e-9) { const z = new THREE.Vector3(e[0], e[1], e[2]).cross(new THREE.Vector3(e[4], e[5], e[6])).normalize(); e[8] = z.x; e[9] = z.y; e[10] = z.z; }
    o.scene.add(mesh);
    return { mesh, mat };
  };
  const pic = layer(EMPTY, 1);
  const shadeC = document.createElement("canvas"); shadeC.width = Math.round(w * K); shadeC.height = Math.round(h * K);
  const shade = layer(canvasTex(shadeC), 2);
  const textC = document.createElement("canvas"); textC.width = shadeC.width; textC.height = shadeC.height;
  const textT = canvasTex(textC);
  const text = layer(textT, 3);

  // the picture's ::after: a shade toward the foot, and scan lines 3 page px apart
  const paintShade = () => {
    const ctx = shadeC.getContext("2d")!, W = shadeC.width, H = shadeC.height;
    const stage = document.querySelector(".case-stage")?.getBoundingClientRect().width ?? 1118;
    const pxU = stage / 1118, step = (3 / pxU) * K, dark = (1 / pxU) * K;
    ctx.clearRect(0, 0, W, H);
    for (let y = (2 / pxU) * K; y < H; y += step) { ctx.fillStyle = "rgba(0,0,0,.08)"; ctx.fillRect(0, y, W, dark); }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    (shade.mat.uniforms.map.value as THREE.Texture).needsUpdate = true;
  };
  paintShade();

  let blinkOn = true, shownKey = "";
  const paintText = (s: RoomState) => {
    const p = s.picked;
    host.toggleAttribute("data-on", !!p);
    scr.innerHTML = p
      ? `<span class="od-dvd__osd">▶ PLAY</span><span class="od-dvd__osd od-dvd__osd--title">${esc(`${p.title}${p.year ? ` · ${p.year}` : ""}`)}</span>`
      : `<span class="od-dvd__osd">KATE™ DVD</span><span class="od-dvd__osd od-dvd__osd--blink" style="animation:none">NO DISC</span>`;
    const ctx = textC.getContext("2d")!;
    ctx.clearRect(0, 0, textC.width, textC.height);
    const sr = scr.getBoundingClientRect();
    for (const el of scr.children) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const blink = el.classList.contains("od-dvd__osd--blink");
      if (blink && !blinkOn) ctx.globalAlpha = 0.25; else ctx.globalAlpha = 1;
      ctx.font = cs.font;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      ctx.fillStyle = cs.color;
      const sh = cs.textShadow.match(/(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
      if (sh) { ctx.shadowColor = sh[1]; ctx.shadowOffsetX = +sh[2]; ctx.shadowOffsetY = +sh[3]; ctx.shadowBlur = +sh[4]; } else ctx.shadowColor = "transparent";
      let t = el.textContent ?? "";
      if (cs.textTransform === "uppercase") t = t.toUpperCase();
      const mt = ctx.measureText(t);
      // (the title's ellipsis: text-overflow, where it runs past its box)
      if (mt.width > r.width + 0.5) { while (t.length > 1 && ctx.measureText(t + "…").width > r.width) t = t.slice(0, -1); t += "…"; }
      ctx.fillText(t, r.left - sr.left, r.top - sr.top + (r.height + mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2);
    }
    ctx.globalAlpha = 1;
    textT.needsUpdate = true;
  };

  // the poster
  let posterSrc = "", posterTex: THREE.Texture | null = null, aspect = 1;
  const want = (s: RoomState) => {
    const src = s.picked?.poster ?? "";
    if (src === posterSrc) return;
    posterSrc = src;
    if (!src) return;
    const im = new Image(); im.decoding = "async";
    im.onload = () => im.decode().catch(() => {}).then(() => {
      if (posterSrc !== src) return;
      posterTex?.dispose();
      const t = new THREE.Texture(im);
      t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = true; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.needsUpdate = true; o.upload(t);
      posterTex = t; aspect = im.naturalWidth / im.naturalHeight;
      pic.mat.uniforms.map.value = t;
      o.redraw();
    });
    im.src = src;
  };
  const sync = (s: RoomState) => { want(s); const key = `${s.picked?.title ?? ""}|${blinkOn}`; if (key !== shownKey) { shownKey = key; paintText(s); } o.redraw(); };
  const off = onRoom(sync);
  document.fonts?.ready.then(() => { shownKey = ""; sync(roomState()); });
  sync(roomState());

  // the panel's picture, where its drift and fade-in have it now
  const uv = new THREE.Vector4(0, 0, 1, 1);
  const readPanel = () => {
    const el = document.querySelector<HTMLElement>(".room-hit--dvd .od-dvd__picture");
    if (!el || !el.offsetWidth) return false;
    const cs = getComputedStyle(el);
    const m = cs.transform === "none" ? new DOMMatrix() : new DOMMatrix(cs.transform);
    const W = el.offsetWidth, H = el.offsetHeight;
    // the screen's point q (0…1) shows the picture's own point c + (q − c − t) / s
    const sx = m.a, sy = m.d, tx = m.e / W, ty = m.f / H;
    const at = (q: number, s: number, t: number) => 0.5 + (q - 0.5 - t) / s;
    // background-size: cover
    const ba = W / H, kx = aspect > ba ? ba / aspect : 1, ky = aspect > ba ? 1 : aspect / ba;
    const cov = (p: number, k: number) => 0.5 + (p - 0.5) * k;
    uv.set(cov(at(0, sx, tx), kx), cov(at(0, sy, ty), ky), cov(at(1, sx, tx), kx), cov(at(1, sy, ty), ky));
    pic.mat.uniforms.uvRect.value.copy(uv);
    pic.mat.uniforms.opacity.value = +cs.opacity;
    const br = cs.filter.match(/brightness\(([\d.]+)\)/);
    pic.mat.uniforms.brightness.value = br ? +br[1] : 1;
    return true;
  };

  /** lays the screen as the state is at `now`; true when it changed */
  const frame = (now: number) => {
    const s = roomState();
    const lidShown = o.lid.shown();
    let changed = false;
    const b = Math.floor(now / BLINK) % 2 === 0;
    if (!s.picked && lidShown && b !== blinkOn) { blinkOn = b; sync(s); changed = true; }
    text.mesh.visible = lidShown;
    const withDisc = lidShown && !!s.picked && !!posterTex;
    pic.mesh.visible = shade.mesh.visible = withDisc;
    // the page's panel is over it at the corner; away from it, its picture
    // is read each frame (it drifts on)
    if (withDisc && document.querySelector(".room-hit--dvd[data-away]")) changed = readPanel() || changed;
    return changed;
  };
  return {
    frame,
    dispose() { off(); host.remove(); posterTex?.dispose(); textT.dispose(); },
  };
}
