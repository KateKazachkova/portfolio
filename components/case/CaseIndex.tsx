import Link from "next/link";
import CASES from "@/content/work";
import type { CaseStudy, Para } from "@/content/work/types";
import { StackDressing } from "@/components/desk/CaseStack";
import { U15File } from "@/components/desk/U15File";
import "./CaseIndex.css";

/**
 * Case Studies (/work): every case file there is, one level above each case
 * — the crumbs' first step. The notebook page the cases are written on, and
 * on it the files as they lie on home's desk (the same components, flat and
 * closed), each signed under it in hand. A click goes straight to the case:
 * here Ukrainska 15's folder doesn't open. BulkSource, one stack on the
 * desk, lies here as its folders, one card each.
 */

/** A field's words without its annotation: a TK says nothing yet. */
const plain = (p: Para) => p.map((s) => (typeof s === "string" ? s : "tk" in s ? "" : Object.values(s)[0])).join("").trim();
/** "File 004" of "File 004 · BulkSource" */
const fileOf = (c: CaseStudy) => c.fileNo.split(" · ")[0];

export default function CaseIndex() {
  const all = Object.values(CASES);
  const groups = [...new Set(all.map((c) => c.parent).filter(Boolean))] as string[];
  return (
    <main className="case case-index">
      <div className="sheet">
        <div className="mast">
          <nav className="crumbs" aria-label="Breadcrumb">
            <span aria-current="page">Case Studies</span>
          </nav>
          <span>{all.length} files</span>
        </div>

        <div className="row title-block">
          <div className="rail" />
          <div className="body wide">
            <h1>Case Studies</h1>
            <p className="subtitle">Every case file I have, as it lies on the desk: the written ones and those still being written.</p>
          </div>
        </div>

        <div className="row">
          <div className="rail" />
          <div className="body wide">
            <ul className="ci-grid">
              {all.filter((c) => !c.parent).map((c) => <File key={c.slug} c={c} />)}
            </ul>
            {groups.map((g) => (
              <section key={g} className="ci-group" aria-labelledby={`ci-${g}`}>
                <h2 id={`ci-${g}`}>{g}</h2>
                <ul className="ci-grid ci-grid--group">
                  {all.filter((c) => c.parent === g).map((c, i) => <File key={c.slug} c={c} i={i} />)}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/** One file: the object, its name under it in hand, and the link over both. */
function File({ c, i = 0 }: { c: CaseStudy; i?: number }) {
  const years = c.years === "TK" ? null : c.years;
  return (
    <li className="ci-file">
      <div className="ci-obj" aria-hidden inert>
        {c.slug === "ukrainska-15" ? <U15File x={AT.x} y={AT.y} r={-3} still />
          : c.parent ? <FolderCard c={c} i={i} />
          : <Stack r={c.slug === "waypro" ? 2 : -2}><StackDressing slug={c.slug} title={c.title} flat /></Stack>}
      </div>
      <div className="ci-label">
        {/* (the pen has no en dash) */}
        <span className="ci-label__name">{c.title.replace(/[–—]/g, "-")}</span>
        <span className="ci-label__meta">{[fileOf(c), years].filter(Boolean).join(" · ")}</span>
        {c.draft && <span className="ci-label__soon">In progress</span>}
      </div>
      <Link className="ci-hit" href={`/work/${c.slug}`} aria-label={`${c.parent ? `${c.parent}: ` : ""}${c.title}${c.draft ? " (in progress)" : ""}`} />
    </li>
  );
}

// The object's centre in the stage (desk px, 360 × 270)
const AT = { x: 180, y: 135 };

/** Where a stack lies in the stage, as on the desk (DeskScene's CaseCard). */
function Stack({ r, children }: { r: number; children: React.ReactNode }) {
  return (
    <div className="desk-card desk-card--stack" style={{
      left: `calc(${AT.x} * var(--u))`, top: `calc(${AT.y} * var(--u))`, "--w": 180, "--h": 120, "--r": `${r}deg`,
    } as React.CSSProperties}>
      {children}
    </div>
  );
}

// each card at its own angle on its own spill of sand
const TILT = [-3, 2, -1.5, 3, -2.5, 1.5];
const SAND = [-8, 40, 160, -60, 110, 200];

/** One of BulkSource's folders: its library card, the stack's one, filled
 *  with what is known of it, on a spill of the stack's sand. The first has
 *  the stack's truck. */
function FolderCard({ c, i }: { c: CaseStudy; i: number }) {
  // every field a ruled line, a blank one where its words are still to come
  // (and blank ones under them, as a library card has: seven in all)
  const rows = c.fields.map((f) => ({ k: f.key, v: plain(f.value).split("\n")[0] }));
  while (rows.length < 7) rows.push({ k: "", v: "" });
  return (
    <Stack r={TILT[i % TILT.length]}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="stack-sand" src="/items/bulksource/sand.sm.webp" alt="" draggable={false} loading="lazy" decoding="async"
        style={{ transform: `translate(-46%, -56%) rotate(${SAND[i % SAND.length]}deg)` }} />
      <div className="jury-card ci-card">
        <span className="jury-card__head">
          <span>{c.title}</span>
          <span>{c.parent} · {fileOf(c)}</span>
        </span>
        {rows.map((r, n) => (
          <span key={n} className="jury-card__row ci-card__row"><span>{r.k}</span><span>{r.v}</span></span>
        ))}
      </div>
      {i === 0 && (
        <span className="stack-truck ci-truck">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="stack-top" src="/items/bulksource/truck.sm.webp" alt="" draggable={false} loading="lazy" decoding="async" />
        </span>
      )}
    </Stack>
  );
}
