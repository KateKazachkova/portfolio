"use client";

import { useEffect, useState } from "react";

export const OFFDUTY_EVENT = "kate:off-duty";

// Off Duty, on home's desk: the bike computer lying in front of the flip
// clock and a little left of it, left of the case, its screen showing Strava live (app/api/strava). A worn head unit
// with a saffron bumper, cut out of a Higgsfield shot and mirrored so its
// own shadow side matches the desk's light (above, front, left). Real ones
// are ~5 × 8 cm; this one is a touch bigger (8 × 11.5 cm) so the figures
// read from the camera's stop. Its shadow is baked into the cut-out, which
// is why the picture is wider than the unit (the unit is 78% of it across).
// x, y are its centre on the desk plane; w is the picture's width.
export const BIKE = { x: 852, y: 689, w: 110, r: -8 };
const H = Math.round(BIKE.w * 1590 / 1200);

type Ride = { id: number; name: string; distanceKm: number; movingMin: number; date: string; path: string | null };
type Data = { stats: { rides: number; distanceKm: number; timeHours: number; elevationM: number } | null; rides: Ride[] };

// plain digits: a space between thousands reads as two figures on a mono LCD
const n = (v: number) => String(v);
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
const day = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "";

/** The head unit. From elsewhere in the room a click turns the camera to
 *  the clock's corner (Off Duty in the index does the same); a click there
 *  brings it down over the unit (html[data-desk-focus="bike"]), and from
 *  then on its buttons page through the screens — the totals, then the
 *  three longest rides — and a click on the screen does too. */
export default function BikeComputer() {
  const [data, setData] = useState<Data | null>(null);
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/strava").then((r) => r.json()).then((d) => on && setData(d)).catch(() => {});
    return () => { on = false; };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setLive(root.dataset.desk === "offduty" && root.dataset.deskFocus === "bike");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk", "data-desk-focus"] });
    return () => mo.disconnect();
  }, []);

  const pages = 1 + (data?.rides.length ?? 0);
  const step = (d: number) => setPage((p) => (p + d + pages) % pages);
  // the first clicks are the camera's, not the buttons': over to the corner,
  // then down onto the unit
  const come = () => {
    const root = document.documentElement;
    if (root.dataset.desk !== "offduty") dispatchEvent(new Event(OFFDUTY_EVENT));
    else root.dataset.deskFocus = "bike";
  };
  const press = (e: React.MouseEvent, act: () => void) => {
    e.stopPropagation();
    if (!live) { come(); return; }
    act();
  };
  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const s = data?.stats;
  const ride = page > 0 ? data?.rides[page - 1] : null;

  return (
    <div
      className="bike"
      data-live={live || undefined}
      style={{
        left: `calc(${BIKE.x - BIKE.w / 2} * var(--u))`, top: `calc(${BIKE.y - H / 2} * var(--u))`,
        width: `calc(${BIKE.w} * var(--u))`, height: `calc(${H} * var(--u))`,
        transform: `rotate(${BIKE.r}deg) translateZ(.1px)`,
      } as React.CSSProperties}
      onClick={(e) => press(e, () => step(1))}
      role="group"
      aria-label="Off Duty — ride totals from Strava, on a bike computer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/off-duty/bike-computer-v2.webp" alt="" draggable={false} />

      <div className="bike__lcd" aria-live="polite">
        <div className="bike__bar">
          <span>{page === 0 ? "ODO" : `LONG ${page}/${pages - 1}`}</span>
          <span>KATE™</span>
        </div>
        {!data ? (
          <div className="bike__wait">SEARCHING<br />GPS…</div>
        ) : page === 0 ? (
          s ? (
            <>
              <div className="bike__field bike__field--big">
                <span className="bike__k">TOTAL DIST</span>
                <span className="bike__v">{n(s.distanceKm)}<small>km</small></span>
              </div>
              <div className="bike__grid">
                <div className="bike__field"><span className="bike__k">RIDES</span><span className="bike__v">{n(s.rides)}</span></div>
                <div className="bike__field"><span className="bike__k">TIME</span><span className="bike__v">{n(s.timeHours)}<small>h</small></span></div>
                <div className="bike__field bike__field--wide"><span className="bike__k">ASCENT</span><span className="bike__v">{n(s.elevationM)}<small>m</small></span></div>
              </div>
            </>
          ) : <div className="bike__wait">NO SIGNAL</div>
        ) : ride && (
          <>
            {ride.path && (
              <svg className="bike__map" viewBox="0 0 100 100" aria-hidden>
                <path d={ride.path} pathLength={1} key={ride.id} />
              </svg>
            )}
            <div className="bike__grid">
              <div className="bike__field"><span className="bike__k">DIST</span><span className="bike__v">{ride.distanceKm}<small>km</small></span></div>
              <div className="bike__field"><span className="bike__k">TIME</span><span className="bike__v">{hm(ride.movingMin)}</span></div>
            </div>
            <div className="bike__date">{day(ride.date)}</div>
          </>
        )}
      </div>

      {/* its three buttons: back, the ride on Strava, next */}
      <button type="button" className="bike__btn" style={{ left: "31.2%" }} tabIndex={live ? 0 : -1}
        aria-label="Previous screen" onClick={(e) => press(e, () => step(-1))} />
      <a className="bike__btn" style={{ left: "49.6%" }} tabIndex={live ? 0 : -1}
        href={ride ? `https://www.strava.com/activities/${ride.id}` : "https://www.strava.com/athletes/52565503"}
        target="_blank" rel="noopener noreferrer" aria-label="Open on Strava"
        onClick={(e) => { e.stopPropagation(); if (!live) { e.preventDefault(); come(); } }} />
      <button type="button" className="bike__btn" style={{ left: "68%" }} tabIndex={live ? 0 : -1}
        aria-label="Next screen" onClick={(e) => press(e, () => step(1))} />
    </div>
  );
}
