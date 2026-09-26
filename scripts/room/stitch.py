"""Helpers for bake.mjs: stitch screenshot tiles; trim a picture to what was
drawn (alpha), keeping a 2 px margin, and write the master PNG + a WebP."""
import json, sys
from PIL import Image

cmd = sys.argv[1]
if cmd == "stitch":
    out, w, h, tiles = sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), json.loads(sys.argv[5])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for t in tiles:
        im.paste(Image.open(t["f"]).convert("RGBA"), (t["x"], t["y"]))
    im.save(out)
elif cmd == "trim":
    src, master, webp = sys.argv[2], sys.argv[3], sys.argv[4]
    im = Image.open(src).convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > 1 else 0)
    bb = a.getbbox()
    if not bb:
        print(json.dumps({"w": 0})); sys.exit()
    m = 2
    x0, y0 = max(0, bb[0] - m), max(0, bb[1] - m)
    x1, y1 = min(im.width, bb[2] + m), min(im.height, bb[3] + m)
    im = im.crop((x0, y0, x1, y1))
    im.save(master)
    im.save(webp, "WEBP", quality=92, method=5, exact=False)
    print(json.dumps({"x": x0, "y": y0, "w": im.width, "h": im.height, "edge": [bb[0] <= 0, bb[1] <= 0, bb[2] >= Image.open(src).width, bb[3] >= Image.open(src).height]}))
