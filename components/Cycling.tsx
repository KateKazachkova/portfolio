import { getRideStats, getLongestRides } from "@/lib/strava";
import { polylineToSvgPath } from "@/lib/polyline";
import { buildStaticMapUrl } from "@/lib/staticmap";
import { mono } from "@/components/ui/type";

/** Part 06 of the manual — the Strava telemetry.
 *
 *  It lives apart from the rest of the page because it is the only section
 *  that waits on a network call: the token, then the ride history. Behind a
 *  Suspense boundary the manual renders at once and the bike figures drop in
 *  when Strava answers. */
export default async function Cycling() {
  const [stats, activities] = await Promise.all([getRideStats(), getLongestRides(3)]);
  if (!stats) return null;

  return (
<Part n="06" title="Cycling – Field Telemetry">
          <div className="flex justify-end mb-4">
            <a href="https://www.strava.com/athletes/52565503" target="_blank" rel="noopener noreferrer"
              className="uppercase font-bold underline hover:no-underline text-gray-400" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
              Strava ↗
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Distance", value: `${stats.distanceKm.toLocaleString()} km` },
              { label: "Rides", value: stats.rides.toLocaleString() },
              { label: "Time", value: `${stats.timeHours.toLocaleString()} h` },
              { label: "Elevation", value: `${stats.elevationM.toLocaleString()} m` },
            ].map((s) => (
              <div key={s.label} className="border-2 p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-2xl font-black" style={{ color: "var(--fg)" }}>{s.value}</div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {activities.length > 0 && (
            <div>
              <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">Longest rides</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activities.map((a) => {
                  const mapUrl = a.polyline ? buildStaticMapUrl(a.polyline) : null;
                  const path = a.polyline ? polylineToSvgPath(a.polyline) : null;
                  return (
                    <a key={a.id} href={`https://www.strava.com/activities/${a.id}`} target="_blank" rel="noopener noreferrer"
                      className="group block border-2 overflow-hidden hover:opacity-90 transition-opacity" style={{ borderColor: "var(--border)" }}>
                      <div className="aspect-square flex items-center justify-center" style={{ background: "var(--inner)" }}>
                        {mapUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mapUrl} alt={`Route of ${a.name}`} className="w-full h-full object-cover" />
                        ) : path ? (
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d={path} fill="none" stroke="var(--accent-red)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <span className="text-xs text-gray-400">No route</span>
                        )}
                      </div>
                      <div className="p-3 border-t-2" style={{ borderColor: "var(--border)" }}>
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{a.name}</p>
                        <p style={{ fontFamily: mono, fontSize: 11 }} className="text-gray-500 mt-1">{a.distanceKm} km · {a.movingMin} min</p>
                        <p style={{ fontFamily: mono, fontSize: 10 }} className="text-gray-400 mt-0.5">
                          {a.date ? new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </Part>
  );
}

/** What stands in while Strava answers: the same frame, the figures blank. */
export function CyclingSkeleton() {
  return (
    <section className="mb-20 last:mb-0">
      <div className="flex items-baseline gap-4 mb-6 border-b-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-red)" }}>06</span>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>Cycling – Field Telemetry</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {["Distance", "Rides", "Time", "Elevation"].map((label) => (
          <div key={label} className="border-2 p-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-2xl font-black" style={{ color: "var(--faint)" }}>—</div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Part({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20 last:mb-0">
      <div className="flex items-baseline gap-4 mb-6 border-b-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-red)" }}>{n}</span>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
