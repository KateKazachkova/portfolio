import Link from "next/link";
import type { CaseStudy as Case, HandNote, MarginNote, Para, Section } from "@/content/work/types";
import Spans from "./Spans";
import Pile from "./Pile";
import CaseTablet from "./CaseTablet";
import AwardCard from "@/components/AwardCard";
import { neighbours } from "@/content/work";

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
function Rail({ n, label, notes }: { n: string; label?: string; notes?: MarginNote[] }) {
  return (
    <div className="rail">
      <div className="num">{n}</div>
      {label && <div className="label" style={{ marginTop: 10 }}>{label}</div>}
      <Notes notes={notes} />
    </div>
  );
}

function Body({ section }: { section: { heading: string; body?: Para[] } }) {
  return (
    <>
      <h2>{section.heading}</h2>
      {section.body?.map((p, i) => (
        <p key={i} style={i === 0 ? { marginTop: 14 } : undefined}>
          <Spans spans={p} />
        </p>
      ))}
    </>
  );
}

/** The case's own award card: the outcome row, or a section that carries it. */
function CaseAwards({ data }: { data: Case }) {
  return (
    <div className="award-card-slot">
      <AwardCard project={data.title} title={data.title} sub={`${data.fileNo} · K. Kazachkova`} />
    </div>
  );
}

function Block({ section, data }: { section: Section; data: Case }) {
  switch (section.kind) {
    case "prose":
      return (
        <section className="row">
          <Rail n={section.n} label={section.label} notes={section.notes} />
          <div className={section.rule ? "body rule" : "body"}>
            <Body section={section} />
            {section.awards && <CaseAwards data={data} />}
          </div>
          <div className="side">
            <Hand hand={section.hand} />
            {section.photos?.map((ph) => (
              <figure key={ph.src} className="side-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="side-print" src={ph.src} alt={ph.alt} loading="lazy"
                  style={{ "--tilt": `${ph.tilt}deg` } as React.CSSProperties} />
                {ph.hand && (
                  <figcaption className="side-hand">
                    {/* a pen stroke from the words up to the print */}
                    <svg className="side-hand__arrow" viewBox="0 0 56 44" aria-hidden>
                      <path d="M6 40 C 14 30, 30 24, 44 8" />
                      <path d="M36 9 L 45 6 L 44 16" />
                    </svg>
                    {ph.hand}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
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
          <div className={section.rule ? "body rule" : "body"}>
            <Body section={section} />
            {section.items.map((d) => (
              <div className="decision" key={d.label}>
                <div className="d-label">{d.label}</div>
                <h4>{d.title}</h4>
                {d.body.map((p, i) => <p key={i}><Spans spans={p} /></p>)}
                {d.tradeoff && (
                  <div className="tradeoff">
                    {d.tradeoff.map((p, i) => <p key={i}><Spans spans={p} /></p>)}
                  </div>
                )}
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
  const { prev, next } = neighbours(data.slug);
  return (
    <main className="case">
      <div className="sheet">
        {/* Where the page is, and the way to the cases either side of it —
            round the ring: after the last case comes the first. */}
        <div className="mast">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/#case-files">Case Studies</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{data.title}</span>
          </nav>
          <nav className="flip" aria-label="Case studies">
            <Link className="flip__prev" href={`/work/${prev.slug}`} aria-label={`Previous case: ${prev.title}`}>←</Link>
            <Link className="flip__next" href={`/work/${next.slug}`}>
              <span className="flip__k">Next project</span> {next.title} <span aria-hidden>→</span>
            </Link>
          </nav>
        </div>

        {data.tablet && (
          <div className="row tablet-row">
            <div className="rail" />
            <div className="body wide"><CaseTablet {...data.tablet} /></div>
          </div>
        )}

        <div className="row title-block">
          <div className="rail">
            <div className="num">{data.fileNo.match(/\d+/)?.[0] ?? "001"}</div>
            <div className="label" style={{ marginTop: 12 }}>Case study</div>
            <div className="label" style={{ marginTop: 4 }}>{data.years}</div>
          </div>
          <div className="body wide">
            <div className="title-line">
              <h1>{data.title}</h1>
              {data.tablet && (
                <a className="case-live" href={data.tablet.href} target="_blank" rel="noopener noreferrer" aria-label={data.tablet.label}>
                  View the live project <span aria-hidden>↗</span>
                </a>
              )}
            </div>
            {data.result && <p className="result"><Spans spans={data.result} /></p>}
            {data.summary
              ? data.summary.map((p, i) => <p key={i} className="subtitle"><Spans spans={p} /></p>)
              : <p className="subtitle">{data.subtitle}</p>}
          </div>
        </div>

        <div className="row">
          <div className="rail" />
          <div className="body wide">
            <div className="fields" style={{ "--n": data.fields.length } as React.CSSProperties}>
              {data.fields.map((f) => (
                <div key={f.key}>
                  <span className="k">{f.key}</span>
                  <span className="v"><Spans spans={f.value} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The lead, overprinted on the argument it summarises. */}
        {data.lead && (
        <div className="row lead-wrap">
          <div className="rail">
            <div className="note"><strong>The short version</strong> – read this, then stop if you like.</div>
            <div className="note note--quiet">Everything below is the same argument, at length and with evidence.</div>
          </div>
          <div className="body wide">
            <div className="ghost" aria-hidden="true">{data.lead.ghost}</div>
            <p className="lead">
              {data.lead.red} <span className="q">{data.lead.ink}</span>
            </p>
          </div>
        </div>
        )}

        {data.outcome && (
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
            <CaseAwards data={data} />
          </div>
        </div>
        )}

        {data.sections.map((s, i) => <Block key={i} section={s} data={data} />)}

        {data.closing && (
          <div className="row closing">
            <div className="rail" />
            <div className="body wide">
              <h2>{data.title}</h2>
              <p className="closing__line">{data.closing.line}</p>
              <a className="closing__cta" href={data.closing.cta.href} target="_blank" rel="noopener noreferrer">
                {data.closing.cta.label}
              </a>
            </div>
          </div>
        )}

        <div className="row">
          <div className="rail" />
          <div className="body casenav" style={{ gridColumn: "2 / 4" }}>
            <Link href="/#case-files"><span>←</span> All case files</Link>
            <Link href={`/work/${next.slug}`}>Next: {next.title} <span>→</span></Link>
          </div>
        </div>
      </div>
    </main>
  );
}
