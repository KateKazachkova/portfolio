import Link from "next/link";
import { getFilms, getSeries, type WatchItem } from "@/lib/content";

export default function About() {
  const films = getFilms();
  const series = getSeries();

  return (
    <main className="min-h-screen px-8 py-20 max-w-5xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">About</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Kate Kazachkova</h1>
      <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-16">
        Product designer. Bio and story coming soon.
      </p>

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
            {/* Poster */}
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
