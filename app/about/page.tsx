import Link from "next/link";
import { getFilms, getSeries, type WatchItem } from "@/lib/content";
import { getRunStats, getRecentActivities } from "@/lib/strava";

export const revalidate = 3600;

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
  const [stats, activities] = await Promise.all([getRunStats(), getRecentActivities(3)]);

  return (
    <main className="min-h-screen px-8 py-20 max-w-5xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">About</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Kate Kazachkova</h1>
      <div className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-16 space-y-4">
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
          500+ designers. I aim to bring this experience in complex B2B systems and
          design communities to the UK&apos;s digital technology sector.
        </p>
      </div>

      {/* Experience */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-6">Experience</h2>
        {EXPERIENCE.map((job) => (
          <div key={job.company} className="mb-10">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="text-xl font-semibold text-gray-900">{job.company}</h3>
              <span className="text-sm text-gray-400">{job.period}</span>
            </div>
            <p className="text-sm text-gray-500 italic mt-1 mb-5">{job.note}</p>
            <div className="space-y-6 border-l-2 border-gray-100 pl-5">
              {job.roles.map((role) => (
                <div key={role.title}>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{role.title}</p>
                    <span className="text-xs text-gray-400">{role.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {role.points.map((p) => (
                      <li key={p} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                        <span className="text-gray-300">✦</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Leadership beyond work */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-6">Community, Teaching &amp; Mentoring</h2>
        <div className="space-y-6">
          {TEACHING.map((item) => (
            <div key={item.title}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">{item.period}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-6">Education</h2>
        <div className="divide-y divide-gray-100">
          {EDUCATION.map((e) => (
            <div key={e.degree} className="flex items-start justify-between gap-6 py-4">
              <div>
                <p className="font-medium text-gray-900">{e.degree}</p>
                <p className="text-sm text-gray-500 mt-1">{e.org}</p>
              </div>
              <span className="text-sm text-gray-400 whitespace-nowrap">{e.period}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-16">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-5">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <span key={s} className="text-sm font-medium px-3 py-1 border" style={{ borderColor: "var(--border)" }}>
              {s}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">Ukrainian (native) · Russian (fluent) · English</p>
      </section>

      {/* Recognition callout */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold">Recognition</h2>
          <Link href="/recognition" className="text-xs font-bold uppercase tracking-wider underline hover:no-underline">
            All awards →
          </Link>
        </div>
        <p className="text-gray-600">30 international design awards — 6 Gold · 20 Silver · 4 Bronze.</p>
      </section>

      {/* Running — Strava */}
      {stats && (
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold">Running 🏃</h2>
            <a
              href="https://www.strava.com/athletes/52565503"
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-wider underline hover:no-underline"
            >
              Strava →
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Distance", value: `${stats.distanceKm.toLocaleString()} km` },
              { label: "Runs", value: stats.runs.toLocaleString() },
              { label: "Time", value: `${stats.timeHours.toLocaleString()} h` },
              { label: "Elevation", value: `${stats.elevationM.toLocaleString()} m` },
            ].map((s) => (
              <div key={s.label} className="border-2 p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-2xl font-black" style={{ color: "var(--fg)" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent activities */}
          {activities.length > 0 && (
            <div className="divide-y divide-gray-100">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.date ? new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{a.distanceKm} km · {a.movingMin} min</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Travels preview → map */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold">Travels</h2>
          <Link href="/about/map" className="text-xs font-bold uppercase tracking-wider underline hover:no-underline">
            View map →
          </Link>
        </div>
        <p className="text-gray-500 italic">A map of places I&apos;ve been — coming soon.</p>
      </section>

      {/* Watching */}
      <WatchSection title="Series" items={series} />
      <WatchSection title="Films" items={films} />
    </main>
  );
}

function WatchSection({ title, items }: { title: string; items: WatchItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-5">
        {title} <span className="text-gray-300">· {items.length}</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {items.map((item) => (
          <div key={item.title} className="group">
            <div
              className="aspect-[2/3] border-2 overflow-hidden flex items-center justify-center mb-2"
              style={{ borderColor: "var(--border)", background: "var(--inner)" }}
            >
              {item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <span
                  className="text-center px-2 font-black uppercase leading-tight"
                  style={{ fontSize: 13, letterSpacing: "-0.01em", color: "var(--fg)" }}
                >
                  {item.title}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{item.title}</p>
            {item.why && <p className="text-xs text-gray-500 italic mt-1 leading-snug">{item.why}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
