import Link from "next/link";
import type { CaseStudy as Case, HandNote, MarginNote, Section } from "@/content/work/types";
import Spans from "./Spans";
import Pile from "./Pile";

/**
 * A case study rendered as an annotated document: a margin rail of notes, a
 * measure of body text, and an annotation field for handwriting. All styling
 * lives in app/case.css under `.case`.
 */

function Notes({ notes }: { notes?: MarginNote[] }) {
  if (!notes?.length) return null;
  return (
    <>
      {notes.map((n, i) => (
        <div key={i} className={n.quiet ? "note note--quiet" : "note"} style={i === 0 ? { marginTop: 28 } : undefined}>
          <Spans spans={n.text} />
        </div>
      ))}
    </>
  );
}

function Hand({ hand }: { hand?: HandNote }) {
  if (!hand) return null;
  const from = hand.inkFrom ?? hand.lines.length;
  return (
    <div className="hand" style={{ marginTop: hand.offsetTop ?? 0 }} aria-hidden="true">
      {hand.lines.map((line, i) => (
        <span key={i} className={i >= from ? "hand--ink" : undefined}>
          {line}
          {i < hand.lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

/** The margin rail: the numeral, the label, and the notes that argue with the
 *  section beside them — one grid cell, not three. */
function Rail({ n, label, notes }: { n: string; label: string; notes?: MarginNote[] }) {
  return (
    <div className="rail">
      <div className="num">{n}</div>
      <div className="label" style={{ marginTop: 10 }}>{label}</div>
      <Notes notes={notes} />
    </div>
  );
}

function Body({ section }: { section: Extract<Section, { kind: "prose" | "spec" }> }) {
  return (
    <>
      <h2>{section.heading}</h2>
      {section.body.map((p, i) => (
        <p key={i} style={i === 0 ? { marginTop: 14 } : undefined}>
          <Spans spans={p} />
        </p>
      ))}
    </>
  );
}

function Block({ section }: { section: Section }) {
  switch (section.kind) {
    case "prose":
      return (
        <section className="row">
          <Rail n={section.n} label={section.label} notes={section.notes} />
          <div className={section.rule ? "body rule" : "body"}>
            <Body section={section} />
          </div>
          <div className="side"><Hand hand={section.hand} /></div>
        </section>
      );

    case "spec":
      return (
        <section className="row">
          <Rail n={section.n} label={section.label} notes={section.notes} />
          <div className="body">
            <Body section={section} />
            <div className="spec">
              {section.rows.map((r) => (
                <div key={r.key}>
                  <span className="k">{r.key}</span>
                  <span className="v"><Spans spans={r.value} /></span>
                </div>
              ))}
            </div>
          </div>
          <div className="side"><Hand hand={section.hand} /></div>
        </section>
      );

    case "decisions":
      return (
        <section className="row">
          <Rail n={section.n} label={section.label} notes={section.notes} />
          <div className="body">
            <h2>{section.heading}</h2>
            {section.items.map((d) => (
              <div className="decision" key={d.label}>
                <div className="d-label">{d.label}</div>
                <h4>{d.title}</h4>
                {d.body.map((p, i) => <p key={i}><Spans spans={p} /></p>)}
                <div className="tradeoff"><Spans spans={d.tradeoff} /></div>
              </div>
            ))}
          </div>
          <div className="side"><Hand hand={section.hand} /></div>
        </section>
      );

    case "pile":
      return (
        <div className="row">
          <div className="rail"><Notes notes={section.notes} /></div>
          <div className="body bleed">
            <Pile items={section.items} title={section.title} count={section.count} help={section.help} />
          </div>
        </div>
      );

    case "plates":
      return (
        <section className="row">
          <div className="rail">
            {section.label && <div className="label">{section.label}</div>}
            <Notes notes={section.notes} />
          </div>
          <div className="body bleed">
            {section.heading && <h2>{section.heading}</h2>}
            <div className="plates">
              {section.items.map((p, i) => (
                <figure key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="plate" src={p.src} alt={p.alt} loading="lazy" />
                  <figcaption>
                    <span className="pl">{p.pl}</span>
                    <span><Spans spans={p.caption} /></span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );

    case "marker":
      return (
        <div className="spread">
          <div className="ghost2" aria-hidden="true">{section.ghost}</div>
          <div className="marker">
            {section.lines.map((line, i) => (
              <span key={i}><Spans spans={line} />{i < section.lines.length - 1 && <br />}</span>
            ))}
          </div>
        </div>
      );
  }
}

export default function CaseStudyPage({ data }: { data: Case }) {
  return (
    <main className="case">
      <div className="sheet">
        <div className="mast row">
          <div className="rail">
            <Link className="backlink" href="/#case-files"><span>←</span> Case Files</Link>
          </div>
          <div className="body" />
          <div className="side" style={{ textAlign: "right" }}>
            <span className="label">{data.fileNo}</span>
          </div>
        </div>

        <div className="row title-block">
          <div className="rail">
            <div className="num">{data.fileNo.match(/\d+/)?.[0] ?? "001"}</div>
            <div className="label" style={{ marginTop: 12 }}>Case study</div>
            <div className="label" style={{ marginTop: 4 }}>{data.years}</div>
          </div>
          <div className="body wide">
            <h1>{data.title}</h1>
            <p className="result"><Spans spans={data.result} /></p>
            <p className="subtitle">{data.subtitle}</p>
          </div>
        </div>

        <div className="row">
          <div className="rail" />
          <div className="body wide">
            <div className="fields">
              {data.fields.map((f) => (
                <div key={f.key}>
                  <span className="k">{f.key}</span>
                  <span className="v">
                    {f.key === "Live" ? (
                      <a href="https://ukrainska15.com" target="_blank" rel="noopener noreferrer">
                        <Spans spans={f.value} />
                      </a>
                    ) : (
                      <Spans spans={f.value} />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The lead, overprinted on the argument it summarises. */}
        <div className="row lead-wrap">
          <div className="rail">
            <div className="note"><strong>The short version</strong> — read this, then stop if you like.</div>
            <div className="note note--quiet">Everything below is the same argument, at length and with evidence.</div>
          </div>
          <div className="body wide">
            <div className="ghost" aria-hidden="true">{data.lead.ghost}</div>
            <p className="lead">
              {data.lead.red} <span className="q">{data.lead.ink}</span>
            </p>
          </div>
        </div>

        <div className="row">
          <div className="rail"><div className="label label--ink" style={{ paddingTop: 24 }}>Outcome</div></div>
          <div className="body outcome wide">
            <div className="grid">
              {data.outcome.stats.map((s) => (
                <div className="stat" key={s.caption}>
                  <div className="n">{s.n}{s.sup && <small>{s.sup}</small>}</div>
                  <span className="c">{s.caption}</span>
                </div>
              ))}
            </div>
            <div className="award-stamps">
              {data.outcome.stamps.map((s, i) => {
                if ("seal" in s)
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img key={i} className="seal" src={`/stamps/awards/${s.seal}.png`} alt={s.label} style={{ aspectRatio: s.ratio }} />;
                if ("mask" in s)
                  return (
                    <span
                      key={i}
                      className="seal seal--mask"
                      role="img"
                      aria-label={s.label}
                      style={{
                        aspectRatio: s.ratio,
                        WebkitMaskImage: `url(/stamps/awards/${s.mask}.webp)`,
                        maskImage: `url(/stamps/awards/${s.mask}.webp)`,
                      }}
                    />
                  );
                return <span className="stamp" key={i}>{s.text}</span>;
              })}
            </div>
          </div>
        </div>

        {data.sections.map((s, i) => <Block key={i} section={s} />)}

        <div className="row">
          <div className="rail" />
          <div className="body casenav" style={{ gridColumn: "2 / 4" }}>
            <Link href="/#case-files"><span>←</span> All case files</Link>
            {data.next && <Link href={data.next.href}>{data.next.label} <span>→</span></Link>}
          </div>
        </div>
      </div>
    </main>
  );
}
