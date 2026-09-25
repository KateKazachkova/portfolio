import { getRides } from "@/lib/strava";
import { polylineToSvgPath } from "@/lib/polyline";

/** What the bike computer on home's desk shows: the ride totals and the
 *  three longest rides, each with its track already drawn as a path.
 *  Home is a client page, so it asks here rather than calling Strava. The
 *  answer is kept for a day; when Strava fails, getRides throws and the
 *  last good answer stays in the cache (lib/strava.ts). */
export const revalidate = 86400;

export async function GET() {
  const { stats, rides } = await getRides(3);
  return Response.json({
    stats,
    rides: rides.map((r) => ({
      id: r.id, name: r.name, distanceKm: r.distanceKm, movingMin: r.movingMin, date: r.date,
      path: r.polyline ? polylineToSvgPath(r.polyline) : null,
    })),
  });
}
