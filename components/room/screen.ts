/**
 * The DVD player's screen in the WebGL room (M6), as OffDutyShelf's shows
 * it whenever the page's own panel (dvd.ts) is not over it: with no disc,
 * "KATE™ DVD" and "NO DISC" blinking (bike-blink, 1.4 s in two steps); with
 * one, its title card (staging 27.09: the disc's number, title, year and
 * why in the OSD's mono, on a dark panel with scan lines; the poster stays
 * on the disc's label) under "▶ PLAY" — what the legacy screen shows once
 * the camera leaves the corner and the clip goes. The bake leaves the lid's
 * own screen blank.
 *
 * The text is laid out by the page's CSS in an unseen copy of the lid and
 * its screen (globals.css .od-dvd__*), and drawn where it put it, line by
 * line. The card's lines come up in turn on the page (od-line) when a disc
 * goes in; WebGL draws them up.
 */
import * as THREE from "three";
import { onRoom, roomState, type RoomState } from "./state";
import { cardOf } from "./dvd";
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

  // the plane: the screen's picture, drawn on a canvas
  const quad = new THREE.BufferGeometry();
  quad.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3));
  quad.setAttribute("st", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
  quad.setIndex([0, 2, 1, 1, 2, 3]);
  const textC = document.createElement("canvas"); textC.width = Math.round(w * K); textC.height = Math.round(h * K);
  const textT = new THREE.CanvasTexture(textC);
  textT.premultiplyAlpha = true; textT.colorSpace = THREE.NoColorSpace; textT.generateMipmaps = true; textT.minFilter = THREE.LinearMipmapLinearFilter;
  const mat = o.material(textT, { alphaTest: 0.002, depthWrite: false });
  const mesh = new THREE.Mesh(quad, mat);
  mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.renderOrder = 3;
  mesh.matrix.fromArray(o.lifted(o.box.m, o.liftCount(o.box.m))).multiply(new THREE.Matrix4().makeTranslation(w / 2, h / 2, 0)).multiply(new THREE.Matrix4().makeScale(w, h, 1));
  // (the screen's box has no z column: the lid's own normal)
  { const e = mesh.matrix.elements; if (Math.hypot(e[8], e[9], e[10]) < 1e-9) { const z = new THREE.Vector3(e[0], e[1], e[2]).cross(new THREE.Vector3(e[4], e[5], e[6])).normalize(); e[8] = z.x; e[9] = z.y; e[10] = z.z; } }
  o.scene.add(mesh);

  // .od-dvd__card's background: a radial glow and scan lines 3 page px apart
  const paintCard = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // (radial-gradient(120% 90% at 30% 35%, #16233a, #070b14 75%): an ellipse,
    // drawn as a circle in a frame squashed to its aspect)
    const rx = W * 1.2, ry = H * 0.9;
    ctx.save();
    ctx.translate(W * 0.3, H * 0.35); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "#16233a"); g.addColorStop(0.75, "#070b14"); g.addColorStop(1, "#070b14");
    ctx.fillStyle = g; ctx.fillRect(-W, -H * rx / ry, W * 3, (H * 3 * rx) / ry);
    ctx.restore();
    const stage = document.querySelector(".case-stage")?.getBoundingClientRect().width ?? 1118;
    const pxU = stage / 1118, step = (3 / pxU) * K, dark = (1 / pxU) * K;
    ctx.fillStyle = "rgba(0,0,0,.18)";
    for (let y = (2 / pxU) * K; y < H; y += step) ctx.fillRect(0, y, W, dark);
  };
  // an element's text where the page laid it, line by line (a clamped line
  // ends in an ellipsis)
  const drawText = (ctx: CanvasRenderingContext2D, el: Element, sr: DOMRect) => {
    const cs = getComputedStyle(el), box = el.getBoundingClientRect();
    ctx.font = cs.font;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    ctx.fillStyle = cs.color;
    const sh = cs.textShadow.match(/(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
    if (sh) { ctx.shadowColor = sh[1]; ctx.shadowOffsetX = +sh[2]; ctx.shadowOffsetY = +sh[3]; ctx.shadowBlur = +sh[4]; } else ctx.shadowColor = "transparent";
    const up = cs.textTransform === "uppercase";
    const node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    const text = node.textContent ?? "";
    // the words' boxes, gathered into the lines the page broke them into
    const lines: { top: number; h: number; left: number; right: number; words: string[] }[] = [];
    const rg = document.createRange();
    let i = 0, cut = false;
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      rg.setStart(node, i); rg.setEnd(node, i + word.length); i += word.length;
      if (/^\s+$/.test(word)) continue;
      const r = rg.getBoundingClientRect();
      // (a line that starts below the box is clamped away; the glyphs' own box
      // runs past a line-height: 1 line's, so its top is what counts)
      if (r.top + r.height / 2 > box.bottom) { cut = true; break; }
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - r.top) < 1) { last.words.push(word); last.right = r.right; }
      else lines.push({ top: r.top, h: r.height, left: r.left, right: r.right, words: [word] });
    }
    lines.forEach((l, k) => {
      let t = l.words.join(" ");
      if (up) t = t.toUpperCase();
      if (cut && k === lines.length - 1) t += "…";
      const mt = ctx.measureText(t);
      // (a line past its box: text-overflow's ellipsis)
      if (mt.width > box.width + 0.5) { while (t.length > 1 && ctx.measureText(t + "…").width > box.width) t = t.slice(0, -1); t += "…"; }
      ctx.fillText(t, l.left - sr.left, l.top - sr.top + (l.h + mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2);
    });
  };

  let blinkOn = true, shownKey = "";
  const paintText = (s: RoomState) => {
    const p = s.picked;
    host.toggleAttribute("data-on", !!p);
    scr.replaceChildren();
    if (p) scr.appendChild(cardOf(p, s));
    scr.insertAdjacentHTML("beforeend", p
      ? `<span class="od-dvd__osd">▶ PLAY</span>`
      : `<span class="od-dvd__osd">KATE™ DVD</span><span class="od-dvd__osd od-dvd__osd--blink" style="animation:none">NO DISC</span>`);
    const card = scr.querySelector<HTMLElement>(".od-dvd__card");
    // (drawn as it is once its lines are up)
    if (card) { card.style.animation = "none"; for (const c of card.children) (c as HTMLElement).style.animation = "none"; }
    const ctx = textC.getContext("2d")!;
    ctx.clearRect(0, 0, textC.width, textC.height);
    const sr = scr.getBoundingClientRect();
    if (card) paintCard(ctx, textC.width, textC.height);
    for (const el of [...(card?.children ?? []), ...scr.querySelectorAll(":scope > .od-dvd__osd")]) {
      const blink = el.classList.contains("od-dvd__osd--blink");
      ctx.globalAlpha = blink && !blinkOn ? 0.25 : 1;
      drawText(ctx, el, sr);
    }
    ctx.globalAlpha = 1; ctx.shadowColor = "transparent";
    textT.needsUpdate = true;
  };

  const sync = (s: RoomState) => { const key = `${s.picked?.title ?? ""}|${s.series.length}|${blinkOn}`; if (key !== shownKey) { shownKey = key; paintText(s); } o.redraw(); };
  const off = onRoom(sync);
  document.fonts?.ready.then(() => { shownKey = ""; sync(roomState()); });
  sync(roomState());

  /** lays the screen as the state is at `now`; true when it changed */
  const frame = (now: number) => {
    const s = roomState();
    const lidShown = o.lid.shown();
    let changed = false;
    const b = Math.floor(now / BLINK) % 2 === 0;
    if (!s.picked && lidShown && b !== blinkOn) { blinkOn = b; sync(s); changed = true; }
    mesh.visible = lidShown;
    return changed;
  };
  return {
    frame,
    dispose() { off(); host.remove(); textT.dispose(); },
  };
}
