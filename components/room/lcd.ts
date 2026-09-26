/**
 * The bike computer's screen for the WebGL room (M4): what BikeComputer's
 * LCD shows — the Strava totals, then the longest rides — live from the
 * room's state (state.ts), drawn onto a canvas WebGL lays over the unit
 * (engine.ts: the bake leaves the unit's own screen blank).
 *
 * The layout is the page's own: an unseen copy of the LCD in BikeComputer's
 * markup and classes (globals.css .bike__*) is laid out by the browser, and
 * its text, rules and the ride's map are drawn where it put them.
 */
import { bikePages, bikeRide, onRoom, roomState, type RoomState } from "./state";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "");

/** BikeComputer's LCD, as markup */
function lcdHtml(s: RoomState): string {
  const d = s.strava, pages = bikePages(s), page = s.bikePage;
  const bar = `<div class="bike__bar"><span>${page === 0 ? "ODO" : `LONG ${page}/${pages - 1}`}</span><span>KATE™</span></div>`;
  if (!d) return bar + `<div class="bike__wait">SEARCHING<br>GPS…</div>`;
  if (page === 0) {
    const t = d.stats;
    if (!t) return bar + `<div class="bike__wait">NO SIGNAL</div>`;
    return bar + `<div class="bike__field bike__field--big"><span class="bike__k">TOTAL DIST</span><span class="bike__v">${t.distanceKm}<small>km</small></span></div>`
      + `<div class="bike__grid"><div class="bike__field"><span class="bike__k">RIDES</span><span class="bike__v">${t.rides}</span></div>`
      + `<div class="bike__field"><span class="bike__k">TIME</span><span class="bike__v">${t.timeHours}<small>h</small></span></div>`
      + `<div class="bike__field bike__field--wide"><span class="bike__k">ASCENT</span><span class="bike__v">${t.elevationM}<small>m</small></span></div></div>`;
  }
  const r = bikeRide(s);
  if (!r) return bar;
  return bar + (r.path ? `<svg class="bike__map" viewBox="0 0 100 100"><path d="${esc(r.path)}"/></svg>` : "")
    + `<div class="bike__grid"><div class="bike__field"><span class="bike__k">DIST</span><span class="bike__v">${r.distanceKm}<small>km</small></span></div>`
    + `<div class="bike__field"><span class="bike__k">TIME</span><span class="bike__v">${hm(r.movingMin)}</span></div></div>`
    + `<div class="bike__date">${day(r.date)}</div>`;
}

export type Lcd = { canvas: HTMLCanvasElement; onChange(f: () => void): void; dispose(): void };

/** w, h: the LCD's box in u; px: canvas px per u */
export function makeLcd(w: number, h: number, px = 10): Lcd {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * px); canvas.height = Math.round(h * px);
  const ctx = canvas.getContext("2d")!;
  // the unseen copy, at 1 u = px CSS px (its --u), laid out by the page's CSS
  const host = document.createElement("div");
  host.className = "bike room-lcd";
  host.setAttribute("aria-hidden", "true");
  // (its box: the LCD is 48.5 % × 44.1 % of the unit)
  const bw = w / 0.485, bh = h / 0.441;
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", width: `${bw * px}px`, height: `${bh * px}px`, visibility: "hidden", pointerEvents: "none" });
  host.style.setProperty("--u", `${px}px`);
  const lcd = document.createElement("div");
  lcd.className = "bike__lcd";
  host.appendChild(lcd);
  document.body.appendChild(host);
  let listener: (() => void) | null = null;

  const draw = () => {
    const box = lcd.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / box.width, sy = canvas.height / box.height;
    const at = (x: number, y: number) => [(x - box.left) * sx, (y - box.top) * sy];
    const opacityOf = (el: Element) => { let o = 1; for (let n: Element | null = el; n && n !== host; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
    // the rules: the bar's foot, the grid's head
    for (const el of lcd.querySelectorAll<HTMLElement>(".bike__bar, .bike__grid")) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      ctx.fillStyle = cs.borderBottomColor;
      const bb = parseFloat(cs.borderBottomWidth), bt = parseFloat(cs.borderTopWidth);
      if (bb) { const [x, y] = at(r.left, r.bottom - bb); ctx.fillRect(x, y, r.width * sx, bb * sy); }
      if (bt) { const [x, y] = at(r.left, r.top); ctx.fillRect(x, y, r.width * sx, bt * sy); }
    }
    // the ride's map, whole (the page draws it in over 1.6 s)
    const svg = lcd.querySelector("svg.bike__map"), path = svg?.querySelector("path");
    if (svg && path) {
      const r = svg.getBoundingClientRect(), cs = getComputedStyle(path);
      const k = Math.min(r.width, r.height) / 100;
      const [x, y] = at(r.left + (r.width - 100 * k) / 2, r.top + (r.height - 100 * k) / 2);
      ctx.save();
      ctx.translate(x, y); ctx.scale(k * sx, k * sy);
      ctx.strokeStyle = getComputedStyle(svg).color; ctx.lineWidth = parseFloat(cs.strokeWidth) || 2.2;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.stroke(new Path2D(path.getAttribute("d") ?? ""));
      ctx.restore();
    }
    // the text, run by run where the page set it
    const walker = document.createTreeWalker(lcd, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement!;
      const text = (n.textContent ?? "").trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()];
      // (a text node broken over lines: each line's part — SEARCHING / GPS)
      const parts = rects.length > 1 ? (n.textContent ?? "").split(/\n|(?<=\S)\s+(?=\S)/).filter(Boolean) : [text];
      ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * sy}px ${cs.fontFamily}`;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${(parseFloat(cs.letterSpacing) || 0) * sx}px`;
      ctx.fillStyle = cs.color;
      ctx.globalAlpha = opacityOf(el);
      ctx.textBaseline = "alphabetic";
      const tt = cs.textTransform === "uppercase" ? (s: string) => s.toUpperCase() : (s: string) => s;
      rects.forEach((r, i) => {
        const s = tt(parts[i] ?? text);
        const m = ctx.measureText(s);
        // the line box's baseline: its middle less half the font's own box
        const [x, y] = at(r.left, r.top + r.height / 2);
        ctx.fillText(s, x, y + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2);
      });
      ctx.globalAlpha = 1;
    }
    listener?.();
  };
  const render = (s: RoomState) => {
    lcd.innerHTML = lcdHtml(s);
    // the page's fonts first, or the first draw is in the fallback
    document.fonts.ready.then(draw);
  };
  const off = onRoom(render);
  render(roomState());
  return {
    canvas,
    onChange(f) { listener = f; },
    dispose() { off(); host.remove(); },
  };
}
