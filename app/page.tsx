"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import InkTip from "@/components/InkTip";
import NicheDoll, { hasNicheClip } from "@/components/NicheDoll";
import NicheLight from "@/components/NicheLight";
import KateTalk from "@/components/KateTalk";
import PocketWatch from "@/components/PocketWatch";
import HeroAside from "@/components/HeroAside";
// import IntroOverlay from "@/components/IntroOverlay"; // opening hidden for now
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour, editionForDate, daytimeForEdition } from "@/lib/time";
import { mono } from "@/components/ui/type";
import DaySticky from "@/components/DaySticky";
import { DeskPlanes, useDeskCamera } from "@/components/DeskScene";

// Animated (transparent WebM) doll per edition; falls back to the static cutout.
// office video disabled for now — it shows the old (pre-v2) doll; regenerate from the v2 cut later.
const EDITION_VIDEO: Record<string, string> = {};

/** The start of an edition's range, for the schedule column. Ranges are
 *  written loosely in lib/time.ts ("07:30–08:15", "10–13", "Mon 09–10"), so
 *  normalise: keep any day prefix, take the opening time, pad a bare hour.
 *  Nothing is invented here — every time on screen comes from EDITIONS. */
function startOfRange(range: string): string {
  const m = range.match(/^([A-Za-z]{3}\s+)?(.+)$/);
  const day = m?.[1]?.trim();
  const from = (m?.[2] ?? range).split(/[–-]/)[0].trim();
  const time = /^\d{1,2}$/.test(from) ? `${from.padStart(2, "0")}:00` : from;
  return day ? `${day} ${time}` : time;
}

/** One layer of the floor shadow, placed in the suitcase box's own percentage
 *  space so it stays pinned to the case at any size. `stop` is where the
 *  gradient reaches zero — lower values hold the shadow dense before it falls
 *  off, which is what gives a contact shadow an edge. */
function Shadow({ cx, bottom, w, h, rgb, a, blur, stop }: {
  cx: number; bottom: number; w: number; h: number;
  rgb: string; a: number; blur: number; stop: number;
}) {
  return (
    <div
      aria-hidden
      className="case-shadow"
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

/** The award's cubby, in the suitcase box's own percentages. The clip was cut
 *  from exactly this rectangle, so it goes back at exactly these numbers. */
const AWARD_CUBBY = { l: 27.214, t: 11.182, w: 11.686, h: 26.318 };

/** A strip of the case's own pixels, re-drawn on top of the clip.
 *
 *  A generated clip can never register with the case to the pixel — the model
 *  redraws the woodwork it was given, and a frame or two of drift shows up
 *  exactly where the clip's edge meets the real case. Rather than chase that,
 *  these strips lay the case back over its own borders: the background is
 *  open2 scaled to the whole suitcase box and offset so each strip shows the
 *  very pixels it covers, which is why it cannot disagree with what is beneath
 *  it. `l/t/w/h` are the strip's rectangle in the SUITCASE BOX's percentages;
 *  the element is positioned inside the cubby, hence the conversion.
 *
 *  The background-position maths: with the image scaled to the whole box, the
 *  percentage CSS wants is l / (100 - w), because a percentage position aligns
 *  that point of the image with the same point of the element. */
function CaseInlay({ l, t, w, h }: { l: number; t: number; w: number; h: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${((l - AWARD_CUBBY.l) / AWARD_CUBBY.w) * 100}%`,
        top: `${((t - AWARD_CUBBY.t) / AWARD_CUBBY.h) * 100}%`,
        width: `${(w / AWARD_CUBBY.w) * 100}%`,
        height: `${(h / AWARD_CUBBY.h) * 100}%`,
        backgroundImage: "url(/suitcase/open2.webp)",
        backgroundSize: `${10000 / w}% ${10000 / h}%`,
        backgroundPosition: `${(l / (100 - w)) * 100}% ${(t / (100 - h)) * 100}%`,
        pointerEvents: "none",
      }}
    />
  );
}

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
 *  editions of the doll: while she is wearing it, it is gone from the rail. */
/** A garment on a hanger is nearly as wide as the wardrobe itself, and on a
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

/** Where the box can be, in the suitcase box's own percentages. It starts on
 *  the top-left shelf (home, which alone has the shelf lip laid over its base)
 *  and, each time it is charged, jumps to the next — the wardrobe by the folded
 *  throws, the case lid, the foot of the left door — and round again. */
const TARDIS_SPOTS: { left: number; top: number; width: number; home?: boolean; behind?: boolean; z?: number }[] = [
  { left: 14.9, top: 17.3, width: 5.1, home: true },
  // Beside the folded throws: the stack is drawn at zIndex 4, so the box needs
  // to sit above it or it lands behind the fleece.
  { left: 84.18, top: 58.0, width: 5.1, z: 5 },
  { left: 56.88, top: 1.0, width: 4.4, behind: true },
  { left: 15.0, top: 76.5, width: 5.1 },
];

/** The model police box. Pointing at it lights a blue glow and the box pulses
 *  in and out of transparency, then it fades away to nothing and rematerialises
 *  at the next spot on the list — round and round. (Sound comes later.) */
function TardisModel() {
  const [phase, setPhase] = useState<"idle" | "charging" | "gone" | "returning">("idle");
  const [spot, setSpot] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function trigger() {
    if (phase !== "idle") return;
    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    setPhase("charging");
    push(() => setPhase("gone"), 1200);
    push(() => {
      setSpot((i) => {
        let n = i;
        while (n === i) n = Math.floor(Math.random() * TARDIS_SPOTS.length);
        return n;
      });
      setPhase("returning");
    }, 2100);
    push(() => setPhase("idle"), 2900);
  }

  const s = TARDIS_SPOTS[spot];
  const base = "brightness(0.94) drop-shadow(0 5px 6px rgba(0,0,0,0.38))";
  const imgStyle: React.CSSProperties =
    phase === "charging"
      ? { animation: "tardis-charge 1.2s ease-in-out forwards" }
      : phase === "gone"
        ? { opacity: 0, filter: "brightness(1.3) drop-shadow(0 0 14px rgba(130,190,255,0.9))", transition: "opacity 0.9s ease-in, filter 0.9s ease-in" }
        : phase === "returning"
          ? { opacity: 1, filter: base, transition: "opacity 0.8s ease-out, filter 0.8s ease-out" }
          : { opacity: 1, filter: base };
  const glowOpacity = phase === "charging" ? 0.9 : phase === "gone" ? 0.6 : 0;

  return (
    <>
      <div style={{ position: "absolute", left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, zIndex: s.behind ? 0 : (s.z ?? 2) }}>
        <div className="relative w-full">
          {/* The blue glow behind the box, brightening as it charges and
              lingering a beat after it has gone. Screen blend adds light only. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "-50% -70%",
              background:
                "radial-gradient(ellipse at 50% 52%, rgba(150,205,255,0.95), rgba(95,155,255,0.4) 42%, rgba(95,155,255,0) 70%)",
              opacity: glowOpacity,
              transition: "opacity 0.5s ease",
              mixBlendMode: "screen",
              pointerEvents: "none",
              // On the shelf the glow must not spill into the compartment
              // below — clip it at the box's base so no light bleeds through.
              clipPath: s.home ? "inset(0 0 23% 0)" : undefined,
              zIndex: 0,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/left-1-tardis.png"
            alt="A model police box"
            className="block w-full h-auto relative"
            style={{ ...imgStyle, zIndex: 1 }}
            draggable={false}
          />
        </div>
      </div>
      {/* Hover catcher — a transparent hit area over the box, always on top
          (zIndex 5) so the charge fires even at the spots where the box itself
          sits behind the case and cannot receive the pointer. Matches the
          model's footprint via its aspect ratio. */}
      <div
        aria-hidden
        onMouseEnter={trigger}
        style={{
          position: "absolute",
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: `${s.width}%`,
          aspectRatio: "0.664",
          zIndex: 5,
        }}
      />
    </>
  );
}

export default function Home() {
  const { hour, auto, setHour, setNow, applyAmbient, previewMood } = useTime();
  // Manual mode override — buttons force a specific edition (incl. the
  // weekend ones, which otherwise only show on Saturday). Cleared by the
  // clock / presets / Now.
  const [forced, setForced] = useState<string | null>(null);
  const deskCam = useRef<HTMLDivElement>(null);
  useDeskCamera(deskCam);
  const edition =
    forced ? EDITIONS[forced]
    : hour === null ? EDITIONS.office
    : auto ? editionForDate(new Date())
    : editionForHour(hour);

  const pickHour = (h: number) => { setForced(null); setHour(h); };

  // Home is a product shot: it gets the studio sweep. Every other route stays
  // flat paper, so the box reads as packaging and the documents read as paper.
  useEffect(() => {
    document.documentElement.setAttribute("data-scene", "studio");
    return () => document.documentElement.removeAttribute("data-scene");
  }, []);

  // Match the ambient mood while previewing a forced edition, and hand the
  // page back to the clock the moment the force is dropped or you leave.
  //
  // It used to only paint the forced mood and return early otherwise, which
  // left the page coloured for an edition it was no longer showing: "Now" and
  // the presets clear the force without necessarily changing the hour, so the
  // provider's own effect had no reason to fire and repaint.
  useEffect(() => {
    if (forced) previewMood(daytimeForEdition(forced));
    else applyAmbient();
    return applyAmbient;
  }, [forced, applyAmbient, previewMood]);
  const [videoFailed, setVideoFailed] = useState(false);

  // The award takes her turn when you point at her. The clip was generated
  // straight into this cubby from the very frame the page already shows, so it
  // is opaque and drops onto the case 1:1 — no alpha, no mask — and its first
  // frame IS the still, which is what makes the swap invisible. The still goes
  // transparent underneath rather than staying behind the clip: hovering lifts
  // the InkTip wrapper to z60 to float its label, which would otherwise put the
  // motionless statue back on top of the video.
  const [awardAwake, setAwardAwake] = useState(false);
  // Whether the clip is actually painting yet. The file is not preloaded — it
  // costs a third of a megabyte and most visitors never point at the shelf — so
  // on the first hover there is a moment with no frame to show. The still stays
  // up until `playing` fires, otherwise the cubby would flash empty.
  const [awardRolling, setAwardRolling] = useState(false);
  // Which hanger is being lifted off the rail, if any.
  const [pulled, setPulled] = useState<string | null>(null);
  const awardClip = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = awardClip.current;
    if (!v) return;
    if (awardAwake && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.currentTime = 0;
      // A hover that ends before the file is ready aborts this play(), which
      // rejects; that is the normal way out, not an error worth reporting.
      void v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
      setAwardRolling(false);
    }
  }, [awardAwake]);

  // The niche shows `shown`, which follows the chosen edition immediately — the
  // clip, the chalk on the back wall and the lamp all run on it. Kept as its own
  // state so the niche and the caption under the case still update from one place.
  const [shown, setShown] = useState(edition.key);
  const staged = useRef(edition.key);

  useEffect(() => {
    if (staged.current === edition.key) return;
    staged.current = edition.key;
    setShown(edition.key);
  }, [edition.key]);

  const dollVideo = EDITION_VIDEO[shown];

  const clockPanel = (
    <div>
      {/* The clock itself is now the pocket watch in the case, so this panel
          keeps only the schedule — a timetable of the hours you can jump the
          doll to, the times taken straight from each edition's own range. */}
      <p
        style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }}
        className="text-gray-400 uppercase text-center mt-8 mb-2"
      >
        Schedule
      </p>
      <div style={{ maxWidth: 260, margin: "0 auto", borderTop: "1px solid var(--hairline)" }}>
        {[
          { title: "Morning", chips: [
            { label: "Alarm", key: "morn_alarm" },
            { label: "Coffee", key: "morning" },
            { label: "Mon Alarm", key: "mon_alarm" },
          ] },
          { title: "Workday", chips: [
            { label: "Standup", key: "work_standup" },
            { label: "Deep Work", key: "office" },
            { label: "Lunch", key: "work_lunch" },
            { label: "Calls", key: "work_calls" },
            { label: "Wrap-Up", key: "work_wrapup" },
          ] },
          { title: "Fri · Mon", chips: [
            { label: "Wine Call", key: "fri_wine" },
            { label: "Closing", key: "fri_transition" },
            { label: "Mon ×2", key: "mon_standup" },
          ] },
          { title: "Evening", chips: [
            { label: "Guitar", key: "evening_guitar" },
            { label: "Reading", key: "evening" },
          ] },
          { title: "Weekend", chips: [
            { label: "Brunch", key: "weekend_brunch" },
            { label: "Cleaning", key: "weekend_cleaning" },
            { label: "Series", key: "weekend_series" },
          ] },
        ].map((group) => (
          <div key={group.title}>
            <p
              style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.18em" }}
              className="text-gray-400 uppercase mt-3 mb-1"
            >
              {group.title}
            </p>
            {group.chips.map((m) => {
              const active = forced === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setForced(m.key)}
                  className="w-full uppercase transition-colors text-left"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "68px 1fr",
                    alignItems: "baseline",
                    gap: 8,
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    padding: "3px 6px",
                    background: active ? "var(--border)" : "transparent",
                    color: active ? "var(--bg)" : "var(--fg)",
                  }}
                >
                  <span style={{ color: active ? "var(--bg)" : "var(--muted)" }}>
                    {startOfRange(EDITIONS[m.key].range)}
                  </span>
                  <span className="font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start gap-4 px-6 pb-3"
      // Painted, not transparent: <main> is the plate's nearest stacking
      // context, so it is what the sweep blends onto. Transparent here and the
      // blend has no backdrop, which shows the raw near-white plate instead.
      //
      // It also starts behind the sticky 56px header rather than below it. The
      // header is transparent until you scroll, and the studio has to run under
      // it — otherwise that strip is flat --bg while everything below it is the
      // plate, and the join reads as a band across the top of the page. The
      // padding puts the content back where it was.
      style={{ background: "var(--bg)", marginTop: -56, paddingTop: 56 + 56 }}
    >

      {/* Suitcase + clock. The box stays centred; on wide screens the clock
          sits to its right (absolute, so the box itself never shifts). */}
      <div className="relative w-full flex flex-wrap justify-center">
      {/* The whole scene — case, clothes, bike, discs, niche — is laid out in
          percentages of this one box, so moving or scaling it moves everything
          together. Nudge it with --case-x / --case-y / --case-scale in
          globals.css rather than touching any item. */}
      {/* select-none only here: dragging the watch hand used to smear a
          selection across the scene. The page's own text stays selectable. */}
      <div className="case-stage select-none" style={{ "--case-x": "130px", marginBottom: -48 } as React.CSSProperties}>
        {/* The studio sweep, anchored to the case so it travels with it, and
            the flat floor that carries its last tone down past the plate. */}
        <div className="studio-floor" aria-hidden />
        <div className="studio-plate" aria-hidden />

        {/* The camera. At night the desk is a room of real planes and Case
            Files moves the camera through it; everything the case holds
            rides in .case-world, the one plane at z = 0, so it moves with the
            desk. In daylight both are inert and the scene is flat as ever. */}
        <div className="scene-cam" ref={deskCam}>
        <DeskPlanes />
        <div className="case-world">

        {/* ── The shadow, in four layers ──────────────────────────────────
            The case does not sit flat on the floor: it stands on the feet at
            the outer bottom corners of the two doors. Measured off open2.png's
            alpha channel, the bottom profile is an arc, not a line — the door
            feet reach 92.9% of the image height (left 8.7-12.3%, right
            85.5-91.7% across), while the trunk's base runs flat at 88.1% from
            26% to 73%. The doors are simply nearer the camera; everything is
            on one floor.

            So the shadow follows two rules from the physics rather than being
            one blob. Penumbra grows with distance from the contact point and
            with the angular size of the light, so a true point of contact is
            dark and sharp while anything lifted away is pale and soft. And a
            recess is dark whatever the key light does, because ambient light
            cannot reach into it.

            Layers, hardest to softest. The key light on the backdrop plate
            comes from the upper left, so every layer leans down and right. */}

        {/* 1. The two feet. Real contact, nearest the camera: tightest blur,
               darkest value, and the only layer with a visible edge. */}
        <Shadow cx={11.6} bottom={6.3} w={10} h={1.9} rgb="26,20,40" a={0.62} blur={4} stop={62} />
        <Shadow cx={90.4} bottom={5.9} w={15} h={2.3} rgb="26,20,40" a={0.62} blur={4} stop={62} />

        {/* 2. The trunk's base — a long edge further back, so a wider penumbra
               and less of it. */}
        <Shadow cx={50} bottom={10.4} w={52} h={3.0} rgb="44,38,63" a={0.34} blur={11} stop={70} />

        {/* 3. Ambient occlusion under the whole lifted mass, plus the cast that
               carries onto the floor past the right-hand door. */}
        <Shadow cx={54} bottom={1.0} w={124} h={13} rgb="44,38,63" a={0.22} blur={34} stop={64} />

        {/* No drop-shadow on the case itself. A drop-shadow offsets the whole
            outline uniformly, so it traces the sides and the top as well as
            the base — a thin dark edging that hangs in the air beside the
            doors, where there is nothing for a shadow to fall on. Anything
            above the floor would be cast onto the wall, which is far behind:
            large, faint and displaced, not a line hugging the edge.

            A mirrored, flattened copy of the silhouette laid on the floor was
            tried instead. It read as a smudge rather than a shape — the case
            is wide, near-symmetrical and mostly solid, so compressing it adds
            no information the ellipses do not already carry. The four floor
            layers ground it on their own. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/suitcase/open2.webp"
          alt="Kate's collector suitcase"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          draggable={false}
        />

        {/* The award, in the top-left cubby — and the way in to Recognition.
            The hoverable box is the CUBBY, not the statue's own outline: it is
            the cubby the clip replaces, so one box carries the label, the
            motion and the link, and there is nothing to keep in sync. Its
            numbers are the crop the clip was cut from, 27.214% to 38.900%
            across and 11.182% to 37.500% down of the case box, which is why the
            video lands back on its own woodwork exactly. */}
        <InkTip
          label="The Award"
          meta="“Redesigning the Redesign”"
          place="bottom"
          style={{
            position: "absolute",
            left: "27.214%",
            top: "11.182%",
            width: "11.686%",
            height: "26.318%",
            zIndex: 2,
          }}
          onHoverChange={setAwardAwake}
        >
          <Link
            href="/recognition"
            aria-label="Recognition — the award for Redesigning the Redesign"
            className="block absolute inset-0"
          >
            {/* Shot to match the case, and seated on the shelf rather than
                floating in front of it.

                The camera: the cubby's floor sits at 35.6% of the case box,
                well above the plate's horizon, so we look UP at anything
                standing on it — which is why the case shows the undersides of
                its shelves. The first trophy was photographed from above (the
                top of its plinth was an open ellipse) and read as pasted on. It
                was re-shot from below: the base mouldings curve upward, the
                plinth's top face is hidden, the plaque tips slightly back. A
                CSS rotateX was tried first and rejected — a 2D warp only
                foreshortens the image, it cannot open those ellipses, so it
                read as the figure shrinking rather than the plinth turning.

                The occlusion: shooting from below leaves the underside of the
                base showing as a downward bulge, and an object standing on a
                shelf can never show that — the shelf's front lip cuts across
                it. So the PNG is cropped near the base's widest row, 1354px
                down to 1286 — a touch past the bottom ring's side tangents — so
                what is left ends in a straight line, and that line is the lip.

                The placement is given inside the cubby box rather than the case
                box: 14.86% across and 22.00% down of it, 72.74% of its width.
                That puts the base at 35.18% of the case box, just above the
                shelf's front lip, so the bottom ring reads as tucked behind the
                wood rather than resting on top of it.

                The light: ambient light cannot reach into a recess, hence the
                brightness and saturation taken off and the warm cast, matching
                the dark wood it stands in. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/items/mid-top-trophy.png"
              alt=""
              style={{
                position: "absolute",
                left: "14.96%",
                top: "22.00%",
                width: "72.74%",
                height: "auto",
                filter:
                  "brightness(0.84) saturate(0.90) sepia(0.08) drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 7px 10px rgba(0,0,0,0.32))",
                opacity: awardAwake && awardRolling ? 0 : 1,
                transition: "opacity 120ms linear",
              }}
              draggable={false}
            />

            {/* Her clip fills the box it was cut from, so every edge of the
                woodwork lands on itself. `fill`, not `cover` — the element
                already carries the crop's aspect, and a cover crop would shave
                a little off and break the alignment it is here to keep. It
                never takes the pointer: the link around it is the target, and
                the clip must not shadow its own hover. */}
            {/* The filename carries a version: the first clip was shot before
                the statue was raised, so a browser holding it in cache would
                keep playing a take that sits three pixels low. */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={awardClip}
              src="/items/mid-top-trophy-turn.mp4"
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              onPlaying={() => setAwardRolling(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                opacity: awardAwake && awardRolling ? 1 : 0,
                transition: "opacity 120ms linear",
                pointerEvents: "none",
              }}
            />

            {/* The clip's own borders, covered by the case itself: the top of
                the cubby, both side walls and the shelf lip. Each strip sits
                clear of the statue — the still ends at 35.19% and the lip strip
                starts at 35.5% — so they only ever hide woodwork. */}
            <CaseInlay l={27.214} t={11.182} w={11.686} h={1.2} />
            <CaseInlay l={27.214} t={35.5} w={11.686} h={2.0} />
            <CaseInlay l={27.214} t={11.182} w={1.0} h={26.318} />
            <CaseInlay l={37.9} t={11.182} w={1.0} h={26.318} />
          </Link>
        </InkTip>

        {/* ── The wardrobe ──────────────────────────────────────────────
            One hanger per outfit: the case now ships with an empty wardrobe,
            so there is no plate to cover baked-in clothes. The hangers are what
            the doll actually wears, so each one vanishes while she has it on.
            The rail runs on `shown`, so it changes together with the doll. */}

        {/* The folded throws, back on the shelf they were taken off. The shelf's
            front edge is not level — it drops 0.2583 %y per %x as the wardrobe
            comes towards the camera — so the stack is seated on the line under
            its own centre: at 82.45% across, that edge is at 67.31% down, which
            is where its bottom goes. It runs the full width of the shelf and a
            little past it, the way a folded fleece actually sits. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/right-2-blanket.png"
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
          {OUTFITS.map((o) => {
            // A percentage of the box's width is 1.5x as much of its height,
            // the box being 3:2 — so this is the hanger's own height in the
            // suitcase box's terms, and `hook` says how far down its PNG the
            // crook of the hook sits, which is what lands on the rail.
            const h = HANGER_W * o.aspect * 1.5;
            // +0.35% of the case: the crooks were sitting a hair above the bar.
            const top = railY(o.cx) - o.hook * h + 0.35 + o.dy;
            const worn = outfitOf(shown) === o.key;
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={o.key}
                src={`/items/wardrobe/right-rail-${o.src}.png`}
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
                  opacity: worn ? 0 : 1,
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

        {/* One narrow hit strip per outfit, touching its neighbours without
            overlapping them, so the rail can be read left to right. */}
        {OUTFITS.map((o, i) => {
          const worn = outfitOf(shown) === o.key;
          const strip = { l: 76.3 + i * 2.3, w: 2.3, t: 14.5, h: 22.0 };
          return (
            <div
              key={o.key}
              aria-hidden
              onMouseEnter={() => setPulled(o.key)}
              onMouseLeave={() => setPulled((prev) => (prev === o.key ? null : prev))}
              style={{
                position: "absolute",
                left: `${strip.l}%`,
                top: `${strip.t}%`,
                width: `${strip.w}%`,
                height: `${strip.h}%`,
                zIndex: 4,
                pointerEvents: worn ? "none" : "auto",
              }}
            />
          );
        })}

        {/* Figma sticker on the top drawer → Figma community profile */}
        <InkTip
          label="Figma"
          meta="@uxui_kazachkova"
          place="top"
          className="group"
          style={{ position: "absolute", left: "28.2%", top: "50.3%", width: "3.9%", height: "5.9%", zIndex: 4 }}
        >
          <a
            href="https://www.figma.com/@uxui_kazachkova"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Figma — @uxui_kazachkova"
            className="block w-full h-full"
            style={{ borderRadius: 9 }}
          >
            <span
              aria-hidden
              className="block w-full h-full rounded-lg ring-0 transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-[#A259FF]/70 group-hover:shadow-[0_6px_16px_rgba(162,89,255,0.45)]"
            />
          </a>
        </InkTip>

        {/* The top-left shelf's wooden front lip — Kate's own cut of the case,
            template-matched back onto it (corr 0.93) so it lands where it came
            from. It rides above whatever stands on the shelf (zIndex 3), so
            every item's base tucks behind the shelf. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-1-shelf-lip1.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            left: "10.254%",
            top: "26.953%",
            width: "14.29%",
            height: "auto",
            maxWidth: "none",
            zIndex: 3,
            pointerEvents: "none",
          }}
          draggable={false}
        />

        {/* The middle shelf's front lip, same cut, same treatment. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-2-shelf-lip1.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            left: "10.221%",
            top: "42.529%",
            width: "14.323%",
            height: "auto",
            maxWidth: "none",
            zIndex: 3,
            pointerEvents: "none",
          }}
          draggable={false}
        />

        {/* The left door's top shelf: books where the box sets used to stand,
            in two stacks with the TARDIS between them. Both are set by their
            BASE, not their top — the shelf board is at 28.3% and the spines
            are different heights, so a shared `top` would leave one of them
            floating. Their bottoms run a little past the board, under the
            shelf lip above them (zIndex 3). They carry no label: the shelf is
            a thing to notice, not a list to read. */}
        <div
          className="group"
          style={{ position: "absolute", left: "10.25%", top: "14.45%", width: "5.5%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/left-1-books-a.webp"
            alt="Books standing on a shelf: Sapiens, IT and Animal Farm"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "brightness(0.9) saturate(0.95) drop-shadow(0 4px 5px rgba(0,0,0,0.45))" }}
            draggable={false}
          />
        </div>

        <div
          className="group"
          style={{ position: "absolute", left: "18.9%", top: "14.9%", width: "5%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/left-1-books-b.webp"
            alt="Books standing on a shelf: W.I.T.C.H. volumes one to three and The Little Prince"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "brightness(0.9) saturate(0.95) drop-shadow(0 4px 5px rgba(0,0,0,0.45))" }}
            draggable={false}
          />
        </div>

        {/* The TARDIS — starts on the left door's top shelf and jumps between
            spots on each charge. Placement and glow live in the component
            (see TARDIS_SPOTS); the shelf lip above is its own element. */}
        <TardisModel />

        {/* The gold pocket watch, hung off the free left end of the wardrobe
            rail, in front of the coats — it both tells and (by dragging the
            hands) sets the scene's hour. The chain's bow sits just above the
            brass bar (railY(79) = 16.42%), so it reads as hung, not floating. */}
        <div style={{ position: "absolute", left: "84.75%", top: "6.6%", width: "10%", zIndex: 4 }}>
          <PocketWatch hour={hour ?? 12} onChange={pickHour} />
        </div>

        {/* Today's plan on a sticky note, pressed to the wardrobe wall under
            the watch — the schedule that used to live in a panel beside the
            case, now an object in it. Tapping a line jumps the doll to that
            edition, which is what the old chips did. */}
        <div style={{ position: "absolute", left: "87.5%", top: "36%", width: "13.65%", zIndex: 5 }}>
          <DaySticky hour={hour} active={forced} onPick={setForced} />
        </div>

        {/* Left door — middle shelf: the VHS tapes. The row is the width of
            the shelf, like the box sets above it, and its base runs under the
            shelf's front lip (zIndex 3) so the tapes stand on the board rather
            than in front of it. */}
        <div
          className="group"
          style={{ position: "absolute", left: "10.24%", top: "31.54%", width: "13.6%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/left-2-vhs.webp"
            alt="A shelf of VHS tapes: The 10th Kingdom, Are You Afraid of the Dark?, Goosebumps, Harry Potter, The Lord of the Rings, The X-Files, Supernatural, Jumanji, IT, The Silence of the Lambs, The Princess Bride, Stargate"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>

        {/* The bike's own shadow on the back wall: the same picture again,
            offset down and to the right of the light, flattened to black and
            blurred. A drop-shadow filter could not do this — it would follow
            the bike when it lifts on hover, and a shadow on a wall does not. */}
        <div
          aria-hidden
          style={{ position: "absolute", left: "57.9%", top: "18.5%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4, pointerEvents: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-bike.webp"
            alt=""
            className="w-full h-auto"
            style={{ filter: "brightness(0) blur(4px)", opacity: 0.5 }}
            draggable={false}
          />
        </div>

        {/* A second pass, displaced almost straight down. The wide one slides
            along the bars — they run down and to the right, the same way the
            light throws the shadow, so it hides behind them — and the bike
            loses its shadow exactly where it meets the wood. */}
        <div
          aria-hidden
          style={{ position: "absolute", left: "56.8%", top: "19.3%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4, pointerEvents: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-bike.webp"
            alt=""
            className="w-full h-auto"
            style={{ filter: "brightness(0) blur(2px)", opacity: 0.45 }}
            draggable={false}
          />
        </div>

        {/* Right compartment, above the poster: the bicycle hung on the wall. */}
        <div
          className="group"
          style={{ position: "absolute", left: "56.48%", top: "17.16%", width: "17.25%", transform: "rotate(5deg)", transformOrigin: "top center", zIndex: 4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-bike.webp"
            alt="A miniature gravel bike hung by its front wheel in the niche"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            // Colour is baked into the file now, so only the shadow is left.
            style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" }}
            draggable={false}
          />
        </div>

        {/* Where the wheel meets the floor: a contact shadow, dense under the
            tyre and gone within a few pixels, because that is the only part of
            it actually touching the boards. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "59.6%",
            top: "78.4%",
            width: "13%",
            height: "3.2%",
            background: "radial-gradient(ellipse at center, rgba(14,9,5,0.5), rgba(14,9,5,0) 72%)",
            filter: "blur(4px)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "62.4%",
            top: "79.3%",
            width: "7.4%",
            height: "1.7%",
            background: "radial-gradient(ellipse at center, rgba(8,5,2,0.78), rgba(8,5,2,0) 62%)",
            filter: "blur(1.5px)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {/* The other way she gets around, parked on the compartment floor
            under the hung bike — the bike hangs, the wheel stands. Colour is
            baked into the file like the bike's, so only the shadow is left. */}
        <InkTip
          label="Field kit"
          meta="The wheel"
          place="bottom"
          className="group"
          style={{ position: "absolute", left: "60.5%", top: "56.4%", width: "11.1%", zIndex: 4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-mono.webp"
            alt="A miniature electric unicycle parked on the compartment floor under the bike"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 7px rgba(0,0,0,0.42))" }}
            draggable={false}
          />
        </InkTip>

        {/* Beside them, the armour that goes on before the wheel does: knee and
            elbow pads stacked at the front of the shelf, overlapping the shoes
            the way a pile of kit dumped on a shelf overlaps whatever is behind
            it. Same baked colour and shadow as the rest of the compartment. */}
        <InkTip
          label="Field kit"
          meta="The armour"
          place="bottom"
          className="group"
          style={{ position: "absolute", left: "78.96%", top: "70.6%", width: "10.8%", zIndex: 6 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-pads.webp"
            alt="A set of miniature knee and elbow pads stacked on the wardrobe's bottom shelf"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            // Cut at the wardrobe's side wall: the case is a photograph, so
            // nothing can pass behind it by z-index — the pile is clipped where
            // the wall stands, which reads as pushed into the corner.
            style={{ filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.42))", clipPath: "inset(0 9% 0 0)" }}
            draggable={false}
          />
        </InkTip>

        {/* The Converse she rides in, paired on the wardrobe's bottom shelf
            under the folded blankets — the floor below the bike is the wheel's
            now, and shoes on a shelf read as put away rather than dropped. */}
        <InkTip
          label="Field kit"
          meta="The Converse"
          place="bottom"
          className="group"
          style={{ position: "absolute", left: "75.1%", top: "72.96%", width: "8.1%", zIndex: 5 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/mid-bike-shoes.webp"
            alt="A pair of black canvas high-top sneakers on the wardrobe's bottom shelf"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.4))" }}
            draggable={false}
          />
        </InkTip>

        {/* The chalked day used to live on the niche's back wall. That wall is
            now where Kate's dialogue opens, and two lists of text in the same
            small arch read as clutter — so the chalk is off (the component
            itself is untouched, in components/ChalkTodo.tsx). */}
        {/* <ChalkTodo edition={shown} /> */}

        {/* Central niche — editions with a generated clip play their video
            sequence (opaque, dropped onto the niche 1:1); others show the cutout. */}
        {hasNicheClip(shown) ? (
          <NicheDoll key={shown} edition={shown} />
        ) : (
          <div
            className="group"
            style={{ position: "absolute", left: "49.4%", bottom: "20%", height: "58%", transform: "translateX(-50%)", zIndex: 2 }}
          >
            {dollVideo && !videoFailed ? (
              <video
                key={dollVideo}
                src={dollVideo}
                autoPlay muted loop playsInline
                onError={() => setVideoFailed(true)}
                poster={`/dolls/cut/web/${shown}.webp`}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/dolls/cut/web/${shown}.webp`}
                alt={EDITIONS[shown].label}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
                draggable={false}
              />
            )}
          </div>
        )}


        {/* The lamp in the arch, turned down while she sleeps. Over the clip,
            because the light is painted into it. */}
        <NicheLight edition={shown} />

        {/* Kate answers, briefly. The hotspot sits over her in the niche; the
            panel it opens fills the wall above her head, where the chalked day
            used to be. Nothing else in the hero moves. */}
        <KateTalk edition={shown} />

        {/* First-visit opening sequence — opens the case in place, doors
            swing apart to reveal the doll in the niche underneath.
            HIDDEN for now per Kate — re-enable when the concept is reworked. */}
        {/* <IntroOverlay /> */}
        </div>
        </div>
      </div>

        {/* The title block to the left of the box, the schedule to its right:
            the case itself stays centred and untouched between them. Both are
            absolute, so neither can push it off centre. */}
        <div style={{ borderColor: "var(--hairline)" }}
          className="hero-aside-wrap basis-full order-first max-w-[34ch] mb-7 ml-[6vw] mr-auto min-[1440px]:border-r min-[1440px]:pr-6 min-[1440px]:ml-0 min-[1440px]:mr-0 min-[1440px]:absolute min-[1440px]:top-0 min-[1440px]:left-6 min-[1440px]:order-none min-[1440px]:basis-auto min-[1440px]:mb-0 min-[1440px]:max-w-none min-[1440px]:w-[min(420px,calc(50vw-min(44vw,559px)+122px))]">
          <HeroAside />
        </div>

        {/* Clock + schedule to the right of the box. HIDDEN for now per Kate —
            the hero is being settled with the case and the title block alone.
            The panel itself is untouched; drop the false to bring it back. */}
        {false && (
          <div
            style={{ position: "absolute", top: "50%", left: "calc(50% + min(44vw, 559px) + 28px)", transform: "translateY(-50%)" }}
          >
            {clockPanel}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="hero-caption text-center -mt-2">
        <p style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em" }} className="uppercase">
          {edition.label}{edition.slogan ? ` · “${edition.slogan}”` : ""}
        </p>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">
          {hour !== null ? `${((hour % 12) || 12)}:00 ${hour >= 12 ? "PM" : "AM"} · your local time` : ""}
        </p>
      </div>

      {/* Have a project? — parked in the bottom-left corner of the page, in the
          same voice as the line under the title: body type, no accent colour.
          mt-auto keeps it on the floor of the min-h-screen column. */}
      <div className="hero-contact w-full mt-auto pt-4">
        <div className="ml-[6vw] min-[1440px]:ml-6">
          <p className="t-body" style={{ color: "var(--fg)" }}>Have a project?</p>
          <Link
            href="/contact"
            className="t-body inline-block mt-1 hover:opacity-60 transition-opacity"
            style={{ color: "var(--fg)" }}
          >
            Let&apos;s talk →
          </Link>
        </div>
      </div>

    </main>
  );
}
