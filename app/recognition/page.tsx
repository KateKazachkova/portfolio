import Link from "next/link";
import {
  AWARD_STATS,
  QUALITIES,
  VERIFIED_PROJECTS,
  ORGANISATIONS,
  AWARD_RECORDS,
} from "@/lib/awards";

export const metadata = {
  title: "Quality Check — Kate Kazachkova",
  description: "Independent product inspection: 30+ international awards recognising the work.",
};

const mono = "var(--font-mono), ui-monospace, monospace";

export default function QualityCheck() {
  const recordsByYear = [...AWARD_RECORDS].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <main className="min-h-screen">
      {/* ── 1. HERO ── */}
      <section className="px-8 pt-16 pb-20 max-w-5xl mx-auto">
        <div className="border-2 p-8 md:p-12 relative" style={{ borderColor: "var(--border)" }}>
          {/* stamp */}
          <div
            className="absolute top-6 right-6 border-2 px-3 py-1 rotate-6"
            style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)" }}
          >
            <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>
              PASS
            </span>
          </div>

          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-6">
            Independent Product Inspection
          </p>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--fg)" }}>
            Quality Check
          </h1>
          <p className="text-xl md:text-2xl font-semibold leading-snug max-w-2xl mb-4" style={{ color: "var(--fg)" }}>
            Every product claims to be good. This one was tested by independent juries.
          </p>
          <p className="text-gray-500 leading-relaxed max-w-2xl mb-10">
            More than 30 international awards and distinctions have recognised my work across
            user experience, interface design, innovation and digital storytelling.
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
      </section>

      {/* ── 2. WHAT WAS VERIFIED ── */}
      <section className="px-8 py-16 max-w-5xl mx-auto">
        <SectionHeading n="02" title="What Was Verified" />
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Different juries, categories and projects. The same qualities kept appearing in the reports.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUALITIES.map((q) => (
            <div key={q.key} className="border-2 p-6" style={{ borderColor: "var(--border)" }}>
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
          Awards matter more when they point back to the work.
        </p>
        <div className="space-y-6">
          {VERIFIED_PROJECTS.map((p) => (
            <div key={p.id} className="border-2 grid grid-cols-1 md:grid-cols-[200px_1fr]" style={{ borderColor: "var(--border)" }}>
              {/* specimen frame */}
              <div className="flex flex-col items-center justify-center p-6 border-b-2 md:border-b-0 md:border-r-2" style={{ borderColor: "var(--border)", background: "var(--inner)" }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="w-full aspect-square object-cover mb-3" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-center px-2 font-black uppercase mb-3 border" style={{ borderColor: "var(--border)", color: "var(--fg)", fontSize: 16 }}>
                    {p.name}
                  </div>
                )}
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase">{p.specimen}</span>
              </div>

              {/* details */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-black uppercase" style={{ color: "var(--fg)" }}>{p.name}</h3>
                  <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "var(--accent-red)" }} className="border-2 px-2 py-1 uppercase whitespace-nowrap" >
                    ✓ Passed
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.description}</p>

                <div className="flex flex-wrap gap-4 mb-4" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }}>
                  <span className="text-gray-400 uppercase">RECOGNITION: <span style={{ color: "var(--fg)" }}>{p.recognitionCount}×</span></span>
                  <span className="text-gray-400 uppercase">FOR: <span style={{ color: "var(--fg)" }}>{p.recognisedFor.join(" / ")}</span></span>
                </div>

                {/* award list */}
                <ul className="border-t pt-3 space-y-1.5 mb-4" style={{ borderColor: "var(--border)" }}>
                  {p.awards.map((a) => (
                    <li key={a} className="text-sm flex gap-2" style={{ color: "var(--fg)" }}>
                      <span style={{ color: "var(--accent-red)" }}>✦</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4">
                  {p.caseStudyUrl && (
                    <Link href={p.caseStudyUrl} className="uppercase font-bold underline hover:no-underline" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
                      View Project →
                    </Link>
                  )}
                  {p.externalUrl && (
                    <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="uppercase font-bold underline hover:no-underline text-gray-400" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
                      Live ↗
                    </a>
                  )}
                </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px" style={{ background: "var(--border)", border: "1px solid var(--border)" }}>
          {ORGANISATIONS.map((o) => (
            <div key={o.name} className="p-5 flex flex-col gap-2" style={{ background: "var(--bg)" }}>
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

      {/* ── 5. INSPECTION RECORDS ── */}
      <section className="px-8 py-16 pb-28 max-w-5xl mx-auto">
        <SectionHeading n="05" title="Inspection Records" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          The full archive — {AWARD_STATS.gold} Gold · {AWARD_STATS.silver} Silver · {AWARD_STATS.bronze} Bronze, plus web distinctions.
        </p>

        <div className="border-t-2" style={{ borderColor: "var(--border)" }}>
          {/* header row */}
          <div className="hidden md:grid grid-cols-[70px_1fr_1fr_1fr] gap-4 py-3 border-b" style={{ borderColor: "var(--border)", fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }}>
            <span className="text-gray-400 uppercase">Year</span>
            <span className="text-gray-400 uppercase">Award</span>
            <span className="text-gray-400 uppercase">Project</span>
            <span className="text-gray-400 uppercase">Recognition</span>
          </div>
          {recordsByYear.map((r) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-[70px_1fr_1fr_1fr] gap-1 md:gap-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ fontFamily: mono, fontSize: 12 }} className="text-gray-400">{r.year ?? "—"}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                {r.externalUrl ? (
                  <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{r.awardName}</a>
                ) : r.awardName}
              </span>
              <span className="text-sm text-gray-500">{r.project}</span>
              <span className="text-sm" style={{ color: "var(--fg)" }}>{r.recognition}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }} className="text-gray-300 uppercase mt-6">
          END OF REPORT · KATE™ · MODEL №001 · This inspection covers design recognition only. Measurable product results are documented in the case studies.
        </p>
      </section>
    </main>
  );
}

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-3">
      <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em", color: "var(--accent-red)" }}>{n}</span>
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>{title}</h2>
    </div>
  );
}
