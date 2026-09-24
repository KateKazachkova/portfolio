import { EXPERIENCE, TEACHING, EDUCATION, SKILLS } from "@/content/profile";

/** The documents in the Profile binder, one per sleeve. The CV and the
 *  photograph are placeholders until their renders arrive; the rest are the
 *  profile's four parts, set as printed sheets. */

function Head({ sheet, title }: { sheet: string; title: string }) {
  return (
    <div className="pf-head pf-mono">
      <span className="pf-head__l"><span className="pf-mark">KATE™</span> PD-001</span>
      <span>{title} · Sheet {sheet}</span>
    </div>
  );
}

function Part({ n, title }: { n: string; title: string }) {
  return (
    <div className="pf-part">
      <span className="pf-part__n">{n}</span>
      <span className="pf-part__t">{title}</span>
    </div>
  );
}

export function CvSheet() {
  return (
    <div className="pf-page">
      <Head sheet="01" title="Curriculum Vitae" />
      <div className="pf-cv__title">Curriculum<br />Vitae</div>
      <div className="pf-cv__row">
        <p className="pf-mono" style={{ fontSize: "calc(8 * var(--px))", margin: 0 }}>
          Kate Kazachkova — product designer.<br />Ten years in UX and product design,<br />
          four B2B SaaS products, one design<br />department built from one to five.
        </p>
        <div className="pf-cv__vol pf-mono">Vol.<b>01</b></div>
      </div>
      <div className="pf-x pf-mono">CV — render pending</div>
      <div className="pf-cells pf-mono">
        <div><span>Date</span>09 / 26</div>
        <div><span>Document</span>Curriculum Vitae</div>
        <div><span>Version</span>1.0</div>
        <div><span>Filed</span>Profile binder</div>
      </div>
    </div>
  );
}

export function PhotoSheet() {
  return (
    <div className="pf-photo">
      <div className="pf-x pf-mono">Photograph — to be supplied</div>
      <div className="pf-tag pf-mono">
        <svg className="pf-tag__clip" viewBox="0 0 12 34" aria-hidden>
          <path d="M4 30V7a3 3 0 0 1 6 0v21a5 5 0 0 1-10 0V9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <div className="pf-tag__t">Model KATE™</div>
        <div className="pf-rule" style={{ paddingTop: "calc(4 * var(--px))" }}>Serial PD-001 · Vol. 01</div>
      </div>
      <div className="pf-slip pf-mono">
        <div className="pf-head__l"><span className="pf-mark">KATE™</span> Unit record</div>
        <p className="pf-slip__lede">Builds the systems B2B products run on, and the teams that keep them honest.</p>
        <dl>
          <dt>Name</dt><dd>Kate Kazachkova</dd>
          <dt>Role</dt><dd>Head of Design, AMTOSS</dd>
          <dt>In service</dt><dd>10 years</dd>
          <dt>Assembled</dt><dd>Ukraine</dd>
          <dt>Operating from</dt><dd>Poland</dd>
          <dt>Awards</dt><dd>30 international</dd>
        </dl>
      </div>
    </div>
  );
}

export function OverviewSheet() {
  return (
    <div className="pf-page">
      <Head sheet="03" title="Overview" />
      <Part n="01" title="Overview" />
      <div className="pf-body">
        <p className="pf-lead">
          Product design leader with 10 years in UX and product design and a background in physics (DAAD scholarship).
        </p>
        <p>
          I head the product design department at AMTOSS and lead design of BulkSource – a US B2B supply-chain SaaS
          platform I designed from 0→1 and carried single-handedly for four years before building the design team around it.
        </p>
        <p>
          My work has earned 30 international design awards, and a product I design was featured on Fox Business
          national TV. Beyond my job I lead the IxDF Kharkiv chapter, author accredited university-level design courses,
          and have mentored 500+ designers.
        </p>
      </div>
      <div className="pf-foot pf-mono"><span>Known issue: still asks “Why?”</span><span>03</span></div>
    </div>
  );
}

export function HistorySheet({ from, to, sheet }: { from: number; to: number; sheet: string }) {
  return (
    <div className="pf-page">
      <Head sheet={sheet} title="Field History" />
      <Part n="02" title={from === 0 ? "Field History" : "Field History, cont."} />
      {EXPERIENCE.slice(from, to).map((job) => (
        <div key={job.company} className="pf-job">
          <div className="pf-job__h"><span>{job.company}</span><span className="pf-mono">{job.period}</span></div>
          <p className="pf-job__note">{job.note}</p>
          {job.roles.map((r) => (
            <div key={r.title} className="pf-role">
              <div className="pf-role__h"><span>{r.title}</span><span className="pf-mono">{r.period}</span></div>
              <ul>{r.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      ))}
      <div className="pf-foot pf-mono"><span>Field history</span><span>{sheet}</span></div>
    </div>
  );
}

export function TeachingSheet() {
  return (
    <div className="pf-page">
      <Head sheet="06" title="Community & Teaching" />
      <Part n="03" title="Community & Teaching" />
      {TEACHING.map((t) => (
        <div key={t.title} className="pf-item">
          <div className="pf-item__h"><span>{t.title}</span><span className="pf-mono">{t.period}</span></div>
          <div>{t.text}</div>
        </div>
      ))}
      <div className="pf-foot pf-mono"><span>Community & teaching</span><span>06</span></div>
    </div>
  );
}

export function SpecsSheet() {
  return (
    <div className="pf-page">
      <Head sheet="07" title="Specifications" />
      <Part n="04" title="Specifications" />
      <div className="pf-mono">Capabilities</div>
      <div className="pf-chips pf-mono">{SKILLS.map((s) => <span key={s}>{s}</span>)}</div>
      <p style={{ margin: "0 0 calc(14 * var(--px))" }}>Languages: Ukrainian (native) · Russian (fluent) · English</p>
      <div className="pf-mono" style={{ marginBottom: "calc(4 * var(--px))" }}>Education</div>
      {EDUCATION.map((e) => (
        <div key={e.degree} className="pf-item">
          <div className="pf-item__h"><span>{e.degree}</span><span className="pf-mono">{e.period}</span></div>
          <div style={{ opacity: 0.7 }}>{e.org}</div>
        </div>
      ))}
      <div className="pf-foot pf-mono"><span>End of file</span><span>07</span></div>
    </div>
  );
}
