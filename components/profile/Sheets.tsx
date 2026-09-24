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
      <Head sheet="13" title="Specifications" />
      <Part n="07" title="Specifications" />
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
      <div className="pf-foot pf-mono"><span>End of file</span><span>13</span></div>
    </div>
  );
}

/* ── БУДЬ / BE: the mentorship, filed behind its own divider tab ──
   Facts from Kate's MC2 evidence note (INSCIENCE, Digitizing.Space). */
const BUD_LOG = [
  ["27 Apr", "Applied to mentor"],
  ["28 Apr", "Welcomed to the mentor team"],
  ["2 Jun", "Booking opens · 28 on day one"],
  ["23 Jun", "Live: Portfolio 101"],
  ["1 Jul", "Live: Working on Products"],
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
      <div className="pf-foot pf-mono">
        <a href="https://inscience.io/en/be/" target="_blank" rel="noopener noreferrer">inscience.io/en/be ↗</a><span>07</span>
      </div>
    </div>
  );
}

/** A punched card hung on the rings (Spread.hang): holes down both edges,
 *  a document on it and a line or two of what it is. */
function PunchedCard({ no, src, alt, title, text, meta, className = "" }: {
  no: string; src: string; alt: string; title: string; text?: string; meta: string; className?: string;
}) {
  return (
    <div className={`pf-certcard ${className}`}>
      <span className="pf-certcard__no pf-mono">{no}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <span className="pf-certcard__cap">
        <b>{title}</b>
        {text}
        <span className="pf-mono">{meta}</span>
      </span>
    </div>
  );
}

/** Hung over the БУДЬ sleeve, not in it: the certificate on its own card. */
export function BudCertificate() {
  return (
    <PunchedCard no="07a · Certificate" src="/profile/bud/certificate.webp"
      alt="INSCIENCE Certificate of Appreciation for mentoring in БУДЬ/BE, 2025"
      title="Certificate of Appreciation"
      text="For mentoring Ukrainian women in their job search and career development in tech and the creative industries."
      meta="INSCIENCE · signed by Olena Skyrta, co-founder · July 2025" />
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

/* ── Kharkiv IT Cluster: the courses and the talks ──
   Facts from Kate's KharkivITCluster folder (README and each Детали.md). */
const ITC_COURSES = [
  { t: "Visual Design Basics for Educators", p: "Teachers2IT · Jul–Aug 2024", h: "4 ECTS", n: "170+", c: "48" },
  { t: "Design Systems: from Basics to Adoption", p: "Prof2IT · Nov–Dec 2024", h: "180 h · 6 ECTS", n: "96", c: "35" },
  { t: "Product Design", p: "Prof2IT · Sep–Nov 2025", h: "90 h · 3 ECTS", n: "143", c: "58" },
];
const ITC_TALKS = [
  ["Nov 2024", "Guest EDU · UI, UX, CX", "200+ students, 4 universities"],
  ["Nov 2025", "ProfClub · Visual content with AI", "webinar"],
  ["Dec 2025", "Syllabus review · UX/UI Development", "expert reviewer"],
  ["Dec 2025", "ProfClub · AI in education", "webinar"],
  ["Jan 2026", "Teachers2IT · Designing learning content", "webinar"],
  ["Feb 2026", "AI in Practice · AI for Designers", "marathon, EDIH"],
  ["Apr 2026", "#SchooLeadCommunity · Presentations", "190 student leaders"],
  ["Jun 2026", "Prof2IT · Presentations & visual content", "2K+ views"],
] as const;

export function ClusterSheet() {
  return (
    <div className="pf-page">
      <Head sheet="09" title="Teaching" />
      <Part n="05" title="Kharkiv IT Cluster" />
      <p className="pf-lead" style={{ margin: "0 0 calc(8 * var(--px))" }}>
        Educator and speaker with Kharkiv IT Cluster since 2024: three accredited courses I wrote and taught, and a run of lectures.
      </p>
      <p style={{ margin: "0 0 calc(10 * var(--px))", opacity: 0.8 }}>
        The cluster links Kharkiv’s IT companies, universities and teachers. My Product Design course has since been built into
        Zaporizhzhia National University’s bachelor’s programme in Marketing and helped it through accreditation (ZNU, Jan 2026).
      </p>
      <div className="pf-mono" style={{ marginBottom: "calc(3 * var(--px))" }}>Courses · enrolled → certified</div>
      <div className="pf-courses">
        {ITC_COURSES.map((c) => (
          <div key={c.t}>
            <span><b>{c.t}</b><span className="pf-mono">{c.p} · {c.h}</span></span>
            <span className="pf-courses__n">{c.n}<i>→</i>{c.c}</span>
          </div>
        ))}
      </div>
      <div className="pf-foot pf-mono">
        <a href="https://it-kharkiv.com/projects/prof2it" target="_blank" rel="noopener noreferrer">it-kharkiv.com ↗</a><span>09</span>
      </div>
    </div>
  );
}

/** Hung over the cluster's sleeve: both course certificates, one on the other. */
export function ClusterCertificates() {
  return (
    <>
      <PunchedCard className="pf-certcard--under" no="09b · Certificate PK-685" src="/profile/itc/cert-design-systems.webp"
        alt="Kharkiv IT Cluster certificate PK-685: Design Systems course, 180 hours, 2024"
        title="Design Systems" meta="Prof2IT · 180 h · 24 Dec 2024" />
      <PunchedCard no="09a · Certificate ITK-25/1303" src="/profile/itc/cert-product-design.webp"
        alt="Kharkiv IT Cluster certificate ITK-25/1303: Product Design course, 90 hours, 2025"
        title="Product Design" text="For teaching a professional development course of practical webinars."
        meta="Prof2IT · 90 h · signed by Olga Shapoval · 18 Dec 2025" />
    </>
  );
}

export function ClusterTalksSheet() {
  return (
    <div className="pf-page">
      <Head sheet="10" title="Teaching" />
      <div className="pf-mono" style={{ marginBottom: "calc(3 * var(--px))" }}>Lectures, webinars, reviews</div>
      <div className="pf-log pf-log--3">
        {ITC_TALKS.map(([d, t, m]) => (
          <div key={t}><span className="pf-mono">{d}</span><span>{t}</span><span className="pf-mono">{m}</span></div>
        ))}
      </div>
      <div className="pf-snaps">
        <figure style={{ "--t": "-2deg" } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/itc/teachers2it-results.webp" alt="Kharkiv IT Cluster's summary of the educators' course: 7 sessions, 170+ participants, 50+ finalists" />
          <figcaption className="pf-mono">Teachers2IT, 2024 — the cluster’s summary</figcaption>
        </figure>
        <figure style={{ "--t": "1.5deg" } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/itc/teachers2it-work.webp" alt="A graduate's work from the educators' course" />
          <figcaption className="pf-mono">A graduate’s work</figcaption>
        </figure>
      </div>
      <div className="pf-foot pf-mono"><span>Kharkiv IT Cluster</span><span>10</span></div>
    </div>
  );
}

/* ── IxDF Kharkiv: the local chapter I lead ── */
const IXDF_LOG = [
  ["May 2025", "Appointed Local Leader, IxDF Kharkiv"],
  ["11 Jul 2025", "Mentorship as a catalyst: the БУДЬ experience"],
  ["11 Oct 2025", "IxDF Kharkiv meetup at Dysarium (in person)"],
  ["16 Jan 2026", "How to assess your skills (with IxDF Odesa)"],
  ["9 Apr 2026", "AI, Design & Reality: an open conversation"],
  ["23 Jun 2026", "From project to award: design competitions"],
  ["21 Jul 2026", "Portfolio Review: Share, Learn, Improve"],
] as const;

export function IxdfSheet() {
  return (
    <div className="pf-page">
      <Head sheet="11" title="Community" />
      <Part n="06" title="IxDF Kharkiv" />
      <p className="pf-lead" style={{ margin: "0 0 calc(8 * var(--px))" }}>
        Local Leader of the Interaction Design Foundation’s Kharkiv chapter — one of six in Ukraine.
      </p>
      <p style={{ margin: "0 0 calc(12 * var(--px))", opacity: 0.8 }}>
        Free meetups for designers in and from Kharkiv: skills, careers, AI, portfolios. I pick the topics, invite the guests and host.
      </p>
      <div className="pf-mono" style={{ marginBottom: "calc(3 * var(--px))" }}>Meetups</div>
      <div className="pf-log">
        {IXDF_LOG.map(([d, t]) => (
          <div key={t}><span className="pf-mono">{d}</span><span>{t}</span></div>
        ))}
      </div>
      <div className="pf-card" style={{ margin: "calc(14 * var(--px)) auto 0 0", width: "52%", transform: "rotate(.8deg)" }}>
        <p>“Big thanks to Kateryna Kazachkova for showing the Figma MCP + Claude magic — super inspiring to see where things are going.”</p>
        <span className="pf-mono">Dmytro Yatsenko, IxDF Ukraine · LinkedIn</span>
      </div>
      <div className="pf-foot pf-mono">
        <a href="https://ixdf.org/" target="_blank" rel="noopener noreferrer">ixdf.org ↗</a><span>11</span>
      </div>
    </div>
  );
}

/** Hung over the IxDF sleeve: the letter that made it official. */
export function IxdfLetter() {
  return (
    <PunchedCard no="11a · Letter" src="/profile/ixdf/local-leader-letter.webp"
      alt="Interaction Design Foundation email: Congrats, you're now an IxDF Local Leader"
      title="“You’re now an IxDF Local Leader”" meta="Interaction Design Foundation · 2025" />
  );
}

export function IxdfEvidenceSheet() {
  return (
    <div className="pf-page">
      <Head sheet="12" title="Community" />
      <div className="pf-ixdf">
        <figure className="pf-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/ixdf/portfolio-review-poster.webp" alt="IxDF Kharkiv poster: Portfolio Review — Share, Learn, Improve, 21 July 2026" />
        </figure>
        <div>
          <figure className="pf-snap" style={{ "--t": "2deg" } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile/ixdf/portfolio-review-call.webp" alt="The Portfolio Review meetup on a video call" />
            <figcaption className="pf-mono">Portfolio Review, 21 Jul 2026</figcaption>
          </figure>
          <div className="pf-card" style={{ width: "100%", margin: "calc(12 * var(--px)) 0 0" }}>
            <p>“Kateryna helped us figure out approaches for creating and presenting case studies under an NDA. It inspired me to keep working on my portfolio.”</p>
            <span className="pf-mono">Veronika Fesiun, UX/UI designer · LinkedIn</span>
          </div>
        </div>
      </div>
      <div className="pf-foot pf-mono"><span>IxDF Kharkiv</span><span>12</span></div>
    </div>
  );
}
