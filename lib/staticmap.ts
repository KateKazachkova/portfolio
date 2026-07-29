// Build a Mapbox Static Images URL with the route polyline overlaid.
// Returns null if no token is configured (caller falls back to the SVG line).
export function buildStaticMapUrl(
  encodedPolyline: string,
  opts: { width?: number; height?: number; style?: string } = {}
): string | null {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || !encodedPolyline) return null;

  const { width = 500, height = 500, style = "light-v11" } = opts;

  // Path overlay: path-{strokeWidth}+{hexColor}-{opacity}(url-encoded polyline)
  const stroke = "e8212e"; // brand red
  const overlay = `path-4+${stroke}-0.9(${encodeURIComponent(encodedPolyline)})`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `${overlay}/auto/${width}x${height}@2x?padding=24&access_token=${token}`
  );
}
