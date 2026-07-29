import Link from "next/link";
import { getFilms, getSeries, type WatchItem } from "@/lib/content";
import FilmStack from "@/components/FilmStack";
import { getRideStats, getLongestRides } from "@/lib/strava";
import { polylineToSvgPath } from "@/lib/polyline";
import { buildStaticMapUrl } from "@/lib/staticmap";

export const revalidate = 3600;

const mono = "var(--font-mono), ui-monospace, monospace";

const SPECS: [string, string][] = [
  ["MODEL", "KATE™"],
  ["SERIAL", "PD-001"],
  ["CATEGORY", "Product Designer"],
  ["ASSEMBLED", "Ukraine"],
  ["CURRENT LOCATION", "Poland"],
  ["EXPERIENCE", "10 years"],
  ["KNOWN FEATURES", "Systems thinking · engineering mindset"],
  ["KNOWN ISSUE", "Still asks “Why?”"],
];

const EXPERIENCE = [
  {
    company: "AMTOSS (ACT Software)",
    period: "Jan 2021 — Present",
    note: "B2B SaaS across supply-chain, compliance, EdTech and IT-management. Joined as the sole product designer and built the flagship platform BulkSource from the ground up; progressed to Head of Design in four years.",
    roles: [
      {
        title: "Head of Design Department",
        period: "Apr 2025 — Present",
        points: [
          "Own design strategy and scale product-design processes across four cross-functional B2B products (BulkSource, OnsiSoft, SaberWing, Atlas Technica).",
          "Grew the design team from one designer to five in 14 months — hiring, onboarding and mentorship, within an open, collaborative culture.",
          "Built a Claude plugin with seven custom AI-agent skills automating the end-to-end Figma workflow — cutting full-screen design time from 70–90 min to ~10 min (≈85%).",
          "Led the Transportation Management System (TMS) from concept to launch, and managed the native iOS app for field reps through to App Store release.",
          "SaberWing (AI-first EdTech for UK schools): led UX/UI from concept — AI learning assistant, student profiles, the tutor system and the UX style guide.",
        ],
      },
      {
        title: "Senior Product Designer",
        period: "Jan 2021 — Apr 2025",
        points: [
          "Designed the BulkSource B2B supply-chain SaaS from the ground up (0→1) as the sole product designer — business analysis, UX research, UI, design systems and developer handoff.",
          "Built all core modules across web, a native Windows desktop app (integrating with on-site truck scales) and mobile; led the platform's first full redesign, supporting growth to a dozen US states.",
          "OnsiSoft: drove design of the compliance & benefits SaaS for US government contractors — reduced support requests by 71% and lifted onboarding completion by 76%.",
          "Atlas Technica: designed the MSP / IT-management web portal. WayPro: designed an award-winning logistics/route mobile app.",
          "BulkSource featured on Fox Business “The Claman Countdown” (2021) and named to the BuiltWorlds 2023 Infrastructure 50.",
        ],
      },
    ],
  },
  {
    company: "88 Ltd — Malta",
    period: "Apr 2018 — Apr 2020",
    note: "Digital agency and product house serving banking, aviation, real-estate and public-sector clients.",
    roles: [
      {
        title: "Senior UX/UI Designer",
        period: "Apr 2019 — Apr 2020",
        points: [
          "Led UX/UI of WISH — a research distribution & development system built with the NHS and Imperial College London — across the full enterprise platform (~14 screens).",
          "Senior designer on flagship accounts: APS Bank, Izola Bank, AgriBank, RE/MAX Malta and Air Malta; trusted with the redesign of 88's own website.",
          "Designed the Agora corporate website — Indigo Design Award 2020 winner (Silver + 2× Bronze); mentored a junior designer through live projects.",
        ],
      },
      {
        title: "UX/UI & Graphic Designer",
        period: "Apr 2018 — Apr 2019",
        points: [
          "Designed multi-page websites and prototypes for RE/MAX Malta, Sunseeker Malta and others; delivered a two-app UX/UI system (Hashly).",
          "Produced editorial publications for the President's Foundation for the Wellbeing of Society (Office of the President of Malta); promoted to Senior within a year.",
        ],
      },
    ],
  },
  {
    company: "Freelance & Contract",
    period: "2015 — Apr 2018",
    note: "Mapi7 · ART CUBE and independent clients.",
    roles: [
      {
        title: "Product Designer",
        period: "2015 — Apr 2018",
        points: [
          "Redesigned an e-commerce store and photobook constructor with before/after usability testing (Mapi7); full-cycle e-commerce design (ART CUBE).",
          "Freelance UX/UI and graphic design from 2015.",
        ],
      },
    ],
  },
];

const TEACHING = [
  {
    title: "Kharkiv Local Leader — Interaction Design Foundation (IxDF)",
    period: "May 2025 — Present",
    text: "Lead one of six national IxDF chapters in Ukraine: 4+ meetups on design skills, AI in design and mentorship; publicly endorsed by the IxDF Ukraine lead.",
  },
  {
    title: "Educator & Speaker — Kharkiv IT Cluster",
    period: "Jun 2024 — Present",
    text: "Authored and taught three accredited courses (Visual Design Basics, Design Systems 180h/6 ECTS, Product Design 90h/3 ECTS). My Product Design course was adopted into Zaporizhzhia National University's bachelor programme. Guest lectures to 50+ students across 4 universities.",
  },
  {
    title: "Mentor — БУДЬ / INSCIENCE · Women For The Future · Happy Monday",
    period: "2025 — Present",
    text: "Mentored 53 designers through 66 one-to-one sessions; ran 14 sessions in Women For The Future. Published Figma Community templates with 14,400+ views and 3,300+ uses worldwide.",
  },
  {
    title: "Conference Speaker — selected talks",
    period: "2018 · 2025 — 2026",
    text: "“Designing Boring Systems That Run the World” — Warsaw IT Days 2026 (co-presented). “AI for Designers” — AI Marathon, Kharkiv IT Cluster. Public workshops with 650+ YouTube views.",
  },
];

const EDUCATION = [
  { degree: "PhD track (Aspirantura), Solid State Physics", org: "V. N. Karazin Kharkiv National University", period: "2014 — 2021" },
  { degree: "Leonhard Euler Scholarship (DAAD)", org: "University of Duisburg-Essen", period: "2014" },
  { degree: "Master's degree (with honours), Condensed Matter Physics", org: "V. N. Karazin Kharkiv National University", period: "2013 — 2014" },
  { degree: "Bachelor's degree (with honours)", org: "V. N. Karazin Kharkiv National University", period: "2009 — 2013" },
];

const SKILLS = [
  "Product & UX Design", "Design Leadership", "Design Systems", "UX Research & Usability Testing",
  "Business Analysis", "AI-First Design (Figma + Claude)", "Figma", "Adobe Creative Suite",
];

export default async function About() {
  const films = getFilms();
  const series = getSeries();
  const [stats, activities] = await Promise.all([getRideStats(), getLongestRides(3)]);

  return (
    <main className="min-h-screen px-8 py-16 max-w-5xl mx-auto">
      {/* ── Manual cover ── */}
      <div className="border-2 p-8 md:p-12 mb-20" style={{ borderColor: "var(--border)" }}>
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-6">
          Assembly Manual · PD-001
        </p>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-3" style={{ color: "var(--fg)" }}>
          Kate Kazachkova
        </h1>
        <p className="text-lg text-gray-500 mb-10">
          Product Designer Doll™ — assembly &amp; operation guide.
        </p>

        {/* Spec table */}
        <div className="border-t-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10" style={{ borderColor: "var(--border)" }}>
          {SPECS.map(([k, v], i) => (
            <div
              key={k}
              className="flex justify-between gap-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase pt-0.5">{k}</span>
              <span style={{ fontFamily: mono, fontSize: 12 }} className="text-right font-semibold" >{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 01 — Overview */}
      <Part n="01" title="Overview">
        <div className="text-lg text-gray-600 leading-relaxed max-w-2xl space-y-4">
          <p>
            Product design leader with 10 years in UX and product design and a background
            in physics (DAAD scholarship). I head the product design department at AMTOSS
            and lead design of BulkSource — a US B2B supply-chain SaaS platform I designed
            from 0→1 and carried single-handedly for four years before building the design
            team around it.
          </p>
          <p>
            My work has earned 30 international design awards, and a product I design was
            featured on Fox Business national TV. Beyond my job I lead the IxDF Kharkiv
            chapter, author accredited university-level design courses, and have mentored
            500+ designers.
          </p>
        </div>
      </Part>

      {/* 02 — Field History */}
      <Part n="02" title="Field History">
        {EXPERIENCE.map((job) => (
          <div key={job.company} className="mb-10 last:mb-0">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="text-xl font-semibold text-gray-900">{job.company}</h3>
              <span style={{ fontFamily: mono, fontSize: 11 }} className="text-gray-400">{job.period}</span>
            </div>
            <p className="text-sm text-gray-500 italic mt-1 mb-5">{job.note}</p>
            <div className="space-y-6 border-l-2 pl-5" style={{ borderColor: "var(--border)" }}>
              {job.roles.map((role) => (
                <div key={role.title}>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{role.title}</p>
                    <span style={{ fontFamily: mono, fontSize: 10 }} className="text-gray-400">{role.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {role.points.map((p) => (
                      <li key={p} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                        <span style={{ color: "var(--accent-red)" }}>✦</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Part>

      {/* 03 — Community & Teaching */}
      <Part n="03" title="Community & Teaching">
        <div className="space-y-6">
          {TEACHING.map((item) => (
            <div key={item.title}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <span style={{ fontFamily: mono, fontSize: 10 }} className="text-gray-400 whitespace-nowrap">{item.period}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </Part>

      {/* 04 — Specifications */}
      <Part n="04" title="Specifications">
        <div className="mb-8">
          <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">Capabilities</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <span key={s} className="text-sm font-medium px-3 py-1 border" style={{ borderColor: "var(--border)" }}>{s}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">Languages: Ukrainian (native) · Russian (fluent) · English</p>
        </div>

        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-3">Education</p>
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {EDUCATION.map((e) => (
            <div key={e.degree} className="flex items-start justify-between gap-6 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="font-medium text-gray-900 text-sm">{e.degree}</p>
                <p className="text-xs text-gray-500 mt-0.5">{e.org}</p>
              </div>
              <span style={{ fontFamily: mono, fontSize: 11 }} className="text-gray-400 whitespace-nowrap">{e.period}</span>
            </div>
          ))}
        </div>
      </Part>

      {/* 05 — Recognition */}
      <Part n="05" title="Recognition">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-gray-600">30 international design awards — 6 Gold · 20 Silver · 4 Bronze.</p>
          <Link href="/recognition" className="uppercase font-bold underline hover:no-underline whitespace-nowrap" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
            Quality Check →
          </Link>
        </div>
      </Part>

      {/* 06 — Cycling */}
      {stats && (
        <Part n="06" title="Cycling — Field Telemetry">
          <div className="flex justify-end mb-4">
            <a href="https://www.strava.com/athletes/52565503" target="_blank" rel="noopener noreferrer"
              className="uppercase font-bold underline hover:no-underline text-gray-400" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
              Strava ↗
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Distance", value: `${stats.distanceKm.toLocaleString()} km` },
              { label: "Rides", value: stats.rides.toLocaleString() },
              { label: "Time", value: `${stats.timeHours.toLocaleString()} h` },
              { label: "Elevation", value: `${stats.elevationM.toLocaleString()} m` },
            ].map((s) => (
              <div key={s.label} className="border-2 p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-2xl font-black" style={{ color: "var(--fg)" }}>{s.value}</div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {activities.length > 0 && (
            <div>
              <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">Longest rides</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activities.map((a) => {
                  const mapUrl = a.polyline ? buildStaticMapUrl(a.polyline) : null;
                  const path = a.polyline ? polylineToSvgPath(a.polyline) : null;
                  return (
                    <a key={a.id} href={`https://www.strava.com/activities/${a.id}`} target="_blank" rel="noopener noreferrer"
                      className="group block border-2 overflow-hidden hover:opacity-90 transition-opacity" style={{ borderColor: "var(--border)" }}>
                      <div className="aspect-square flex items-center justify-center" style={{ background: "var(--inner)" }}>
                        {mapUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mapUrl} alt={`Route of ${a.name}`} className="w-full h-full object-cover" />
                        ) : path ? (
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d={path} fill="none" stroke="var(--accent-red)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <span className="text-xs text-gray-400">No route</span>
                        )}
                      </div>
                      <div className="p-3 border-t-2" style={{ borderColor: "var(--border)" }}>
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{a.name}</p>
                        <p style={{ fontFamily: mono, fontSize: 11 }} className="text-gray-500 mt-1">{a.distanceKm} km · {a.movingMin} min</p>
                        <p style={{ fontFamily: mono, fontSize: 10 }} className="text-gray-400 mt-0.5">
                          {a.date ? new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </Part>
      )}

      {/* 07 — Travels */}
      <Part n="07" title="Travels">
        <div className="flex items-baseline justify-between">
          <p className="text-gray-500 italic">A map of places I&apos;ve been — coming soon.</p>
          <Link href="/about/map" className="uppercase font-bold underline hover:no-underline whitespace-nowrap" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
            View map →
          </Link>
        </div>
      </Part>

      {/* 08 — Reference Library */}
      <Part n="08" title="Reference Library">
        <p className="text-gray-500 mb-8 max-w-2xl">What I watch — a small archive of series and films on the shelf.</p>
        <WatchSection title="Series" items={series} />
        <div className="mt-10">
          <p style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">
            Films · {films.length} · VHS shelf
          </p>
          <FilmStack films={films} />
        </div>
      </Part>
    </main>
  );
}

function Part({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20 last:mb-0">
      <div className="flex items-baseline gap-4 mb-6 border-b-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em", color: "var(--accent-red)" }}>{n}</span>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function WatchSection({ title, items }: { title: string; items: WatchItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-10 last:mb-0">
      <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">
        {title} · {items.length}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.title} className="group">
            <div className="aspect-[2/3] border-2 overflow-hidden flex items-center justify-center mb-2" style={{ borderColor: "var(--border)", background: "var(--inner)" }}>
              {item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-center px-2 font-black uppercase leading-tight" style={{ fontSize: 12, color: "var(--fg)" }}>{item.title}</span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
