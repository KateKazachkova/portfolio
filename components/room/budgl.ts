/**
 * The БУДЬ prints in WebGL (M6): the Profile binder's loose prints, which
 * the page lets anyone pick up and move (components/profile/PhotoStack.tsx).
 * At Profile at rest the binder is the page's own DOM (RoomBinder.tsx); in
 * flight and at every other stop it is WebGL's, and there the prints lie
 * where the page's store has them now, not as baked: the sheet is baked
 * without them (bake.mjs), each print is a plane of its own, and every
 * frame each is laid on the sheet's face as it lies at this moment — the
 * face's frame × the stack's box × the print's transform (translate in %
 * of the stack, rotate about its middle, as its style) × the picture's
 * offset in it — in the order of their z-index, cut to the sheet (its
 * overflow), and the sleeve's plastic over them all. They show wherever
 * the face shows (the spread, the panel taking over at rest).
 */
import * as THREE from "three";
import { budPrints, onBudPrints } from "@/components/profile/PhotoStack";

type Plane = { meshes: THREE.Mesh[]; mats: THREE.ShaderMaterial[]; w: number; h: number; q: [number, number] };
export type BudData = { face: number; off: [number, number]; box: [number, number, number, number]; sheet: [number, number, number, number] };
export type BudCtx = {
  face: { meshes: THREE.Mesh[]; w: number; h: number; shown?: () => boolean };
  prints: (Plane & { n: number })[];
  gloss: Plane | null;
  data: BudData;
  redraw: () => void;
};

// over the face and under whatever lies over it in the room (the next lift
// is 0.06 up): drawn in their own order, not by depth
const LIFT = 0.03;

export function makeBud(o: BudCtx) {
  const { box, sheet, off } = o.data;
  const [bx, by, s] = box;
  // each drawn in one pass, see-through and solid pixels alike, blended in
  // their order: in two (the room's solid pass, then its see-through one) a
  // print's shadow and edges would land on the prints above it
  const one = new Map<Plane, THREE.Mesh>();
  for (const p of [...o.prints, ...(o.gloss ? [o.gloss] : [])]) {
    const k = p.mats.findIndex((m) => m.transparent);
    one.set(p, p.meshes[k]);
    for (const mat of p.mats) {
      mat.depthWrite = false;
      mat.uniforms.alphaMax.value = 2;
      mat.uniforms.clip.value.set(sheet[0], sheet[1], sheet[2], sheet[3]);
    }
  }
  const E = new THREE.Matrix4(), L = new THREE.Matrix4(), W = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4();
  // one plane laid at L (its picture's top-left in the face's frame, u)
  const lay = (p: Plane, order: number, vis: boolean) => {
    // (st → the face's frame, for the cut to the sheet)
    const e = L.elements;
    for (const mat of p.mats) mat.uniforms.stg.value.set(e[0] * p.w, e[4] * p.h, e[12], e[1] * p.w, e[5] * p.h, e[13], 0, 0, 1);
    W.copy(E).multiply(L).multiply(T.makeTranslation(p.w / 2, p.h / 2, 0)).multiply(R.makeScale(p.w, p.h, 1));
    for (const mesh of p.meshes) { mesh.matrix.copy(W); mesh.matrixWorldNeedsUpdate = true; mesh.renderOrder = order; mesh.visible = vis && mesh === one.get(p); }
  };
  const frame = () => {
    const fm = o.face.meshes[0];
    const vis = o.face.shown ? o.face.shown() : fm.visible;
    // the face element's own frame: back from its picture's quad
    E.copy(fm.matrix).multiply(R.makeScale(1 / o.face.w, 1 / o.face.h, 1)).multiply(T.makeTranslation(-o.face.w / 2, -o.face.h / 2, 0))
      .multiply(T.makeTranslation(-off[0], -off[1], LIFT));
    const list = budPrints();
    // bottom to top: by z-index, then by place in the stack
    const order = o.prints.map((p) => p).sort((a, b) => (list[a.n]?.z ?? 0) - (list[b.n]?.z ?? 0) || a.n - b.n);
    order.forEach((p, k) => {
      const q = list[p.n] ?? { x: 0, y: 0, r: 0 };
      L.makeTranslation(bx + s / 2 + (q.x * s) / 100, by + s / 2 + (q.y * s) / 100, 0)
        .multiply(R.makeRotationZ((q.r * Math.PI) / 180))
        .multiply(T.makeTranslation(-s / 2 + p.q[0], -s / 2 + p.q[1], 0));
      lay(p, 200 + k, vis);
    });
    if (o.gloss) { L.makeTranslation(o.gloss.q[0], o.gloss.q[1], 0); lay(o.gloss, 300, vis); }
  };
  const off2 = onBudPrints(() => o.redraw());
  return { frame, dispose: off2 };
}
