const TOKEN_URL = "https://www.strava.com/oauth/token";
const API = "https://www.strava.com/api/v3";

async function getAccessToken(): Promise<string | null> {
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
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export type StravaStats = {
  runs: number;
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
};

export async function getRunStats(): Promise<StravaStats> {
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
    const run = d.all_run_totals ?? {};
    return {
      runs: run.count ?? 0,
      distanceKm: Math.round((run.distance ?? 0) / 1000),
      timeHours: Math.round((run.moving_time ?? 0) / 3600),
      elevationM: Math.round(run.elevation_gain ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getRecentActivities(limit = 3): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API}/athlete/activities?per_page=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list.map((a: any) => ({
      id: a.id,
      name: a.name,
      distanceKm: Math.round((a.distance ?? 0) / 100) / 10,
      movingMin: Math.round((a.moving_time ?? 0) / 60),
      date: a.start_date_local ?? "",
      type: a.type ?? "",
    }));
  } catch {
    return [];
  }
}
