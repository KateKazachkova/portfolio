import Link from "next/link";
import { Suspense } from "react";
import { getFilms, getSeries, getBooks } from "@/lib/content";
import FilmStack from "@/components/FilmStack";
import DiscStack from "@/components/DiscStack";
import BookShelf from "@/components/BookShelf";
import { mono } from "@/components/ui/type";
import Cycling, { CyclingSkeleton } from "@/components/Cycling";

export const revalidate = 3600;

export const metadata = {
  title: "Off Duty – Kate Kazachkova",
  description: "Field notes from outside the job: rides, places and the shelf.",
};

/** The other half of the sheet that used to be one long About page.
 *
 *  Same paper, same parts, different filing: the assembly manual keeps the
 *  professional specification on /about, and everything the model does with
 *  the hours it is not working is filed here as field notes. */
export default function OffDuty() {
  const films = getFilms();
  const series = getSeries();
  const books = getBooks();

  return (
    <main className="min-h-screen px-8 py-16 max-w-5xl mx-auto">
      {/* ── Notes cover ── */}
      <div className="border-2 p-8 md:p-12 mb-20" style={{ borderColor: "var(--border)" }}>
        <p className="t-label text-gray-400 mb-6">
          Field Notes · Model KATE™ / Off Duty
        </p>
        <h1 className="t-display mb-3">
          Off Duty
        </h1>
        <p className="t-lead text-gray-500">
          What the doll does with the hours it isn&apos;t working – rides,
          places, and the shelf.
        </p>
      </div>

      {/* 01 – Field Telemetry. Its own component behind Suspense: Strava costs
          a few round trips, and the notes should not wait on a bike ride. */}
      <Suspense fallback={<CyclingSkeleton n="01" title="Field Telemetry" />}>
        <Cycling n="01" title="Field Telemetry" />
      </Suspense>

      {/* 02 – Travel Log */}
      <Part n="02" title="Travel Log">
        <div className="flex items-baseline justify-between">
          <p className="text-gray-500 italic">A map of places I&apos;ve been – coming soon.</p>
          <Link href="/off-duty/map" className="uppercase font-bold underline hover:no-underline whitespace-nowrap" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }}>
            View map →
          </Link>
        </div>
      </Part>

      {/* 03 – Reference Library */}
      <Part n="03" title="Reference Library">
        <p className="text-gray-500 mb-10 max-w-2xl">What I watch and read – a small archive on the shelf.</p>

        {/* Series – disc rack */}
        <div className="mb-12">
          <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">
            Series · {series.length} · disc rack
          </p>
          <DiscStack series={series} />
        </div>

        {/* Films – VHS shelf */}
        <div className="mb-12">
          <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">
            Films · {films.length} · VHS shelf
          </p>
          <FilmStack films={films} />
        </div>

        {/* Books – shelf */}
        <div>
          <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">
            Books · {books.length} · shelf
          </p>
          {books.length > 0 ? (
            <BookShelf books={books} />
          ) : (
            <p className="text-gray-400 italic text-sm">Books – coming soon.</p>
          )}
        </div>
      </Part>
    </main>
  );
}

function Part({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20 last:mb-0">
      <div className="flex items-baseline gap-4 mb-6 border-b-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <span className="t-label" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-red)" }}>{n}</span>
        <h2 className="t-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}
