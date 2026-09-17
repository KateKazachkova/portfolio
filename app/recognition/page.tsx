import Link from "next/link";
import AwardStamps from "@/components/AwardStamps";
import {
  QUALITIES,
  VERIFIED_PROJECTS,
  ORGANISATIONS,
  AWARD_RECORDS,
  PROJECT_ORDER,
  type AwardRecord,
} from "@/lib/awards";

export const metadata = {
  title: "Quality Check – Kate Kazachkova",
  description: "Independent product inspection: 30+ international awards recognising the work.",
};

const mono = "var(--font-mono), ui-monospace, monospace";

/** The report's other sheets. Same stock as the card at the top, but square
 *  and unpunched: they are pages of the report, not tags tied to it, and a
 *  page of tilted punched cards would be a pile rather than a document. The
 *  shadow is a fifth of the card's — paper resting on paper, not held above
 *  it. Hairline instead of the 2px ink border, or the page reads as drawn
 *  boxes on a background rather than sheets lying on a desk. */
const paper: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--hairline)",
  boxShadow: "0 8px 16px rgba(30,24,16,0.09)",
};

export default function QualityCheck() {
  // One card per project, carrying its full inspection record (was section 05).
  const projectCards = PROJECT_ORDER
    .map((name) => ({
      name,
      project: VERIFIED_PROJECTS.find((p) => p.name === name) ?? null,
      records: AWARD_RECORDS.filter((r) => r.project === name),
    }))
    .filter((g) => g.records.length > 0);

  return (
    <main className="min-h-screen">
      {/* ── 1. HERO ──
          The report itself, as the piece of paper it would be: panel stock,
          a clipped corner and a real punched hole — cut with a mask, so the
          page shows through it rather than a painted circle pretending to —
          hung a third of a degree off square. Same tag the 404 hands you,
          at certificate size: one degree on a 480px tag reads as charm, on a
          1024px sheet it reads as a mistake, so the tilt comes down with the
          width while the paper stays the same. */}
      <section className="px-8 pt-16 pb-20 max-w-5xl mx-auto">
        <div style={{ filter: "drop-shadow(0 16px 26px rgba(30,24,16,0.20))" }}>
        <div
          className="p-8 md:p-12 relative"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            transform: "rotate(-0.35deg)",
            clipPath: "polygon(0 34px, 34px 0, 100% 0, 100% 100%, 0 100%)",
            WebkitMaskImage: "radial-gradient(circle 9px at 38px 44px, transparent 0 9px, #000 9.8px)",
            maskImage: "radial-gradient(circle 9px at 38px 44px, transparent 0 9px, #000 9.8px)",
          }}
        >
          {/* What the sheet has been through, beside the verdict. Faint, and
              leaning off the right edge where the card's own clip cuts them —
              a stamp pressed half over the edge of a sheet does exactly that.
              Above the type rather than behind it: a stamp lands on a printed
              page, not under it. */}
          <div className="absolute pointer-events-none" style={{ top: "9%", right: "-2%", width: "42%", height: "58%" }}>
            <AwardStamps variant="card" />
          </div>

          {/* The verdict, as an impression rather than a drawn box — the tilt
              and the broken frame are in the stamp itself. */}
          <span
            className="ink-stamp ink-stamp--pass absolute top-6 right-6"
            role="img"
            aria-label="Pass"
          >
            PASS
          </span>

          {/* clears the punched hole, the way a printed line on a real tag does */}
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em", marginLeft: 34 }} className="text-gray-400 uppercase mb-6">
            Independent Product Inspection
          </p>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--fg)" }}>
            Quality Check
          </h1>
          <p className="text-xl md:text-2xl font-semibold leading-snug max-w-2xl mb-4" style={{ color: "var(--fg)" }}>
            Every product claims to be good.
            <br />
            This one was tested by independent juries.
          </p>
          <p className="text-gray-500 leading-relaxed max-w-2xl mb-10">
            Since 2020 the work has been entered into 11 international competitions –
            earning 6 Gold, 20 Silver and 4 Bronze awards, plus web distinctions
            including Site of the Day and judges&apos; Special Kudos.
          </p>

          {/* big stat */}
          <div className="flex items-end gap-5 mb-10">
            <span className="font-black leading-none" style={{ fontSize: 72, color: "var(--fg)" }}>30+</span>
            <span className="uppercase text-xs font-bold tracking-widest text-gray-400 pb-2 leading-relaxed">
              International awards<br />and distinctions
            </span>
          </div>

          {/* inspection metadata */}
          <div className="border-t-2 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" style={{ borderColor: "var(--border)" }}>
            {[
              ["MODEL", "KATE™"],
              ["CATEGORY", "PRODUCT DESIGN"],
              ["STATUS", "VERIFIED"],
              ["INSPECTION", "JURY REVIEW"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-1">{k}</div>
                <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700 }} className="uppercase" >{v}</div>
              </div>
            ))}
          </div>

          <a
            href="#verified-projects"
            className="inline-block uppercase font-bold transition-colors hover:opacity-80"
            style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.1em", padding: "10px 18px", background: "var(--border)", color: "var(--bg)" }}
          >
            View Verified Work →
          </a>
        </div>
        </div>
      </section>

      {/* ── 2. WHAT WAS VERIFIED ── */}
      <section className="px-8 py-16 max-w-5xl mx-auto">
        <SectionHeading n="02" title="What Was Verified" />
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Different juries, categories and projects. The same qualities kept appearing in the reports.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUALITIES.map((q) => (
            <div key={q.key} className="p-6" style={paper}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold uppercase" style={{ color: "var(--fg)" }}>{q.label}</h3>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", color: "var(--accent-red)" }} className="border px-2 py-0.5 uppercase" >
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{q.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. VERIFIED PROJECTS ── */}
      <section id="verified-projects" className="px-8 py-16 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading n="03" title="Verified Projects" />
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Awards matter more when they point back to the work. Each specimen carries its full inspection record.
        </p>
        <div className="space-y-6">
          {projectCards.map(({ name, project: p, records }) => (
            <div key={name} className="grid grid-cols-1 md:grid-cols-[200px_1fr]" style={paper}>
              {/* specimen frame */}
              <div className="flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--hairline)", background: "var(--inner)" }}>
                {p?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={name} className="w-full aspect-square object-cover mb-3" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-center px-2 font-black uppercase mb-3 border" style={{ borderColor: "var(--border)", color: "var(--fg)", fontSize: 16 }}>
                    {name}
                  </div>
                )}
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase">{p?.specimen ?? "Archive"}</span>
              </div>

              {/* details */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-black uppercase" style={{ color: "var(--fg)" }}>{name}</h3>
                  <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "var(--accent-red)" }} className="border-2 px-2 py-1 uppercase whitespace-nowrap" >
                    ✓ Passed
                  </span>
                </div>
                {p?.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.description}</p>}

                <div className="flex flex-wrap gap-4 mb-4" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }}>
                  <span className="text-gray-400 uppercase">RECOGNITION: <span style={{ color: "var(--fg)" }}>{p?.recognitionCount ?? records.length}×</span></span>
                  {p?.recognisedFor?.length ? (
                    <span className="text-gray-400 uppercase">FOR: <span style={{ color: "var(--fg)" }}>{p.recognisedFor.join(" / ")}</span></span>
                  ) : null}
                </div>

                {/* full inspection record */}
                <RecordsTable records={records} />

                {(p?.caseStudyUrl || p?.externalUrl) && (
                  <div className="flex flex-wrap gap-4">
                    {p?.caseStudyUrl && (
                      <Link href={p.caseStudyUrl} className="uppercase font-bold underline hover:no-underline" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
                        View Project →
                      </Link>
                    )}
                    {p?.externalUrl && (
                      <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="uppercase font-bold underline hover:no-underline text-gray-400" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
                        Live ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. INDEPENDENT JURIES ── */}
      <section className="px-8 py-16 max-w-5xl mx-auto">
        <SectionHeading n="04" title="Independent Juries" />
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Selected organisations that independently reviewed and recognised the work.
        </p>

        {/* Their own marks, pressed onto the sheet. A parcel that has passed
            through eleven hands carries eleven stamps, and none of them line
            up — that is the whole point of the pile. The list under it stays:
            ink tells you who was here, the list tells you what they are. */}
        <div className="mb-12">
          <AwardStamps />
        </div>
        {/* Ruled, not gapped. The old grid drew its lines by letting a coloured
            background show through 1px gaps, which also painted the empty slot
            at the end of the last row as a solid block — a table with one cell
            filled in for no reason. The rules now belong to the cells, so a
            short last row is simply blank paper. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={paper}>
          {ORGANISATIONS.map((o) => (
            <div key={o.name} className="p-5 flex flex-col gap-2" style={{ background: "var(--panel)", boxShadow: "inset -1px -1px 0 var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm" style={{ color: "var(--fg)" }}>{o.name}</span>
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.12em", color: "var(--accent-red)" }} className="uppercase">✓</span>
              </div>
              <span className="text-xs text-gray-400">{o.type}</span>
              {o.externalUrl && (
                <a href={o.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:no-underline text-gray-400 mt-auto">
                  Visit ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CLOSING STAMP ── */}
      <section className="px-8 pb-28 max-w-5xl mx-auto">
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }} className="text-gray-300 uppercase">
          END OF REPORT · KATE™ · MODEL №001 · This inspection covers design recognition only. Measurable product results are documented in the case studies.
        </p>
      </section>
    </main>
  );
}

function RecordsTable({ records }: { records: AwardRecord[] }) {
  return (
    <div className="border-t pt-2 mb-4" style={{ borderColor: "var(--border)" }}>
      {records.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-1 md:grid-cols-[46px_1.1fr_1.3fr_auto] gap-0.5 md:gap-x-4 py-2 border-b"
          style={{ borderColor: "var(--hairline)" }}
        >
          <span style={{ fontFamily: mono, fontSize: 12 }} className="text-gray-400">{r.year ?? "–"}</span>
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {r.externalUrl ? (
              <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{r.awardName}</a>
            ) : r.awardName}
          </span>
          <span className="text-sm text-gray-500">{r.category ?? ""}</span>
          <span className="text-sm md:text-right" style={{ color: "var(--fg)" }}>{r.recognition}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-3">
      <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-red)" }}>{n}</span>
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>{title}</h2>
    </div>
  );
}
