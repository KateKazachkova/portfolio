import Link from "next/link";
import { getFilms, getSeries, type WatchItem } from "@/lib/content";

const EXPERIENCE = [
  {
    company: "AMTOSS (ACT Software)",
    period: "Jan 2021 — Present",
    note: "B2B SaaS across supply-chain, compliance, EdTech and IT-management.",
    roles: [
      {
        title: "Head of Design Department",
        period: "Apr 2025 — Present",
        points: [
          "Own design strategy and scale product-design processes across four cross-functional B2B products.",
          "Grew the design team from one designer to four in 14 months — hiring, onboarding and mentorship.",
          "Built a Claude plugin with six custom AI-agent skills automating the Figma workflow — cutting full-screen design time by ~85%.",
          "Led the new Transportation Management System (TMS) from concept to launch, plus a native iOS app for field reps.",
        ],
      },
      {
        title: "Senior Product Designer",
        period: "Jan 2021 — Apr 2025",
        points: [
          "Designed the BulkSource B2B supply-chain SaaS from the ground up (0→1) as the sole product designer.",
          "Led the platform's first full redesign, cutting task-completion time by 67–75% through data-driven usability.",
          "Drove OnsiSoft compliance & benefits SaaS — reduced support requests by 71% and lifted onboarding completion by 76%.",
          "Designed award-winning products across web, native iOS and Windows desktop.",
        ],
      },
    ],
  },
];

export default function About() {
  const films = getFilms();
  const series = getSeries();

  return (
    <main className="min-h-screen px-8 py-20 max-w-5xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">About</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Kate Kazachkova</h1>
      <div className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-16 space-y-4">
        <p>
          Product designer with ~10 years in UX and product design. Head of Design
          Department at AMTOSS (ACT Software), shaping B2B SaaS products from concept
          to launch.
        </p>
        <p>
          My background is in physics (PhD track, DAAD scholarship) — an engineering
          mindset I bring to design: structure, systems and evidence over guesswork.
          Beyond product work I lead the IxDF community in Kharkiv and teach and speak
          on product design.
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

      {/* Travel preview → map */}
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
