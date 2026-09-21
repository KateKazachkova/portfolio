"use client";

import Link from "next/link";
import { useEffect } from "react";
import { mono } from "@/components/ui/type";
import { InkButton } from "@/components/ui/InkButton";

/**
 * 404 — the Error Edition.
 *
 * Every other page keeps the doll inside something: the suitcase on home, the
 * spec sheet on /about, the inspection card on /recognition. This is the only
 * page where she stands on the sweep with no packaging around her — which is
 * what a missing page is, an item with no box — and the only edition that is
 * not on the clock. You cannot ask for this one; it is issued when a link
 * breaks, so she turns up in costume, holding the error herself.
 *
 * The studio plate and the floor geometry are the home page's, so the floor
 * line here is the floor line the suitcase stands on.
 */

/** The Error Edition — the only doll on the site you cannot ask for. Every
 *  other edition is on a clock; this one exists solely because something
 *  broke, which makes it the rarest unit in the collection and the only one
 *  wearing a costume. 900px tall WebP; the full-size cutout it came from sits
 *  beside the others in /dolls/cut.
 *
 *  The canvas is wider than she is on purpose. Both poses were cut to her
 *  standing silhouette, which meant the airborne one — tail swung out one way,
 *  the sign the other — ran off both edges and lost the end of its tail. Both
 *  sheets are now padded by the same amount on each side, so she stays centred
 *  and the two still register on the head; the extra width is empty. */
const DOLL = { w: 520, h: 900 };
/** Two frames of her, aligned on the head so only the legs change when they
 *  swap: standing, and airborne with the knees drawn up. The landing crouch
 *  the model refused to draw is done in CSS instead, as squash on impact. */
const POSES = {
  stand: "/dolls/cut/web/error.webp",
  air:   "/dolls/cut/web/error_air.webp",
};

/** The obstacles, each cut separately from its own studio frame. Heights are
 *  percentages of HER height — the tall one is deliberately shorter than the
 *  top of her arc, and the boulders are taller than the tallest cactus so they
 *  can hide one completely. */
const CACTI = [
  { src: "/dolls/cut/web/cactus.webp",      w: 175, h: 260, ht: 17.5 },
  { src: "/dolls/cut/web/cactus_low.webp",  w: 251, h: 170, ht: 11 },
  { src: "/dolls/cut/web/cactus_tall.webp", w: 101, h: 430, ht: 21 },
];
// The clip band is inset horizontally only, so it is as tall as the column and
// every vertical percentage above still means what it did.

/** The wings. They stand nearer the camera than the cacti, so a cactus slides
 *  out from behind the right-hand boulder and disappears behind the left one:
 *  the scene gets an entrance and an exit instead of things blinking into
 *  existence at the edge of an empty sweep. */
const ROCKS = [
  // Both must out-top the tallest cactus, or it is seen being clipped in mid
  // air above them. Measured: the tall cactus reaches 149px up a 553px column,
  // so the wide boulder went from 18 to 27 (it topped out at 116px and the
  // plant was sliced clean off above it). Growing it also widened it, hence
  // the push further left — it must not sit on top of her.
  { src: "/dolls/cut/web/rock_wide.webp", w: 347, h: 220, ht: 27, side: "left"  as const, off: -24 },
  { src: "/dolls/cut/web/rock_tall.webp", w: 167, h: 220, ht: 30, side: "right" as const, off: -5 },
];

/** Her floor, measured off the cutout's own alpha rather than guessed. The
 *  frame has TWO things standing on the ground at different depths — the
 *  slippers touch down at 99% of the image height (x 38.0-65.8% since the
 *  canvas was widened for the tail), the cactus further back at 93.5% — and
 *  the generated frame carries no shadow at all, so without these both float.
 *
 *  Percentages are of the IMAGE, not of the column, which is why the shadows
 *  live in a wrapper that matches the image exactly. The key light is the home
 *  page's, upper left, so every layer leans down and right of its object. */
const FLOOR = [
  // Three layers, all under her feet and nowhere else — a pool around the
  // whole doll reads as fog, not as contact. Softest and palest first, then
  // tighter and darker, so the shadow has a dense core with a real edge.
  // cx and w are re-mapped by 877/1301 — the box is wider than it was, so the
  // same shadow in the same place is a smaller share of it. Vertical values
  // are untouched: the canvas only grew sideways.
  { cx: 51.3, bottom: -0.7, w: 39.1, h: 4.4, rgb: "44,38,63", a: 0.16, blur: 15, stop: 66 },
  { cx: 51.3, bottom: 0.0,  w: 28.3, h: 2.9, rgb: "32,26,46", a: 0.30, blur: 7,  stop: 64 },
  { cx: 51.3, bottom: 0.4,  w: 18.9, h: 1.8, rgb: "26,20,40", a: 0.55, blur: 3,  stop: 62 },
];

/** One layer of the floor shadow, in its parent's percentage space. Penumbra
 *  grows with distance from the contact point, so a real point of contact is
 *  dark and tight while anything further back is pale and soft — the same rule
 *  the suitcase stands on. `stop` is where the gradient reaches zero. */
function Shadow({ cx, bottom, w, h, rgb, a, blur, stop }: {
  cx: number; bottom: number; w: number; h: number;
  rgb: string; a: number; blur: number; stop: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${cx}%`,
        bottom: `${bottom}%`,
        transform: "translateX(-50%)",
        width: `${w}%`,
        height: `${h}%`,
        background: `radial-gradient(ellipse at center, rgba(${rgb},${a}), rgba(${rgb},0) ${stop}%)`,
        filter: `blur(${blur}px)`,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default function NotFound() {
  // Same product-shot treatment as home: this page gets the studio sweep,
  // every other route stays flat paper.
  useEffect(() => {
    document.documentElement.setAttribute("data-scene", "studio");
    return () => document.documentElement.removeAttribute("data-scene");
  }, []);

  // The run speeds up the longer you stay, the way the real game does.
  //
  // One rate for all five animations, applied through updatePlaybackRate():
  // the tracks and the jump are only in step because they share a clock, so
  // anything that changes the tempo has to change it for every one of them in
  // the same tick. updatePlaybackRate also hands over smoothly — setting
  // .playbackRate directly jumps the phase, which would land her on a cactus.
  //
  // It caps at 2×. Past that the scene stops being something you notice out of
  // the corner of your eye while reading the tag, and starts being something
  // you have to wait out. Reduced motion has no animations to collect, so this
  // quietly does nothing there.
  useEffect(() => {
    const RAMP_MS = 45_000;
    const MAX_RATE = 2;
    let stop = false;
    let timer = 0;

    const collect = (tries = 0): Animation[] => {
      const found = [...document.querySelectorAll(
        ".err-track, .err-doll, .err-squash, .err-ground, .err-pose-stand, .err-pose-air")]
        .flatMap((el) => el.getAnimations());
      if (found.length === 0 && tries < 5) {
        window.setTimeout(() => !stop && run(collect(tries + 1)), 120);
        return [];
      }
      return found;
    };

    const run = (anims: Animation[]) => {
      if (stop || anims.length === 0) return;
      const t0 = performance.now();
      timer = window.setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / RAMP_MS);
        const rate = 1 + (MAX_RATE - 1) * k;
        for (const a of anims) {
          if (typeof a.updatePlaybackRate === "function") a.updatePlaybackRate(rate);
          else a.playbackRate = rate;
        }
        if (k >= 1) window.clearInterval(timer);
      }, 400);
    };

    run(collect());
    return () => { stop = true; window.clearInterval(timer); };
  }, []);

  const SPECS: [string, string][] = [
    ["MODEL", "KATE™"],
    ["CAT. NO.", "404"],
    ["STATUS", "NOT FOUND"],
    ["EDITION", "Uncatalogued · 1 of 1"],
    ["AVAILABILITY", "Not for sale"],
    ["NEXT MOVE", "return to the collection"],
  ];

  return (
    <main
      className="min-h-screen px-6 pb-20"
      // Painted, not transparent — <main> is what the plate multiplies onto —
      // and started behind the 56px header so the studio runs under it.
      // (Both explained at length on the home page.)
      // `clip`, not `hidden`: the sweep is deliberately wider than the viewport
      // and would otherwise push a horizontal scrollbar onto every visitor.
      // `hidden` would also turn this into a scroll container and cut the
      // plate's vertical bleed; `clip` only trims the overhang.
      style={{ background: "var(--bg)", marginTop: -56, paddingTop: 56 + 48, overflowX: "clip" }}
    >
      <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row md:items-end md:gap-14 gap-8">

        {/* The sweep belongs to the whole scene, not to the doll's own box:
            the plate is `max(100vw, 240%)` wide, so inside a 340px column its
            right-hand edge lands mid-page and rules a hard line down it. Hung
            here it is wider than the viewport in every direction and the only
            edges left are the masked ones. Its horizon sits at 64.2% of this
            wrapper — roughly her hip, which is where a real sweep's curve is
            for a standing figure. */}
        <div className="studio-plate" aria-hidden />

        {/* ── The unit ──────────────────────────────────────────────────── */}
        <div
          className="relative shrink-0 mx-auto md:mx-0"
          // Held back on a phone: she stacks above the text there, and much
          // wider than this she pushes the headline — the part somebody who
          // mistyped a URL actually needs — below the fold.
          style={{ width: "clamp(190px, 46vw, 415px)", aspectRatio: "3 / 4" }}
        >
          {/* She and her floor share one box, sized to her cutout, so the
              shadows sit in her own percentages whatever the column does. */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "7.6%",
              height: "81%",
              aspectRatio: `${DOLL.w} / ${DOLL.h}`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="err-ground" style={{ position: "absolute", inset: 0 }}>
              {FLOOR.map((f, i) => <Shadow key={i} {...f} />)}
            </div>

            <div className="err-doll absolute inset-0">
              <div className="err-squash absolute inset-0" style={{ zIndex: 2 }}>
                {([["stand", POSES.stand], ["air", POSES.air]] as const).map(([k, src]) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={k}
                    className={`err-pose-${k} absolute inset-0 w-full h-full`}
                    src={src}
                    alt={k === "stand"
                      ? "The doll in a plush dinosaur onesie, holding a cardboard sign that reads 404"
                      : ""}
                    aria-hidden={k === "air" || undefined}
                    width={DOLL.w}
                    height={DOLL.h}
                    style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.22))" }}
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* The obstacles. Measured on the page, the boulders stand at -7%..23.7%
              and 80.4%..105% of the column, so the cacti are clipped to a band
              that ends inside solid stone at each side: a cactus crosses the clip edge while
              it is behind solid stone, which is what makes it look like it went
              behind the rock rather than simply stopping. Without this they park
              off the left edge of the column in plain sight between runs.

              Each track spans the band and slides; every cactus is centred on its
              track's left edge, so all three cross her at the same instant
              whatever their width. The three tracks share one 18s loop offset by
              6s, which is why a cactus arrives exactly once per jump. */}
          <div style={{ position: "absolute", left: "1%", right: "8%", top: 0, bottom: 0, overflow: "hidden", zIndex: 1 }} aria-hidden>
            {CACTI.map((c, i) => (
              <div
                key={c.src}
                className="err-track"
                style={{ position: "absolute", inset: 0, animationDelay: `${-6 * i}s` }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: "9.9%",
                    height: `${c.ht * 0.81}%`,
                    aspectRatio: `${c.w} / ${c.h}`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <Shadow cx={50} bottom={-2} w={128} h={10} rgb="26,20,40" a={0.4} blur={4} stop={62} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="absolute inset-0 w-full h-full" src={c.src} alt=""
                       width={c.w} height={c.h} style={{ zIndex: 1 }} draggable={false} />
                </div>
              </div>
            ))}
          </div>

          {/* The wings, nearest the camera and never moving. */}
          {ROCKS.map((r) => (
            <div
              key={r.src}
              style={{
                position: "absolute",
                [r.side]: `${r.off}%`,
                bottom: "6.4%",
                height: `${r.ht * 0.81}%`,
                aspectRatio: `${r.w} / ${r.h}`,
                zIndex: 3,
              }}
              aria-hidden
            >
              <Shadow cx={50} bottom={-3} w={122} h={12} rgb="26,20,40" a={0.34} blur={6} stop={64} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="absolute inset-0 w-full h-full" src={r.src} alt=""
                   width={r.w} height={r.h} style={{ zIndex: 1 }} draggable={false} />
            </div>
          ))}
        </div>

        {/* ── The tag ───────────────────────────────────────────────────
            Not a text column but a swing tag: the only paperwork an item with
            no catalogue number still has. Paper stock, a punched hole, a
            clipped corner, hung slightly off square because nobody ties one on
            straight. The hole is a real hole — cut with a mask, so the sweep
            shows through it rather than a painted circle pretending to. */}
        <div className="relative" style={{ zIndex: 4 }}>
          <div style={{ filter: "drop-shadow(0 14px 22px rgba(30,24,16,0.22))" }}>
            <div
              style={{
                background: "var(--panel)",
                border: "1px solid var(--hairline)",
                padding: "30px 30px 30px 34px",
                maxWidth: 480,
                transform: "rotate(-1.05deg)",
                // clipped top-left corner, and the punched hole below it
                clipPath: "polygon(0 26px, 26px 0, 100% 0, 100% 100%, 0 100%)",
                WebkitMaskImage: "radial-gradient(circle 8px at 30px 34px, transparent 0 8px, #000 8.8px)",
                maskImage: "radial-gradient(circle 8px at 30px 34px, transparent 0 8px, #000 8.8px)",
              }}
            >
              <p
                style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.22em", marginLeft: 30 }}
                className="uppercase mb-5"
              >
                <span style={{ color: "var(--accent-red)" }}>Error 404</span>
                <span style={{ color: "var(--muted)" }}> · KATE™ Archive</span>
              </p>

              <h1
                className="text-2xl md:text-3xl font-black uppercase tracking-tight"
                style={{ color: "var(--fg)", letterSpacing: "-0.01em", lineHeight: 1.06 }}
              >
                This one never<br />made the catalogue.
              </h1>

              <p className="text-sm md:text-base leading-snug mt-3.5" style={{ color: "var(--muted)" }}>
                You’ve reached an edition that doesn’t exist. Kate is still here — this
                particular version isn’t. No stock. No reissue. Probably for the best.
              </p>

              {/* the printed side of the tag */}
              <div className="mt-6 pt-1" style={{ borderTop: "1px solid var(--hairline)" }}>
                {SPECS.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 py-2"
                    style={{ borderBottom: "1px solid var(--hairline)" }}
                  >
                    <span
                      style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.15em", color: "var(--muted)" }}
                      className="uppercase pt-0.5"
                    >
                      {k}
                    </span>
                    <span
                      style={{ fontFamily: mono, fontSize: 11.5, color: "var(--fg)" }}
                      className="text-right font-semibold"
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The ways out live off the tag: they are what you do, not what the
              tag says about the item. */}
          <div className="mt-7 flex flex-wrap gap-3">
            <InkButton href="/">← Back to collection</InkButton>
            <Link
              href="/work"
              className="uppercase font-bold transition-colors"
              style={{
                fontFamily: mono, fontSize: 11, letterSpacing: "0.12em",
                padding: "10px 16px", border: "2px solid var(--border)", color: "var(--fg)",
              }}
            >
              View the case files →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
