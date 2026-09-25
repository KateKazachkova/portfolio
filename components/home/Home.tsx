"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import NicheDoll, { hasNicheClip } from "@/components/NicheDoll";
import NicheLight from "@/components/NicheLight";
import NightRoom, { NightCam } from "@/components/NightRoom";
import DeskLamp, { DeskLampSwitch } from "@/components/desk/DeskLamp";
import KateTalk from "@/components/KateTalk";
import FlipClock, { clockDate, type ClockTime } from "@/components/FlipClock";
import HeroAside from "@/components/HeroAside";
import IntroOpen from "@/components/IntroOpen";
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour, editionForDate } from "@/lib/time";
import { mono } from "@/components/ui/type";
import { DeskPlanes, DeskHint, useDeskCamera } from "@/components/DeskScene";
import U15Still from "@/components/desk/U15Still";
import Tardis from "./Tardis";
import AwardCubby from "./AwardCubby";
import Wardrobe from "./Wardrobe";

/** Home: the case on the desk, and everything in it that moves with the time
 *  of day. The still things in the case come from the server as `shelves`
 *  and `kit` (components/home/CaseShelves.tsx, CaseKit.tsx), dropped into
 *  their places in the case's stacking order. */
export default function Home({ shelves, kit }: { shelves: ReactNode; kit: ReactNode }) {
  const { hour, auto, setHour, setNow, applyAmbient } = useTime();
  const deskCam = useRef<HTMLDivElement>(null);
  useDeskCamera(deskCam);
  // The flip clock's own time: a weekday and minutes, or null while it simply
  // follows now. Set, it decides the edition — weekday specials included —
  // and hands its hour to the rest of the site's mood.
  const [clock, setClock] = useState<ClockTime | null>(null);
  // Now, ticked every half minute: the clock face and, following now, the
  // edition itself move on with it.
  const [now, setNowTick] = useState<Date | null>(null);
  useEffect(() => {
    // After mount, so server and client agree on the first paint.
    const first = window.setTimeout(() => setNowTick(new Date()), 0);
    const t = window.setInterval(() => setNowTick(new Date()), 30_000);
    return () => { window.clearTimeout(first); window.clearInterval(t); };
  }, []);
  const edition =
    clock ? editionForDate(clockDate(clock))
    : hour === null ? EDITIONS.office
    : auto ? editionForDate(now ?? new Date())
    : editionForHour(hour);
  // The niche, the rail, the guitar, the lamp and the night all run on it.
  const shown = edition.key;

  const setClockTime = (t: ClockTime) => {
    setClock(t);
    setHour(Math.floor(t.minutes / 60));
  };
  const clockNow = () => { setClock(null); setNow(); };
  const clockShown: ClockTime = clock ?? (now
    ? { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() }
    : { day: 1, minutes: 10 * 60 });

  // Home is a product shot: it gets the studio sweep. Every other route stays
  // flat paper, so the box reads as packaging and the documents read as paper.
  useEffect(() => {
    document.documentElement.setAttribute("data-scene", "studio");
    return () => document.documentElement.removeAttribute("data-scene");
  }, []);

  // The page's mood follows the clock, and is handed back to it on leaving.
  useEffect(() => {
    applyAmbient();
    return applyAmbient;
  }, [applyAmbient]);

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
      // The room's wall is not drawn (globals.css, .desk-wall): this is it.
      style={{ background: "var(--room-wall)", marginTop: -56, paddingTop: 56 + 56 }}
    >

      {/* Suitcase + title block. The box stays centred; the title block sits
          to its left on wide screens (absolute, so the box never shifts). */}
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
        <DeskPlanes>
          {/* The flip clock, standing on the desk left of the case, under the
              index. It tells the scene's time and sets it: see FlipClock. It
              stands in the room itself, not on the case's plate, so the camera
              can turn to it (Off Duty lies beside it). */}
          <div className="flip-clock-slot">
            <FlipClock time={clockShown} live={clock === null} onChange={setClockTime} onNow={clockNow} />
          </div>
          {/* The desk lamp behind it, the room's light switch: see DeskLamp */}
          <DeskLamp />
        </DeskPlanes>
        <div className="case-world">
        {/* Ukrainska 15's stack as this camera sees it, over the live one */}
        <U15Still />

        {/* The case does not sit flat on the floor: it stands on the feet at
            the outer bottom corners of the two doors, nearer the camera than
            the trunk's base. Its shadow at rest is the opening clip's last
            frame's (Kate, 25.09: the one it casts while it opens, kept once
            it stands still), laid on the case's own plane the way the clip
            is, running below the box by the clip's 146 of 1226 rows. It
            stands in for the floor ellipses the page used to draw and for
            the desk's desk-shadow.png (hidden in globals.css).

            No drop-shadow on the case itself: a drop-shadow offsets the
            whole outline uniformly, so it traces the sides and the top as
            well as the base — a thin dark edging that hangs in the air
            beside the doors, where there is nothing for a shadow to fall on. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="case-shadow"
          src="/suitcase/intro/rest_shadow.webp"
          alt=""
          aria-hidden
          draggable={false}
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${(1226 / 1080) * 100}%`, maxWidth: "none", zIndex: 0, pointerEvents: "none" }}
        />

        {/* The case: the full 3072px picture only where it is drawn over
            ~1500 device pixels (a wide screen at 1.5x or more), 1600px
            everywhere else. The same condition picks --case-plate in
            globals.css, which the award's inlays and the niche's light draw
            with, so each visitor fetches one of the two files, never both. */}
        <picture>
          <source media="(min-width: 1024px) and (min-resolution: 1.5dppx)" srcSet="/suitcase/open2.webp" />
          <img
            src="/suitcase/open2-1600.webp"
            alt="Kate's collector suitcase"
            // the page's picture: fetched ahead of everything the room holds
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: 1 }}
            draggable={false}
          />
        </picture>

        {/* The award, in the top-left cubby — and the way in to Recognition */}
        <AwardCubby />

        {/* ── The wardrobe ──────────────────────────────────────────────
            One hanger per outfit: the case now ships with an empty wardrobe,
            so there is no plate to cover baked-in clothes. The hangers are what
            the doll actually wears, so each one vanishes while she has it on. */}
        <Wardrobe edition={shown} />

        {/* The Figma sticker, the shelf lips, the books and the tapes */}
        {shelves}

        {/* The TARDIS — starts on the left door's top shelf and jumps between
            spots on each charge (components/home/Tardis.tsx). */}
        <Tardis />

        {/* Left door — bottom compartment: the guitar, leaning on the bare
            velvet. Generated into this very compartment (public/items/gen/
            guitar/) and cut out against the case; its shadow is kept as plain
            darkening, so none of the old pocket's velvet comes with it. Like the clothes on the rail, it is
            gone while the doll has it in her hands. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/left-3-guitar.webp"
          alt="A blue classical guitar leaning in the bottom of the left door"
          style={{
            position: "absolute", left: "13.4%", top: "45.215%", width: "10.905%", height: "auto", maxWidth: "none",
            zIndex: 2, pointerEvents: "none",
            opacity: shown === "evening_guitar" ? 0 : 1, transition: "opacity 320ms linear",
          }}
          draggable={false}
        />

        {/* The bike on the wall and the field kit */}
        {kit}

        {/* Central niche — editions with a generated clip play their video
            sequence (opaque, dropped onto the niche 1:1); others show the cutout. */}
        {hasNicheClip(shown) ? (
          <NicheDoll key={shown} edition={shown} ready={hour !== null} />
        ) : (
          <div
            className="group"
            style={{ position: "absolute", left: "49.4%", bottom: "20%", height: "58%", transform: "translateX(-50%)", zIndex: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/dolls/cut/web/${shown}.webp`}
              alt={EDITIONS[shown].label}
              className="h-full w-auto warm"
              style={{ "--rest": "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" } as React.CSSProperties}
              draggable={false}
            />
          </div>
        )}

        {/* The lamp in the arch, turned down while she sleeps. Over the clip,
            because the light is painted into it. */}
        <NicheLight edition={shown} />

        {/* Kate answers, briefly. The hotspot sits over her in the niche; the
            panel it opens fills the wall above her head, where the chalked day
            used to be. Nothing else in the hero moves. */}
        <KateTalk edition={shown} />
        </div>
        {/* First visit: the closed trunk opens onto all of this, in place.
            Beside .case-world, not in it, so the case can be cut to its body
            while the clip's doors are still swinging. */}
        <IntroOpen />
        </div>
        {/* The room put out while she sleeps: over the whole stage, the
            desk and the wall as well as the case. */}
        <NightRoom edition={shown} />
        <DeskLampSwitch />
      </div>
        {/* …and the same night over the camera's other stops. Before the
            index column in the page, so it goes down under the room and not
            the words. */}
        <NightCam edition={shown} />

        {/* The title block to the left of the box: the case itself stays
            centred and untouched beside it. Absolute on wide screens, so it
            cannot push the case off centre. */}
        <div
          className="hero-aside-wrap basis-full order-first max-w-[34ch] mb-7 ml-[6vw] mr-auto min-[1024px]:pr-6 min-[1024px]:ml-0 min-[1024px]:mr-0 min-[1024px]:absolute min-[1024px]:top-0 min-[1024px]:left-6 min-[1024px]:order-none min-[1024px]:basis-auto min-[1024px]:mb-0 min-[1024px]:max-w-none min-[1024px]:w-[19.65vw] min-[1440px]:w-[min(420px,calc(50vw-min(44vw,559px)+122px))]">
          <HeroAside />
        </div>
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

      {/* Over the desk only: how to move along it, which file is in front. */}
      <DeskHint />
    </main>
  );
}
