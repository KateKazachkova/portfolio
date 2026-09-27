"use client";

import { useEffect, useState } from "react";

export const OFFDUTY_EVENT = "kate:off-duty";

// Off Duty, on home's desk: the bike computer lying in front of the CD
// wallet and the player in the room's far left corner, its screen showing
// Strava live (app/api/strava). A worn head unit
// with a saffron bumper, cut out of a Higgsfield shot and mirrored so its
// own shadow side matches the desk's light (above, front, left). Real ones
// are ~5 × 8 cm; this one is a touch bigger (8 × 11.5 cm) so the figures
// read from the camera's stop. Its shadow is baked into the cut-out, which
// is why the picture is wider than the unit (the unit is 78% of it across).
// x, y are its centre on the desk plane; w is the picture's width.
// It stands leaning against the helmet in the foreground (Helmet.tsx, box
// x -1200, z 450), its foot on the desk in front of the shell's right
// side (box x -1042, z 466: desk-top px box x + 1052.5, z + 269), tipped
// up about its foot to 22° off upright and drawn at 1.08 so it keeps to
// the helmet's scale.
export const BIKE = { x: 10, y: 735, w: 110, r: -6, lean: 68, k: 1.08 };
const H = Math.round(BIKE.w * 1590 / 1200);

type Ride = { id: number; name: string; distanceKm: number; movingMin: number; date: string; path: string | null };
type Data = { stats: { rides: number; distanceKm: number; timeHours: number; elevationM: number } | null; rides: Ride[] };

// plain digits: a space between thousands reads as two figures on a mono LCD
const n = (v: number) => String(v);
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
const day = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "";

/** The head unit. From elsewhere in the room a click turns the camera to
 *  the Off Duty corner (Off Duty in the index does the same); once there
 *  its buttons page through the screens — the totals, then the three
 *  longest rides — and a click on the screen does too. The camera does
 *  not come in closer (Kate, 26.09): it lies near enough to read. */
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
    const read = () => setLive(root.dataset.desk === "offduty");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    return () => mo.disconnect();
  }, []);

  const pages = 1 + (data?.rides.length ?? 0);
  const step = (d: number) => setPage((p) => (p + d + pages) % pages);
  // from elsewhere the first click is the camera's, not the buttons'
  const come = () => {
    if (document.documentElement.dataset.desk !== "offduty") dispatchEvent(new Event(OFFDUTY_EVENT));
  };
  const press = (e: React.MouseEvent, act: () => void) => {
    e.stopPropagation();
    if (!live) { come(); return; }
    act();
  };

  const s = data?.stats;
  const ride = page > 0 ? data?.rides[page - 1] : null;

  return (
    <div
      className="bike"
      data-live={live || undefined}
      style={{
        left: `calc(${BIKE.x - BIKE.w / 2} * var(--u))`, top: `calc(${BIKE.y - H / 2} * var(--u))`,
        width: `calc(${BIKE.w} * var(--u))`, height: `calc(${H} * var(--u))`,
        transformOrigin: "50% 100%",
        transform: `translateZ(.1px) rotate(${BIKE.r}deg) rotateX(${-BIKE.lean}deg) scale(${BIKE.k})`,
      } as React.CSSProperties}
      onClick={(e) => press(e, () => step(1))}
      role="group"
      aria-label="Off Duty – ride totals from Strava, on a bike computer"
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
