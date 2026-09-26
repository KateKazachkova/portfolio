/**
 * What a flat element looks like, as one string: the key the bake stores
 * a flat group's non-picture paint under (scripts/room/bake.mjs) and the
 * room finds it by at runtime (components/room/mirror.ts). Kept as source
 * so both run the very same code in the page.
 */
export const SIG_SRC = `
  const cs = getComputedStyle(el), b = getComputedStyle(el, "::before"), a = getComputedStyle(el, "::after");
  const o = location.origin;
  const strip = (s) => (s || "").split(o).join("");
  const pseudo = (p) => p.content === "none" || p.content === "normal" ? "" : [p.content, strip(p.backgroundImage), p.backgroundColor, p.width, p.height, p.filter].join(";");
  return [el.tagName, (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().trim(),
    strip(cs.backgroundImage), cs.backgroundColor, cs.backgroundSize, cs.backgroundPosition, cs.borderRadius, cs.boxShadow, cs.borderTopWidth + cs.borderTopStyle + cs.borderTopColor, cs.filter,
    pseudo(b), pseudo(a)].join("|");
`;

export const signature = new Function("el", "u", SIG_SRC) as (el: Element, u: number) => string;
