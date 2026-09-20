const TOKEN_URL = "https://www.strava.com/oauth/token";
const API = "https://www.strava.com/api/v3";

// One token per render pass, and one refresh per half hour across renders:
// the old no-store call meant every page view spent a round trip on OAuth
// before it could ask for a single ride.
let tokenCache: { value: string; until: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.until > Date.now()) return tokenCache.value;
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env;
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) return null;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: STRAVA_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token ?? null;
    if (token) tokenCache = { value: token, until: Date.now() + 30 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}

export type StravaStats = {
  rides: number;
  distanceKm: number;
  timeHours: number;
  elevationM: number;
} | null;

export type StravaActivity = {
  id: number;
  name: string;
  distanceKm: number;
  movingMin: number;
  date: string;
  type: string;
  polyline: string | null;
};

export async function getRideStats(): Promise<StravaStats> {
  const token = await getAccessToken();
  const id = process.env.STRAVA_ATHLETE_ID;
  if (!token || !id) return null;

  try {
    const res = await fetch(`${API}/athletes/${id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    const ride = d.all_ride_totals ?? {};
    return {
      rides: ride.count ?? 0,
      distanceKm: Math.round((ride.distance ?? 0) / 1000),
      timeHours: Math.round((ride.moving_time ?? 0) / 3600),
      elevationM: Math.round(ride.elevation_gain ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getLongestRides(limit = 3): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const rides: any[] = [];
  try {
    // Two pages is 400 activities — enough to hold the longest rides, and it
    // costs two round trips instead of five.
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(`${API}/athlete/activities?per_page=200&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) break;
      rides.push(...list.filter((a: any) => a.type === "Ride" || a.type === "VirtualRide" || a.type === "EBikeRide"));
      if (list.length < 200) break;
    }
  } catch {
    return [];
  }

  return rides
    .sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))
    .slice(0, limit)
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      distanceKm: Math.round((a.distance ?? 0) / 100) / 10,
      movingMin: Math.round((a.moving_time ?? 0) / 60),
      date: a.start_date_local ?? "",
      type: a.type ?? "",
      polyline: a.map?.summary_polyline || null,
    }));
}

export async function getRecentActivities(limit = 3): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API}/athlete/activities?per_page=30`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list
      .filter((a: any) => a.type === "Ride" || a.type === "VirtualRide" || a.type === "EBikeRide")
      .slice(0, limit)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        distanceKm: Math.round((a.distance ?? 0) / 100) / 10,
        movingMin: Math.round((a.moving_time ?? 0) / 60),
        date: a.start_date_local ?? "",
        type: a.type ?? "",
        polyline: a.map?.summary_polyline || null,
      }));
  } catch {
    return [];
  }
}
