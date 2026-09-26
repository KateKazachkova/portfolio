// The page side of the room's scripts (bake.mjs, check-stops.mjs): walks
// the CSS room and returns every plane with its matrix, run in the page as
// `(${collect})(SIG_SRC)`. Also leaves window.__bk (bake poses) and
// window.__bkState (the room at another stop) behind.
export function collect(SIG) {
  // eslint-disable-next-line no-new-func
  const sig = new Function("el", "u", SIG);
  const stageEl = document.querySelector(".case-stage");
  const S = stageEl.getBoundingClientRect();
  const u = S.width / 1118;
  const world = document.querySelector(".desk-world");
  const W = world.getBoundingClientRect();
  const px = (v) => parseFloat(v) || 0;
  // offsetLeft/Top are whole px; the layout is not. Measure every element's
  // place in its offset parent with all transforms off.
  const off = new Map(), size = new Map();
  const measure = () => {
    off.clear(); size.clear();
    const st = document.createElement("style");
    st.textContent = "html.bk-flatten *, html.bk-flatten *::before, html.bk-flatten *::after { transform: none !important; translate: none !important; rotate: none !important; scale: none !important; } html.bk-notrans *, html.bk-notrans *::before, html.bk-notrans *::after { transition: none !important; }";
    document.head.appendChild(st);
    document.documentElement.classList.add("bk-flatten", "bk-notrans");
    for (const el of document.querySelectorAll(".case-stage *")) {
      const p = el.offsetParent; if (!p || !(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect(), q = p.getBoundingClientRect();
      off.set(el, [r.left - q.left - p.clientLeft, r.top - q.top - p.clientTop]);
      size.set(el, [r.width, r.height]);
    }
    // back, with no transitions: the page's own would run from "none"
    document.documentElement.classList.remove("bk-flatten");
    void document.body.offsetHeight;
    getComputedStyle(document.querySelector(".scene-cam") ?? document.body).transform;
    document.documentElement.classList.remove("bk-notrans");
    st.remove();
  };
  measure();
  // an element's own transform in its offset parent's frame (as export.mjs)
  const local = (el) => {
    const cs = getComputedStyle(el);
    const o = cs.transformOrigin.split(" ").map(px);
    const at = off.get(el) ?? [el.offsetLeft, el.offsetTop];
    let m = new DOMMatrix().translate(at[0], at[1], 0).translate(o[0], o[1], o[2] || 0);
    if (cs.translate && cs.translate !== "none") { const t = cs.translate.split(" ").map(px); m = m.translate(t[0] || 0, t[1] || 0, t[2] || 0); }
    if (cs.rotate && cs.rotate !== "none") { const r = cs.rotate.trim(); const a = parseFloat(r.split(" ").pop()); if (/^[xyz] /.test(r)) { const ax = r[0]; m = m.rotate(ax === "x" ? a : 0, ax === "y" ? a : 0, ax === "z" ? a : 0); } else if (r.split(" ").length === 4) { const [x, y, z] = r.split(" ").map(parseFloat); m = m.rotateAxisAngle(x, y, z, a); } else m = m.rotate(0, 0, a); }
    if (cs.scale && cs.scale !== "none") { const s = cs.scale.split(" ").map(parseFloat); m = m.scale(s[0], s[1] ?? s[0], s[2] ?? 1); }
    if (cs.transform && cs.transform !== "none") m = m.multiply(new DOMMatrix(cs.transform));
    return m.translate(-o[0], -o[1], -(o[2] || 0));
  };
  const F = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  const grouping = (cs) => +cs.opacity < 1 || cs.filter !== "none" || cs.overflow !== "visible" || cs.clipPath !== "none" || cs.mixBlendMode !== "normal" || cs.isolation === "isolate" || (cs.maskImage && cs.maskImage !== "none");
  const flatOf = (el) => getComputedStyle(el).transformStyle !== "preserve-3d" || grouping(getComputedStyle(el));
  const worldOf = (el, root) => {
    const chain = []; let n = el;
    while (n && n !== root) { chain.unshift(n); n = n.offsetParent; }
    if (n !== root) return null;
    let m = new DOMMatrix(); let parent = root;
    for (const c of chain) { if (parent !== root && flatOf(parent)) m = m.multiply(F); m = m.multiply(local(c)); parent = c; }
    return m;
  };
  // a plane flattened into another has no depth of its own (its z column is
  // 0): give it its normal, so it can be turned back flat
  const invert = (m) => {
    const a = Array.from(m.toFloat64Array());
    const x = [a[0], a[1], a[2]], y = [a[4], a[5], a[6]];
    const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
    const zl = Math.hypot(...z), zc = Math.hypot(a[8], a[9], a[10]);
    if (zc < 1e-6 && zl > 1e-9) { a[8] = z[0] / zl; a[9] = z[1] / zl; a[10] = z[2] / zl; }
    return new DOMMatrix(a).inverse();
  };
  const clsOf = (el) => (el.className?.baseVal ?? el.className ?? "").toString().trim();
  const units = []; let order = 0;
  const hasBorder = (cs) => ["Top", "Right", "Bottom", "Left"].some((k) => px(cs[`border${k}Width`]) > 0 && cs[`border${k}Style`] !== "none");
  const painted = (p) => p.content !== "none" && p.content !== "normal";
  const urlsOf = (bg) => [...bg.matchAll(/url\("?([^")]+)"?\)/g)].map((x) => x[1].replace(location.origin, ""));
  // the picture an element's own box shows, if that is all its box shows
  // (its pseudo-elements and children aside)
  const ownPicture = (el, cs) => {
    const plain = cs.filter === "none" && cs.boxShadow === "none" && +cs.opacity === 1 && cs.borderRadius.split(" ").every((r) => px(r) === 0) && cs.mixBlendMode === "normal" && cs.clipPath === "none" && !hasBorder(cs);
    if (!plain) return null;
    if (el.tagName === "IMG") return (cs.objectFit === "fill" || !cs.objectFit) && el.currentSrc ? { kind: "img", src: el.currentSrc.replace(location.origin, "") } : null;
    const bg = cs.backgroundImage, urls = urlsOf(bg);
    if (cs.backgroundColor !== "rgba(0, 0, 0, 0)") return null;
    if (urls.length === 1 && !bg.includes("gradient") && cs.backgroundSize === "100% 100%") return { kind: "bg", src: urls[0] };
    // the desk's top: its plate under the tile lines, drawn by a shader
    if (el.classList.contains("desk-top") && urls.length === 1 && cs.backgroundBlendMode.startsWith("multiply")) {
      const sz = cs.backgroundSize.split(",")[0].trim().split(" ").map(px), pos = cs.backgroundPosition.split(",").map((q) => q.trim().split(" ").map(px));
      const line = px(bg.match(/rgb\(58, 60, 74\) ([\d.]+)px, rgba/)?.[1]);
      return { kind: "grid", src: urls[0], grid: [line, sz[0], pos[0][0], pos[1][1]] };
    }
    return null;
  };
  const textOf = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const add = (el, mode, pic) => {
    const cs = getComputedStyle(el);
    const m = worldOf(el, world); if (!m) return;
    const i = units.length;
    if (!mode.startsWith("pseudo")) el.dataset.bk = i;
    else el.dataset["bk" + mode.slice(7)] = i;
    const r = el.getBoundingClientRect();
    const sz = size.get(el) ?? [el.offsetWidth, el.offsetHeight];
    const ps = mode.startsWith("pseudo") ? getComputedStyle(el, "::" + mode.slice(7)) : null;
    const anc = []; for (let n = el; n && n !== world; n = n.parentElement) anc.push(clsOf(n));
    units.push({ i, mode, anc: anc.join(" "), back: cs.backfaceVisibility === "hidden", cls: clsOf(el) + (ps ? "::" + mode.slice(7) : ""), tag: el.tagName.toLowerCase(), w: sz[0], h: sz[1], m: Array.from(m.toFloat64Array()),
      op: ps ? 1 : +cs.opacity, blend: ps ? ps.mixBlendMode : cs.mixBlendMode, order: order++, kind: pic?.kind ?? "tex", src: pic?.src, grid: pic?.grid,
      smooth: ps ? !ps.backgroundImage.includes("url(") : false, rect: ps ? null : { x: r.x, y: r.y, w: r.width, h: r.height } });
  };
  // A flat plane is baked whole, unless its own box is a plain picture (the
  // wall, a desk plate): then that picture is drawn as it is, and what lies
  // on it — its pseudo-elements, its children — is baked on its own, in the
  // same plane, in paint order.
  const flatUnit = (c) => {
    const cs = getComputedStyle(c);
    const pic = ownPicture(c, cs);
    if (!pic) return add(c, "all");
    add(c, "own", pic);
    const pb = getComputedStyle(c, "::before"), pa = getComputedStyle(c, "::after");
    if (painted(pb)) add(c, "pseudo:before");
    if (textOf(c)) return; // its own text: bake it whole after all
    for (const k of c.children) { if (k instanceof HTMLElement && getComputedStyle(k).display !== "none") flatUnit(k); }
    if (painted(pa)) add(c, "pseudo:after");
  };
  const visit = (el) => {
    for (const c of el.children) {
      if (!(c instanceof HTMLElement)) continue;
      const cs = getComputedStyle(c);
      if (cs.display === "none") continue;
      // the flat groups mirrored live at runtime
      if (c.classList.contains("flip-clock-slot") || c.classList.contains("desk-lamp")) continue;
      const p3 = cs.transformStyle === "preserve-3d" && !grouping(cs);
      if (p3) { add(c, "own", ownPicture(c, cs) && ![...c.children].some((k) => k instanceof SVGElement) && !painted(getComputedStyle(c, "::before")) && !painted(getComputedStyle(c, "::after")) ? ownPicture(c, cs) : null); visit(c); }
      else flatUnit(c);
    }
  };
  visit(world);

  // the flat groups: every element that paints something other than a
  // picture or its own text is baked, by signature
  const flat = [];
  const groups = [["case", document.querySelector(".case-world")], ["clock", document.querySelector(".flip-clock-slot")], ["lamp", document.querySelector(".desk-lamp")]];
  const seen = new Set();
  for (const [group, g] of groups) {
    if (!g) continue;
    for (const el of [g, ...g.querySelectorAll("*")]) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "PICTURE" || el.tagName === "SOURCE") continue;
      if (el.closest(".inktip, .katetalk, .hanger-tag")) continue;
      const pb = getComputedStyle(el, "::before"), pa = getComputedStyle(el, "::after");
      const paints = cs.backgroundImage !== "none" || cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.boxShadow !== "none" ||
        cs.borderStyle.split(" ").some((s) => s !== "none" && s !== "hidden") || (pb.content !== "none" && pb.content !== "normal") || (pa.content !== "none" && pa.content !== "normal") || el instanceof SVGElement;
      if (!paints) continue;
      const s = sig(el, u);
      if (seen.has(s)) continue;
      seen.add(s);
      const i = 10000 + flat.length;
      el.dataset.bk = i;
      flat.push({ i, group, sig: s, cls: clsOf(el), kind: "tex" });
    }
  }

  const stage0 = () => { stageEl.style.removeProperty("translate"); return stageEl.getBoundingClientRect(); };
  const only = (i, cls) => {
    document.documentElement.classList.add("bk");
    document.querySelectorAll(".bk-on, .bk-anc").forEach((e) => e.classList.remove("bk-on", "bk-own", "bk-flat", "bk-anc", "bk-psb", "bk-psa", "bk-nops"));
    const el = document.querySelector(`[data-bk="${i}"]`);
    el.classList.add("bk-on", ...cls);
    return el;
  };
  const groupRoot = (el) => el.closest(".flip-clock-slot, .desk-lamp, .case-world");
  window.__bk = {
    // the world turned so plane i lies flat at 1:1, its local (0, 0) at the
    // stage's top-left
    pose(i, mode) {
      const ps = mode.startsWith("pseudo");
      const sel = ps ? `[data-bk${mode.slice(7)}="${i}"]` : `[data-bk="${i}"]`;
      document.documentElement.classList.add("bk");
      document.querySelectorAll(".bk-on, .bk-anc").forEach((e) => e.classList.remove("bk-on", "bk-own", "bk-flat", "bk-anc", "bk-psb", "bk-psa", "bk-nops"));
      const el = document.querySelector(sel);
      el.classList.add("bk-on", ...(mode === "own" ? ["bk-own"] : []), ...(ps ? [mode === "pseudo:before" ? "bk-psb" : "bk-psa"] : []));
      this.cur = el;
      world.style.setProperty("transform", invert(worldOf(el, world)).toString(), "important");
      this.s0 = stage0();
      return 1;
    },
    // a flat group's element on its own, its group's local (0, 0) at the
    // stage's top-left (the case is there already; the clock and the lamp
    // are turned flat like a plane)
    flatPose(i) {
      const el = only(i, ["bk-flat"]);
      for (let a = el.parentElement; a; a = a.parentElement) a.classList.add("bk-anc");
      const g = groupRoot(el);
      if (g.classList.contains("case-world")) world.style.removeProperty("transform");
      else world.style.setProperty("transform", invert(worldOf(g, world)).toString(), "important");
      this.s0 = stage0();
      return 1;
    },
    // local (x, y) of the current pose to the window's (vx, vy)
    shift(vx, vy, x, y) { stageEl.style.setProperty("translate", `${vx - x - this.s0.left}px ${vy - y - this.s0.top}px`); return 1; },
    // what the element draws, in its pose's local px; for a flat element
    // also its own box there
    bounds(i, flatEl) {
      const el = flatEl ? document.querySelector(`[data-bk="${i}"]`) : this.cur;
      const base = stageEl.getBoundingClientRect();
      const own = flatEl || ["bk-own", "bk-psb", "bk-psa"].some((c) => el.classList.contains(c));
      // a plane that paints nothing of its own (a wall's hanging layer) is
      // only as big as what it holds
      const bare = (e) => { const c = getComputedStyle(e); return c.backgroundImage === "none" && c.backgroundColor === "rgba(0, 0, 0, 0)" && c.boxShadow === "none" && !hasBorder(c) && !textOf(e) && !painted(getComputedStyle(e, "::before")) && !painted(getComputedStyle(e, "::after")); };
      const els = own ? [el] : [el, ...el.querySelectorAll("*")].filter((e) => !bare(e) || e.tagName === "IMG" || e instanceof SVGElement || e.tagName === "VIDEO" || e.tagName === "CANVAS");
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const e of els) { const cs = getComputedStyle(e); if (cs.display === "none") continue; const r = e.getBoundingClientRect(); if (r.width < 0.01 && r.height < 0.01) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
      if (x0 > x1) return null;
      const er = el.getBoundingClientRect();
      return { x: x0 - base.left, y: y0 - base.top, w: x1 - x0, h: y1 - y0, ex: er.left - base.left, ey: er.top - base.top, ew: er.width, eh: er.height };
    },
  };
  // The room in another state of the page (html[data-desk…]): where each
  // plane is, how opaque, whether shown — the CSS's own rules applied at
  // once, no transitions, no animations.
  const stateCss = document.createElement("style");
  stateCss.textContent = "html.bk-state *, html.bk-state *::before, html.bk-state *::after { transition: none !important; animation: none !important; }";
  document.head.appendChild(stateCss);
  const root = document.documentElement;
  const base = { desk: root.dataset.desk, focus: root.dataset.deskFocus, arrived: root.dataset.deskArrived };
  const setAttr = (k, v) => { if (v === undefined) delete root.dataset[k]; else root.dataset[k] = v; };
  window.__bkState = (desk, focus, arrived) => {
    root.classList.add("bk-state");
    setAttr("desk", desk); setAttr("deskFocus", focus); setAttr("deskArrived", arrived);
    void document.body.offsetHeight;
    measure();
    const res = units.map((it) => {
      const el = document.querySelector(it.mode.startsWith("pseudo") ? `[data-bk${it.mode.slice(7)}="${it.i}"]` : `[data-bk="${it.i}"]`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      let op = it.mode.startsWith("pseudo") ? 1 : +cs.opacity;
      for (let n = el.parentElement; n && n !== world; n = n.parentElement) op *= +getComputedStyle(n).opacity;
      const m = worldOf(el, world);
      return { m: m ? Array.from(m.toFloat64Array()) : null, op, vis: cs.visibility !== "hidden" && cs.display !== "none" };
    });
    setAttr("desk", base.desk); setAttr("deskFocus", base.focus); setAttr("deskArrived", base.arrived);
    root.classList.remove("bk-state");
    void document.body.offsetHeight;
    measure();
    return res;
  };
  const groupM = {};
  for (const [k, sel] of [["clock", ".flip-clock-slot"], ["lamp", ".desk-lamp"]]) { const g = document.querySelector(sel); if (g) groupM[k] = Array.from(worldOf(g, world).toFloat64Array()); }
  return { groupM, u, stage: { left: S.left, top: S.top, width: S.width, height: S.height }, world: { left: W.left, top: W.top }, units, flat };
}
