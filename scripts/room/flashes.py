"""Finds flashes in a screencast (scripts/room/flash.mjs): a frame unlike
both of its neighbours while they are like each other — a hole, a blink,
something drawn for one frame — and, per leg of the tour, the largest jump
between two frames and how dark the darkest frame was.

    python3 flashes.py DIR
"""
import json, os, sys
import numpy as np
from PIL import Image

d = sys.argv[1]
meta = json.load(open(os.path.join(d, "frames.json")))
frames = meta["frames"]
imgs = []
for fr in frames:
    im = Image.open(fr["f"]).convert("L").resize((252, 144))
    imgs.append(np.asarray(im).astype(np.float32))
n = len(imgs)
diff = [0.0] + [float(np.abs(imgs[i] - imgs[i - 1]).mean()) for i in range(1, n)]
dark = [float((im < 12).mean()) for im in imgs]
flashes = []
for i in range(1, n - 1):
    a = np.abs(imgs[i] - imgs[i - 1]).mean()
    b = np.abs(imgs[i] - imgs[i + 1]).mean()
    c = np.abs(imgs[i - 1] - imgs[i + 1]).mean()
    # unlike both neighbours, which are alike
    if min(a, b) > 6 and min(a, b) > 3 * c:
        flashes.append({"frame": i, "t": round(frames[i]["t"] - frames[0]["t"], 3), "a": round(float(a), 1), "b": round(float(b), 1), "c": round(float(c), 1)})
marks = meta["marks"]
legs = []
for k in range(len(marks) - 1):
    s, e = marks[k]["frame"], marks[k + 1]["frame"]
    if e - s < 2:
        continue
    seg = diff[s + 1:e]
    legs.append({"leg": marks[k]["label"], "frames": e - s, "maxJump": round(max(seg), 1) if seg else 0,
                 "maxDark": round(max(dark[s:e]), 3), "minDark": round(min(dark[s:e]), 3)})
print(json.dumps({"frames": n, "flashes": flashes, "legs": legs}, indent=1))
