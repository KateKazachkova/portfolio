/**
 * Map a w×h rectangle (origin top-left, transform-origin 0 0) onto an arbitrary
 * quad with a CSS matrix3d(). Used to pin flat HTML (a poster on the player's
 * screen, stickers on a lid) onto a plane photographed in perspective.
 *
 * Quad order: TL, TR, BR, BL in the target's pixel space.
 */
export type Pt = [number, number];

// Solve the 8-dof homography H with (0,0)→q0, (w,0)→q1, (w,h)→q2, (0,h)→q3.
function solve(w: number, h: number, q: Pt[]): number[] {
  const src: Pt[] = [[0, 0], [w, 0], [w, h], [0, h]];
  // Build the 8×8 system A·x = b for x = [h11 h12 h13 h21 h22 h23 h31 h32].
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = q[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // Gaussian elimination with partial pivoting.
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = M.map((row, i) => row[n] / (row[i] || 1e-12));
  return [...x, 1]; // h33 = 1
}

/** The raw 3×3 homography (row-major, h33 = 1) for w×h → quad. */
export function homography(w: number, h: number, quad: Pt[]): number[] {
  return solve(w, h, quad);
}

/** Apply a homography from `homography()` to a point. */
export function applyH(H: number[], x: number, y: number): Pt {
  const d = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d];
}

/** CSS transform string that maps a w×h element onto `quad` (pixels). */
export function quadToMatrix3d(w: number, h: number, quad: Pt[]): string {
  const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = solve(w, h, quad);
  // matrix3d is column-major; z row/column stay identity so the plane keeps 3D depth cues off.
  const m = [
    h11, h21, 0, h31,
    h12, h22, 0, h32,
    0, 0, 1, 0,
    h13, h23, 0, h33,
  ];
  return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6))).join(",")})`;
}
