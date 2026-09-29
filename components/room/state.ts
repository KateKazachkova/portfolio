/**
 * What the WebGL room's objects hold between clicks (M3): the page the bike
 * computer shows and the rides it pages through; the series in the CD
 * wallet, the spread it is open at, the disc in the player and whether its
 * clip has sound; whether Ukrainska 15's folder is open and its song on. Under the flag the legacy
 * components that kept this in React state are not rendered, so it lives
 * here, for the controls (hits.ts) to change and for what draws it (M4: the
 * LCD) to read. One plain store: set() merges and tells every listener.
 */

export type Ride = { id: number; name: string; distanceKm: number; movingMin: number; date: string; path: string | null };
export type Strava = { stats: { rides: number; distanceKm: number; timeHours: number; elevationM: number } | null; rides: Ride[] };

export type Series = { title: string; poster: string | null; year: number | null; why?: string; clip?: string | null; disc?: string | null };

export type RoomState = {
  /** the bike computer's screen: 0 the totals, then the longest rides */
  bikePage: number;
  strava: Strava | null;
  /** the wallet's series, newest first (OffDutyShelf's order) */
  series: Series[];
  /** the spread it is open at, eight discs to one */
  spread: number;
  /** a sleeve turning over the spine (OffDutyShelf's TURN_MS): which way,
   *  to which spread, since when (performance.now()) */
  turn: { dir: 1 | -1; to: number; t0: number } | null;
  /** the disc in the player */
  picked: Series | null;
  /** a disc on its way from pocket `from` of spread `spread` to the player
   *  (FLY_MS); the player is empty meanwhile */
  flying: { item: Series; from: number; spread: number; t0: number } | null;
  /** its clip has sound (only while the camera is at the corner) */
  sound: boolean;
  /** Ukrainska 15's folder is open on the desk, and its song playing */
  u15: boolean;
  playing: boolean;
};

const state: RoomState = { bikePage: 0, strava: null, series: [], spread: 0, turn: null, picked: null, flying: null, sound: false, u15: false, playing: false };
const listeners = new Set<(s: RoomState) => void>();

export const roomState = () => state;
export function setRoom(p: Partial<RoomState>) {
  Object.assign(state, p);
  for (const f of listeners) f(state);
}
export function onRoom(f: (s: RoomState) => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

// the rides, once, as BikeComputer fetches them
let asked = false;
export function loadStrava() {
  if (asked) return;
  asked = true;
  fetch("/api/strava").then((r) => r.json()).then((d: Strava) => setRoom({ strava: d })).catch(() => {});
}

export const bikePages = (s = state) => 1 + (s.strava?.rides.length ?? 0);
export const stepBike = (d: number) => setRoom({ bikePage: (state.bikePage + d + bikePages()) % bikePages() });
/** the ride on screen, or null on the totals */
export const bikeRide = (s = state) => (s.bikePage > 0 ? s.strava?.rides[s.bikePage - 1] ?? null : null);
export const stravaHref = (s = state) => {
  const r = bikeRide(s);
  return r ? `https://www.strava.com/activities/${r.id}` : "https://www.strava.com/athletes/52565503";
};

// what the LCD says, in words (BikeComputer's screens), for a screen reader
const hm = (min: number) => `${Math.floor(min / 60)} h ${min % 60} min`;
export function bikeWords(s = state): string {
  if (!s.strava) return "Searching GPS…";
  const n = bikePages(s) - 1;
  if (s.bikePage === 0) {
    const t = s.strava.stats;
    return t ? `Totals: ${t.distanceKm} km over ${t.rides} rides, ${t.timeHours} h, ${t.elevationM} m ascent` : "No signal";
  }
  const r = bikeRide(s);
  if (!r) return "";
  const day = r.date ? new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  return `Longest ride ${s.bikePage} of ${n}: ${r.distanceKm} km, ${hm(r.movingMin)}${day ? `, ${day}` : ""}`;
}

// ── the CD wallet and the player (OffDutyShelf) ──
export const PER_SPREAD = 8;
let askedSeries = false;
export function loadSeries() {
  if (askedSeries) return;
  askedSeries = true;
  // filed newest first; titles in a year alphabetically, undated at the back
  const byYear = (a: Series, b: Series) => (b.year ?? -1) - (a.year ?? -1) || a.title.localeCompare(b.title);
  fetch("/api/series").then((r) => r.json()).then((d: Series[]) => setRoom({ series: [...d].sort(byYear) })).catch(() => {});
}
export const spreads = (s = state) => Math.max(1, Math.ceil(s.series.length / PER_SPREAD));
/** the series in pocket i (0–3 the left sleeve, 4–7 the right) of the open spread */
export const discAt = (i: number, s = state) => s.series[s.spread * PER_SPREAD + i] ?? null;
// OffDutyShelf's timings: a sleeve folds flat to the pegs and opens on the
// other side (.32 s + .32 s); a disc flies to the spindle in .9 s
export const TURN_MS = 640;
export const FLY_MS = 900;
export const turnSpread = (d: 1 | -1) => {
  if (state.turn) return;
  const to = state.spread + d;
  if (to < 0 || to >= spreads()) return;
  setRoom({ turn: { dir: d, to, t0: performance.now() } });
  setTimeout(() => setRoom({ spread: to, turn: null }), TURN_MS);
};
/** the disc in pocket i of the open spread goes into the player: the one in
 *  it goes back at once, this one flies over and is in when it lands */
export const pickDisc = (i: number) => {
  const item = discAt(i);
  if (!item || state.flying) return;
  setRoom({ picked: null, sound: false, flying: { item, from: i, spread: state.spread, t0: performance.now() } });
  setTimeout(() => setRoom({ picked: item, flying: null }), FLY_MS);
};
/** the disc out of its pocket: in the player, or on its way there */
export const discOut = (s = state) => (s.flying?.item ?? s.picked)?.title;
