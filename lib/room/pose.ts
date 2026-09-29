/**
 * The room's camera as numbers: the same stops, curve and projection the
 * CSS camera uses (globals.css, "The desk as a room"), for the WebGL room
 * (components/room) and the scripts that bake and check it (scripts/room).
 * No imports, so node runs it as it is.
 *
 * Space is the case box's own px ("u", 1118 across the box), y down, z
 * toward the viewer, as in the CSS. The CSS camera moves the world:
 * W = T(O) · rotateX(rx) · T(t) · T(−O) about the eye O = (560, 226, 2150),
 * then projects with perspective 2150 about (560, 226), then shifts the
 * picture by the scene-cam's translate (dx, dy, in screen px).
 */

export type Mat4 = number[]; // column-major, as DOMMatrix / three

export const EYE = [560, 226, 2150] as const;
export const FOCAL = 2150;

export type Pose = { rx: number; t: [number, number, number]; sx: number; sy: number };
export type View = "home" | "files" | "award" | "profile" | "offduty" | "bike";

/** Where each stop puts the world (translate in u) and how far the picture
 *  is shifted besides the lens shift (px). Files' x runs with the pan. */
export function stopPose(view: View, pan = 0, narrow = false): Pose {
  // (on a phone, under 768 px, the wall's two stops and Profile pan along the
  // room too, and Profile's axis is on the binder's middle: globals.css)
  const p = narrow ? pan : 0;
  switch (view) {
    case "files": return { rx: -90, t: [200 - pan, 430, 1751.5], sx: 0, sy: 0 };
    case "award": return { rx: 0, t: [-1040 - p, -150, 100], sx: 0, sy: 0 };
    case "profile": return { rx: -90, t: [(narrow ? -1397.5 : -1327.5) - p, 506, 2129], sx: -20, sy: -15 };
    case "offduty": return { rx: 0, t: [1423 - p, -150, 100], sx: 0, sy: 0 };
    case "bike": return { rx: -90, t: [1380, 170, 1890], sx: 0, sy: 0 };
    default: return { rx: 0, t: [0, 0, 0], sx: 0, sy: 0 };
  }
}

/** html[data-desk] (+ data-desk-focus) → the view the CSS draws */
export function viewOfState(desk: string | undefined, focus: string | undefined): View {
  switch (desk) {
    case "open": return "files";
    case "award": return "award";
    case "profile": return "profile";
    // (no camera down over the bike computer since staging 27.09)
    case "offduty": return "offduty";
    default: return "home";
  }
}

export const mul = (a: Mat4, b: Mat4): Mat4 => {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
};
export const translate = (x: number, y: number, z: number): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
export const scale = (x: number, y: number, z = 1): Mat4 => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
/** CSS rotateX(deg) */
export const rotateX = (deg: number): Mat4 => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};
export const apply = (m: Mat4, p: [number, number, number]): [number, number, number, number] => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
];

/** The world's transform at a pose: world u → scene-cam u (before projection). */
export function worldMatrix(p: Pose): Mat4 {
  return mul(mul(mul(translate(EYE[0], EYE[1], EYE[2]), rotateX(p.rx)), translate(p.t[0], p.t[1], p.t[2])), translate(-EYE[0], -EYE[1], -EYE[2]));
}

/** world u → eye space (x right, y up, looking down −z), for a GL camera */
export function viewMatrix(p: Pose): Mat4 {
  return mul(mul(scale(1, -1, 1), translate(-EYE[0], -EYE[1], -EYE[2])), worldMatrix(p));
}

/** A perspective projection for a canvas covering (cx, cy, cw, ch) of the
 *  stage, in u, with the principal point at (ppx, ppy) of the stage, in u. */
export function projectionMatrix(cx: number, cy: number, cw: number, ch: number, ppx: number, ppy: number, near = 20, far = 12000): Mat4 {
  const f = FOCAL;
  const m02 = 1 - (2 * (ppx - cx)) / cw;
  const m12 = (2 * (ppy - cy)) / ch - 1;
  return [
    (2 * f) / cw, 0, 0, 0,
    0, (2 * f) / ch, 0, 0,
    m02, m12, -(far + near) / (far - near), -1,
    0, 0, (-2 * far * near) / (far - near), 0,
  ];
}

/** A world point (u) to the stage's own coordinates (u), as the CSS draws
 *  it, before the scene-cam's shift; null behind the eye. */
export function projectToStage(p: Pose, pt: [number, number, number]): [number, number] | null {
  const q = apply(worldMatrix(p), pt);
  const d = FOCAL - q[2];
  if (d <= 1) return null;
  const k = FOCAL / d;
  return [EYE[0] + (q[0] - EYE[0]) * k, EYE[1] + (q[1] - EYE[1]) * k];
}

export const lerpPose = (a: Pose, b: Pose, e: number): Pose => ({
  rx: a.rx + (b.rx - a.rx) * e,
  t: [0, 1, 2].map((i) => a.t[i] + (b.t[i] - a.t[i]) * e) as [number, number, number],
  sx: a.sx + (b.sx - a.sx) * e,
  sy: a.sy + (b.sy - a.sy) * e,
});

/** CSS cubic-bezier(x1, y1, x2, y2) */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  const dx = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
    }
    // bisection if Newton wandered
    if (t < 0 || t > 1 || Math.abs(bx(t) - x) > 1e-4) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; if (bx(t) < x) lo = t; else hi = t; }
    }
    return by(t);
  };
}

export const EASE = { cam: bezier(0.45, 0, 0.55, 1), bike: bezier(0.65, 0, 0.2, 1), ease: bezier(0.25, 0.1, 0.25, 1) };
/** the camera's move (--cam-t, --cam-wait), the bike's (1.4 s, no wait) */
export const CAM = { t: 2300, wait: 200, bikeT: 1400 };

/** The case box's width on the page for a window (globals.css, the suitcase
 *  stage), in px — to size things without a page. */
export function stageWidth(w: number, h: number) {
  return w >= 1280 ? Math.min(0.7764 * w, (h - 16) * 1.3298) : w >= 1024 ? 0.7764 * w : Math.min(0.88 * w, 1118);
}
