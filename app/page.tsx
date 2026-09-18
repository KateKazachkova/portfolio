"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import EditionClock from "@/components/EditionClock";
import InkTip from "@/components/InkTip";
import NicheDoll, { hasNicheClip, nichePoster } from "@/components/NicheDoll";
import NicheCurtain, { CURTAIN_CLOSE_MS, CURTAIN_HOLD_MS } from "@/components/NicheCurtain";
import ChalkTodo from "@/components/ChalkTodo";
import NicheLight from "@/components/NicheLight";
// import IntroOverlay from "@/components/IntroOverlay"; // opening hidden for now
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour, editionForDate, daytimeForEdition } from "@/lib/time";
import { mono } from "@/components/ui/type";

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

export default function Home() {
  const { hour, auto, setHour, setNow, applyAmbient } = useTime();
  // Manual mode override — buttons force a specific edition (incl. the
  // weekend ones, which otherwise only show on Saturday). Cleared by the
  // clock / presets / Now.
  const [forced, setForced] = useState<string | null>(null);
  const edition =
    forced ? EDITIONS[forced]
    : hour === null ? EDITIONS.office
    : auto ? editionForDate(new Date())
    : editionForHour(hour);

  const pickHour = (h: number) => { setForced(null); setHour(h); };
  const pickNow = () => { setForced(null); setNow(); };

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
    if (forced) document.documentElement.setAttribute("data-daytime", daytimeForEdition(forced));
    else applyAmbient();
    return applyAmbient;
  }, [forced, applyAmbient]);
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

  // ── The curtain call ──
  // The niche shows `shown`, not `edition`: it lags the chosen edition by the
  // length of the curtain's close, so one doll is never seen turning into the
  // next. Everything inside the niche runs on it — the clip, the chalk on the
  // back wall, the lamp — while the caption under the case changes at once, so
  // a click still answers immediately.
  const [shown, setShown] = useState(edition.key);
  const [curtainClosed, setCurtainClosed] = useState(false);
  // The last edition the sequence was started for. A ref, not the state: the
  // effect must fire once per change of edition and not again when `shown`
  // catches up, or its cleanup would cancel its own re-opening.
  const staged = useRef(edition.key);

  useEffect(() => {
    if (staged.current === edition.key) return;
    staged.current = edition.key;
    const next = edition.key;

    // Anyone who has asked for less motion gets the swap, not the theatre.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const plain = window.setTimeout(() => setShown(next), 0);
      return () => window.clearTimeout(plain);
    }

    // Start the next poster loading now, behind the fabric, so the niche has a
    // frame to show the moment the curtain parts.
    new Image().src = nichePoster(next);

    // Three beats on one clock, the first of them immediate. Scheduling the
    // close rather than setting it here keeps the whole sequence in timers —
    // which is also what lets a second click cancel it cleanly.
    const draw = window.setTimeout(() => setCurtainClosed(true), 0);
    const swap = window.setTimeout(() => setShown(next), CURTAIN_CLOSE_MS);
    const part = window.setTimeout(() => setCurtainClosed(false), CURTAIN_CLOSE_MS + CURTAIN_HOLD_MS);
    // Clicking through the schedule faster than a second drops the pending
    // beats and restarts: the curtain simply stays shut a little longer.
    return () => {
      window.clearTimeout(draw);
      window.clearTimeout(swap);
      window.clearTimeout(part);
    };
  }, [edition.key]);

  const dollVideo = EDITION_VIDEO[shown];

  const clockPanel = (
    <div>
      <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase text-center mb-3">
        Set the time
      </p>
      <EditionClock hour={hour ?? 12} onChange={pickHour} onNow={pickNow} />

      {/* The schedule. These were loose chips; as a timetable they say what
          they actually are — the hours of a day you can jump the doll to —
          and the times come straight from each edition's own range. */}
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
            { label: "Ready", key: "morn_ready" },
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
      className="min-h-screen flex flex-col items-center justify-start gap-10 select-none px-6 pb-14"
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

      {/* Eyebrow */}
      <div className="text-center">
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-2">
          KATE™ · Collector Edition
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto italic">A designer who turns chaos into systems.</p>
      </div>

      {/* Suitcase + clock. The box stays centred; on wide screens the clock
          sits to its right (absolute, so the box itself never shifts). */}
      <div className="relative w-full flex justify-center">
      <div style={{ position: "relative", width: "min(88vw, 1118px)", aspectRatio: "1536 / 1024" }}>
        {/* The studio sweep, anchored to the case so it travels with it, and
            the flat floor that carries its last tone down past the plate. */}
        <div className="studio-floor" aria-hidden />
        <div className="studio-plate" aria-hidden />

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
                box: 14.86% across and 22.52% down of it, 72.74% of its width,
                which is the same statue at the same size as before, now
                measured against its own shelf.

                The light: ambient light cannot reach into a recess, hence the
                brightness and saturation taken off and the warm cast, matching
                the dark wood it stands in. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/items/trophy.png"
              alt=""
              style={{
                position: "absolute",
                left: "14.86%",
                top: "22.52%",
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
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={awardClip}
              src="/items/award_turn.mp4"
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
          </Link>
        </InkTip>

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

        {/* Left door — top shelf: TV box sets */}
        <InkTip
          label="Box Sets"
          meta="Doctor Who · How I Met Your Mother"
          place="bottom"
          className="group"
          style={{ position: "absolute", left: "10.5%", top: "13.0%", width: "13%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/tv2.png"
            alt="Box sets: Doctor Who and How I Met Your Mother"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </InkTip>

        {/* Brass gallery rail across the top shelf — sits in front of the box sets */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/top boarder.png"
          alt=""
          aria-hidden
          style={{ position: "absolute", left: "11%", top: "24.5%", width: "12.4%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Left door — middle shelf: cassettes */}
        <InkTip
          label="Cassettes"
          meta="The 10th Kingdom · Are You Afraid of the Dark?"
          place="bottom"
          className="group"
          style={{ position: "absolute", left: "14.9%", top: "29.8%", width: "9.4%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/tv show.png"
            alt="Books: The 10th Kingdom and Are You Afraid of the Dark?"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </InkTip>

        {/* Brass gallery rail across the middle shelf — sits in front of the cassettes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/top boarder.png"
          alt=""
          aria-hidden
          style={{ position: "absolute", left: "11%", top: "46.5%", width: "12.4%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Right door — bottom shelf: books */}
        <InkTip
          label="On the Shelf"
          meta="Animal Farm · The Little Prince"
          place="top"
          className="group"
          style={{ position: "absolute", left: "75.5%", top: "69%", width: "11.4%", zIndex: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/books_.png"
            alt="Books: Animal Farm and The Little Prince"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </InkTip>

        {/* Right-centre rail: the bicycle — needs a transparent cutout at
            /items/bike_hang.png (position already dialled in). Enable when ready.
        <div
          className="group"
          style={{ position: "absolute", left: "57%", top: "16.5%", width: "12.5%", zIndex: 2 }}
          title="Field kit — the bicycle"
        >
          <img
            src="/items/bike_hang.png"
            alt="A bicycle hung on the rail"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" }}
            draggable={false}
          />
        </div>
        */}

        {/* The day chalked on the niche's back wall — schedule and to-do in one
            list, struck through as the hours go by */}
        <ChalkTodo edition={shown} />

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
                poster={`/dolls/cut/${shown}.png`}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/dolls/cut/${shown}.png`}
                alt={EDITIONS[shown].label}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
                draggable={false}
              />
            )}
          </div>
        )}

        {/* The curtain, over the clip and the chalk but under the lamp — the
            light in the arch falls on the fabric too. */}
        <NicheCurtain closed={curtainClosed} />

        {/* The lamp in the arch, turned down while she sleeps. Over the clip,
            because the light is painted into it. */}
        <NicheLight edition={shown} />

        {/* First-visit opening sequence — opens the case in place, doors
            swing apart to reveal the doll in the niche underneath.
            HIDDEN for now per Kate — re-enable when the concept is reworked. */}
        {/* <IntroOverlay /> */}
      </div>

        {/* Clock to the right of the box (wide screens only) */}
        <div
          className="hidden min-[1700px]:block"
          style={{ position: "absolute", top: "50%", left: "calc(50% + min(44vw, 559px) + 28px)", transform: "translateY(-50%)" }}
        >
          {clockPanel}
        </div>
      </div>

      {/* Caption */}
      <div className="text-center -mt-2">
        <p style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em" }} className="uppercase">
          {edition.label}{edition.slogan ? ` · “${edition.slogan}”` : ""}
        </p>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">
          {hour !== null ? `${((hour % 12) || 12)}:00 ${hour >= 12 ? "PM" : "AM"} · your local time` : ""}
        </p>
      </div>

      {/* Clock below the box on smaller screens */}
      <div className="min-[1700px]:hidden">
        {clockPanel}
      </div>
    </main>
  );
}
