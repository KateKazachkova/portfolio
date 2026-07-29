// Decode a Google/Strava encoded polyline into [lat, lng] points.
export function decodePolyline(str: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < str.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0; shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Convert an encoded polyline into an SVG path `d` string normalised to a square box.
export function polylineToSvgPath(encoded: string, size = 100, pad = 6): string | null {
  const pts = decodePolyline(encoded);
  if (pts.length < 2) return null;

  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const spanLat = maxLat - minLat || 1e-6;
  const spanLng = maxLng - minLng || 1e-6;
  const span = Math.max(spanLat, spanLng);
  const inner = size - pad * 2;

  // Centre the smaller axis
  const offX = (span - spanLng) / 2;
  const offY = (span - spanLat) / 2;

  const d = pts.map(([la, ln], i) => {
    const x = pad + (ln - minLng + offX) / span * inner;
    // flip Y: higher latitude → up
    const y = pad + (maxLat - la + offY) / span * inner;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return d;
}
