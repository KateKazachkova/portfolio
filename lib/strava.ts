import "server-only";

const TOKEN_URL = "https://www.strava.com/oauth/token";
const API = "https://www.strava.com/api/v3";

/**
 * Strava for the bike computer, read once a day (app/api/strava).
 *
 * Every failure throws rather than coming back empty: a revalidation that
 * throws keeps the last good answer in the cache, so a Strava outage, a rate
 * limit or an expired token leaves yesterday's figures on the unit instead
 * of blanking it for a day. Only Strava not being configured at all is an
 * empty answer, and so is a failure while the site is being built, so a
 * deploy never waits on Strava.
 */
export class StravaError extends Error {}

// The access token, kept until a minute before Strava says it expires. None
// of the fetches here says how to cache: they are then not cached, and they
// leave the route static, so it is fetched afresh only when the route's own
// day is up (app/api/strava). `cache: "no-store"` would say the same about
// the fetch but make the route dynamic: Strava on every request.
let tokenCache: { value: string; until: number } | null = null;

const configured = () =>
  Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET
    && process.env.STRAVA_REFRESH_TOKEN && process.env.STRAVA_ATHLETE_ID);

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.until > Date.now()) return tokenCache.value;
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new StravaError(`token refresh: ${res.status}`);
  const data = (await res.json()) as { access_token?: string; expires_at?: number; refresh_token?: string };
  if (!data.access_token) throw new StravaError("token refresh: no access_token");
  // Strava may hand back a new refresh token; the old one then stops working
  // once this access token expires, and STRAVA_REFRESH_TOKEN has to be updated.
  if (data.refresh_token && data.refresh_token !== STRAVA_REFRESH_TOKEN)
    console.warn("[strava] Strava issued a new refresh token: update STRAVA_REFRESH_TOKEN");
  const until = (data.expires_at ? data.expires_at * 1000 : Date.now() + 30 * 60_000) - 60_000;
  tokenCache = { value: data.access_token, until };
  return data.access_token;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
  if (!res.ok) throw new StravaError(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export type StravaStats = {
  rides: number;
  distanceKm: number;
  timeHours: number;
  elevationM: number;
};

export type StravaActivity = {
  id: number;
  name: string;
  distanceKm: number;
  movingMin: number;
  date: string;
  type: string;
  polyline: string | null;
};

type RawTotals = { count?: number; distance?: number; moving_time?: number; elevation_gain?: number };
type RawActivity = {
  id: number; name: string; type?: string; distance?: number; moving_time?: number;
  start_date_local?: string; map?: { summary_polyline?: string | null };
};

const RIDE_TYPES = new Set(["Ride", "VirtualRide", "EBikeRide"]);

async function getRideStats(): Promise<StravaStats> {
  const d = await get<{ all_ride_totals?: RawTotals }>(`/athletes/${process.env.STRAVA_ATHLETE_ID}/stats`);
  const ride = d.all_ride_totals;
  if (!ride) throw new StravaError("stats: no all_ride_totals");
  return {
    rides: ride.count ?? 0,
    distanceKm: Math.round((ride.distance ?? 0) / 1000),
    timeHours: Math.round((ride.moving_time ?? 0) / 3600),
    elevationM: Math.round(ride.elevation_gain ?? 0),
  };
}

async function getLongestRides(limit: number): Promise<StravaActivity[]> {
  // Two pages is 400 activities — enough to hold the longest rides, and it
  // costs two round trips instead of five.
  const rides: RawActivity[] = [];
  for (let page = 1; page <= 2; page++) {
    const list = await get<RawActivity[]>(`/athlete/activities?per_page=200&page=${page}`);
    if (!Array.isArray(list)) throw new StravaError("activities: not a list");
    rides.push(...list.filter((a) => a.type && RIDE_TYPES.has(a.type)));
    if (list.length < 200) break;
  }
  return rides
    .sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      name: a.name,
      distanceKm: Math.round((a.distance ?? 0) / 100) / 10,
      movingMin: Math.round((a.moving_time ?? 0) / 60),
      date: a.start_date_local ?? "",
      type: a.type ?? "",
      polyline: a.map?.summary_polyline || null,
    }));
}

/** The totals and the longest rides, or nothing when Strava isn't set up
 *  (or is failing during a build). Throws on any other failure. */
export async function getRides(limit = 3): Promise<{ stats: StravaStats | null; rides: StravaActivity[] }> {
  if (!configured()) return { stats: null, rides: [] };
  try {
    const [stats, rides] = await Promise.all([getRideStats(), getLongestRides(limit)]);
    return { stats, rides };
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("[strava] skipped during build:", e);
      return { stats: null, rides: [] };
    }
    throw e;
  }
}
