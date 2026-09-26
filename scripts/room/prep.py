"""A texture's pixels for the encoder (textures.mjs): the source, scaled
down (never up) to the size the closest camera needs, premultiplied by its
alpha (a compressed texture cannot be premultiplied on upload, and
filtering needs it), as raw RGBA.

Soft paint — shadows, haze, gradients: what the caller calls soft, or
anything with no opaque pixel at all — then shrinks further while that
cannot be seen: scaled down and back up it stays within PSNR 40 dB of
itself (40 dB; premultiplied, so a faint shadow's change is as faint as it is).
Photographs and anything with detail keep the camera's size: an automatic
measure let a dark, grainy wall shrink to a smear.

Prints the sizes and whether it was soft.

    python3 prep.py SRC OUT.rgba W H sharp|soft
"""
import json, sys
import numpy as np
from PIL import Image

src, out, w, h, kind = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
im = Image.open(src).convert("RGBA")
sw, sh = im.size
a = np.asarray(im).astype(np.float32) / 255.0
soft = kind == "soft" or float(a[..., 3].max()) < 0.95
a[..., :3] *= a[..., 3:4]
pm = Image.fromarray((a * 255 + 0.5).astype(np.uint8), "RGBA")

def psnr(x, y):
    d = (np.asarray(x).astype(np.float32) - np.asarray(y).astype(np.float32)) / 255.0
    mse = float((d * d).mean())
    return 99.0 if mse < 1e-12 else 10 * np.log10(1.0 / mse)

k = min(1.0, w / sw, h / sh)
tw, th = max(4, round(sw * k)), max(4, round(sh * k))
base = pm if (tw, th) == pm.size else pm.resize((tw, th), Image.LANCZOS)
cur = base
while soft and min(cur.size) > 16:
    nw, nh = max(4, round(cur.size[0] * 0.75)), max(4, round(cur.size[1] * 0.75))
    small = base.resize((nw, nh), Image.LANCZOS)
    if psnr(small.resize(base.size, Image.LANCZOS), base) < 40.0:
        break
    cur = small
np.asarray(cur).astype(np.uint8).tofile(out)
opaque = bool(np.asarray(cur)[..., 3].min() >= 250)
print(json.dumps({"sw": sw, "sh": sh, "w": cur.size[0], "h": cur.size[1], "need": [tw, th], "soft": soft, "opaque": opaque}))
