/**
 * What the WebGL room's objects hold between clicks (M3): the page the bike
 * computer shows and the rides it pages through; the series in the CD
 * wallet, the spread it is open at, the disc in the player and whether its
 * clip has sound. Under the flag the legacy
 * components that kept this in React state are not rendered, so it lives
 * here, for the controls (hits.ts) to change and for what draws it (M4: the
 * LCD) to read. One plain store: set() merges and tells every listener.
 */

export type Ride = { id: number; name: string; distanceKm: number; movingMin: number; date: string; path: string | null };
export type Strava = { stats: { rides: number; distanceKm: number; timeHours: number; elevationM: number } | null; rides: Ride[] };

export type Series = { title: string; poster: string | null; year: number | null; clip?: string | null; disc?: string | null };

export type RoomState = {
  /** the bike computer's screen: 0 the totals, then the longest rides */
  bikePage: number;
  strava: Strava | null;
  /** the wallet's series, newest first (OffDutyShelf's order) */
  series: Series[];
  /** the spread it is open at, eight discs to one */
  spread: number;
  /** the disc in the player */
  picked: Series | null;
  /** its clip has sound (only while the camera is at the corner) */
  sound: boolean;
};

const state: RoomState = { bikePage: 0, strava: null, series: [], spread: 0, picked: null, sound: false };
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
export const turnSpread = (d: 1 | -1) => {
  const to = state.spread + d;
  if (to >= 0 && to < spreads()) setRoom({ spread: to });
};
export const pickDisc = (item: Series) => setRoom({ picked: item, sound: false });
