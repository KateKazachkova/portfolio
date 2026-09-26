"""How far apart two screenshots are: the share of pixels that differ
(more than 8 and more than 32 of 255 in any channel), the mean difference,
and the largest local shift — the best whole-pixel offset between the two
in tiles that have enough detail to tell. Writes a heat map.

    python3 diff.py A.png B.png HEAT.png
"""
import json, sys
import numpy as np
from PIL import Image

a = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB")).astype(np.int16)
h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
a, b = a[:h, :w], b[:h, :w]
d = np.abs(a - b).max(axis=2)
res = {
    "px": w * h,
    "over8": round(float((d > 8).mean()) * 100, 3),
    "over32": round(float((d > 32).mean()) * 100, 3),
    "mean": round(float(d.mean()), 3),
}

# the local shift, where the pictures have edges to align
ga = a.mean(axis=2)
gb = b.mean(axis=2)
T, R = 128, 5
shifts = []
for y in range(R, h - T - R, T):
    for x in range(R, w - T - R, T):
        ta = ga[y:y + T, x:x + T]
        if ta.std() < 12:
            continue
        # only tiles that differ at all
        if np.abs(ta - gb[y:y + T, x:x + T]).mean() < 1.0:
            shifts.append((0, 0, 0.0))
            continue
        best = None
        for dy in range(-R, R + 1):
            for dx in range(-R, R + 1):
                tb = gb[y + dy:y + dy + T, x + dx:x + dx + T]
                e = np.abs(ta - tb).mean()
                if best is None or e < best[2]:
                    best = (dx, dy, e)
        base = np.abs(ta - gb[y:y + T, x:x + T]).mean()
        # a shift only counts if it explains most of the difference (a
        # textured tile otherwise "matches" itself a few px off)
        if base > 3 and best[2] < base * 0.5:
            shifts.append(best)
        else:
            shifts.append((0, 0, base))
mx = max((max(abs(s[0]), abs(s[1])) for s in shifts), default=0)
res["tiles"] = len(shifts)
res["maxShift"] = int(mx)
res["shifted"] = sum(1 for s in shifts if s[0] or s[1])

heat = np.zeros((h, w, 3), np.uint8)
heat[..., 0] = np.clip(d * 4, 0, 255)
heat[..., 1] = (np.asarray(Image.open(sys.argv[1]).convert("L"))[:h, :w] * 0.35).astype(np.uint8)
Image.fromarray(heat).save(sys.argv[3])
print(json.dumps(res))
