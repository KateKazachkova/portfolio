/**
 * The room at night in WebGL (M5): NightRoom and NightCam (components/
 * NightRoom.tsx, globals.css) as one full-window pass multiplied over the
 * scene, drawn last, so while the camera travels the night is WebGL's and
 * no DOM layer is blended over the canvas.
 *
 *  - home: NightRoom, in the case box's own px (1118 × 745, stretched over
 *    the stage): the room out, a fill that keeps her found, the lamp's pool
 *    thrown down from its head and the lit shade over the lid, the window's
 *    four panes of moonlight across the desk, and without the lamp a torch
 *    at the pointer;
 *  - the other stops: NightCam, in the window's px: the same ground, the
 *    lamp's pool coming in from where the lamp stands for that stop, or the
 *    torch.
 *
 * Each is a multiply layer with its own opacity, so the pass multiplies by
 * mix(1, home, homeOp) · mix(1, cam, camOp). At rest the page's own layers
 * draw the night instead (over the page's case at home, over the stop's
 * panels elsewhere): engine.ts hands over between them in one frame.
 */
import * as THREE from "three";
import { LAMP_HEAD, LAMP_MOUTH, LID } from "@/components/desk/DeskLamp";

const VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 res;          // the canvas, device px
uniform float pr;          // device px per CSS px
uniform vec4 stage;        // the case box on the canvas, CSS px: x, y, w, h
uniform vec4 view;         // the window on the canvas, CSS px
uniform float homeOp, camOp, lamp, torchOp;
uniform vec2 torch;        // the pointer, CSS px on the canvas
uniform vec4 pool;         // NightCam's pool: centre (fractions of the window), size (fractions)
uniform float poolK;
uniform vec2 poolAt, mouth, head;
uniform float lid;

vec4 over(vec4 d, vec3 c, float a) { return vec4(mix(d.rgb, c, a), 1.0); }
// an SVG / CSS gradient's colour and alpha at t through four stops
vec4 stops4(float t, vec4 s0, vec4 s1, vec4 s2, vec4 s3, vec3 at) {
  t = clamp(t, 0.0, 1.0);
  if (t < at.x) return mix(s0, s1, t / at.x);
  if (t < at.y) return mix(s1, s2, (t - at.x) / (at.y - at.x));
  return mix(s2, s3, (t - at.y) / (1.0 - at.y));
}
// a convex quad's signed distance (negative inside), corners in order
float sdQuad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 v[4]; v[0] = a; v[1] = b; v[2] = c; v[3] = d;
  float s = -1e9;
  float orient = sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  for (int i = 0; i < 4; i++) {
    vec2 e = v[(i + 1) % 4] - v[i];
    vec2 n = normalize(vec2(e.y, -e.x)) * orient;
    s = max(s, dot(p - v[i], n));
  }
  return s;
}
// a Gaussian-blurred edge (feGaussianBlur σ over a hard shape)
float soft(float sd, float sigma) { float x = sd / (sigma * 1.41421356); return 0.5 - 0.5 * tanh(1.1283792 * x + 0.1009 * x * x * x); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / pr;
  vec3 ground = vec3(58.0, 62.0, 86.0) / 255.0;
  vec3 f = vec3(1.0);

  if (homeOp > 0.001) {
    vec2 b = (p - stage.xy) / stage.zw * vec2(1118.0, 745.0);
    vec4 c = vec4(ground, 1.0);
    // the fill, so she is never lost
    float tf = length(vec2(b.x - 553.0, (b.y - 440.0) / 0.8)) / 420.0;
    c = over(c, vec3(150.0, 128.0, 112.0) / 255.0, clamp(1.0 - tf, 0.0, 1.0));
    // the lamp's pool, and its lit shade over the lid
    if (lamp > 0.001) {
      float tp = length(vec2(b.x - poolAt.x, (b.y - poolAt.y) / 0.7)) / 1150.0;
      vec4 g = stops4(tp, vec4(255.0, 224.0, 180.0, 255.0) / 255.0, vec4(236.0, 196.0, 150.0, 255.0) / 255.0,
                      vec4(170.0, 136.0, 112.0, 204.0) / 255.0, vec4(80.0, 74.0, 90.0, 0.0) / 255.0, vec3(0.3, 0.62, 1.0));
      c = over(c, g.rgb, g.a * lamp);
      vec2 e = (b - vec2(mouth.x, mouth.y - 0.25 * head.y)) / vec2(0.6 * head.x, 0.75 * head.y);
      float te = length(e);
      float ae = te < 0.7 ? 1.0 : clamp(1.0 - (te - 0.7) / 0.3, 0.0, 1.0);
      if (b.y < lid) c = over(c, vec3(1.0), ae * lamp);
    }
    // the window's panes of moonlight on the desk
    vec2 m0 = vec2(-120.0, 600.0), m1 = vec2(420.0, 820.0);
    float tm = clamp(dot(b - m0, m1 - m0) / dot(m1 - m0, m1 - m0), 0.0, 1.0);
    vec3 moon = mix(vec3(196.0, 212.0, 240.0), vec3(140.0, 158.0, 196.0), tm) / 255.0;
    float sd = min(min(sdQuad(b, vec2(-150.0, 640.0), vec2(40.0, 612.0), vec2(150.0, 690.0), vec2(-60.0, 726.0)),
                       sdQuad(b, vec2(58.0, 609.0), vec2(240.0, 582.0), vec2(360.0, 654.0), vec2(168.0, 687.0))),
                   min(sdQuad(b, vec2(-40.0, 742.0), vec2(170.0, 704.0), vec2(300.0, 800.0), vec2(70.0, 846.0)),
                       sdQuad(b, vec2(188.0, 700.0), vec2(380.0, 666.0), vec2(520.0, 758.0), vec2(318.0, 796.0))));
    c = over(c, moon, 0.9 * soft(sd, 3.5));
    // the torch, at the pointer
    if (torchOp > 0.001) {
      vec2 tb = (torch - stage.xy) / stage.zw * vec2(1118.0, 745.0);
      vec4 g = stops4(length(b - tb) / 175.0, vec4(255.0, 244.0, 226.0, 255.0) / 255.0, vec4(240.0, 214.0, 178.0, 230.0) / 255.0,
                      vec4(238.0, 211.0, 174.0, 115.0) / 255.0, vec4(236.0, 208.0, 170.0, 0.0) / 255.0, vec3(0.5, 0.75, 1.0));
      c = over(c, g.rgb, g.a * torchOp);
    }
    f *= mix(vec3(1.0), c.rgb, homeOp);
  }

  if (camOp > 0.001) {
    vec2 q = (p - view.xy) / view.zw;
    vec4 c = vec4(ground, 1.0);
    if (lamp * poolK > 0.001) {
      // radial-gradient(size at centre): its ellipse's radii are the size
      float t = length((q - pool.xy) / pool.zw);
      vec4 g = stops4(t, vec4(255.0, 224.0, 180.0, 255.0) / 255.0, vec4(236.0, 196.0, 150.0, 255.0) / 255.0,
                      vec4(170.0, 136.0, 112.0, 204.0) / 255.0, vec4(80.0, 74.0, 90.0, 0.0) / 255.0, vec3(0.3, 0.62, 1.0));
      c = over(c, g.rgb, g.a * lamp * poolK);
    }
    if (torchOp > 0.001) {
      vec4 g = stops4(length(p - torch) / 260.0, vec4(255.0, 244.0, 226.0, 255.0) / 255.0, vec4(240.0, 214.0, 178.0, 230.0) / 255.0,
                      vec4(238.0, 211.0, 174.0, 115.0) / 255.0, vec4(236.0, 208.0, 170.0, 0.0) / 255.0, vec3(0.5, 0.75, 1.0));
      c = over(c, g.rgb, g.a * torchOp);
    }
    f *= mix(vec3(1.0), c.rgb, camOp);
  }
  gl_FragColor = vec4(f, 1.0);
}`;

/** NightCam's pool for each stop (globals.css): centre and size, fractions of the window */
export const POOL: Record<string, { at: [number, number]; size: [number, number]; k: number }> = {
  home: { at: [0.3, -0.15], size: [1.3, 1.2], k: 1 },
  files: { at: [0.3, -0.15], size: [1.3, 1.2], k: 1 },
  award: { at: [-0.15, 0.1], size: [1.1, 1.3], k: 1 },
  profile: { at: [-0.4, -0.1], size: [1.4, 1.4], k: 0.85 },
  offduty: { at: [1.15, 0.05], size: [1.1, 1.3], k: 1 },
  bike: { at: [0.95, -0.2], size: [1.2, 1.2], k: 1 },
};

export function makeNight() {
  const u = {
    res: { value: new THREE.Vector2(1, 1) }, pr: { value: 1 },
    stage: { value: new THREE.Vector4(0, 0, 1, 1) }, view: { value: new THREE.Vector4(0, 0, 1, 1) },
    homeOp: { value: 0 }, camOp: { value: 0 }, lamp: { value: 1 }, torchOp: { value: 0 },
    torch: { value: new THREE.Vector2(-1e4, -1e4) },
    pool: { value: new THREE.Vector4(0.3, -0.15, 1.3, 1.2) }, poolK: { value: 1 },
    poolAt: { value: new THREE.Vector2(LAMP_MOUTH.x - 120, 440) },
    mouth: { value: new THREE.Vector2(LAMP_MOUTH.x, LAMP_MOUTH.y) },
    head: { value: new THREE.Vector2(LAMP_HEAD.w, LAMP_HEAD.h) },
    lid: { value: LID },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true });
  // the scene times the night: dst · src, its alpha kept
  mat.blending = THREE.CustomBlending;
  mat.blendSrc = THREE.DstColorFactor; mat.blendDst = THREE.ZeroFactor;
  mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1e9;
  mesh.visible = false;
  return { mesh, u };
}
