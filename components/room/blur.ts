/**
 * A Gaussian blur of a texture on the GPU, for what CSS draws with
 * drop-shadow() and blur() on the flat groups' pictures (./mirror): two
 * passes into a render target padded by 3σ, scaled down so no pass takes
 * more than ~37 taps. Premultiplied in, premultiplied out. Cached per
 * texture and radius.
 */
import * as THREE from "three";

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = /* glsl */ `
uniform sampler2D map; uniform vec2 step; uniform float sigma; uniform int taps; uniform vec4 box; uniform float clip;
varying vec2 vUv;
vec4 at(vec2 uv) {
  // the first pass reads the source through the padded box; outside it,
  // nothing (no clamping: a picture's edge must not smear into its shadow)
  vec2 s = clip > 0.5 ? (uv - box.xy) / box.zw : uv;
  if (clip > 0.5 && (s.x < 0.0 || s.y < 0.0 || s.x > 1.0 || s.y > 1.0)) return vec4(0.0);
  return texture2D(map, s);
}
void main() {
  vec4 acc = vec4(0.0); float wsum = 0.0;
  for (int i = -64; i <= 64; i++) {
    if (i < -taps || i > taps) continue;
    float w = exp(-0.5 * float(i * i) / (sigma * sigma));
    acc += at(vUv + step * float(i)) * w; wsum += w;
  }
  gl_FragColor = acc / wsum;
}`;

export type Blurred = { tex: THREE.Texture; pad: number };

export function makeBlur(renderer: THREE.WebGLRenderer) {
  const cache = new Map<string, Blurred>();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, step: { value: new THREE.Vector2() }, sigma: { value: 1 }, taps: { value: 3 }, box: { value: new THREE.Vector4(0, 0, 1, 1) }, clip: { value: 0 } },
    vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  /** `src` of w × h px, blurred by sigma (in its own px) */
  return (src: THREE.Texture, w: number, h: number, sigma: number): Blurred | null => {
    if (!w || !h || sigma <= 0.25) return null;
    const key = `${src.uuid}|${sigma.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const pad = Math.ceil(sigma * 3);
    const k = Math.min(1, 6 / sigma, 2048 / (Math.max(w, h) + 2 * pad));
    const W = Math.max(2, Math.ceil((w + 2 * pad) * k)), H = Math.max(2, Math.ceil((h + 2 * pad) * k));
    const opts = { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, colorSpace: THREE.NoColorSpace } as const;
    const a = new THREE.WebGLRenderTarget(W, H, opts), b = new THREE.WebGLRenderTarget(W, H, opts);
    const s = sigma * k, taps = Math.min(64, Math.ceil(s * 3));
    renderer.initTexture(src);
    const prev = renderer.getRenderTarget();
    const u = mat.uniforms;
    // across, reading the source through the padded box
    u.map.value = src; u.clip.value = 1; u.sigma.value = s; u.taps.value = taps;
    u.box.value.set(pad / (w + 2 * pad), pad / (h + 2 * pad), w / (w + 2 * pad), h / (h + 2 * pad));
    u.step.value.set(1 / W, 0);
    renderer.setRenderTarget(a); renderer.render(scene, cam);
    // down
    u.map.value = a.texture; u.clip.value = 0; u.step.value.set(0, 1 / H);
    renderer.setRenderTarget(b); renderer.render(scene, cam);
    renderer.setRenderTarget(prev);
    a.dispose();
    const out = { tex: b.texture, pad };
    cache.set(key, out);
    return out;
  };
}
