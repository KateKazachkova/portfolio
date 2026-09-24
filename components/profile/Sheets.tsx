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
      <Head sheet="09" title="Specifications" />
      <Part n="05" title="Specifications" />
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
      <div className="pf-foot pf-mono"><span>End of file</span><span>09</span></div>
    </div>
  );
}

/* ── БУДЬ / BE: the mentorship, filed behind its own divider tab ──
   Facts from Kate's MC2 evidence note (INSCIENCE, Digitizing.Space). */
const BUD_LOG = [
  ["27 Apr", "Applied to mentor"],
  ["28 Apr", "Welcomed to the mentor team by INSCIENCE"],
  ["2 Jun", "Booking opens · 28 sessions booked on day one"],
  ["23 Jun", "Live: Portfolio UI/UX/Product Designer 101"],
  ["1 Jul", "Live: Working on Products · Q&A / AMA"],
  ["Jul", "Certificate of Appreciation"],
] as const;

export function BudSheet() {
  return (
    <div className="pf-page">
      <Head sheet="07" title="Mentorship" />
      <Part n="04" title="БУДЬ / BE" />
      <p className="pf-lead" style={{ margin: "0 0 calc(8 * var(--px))" }}>
        Six weeks in 2025 as a UX/UI mentor for БУДЬ/BE, a programme for Ukrainian women entering IT and the creative industries.
      </p>
      <p style={{ margin: "0 0 calc(12 * var(--px))", opacity: 0.8 }}>
        Run by INSCIENCE with Digitizing.Space, supported by Nova Ukraine. Participants chose their own mentor from the directory
        and booked directly; I was listed for design leadership, design systems, portfolio reviews and mock interviews.
      </p>
      <div className="pf-stats">
        <div><b>66</b><span className="pf-mono">consultations</span></div>
        <div><b>53</b><span className="pf-mono">participants</span></div>
        <div><b>4×</b><span className="pf-mono">the expected 1–15</span></div>
        <div><b>28</b><span className="pf-mono">booked on day one</span></div>
      </div>
      <div className="pf-mono" style={{ margin: "calc(12 * var(--px)) 0 calc(3 * var(--px))" }}>Record · 2025</div>
      <div className="pf-log">
        {BUD_LOG.map(([d, t]) => (
          <div key={t}><span className="pf-mono">{d}</span><span>{t}</span></div>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-cert" src="/profile/bud/certificate.webp" alt="INSCIENCE Certificate of Appreciation for mentoring in БУДЬ/BE, 2025" />
      <div className="pf-foot pf-mono">
        <a href="https://inscience.io/en/be/" target="_blank" rel="noopener noreferrer">inscience.io/en/be ↗</a><span>07</span>
      </div>
    </div>
  );
}

export function BudEvidenceSheet() {
  return (
    <div className="pf-page">
      <Head sheet="08" title="Mentorship" />
      <div className="pf-bud">
        <div className="pf-badge">
          <svg className="pf-tag__clip" viewBox="0 0 12 34" aria-hidden>
            <path d="M4 30V7a3 3 0 0 1 6 0v21a5 5 0 0 1-10 0V9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/bud/badge.webp" alt="БУДЬ mentor card: Kateryna Kazachkova, Head of Design Department at Amtoss / BulkSource" />
        </div>
        <div className="pf-talks">
          <div className="pf-mono">Open sessions, for the whole programme</div>
          {[
            { img: "portfolio-101", t: "Portfolio UI/UX/Product Designer 101", m: "23 Jun · 1 h 50 · 424 views", href: "https://www.youtube.com/@practicalskillsforrealworld/streams" },
            { img: "products-qa", t: "Working on Products · Q&A / AMA", m: "1 Jul · 1 h 23 · 259 views", href: "https://youtube.com/live/SmqqurYmXx8" },
          ].map((s) => (
            <a key={s.img} className="pf-ticket" href={s.href} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/profile/bud/${s.img}.webp`} alt="" />
              <span><b>{s.t}</b><span className="pf-mono">{s.m} · Watch ↗</span></span>
            </a>
          ))}
        </div>
      </div>
      <figure className="pf-quote">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/bud/notes.webp" alt="A participant's notes from the portfolio session, the stream on the laptop behind" />
        <blockquote>
          “A really informative and constructive lecture. I now understand my own strengths better — and the line I underlined
          in my notes: not to make it ‘pretty’, but so it gets easier for the user, and the business feels it.”
          <cite className="pf-mono">
            <a href="https://www.linkedin.com/posts/nadia-gerasimova-856111225_kateryna-kazachkova-%D1%86%D0%B5-%D0%B1%D1%83%D0%BB%D0%B0-%D0%B4%D1%83%D0%B6%D0%B5-%D1%96%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%B2%D0%BD%D0%B0-activity-7345854543412322306-tfnL" target="_blank" rel="noopener noreferrer">Nadia Gerasimova, UX/UI designer · LinkedIn ↗</a>
          </cite>
        </blockquote>
      </figure>
      <div className="pf-card">
        <p>“Thank you for the webinar on product design — so structured and thorough. I’ve decided this is the direction I want to go: it’s more me, in how I think and how deep I want to go into what I work on.”</p>
        <span className="pf-mono">A participant, in the programme’s Slack</span>
      </div>
      <div className="pf-foot pf-mono"><span>Translated from Ukrainian</span><span>08</span></div>
    </div>
  );
}
