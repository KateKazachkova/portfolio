"use client";

import { memo, useRef, useState } from "react";

/** The wardrobe, rebuilt as layers so the clothes can leave it.
 *
 *  `open2.webp` has the garments baked in, so an empty plate was generated from
 *  the case's own pixels — the rail straightened to the angle Kate drew, the
 *  folded blankets taken off the shelf — and it is laid back over exactly the
 *  rectangle it was cut from. Everything else here hangs on top of it.
 *
 *  All numbers are percentages of the SUITCASE BOX. The rail is a measured
 *  line, not a guess: fitted to the brass in the plate (183 samples), it passes
 *  through (76.50, 16.62) and climbs to the right at -0.0631 %y per %x, because
 *  the right-hand side of the wardrobe is nearer the camera. */
const WARDROBE = { l: 73.38, t: 9.8, w: 15.625, h: 71.387 };
const RAIL = { x: 75.88, y: 16.62, k: -0.0631 };
const railY = (x: number) => RAIL.y + (x - RAIL.x) * RAIL.k;

/** One outfit on one hanger. `cx` is where its hook sits along the rail, `hook`
 *  how far down its own PNG the bar crosses the hook — 30% of the way down it,
 *  inside the curve of the crook, not through the straight stem below, which is
 *  what makes a hanger look hung rather than hovering. Each is worn by one or more
 *  editions of the doll: while she is wearing it, it is gone from the rail.
 *
 *  A garment on a hanger is nearly as wide as the wardrobe itself, and on a
 *  full rail they overlap almost completely — each one shows a sliver and the
 *  outer two run behind the side walls. So they are drawn at their real width
 *  inside a box clipped to the wardrobe opening, rather than shrunk to fit. */
const HANGER_W = 18.515;
const RAIL_BOX = { l: 73.79, t: 13.0, w: 13.7, h: 38.5 };
const OUTFITS = [
  // Onesie behind, nudged right so its wide body is not clipped at the opening;
  // the day outfit sits one layer above it.
  { key: "morning", src: "morning", label: "First Coffee", meta: "Cardigan · Pyjamas", cx: 77.84, aspect: 1.5071, hook: 0.0565, tilt: 1.6, dy: -0.33 },
  { key: "night",   src: "night",   label: "Lights Out",  meta: "The onesie",        cx: 79.74, aspect: 1.7602, hook: 0.0363, tilt: -1.1, dy: -0.5 },
  { key: "day",     src: "day",     label: "Deep Work",   meta: "Flannel · Jeans",   cx: 81.64,  aspect: 1.5071, hook: 0.0442, tilt: -2.4, dy: -0.5 },
  { key: "street",  src: "street",  label: "Urban Explorer", meta: "Raincoat · Hoodie", cx: 84.74, aspect: 1.5,    hook: 0.0422, tilt: 2.3, dy: -0.67 },
  { key: "evening", src: "evening", label: "One More Page", meta: "Cardigan · Tee",  cx: 86.54,  aspect: 1.5143, hook: 0.0400, tilt: -1.8, dy: -0.17 },
] as const;

/** Which outfit an edition is wearing. The shifts of the working day share the
 *  flannel; the morning ones share the cardigan and pyjamas, and so does
 *  Saturday's series marathon. Anything not listed — the cleaning
 *  dungarees — has no hanger in this wardrobe. */
function outfitOf(edition: string): string | null {
  if (edition === "office" || edition.startsWith("work_") || edition === "mon_standup" || edition === "fri_wine") return "day";
  if (edition.startsWith("morn") || edition === "morning" || edition === "mon_alarm" || edition === "weekend_brunch") return "morning";
  if (edition === "night") return "night";
  if (edition === "street" || edition.startsWith("fri_transition")) return "street";
  if (edition === "evening") return "evening";
  if (edition === "weekend_series") return "morning";
  return null;
}

/** The folded throws, the clothes on the rail and their slips. The rail runs
 *  on `edition` (the one the niche shows), so it changes together with the
 *  doll. Memoised: home's clock ticks every half minute and the rail has no
 *  reason to redraw for it. */
function Wardrobe({ edition }: { edition: string }) {
  // Which hanger is being lifted off the rail, if any.
  const [pulled, setPulled] = useState<string | null>(null);
  // The hangers overlap almost completely, so hover is decided by the pixels
  // under the pointer: the topmost garment with cloth there wins. Each PNG's
  // alpha is sampled once, at a quarter size, into a mask.
  const railBox = useRef<HTMLDivElement>(null);
  const hangerImgs = useRef<(HTMLImageElement | null)[]>([]);
  const hangerMasks = useRef<({ w: number; h: number; a: Uint8ClampedArray } | null)[]>([]);
  const sampleHanger = (i: number, img: HTMLImageElement) => {
    if (hangerMasks.current[i] || !img.naturalWidth) return;
    const w = Math.max(1, Math.round(img.naturalWidth / 4));
    const h = Math.max(1, Math.round(img.naturalHeight / 4));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const a = new Uint8ClampedArray(w * h);
    for (let k = 0; k < a.length; k++) a[k] = d[k * 4 + 3];
    hangerMasks.current[i] = { w, h, a };
  };
  const worn = outfitOf(edition);

  return (
    <>
      {/* The folded throws, back on the shelf they were taken off. The shelf's
          front edge is not level — it drops 0.2583 %y per %x as the wardrobe
          comes towards the camera — so the stack is seated on the line under
          its own centre: at 82.45% across, that edge is at 67.31% down, which
          is where its bottom goes. It runs the full width of the shelf and a
          little past it, the way a folded fleece actually sits. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/items/right-2-blanket.webp"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: "74.88%",
          // Four pixels below the computed line: the stack reads as resting
          // on the shelf rather than hovering a hair above it.
          top: "54.0%",
          width: "13.9%",
          height: "auto",
          maxWidth: "none",
          filter: "brightness(0.9) saturate(0.95)",
          // Above the hanging clothes (their container is zIndex 3) so the
          // folded throw sits in front of the onesie's hem.
          zIndex: 4,
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* The clothes themselves, clipped to the wardrobe opening so the
          outer hangers run behind the side walls exactly as they do in the
          photograph. Nothing here takes the pointer — the hit strips below
          do that, because five overlapping sleeves would otherwise steal each
          other's hover. */}
      <div
        ref={railBox}
        aria-hidden
        style={{
          position: "absolute",
          left: `${RAIL_BOX.l}%`,
          top: `${RAIL_BOX.t}%`,
          width: `${RAIL_BOX.w}%`,
          height: `${RAIL_BOX.h}%`,
          // The bottom is open so a long hem runs past the opening, and the
          // LEFT side is let out by 2.2% of the case — 16.1% of this box — so
          // the first sleeve breaks the line of the wardrobe's wall instead
          // of being sliced off flush against it. Only the left: the right
          // wall is the outer edge of the case, and cloth hanging past that
          // floats over the backdrop with nothing behind it. Bounded rather
          // than free — past about three percent the flannel starts hanging
          // over the middle compartment, which reads as a mistake.
          clipPath: "inset(0 -8% -200% -30%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        {OUTFITS.map((o, i) => {
          // A percentage of the box's width is 1.5x as much of its height,
          // the box being 3:2 — so this is the hanger's own height in the
          // suitcase box's terms, and `hook` says how far down its PNG the
          // crook of the hook sits, which is what lands on the rail.
          const h = HANGER_W * o.aspect * 1.5;
          // +0.35% of the case: the crooks were sitting a hair above the bar.
          const top = railY(o.cx) - o.hook * h + 0.35 + o.dy;
          return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={o.key}
              ref={(el) => {
                hangerImgs.current[i] = el;
                if (el?.complete) sampleHanger(i, el);
              }}
              onLoad={(e) => sampleHanger(i, e.currentTarget)}
              src={`/items/wardrobe/right-rail-${o.src}.webp`}
              alt=""
              style={{
                position: "absolute",
                left: `${((o.cx - HANGER_W / 2 - RAIL_BOX.l) / RAIL_BOX.w) * 100}%`,
                top: `${((top - RAIL_BOX.t) / RAIL_BOX.h) * 100}%`,
                width: `${(HANGER_W / RAIL_BOX.w) * 100}%`,
                height: "auto",
                // Tailwind's preflight caps images at max-width:100%, which
                // would shrink the garment to the width of its container.
                maxWidth: "none",
                // Hung by hand, not by a shop assistant: each hanger sits a
                // degree or two off true, turning about the point where its
                // hook rests on the bar rather than about its own middle.
                transform: pulled === o.key
                  ? `translate(-4%, -1.5%) scale(1.04) rotate(${o.tilt * 0.4}deg)`
                  : `rotate(${o.tilt}deg)`,
                transformOrigin: `50% ${o.hook * 100}%`,
                opacity: worn === o.key ? 0 : 1,
                filter: pulled === o.key
                  ? "brightness(1) drop-shadow(0 4px 9px rgba(0,0,0,0.45))"
                  : "brightness(0.9) saturate(0.95)",
                transition: "transform 220ms cubic-bezier(.2,.7,.3,1), opacity 320ms linear, filter 220ms linear",
              }}
              draggable={false}
            />
          );
        })}
      </div>

      {/* One hit area over the upper rail. Which garment it means is read
          from the masks: walk the hangers from the top layer down, undo each
          one's resting tilt about its hook, and take the first with cloth
          under the pointer. Worn outfits are off the rail and are skipped. */}
      <div
        aria-hidden
        onMouseMove={(e) => {
          const box = railBox.current;
          if (!box) return;
          const r = box.getBoundingClientRect();
          // The scene may be scaled by the desk camera; offset* are unscaled.
          const s = r.width / box.offsetWidth || 1;
          const px = (e.clientX - r.left) / s;
          const py = (e.clientY - r.top) / s;
          let hit: string | null = null;
          for (let i = OUTFITS.length - 1; i >= 0; i--) {
            const o = OUTFITS[i];
            const img = hangerImgs.current[i];
            const m = hangerMasks.current[i];
            if (o.key === worn || !img || !m) continue;
            const ox = img.offsetLeft + img.offsetWidth / 2;
            const oy = img.offsetTop + img.offsetHeight * o.hook;
            const t = (-o.tilt * Math.PI) / 180;
            const dx = px - ox;
            const dy = py - oy;
            const lx = dx * Math.cos(t) - dy * Math.sin(t) + img.offsetWidth / 2;
            const ly = dx * Math.sin(t) + dy * Math.cos(t) + img.offsetHeight * o.hook;
            const u = Math.floor((lx / img.offsetWidth) * m.w);
            const v = Math.floor((ly / img.offsetHeight) * m.h);
            if (u < 0 || v < 0 || u >= m.w || v >= m.h) continue;
            if (m.a[v * m.w + u] > 60) {
              hit = o.key;
              break;
            }
          }
          setPulled((prev) => (prev === hit ? prev : hit));
        }}
        onMouseLeave={() => setPulled(null)}
        style={{
          position: "absolute",
          left: `${RAIL_BOX.l}%`,
          top: "14.5%",
          width: `${RAIL_BOX.w}%`,
          height: "22%",
          zIndex: 4,
        }}
      />

      {/* The same, from the keyboard: one stop per hanger still on the rail,
          on its hook. Focus lifts it and shows its slip, as the pointer does. */}
      {OUTFITS.filter((o) => o.key !== worn).map((o) => (
        <button
          key={o.key}
          type="button"
          className="scene-hit"
          aria-label={`On the rail: ${o.label} — ${o.meta}`}
          onFocus={() => setPulled(o.key)}
          onBlur={() => setPulled(null)}
          style={{
            position: "absolute", left: `${o.cx - 0.9}%`, top: `${railY(o.cx) - 0.9}%`,
            width: "1.8%", height: "4%", zIndex: 4, pointerEvents: "none",
          }}
        />
      ))}

      {/* What the lifted hanger is: the ribbons' hover slip, above its hook */}
      {OUTFITS.map((o) => (
        <span
          key={o.key}
          aria-hidden
          className="hanger-tag"
          data-open={pulled === o.key ? "true" : "false"}
          // Centred over the hook, except near the case's right edge, where
          // it would run off the page: there it ends flush with the wall.
          style={o.cx > 83
            ? { left: `${WARDROBE.l + WARDROBE.w}%`, top: `${railY(o.cx) - 1.2}%`, transform: "translate(-100%, -100%)" }
            : { left: `${o.cx}%`, top: `${railY(o.cx) - 1.2}%` }}
        >
          {o.label} · {o.meta}
        </span>
      ))}
    </>
  );
}

export default memo(Wardrobe);
