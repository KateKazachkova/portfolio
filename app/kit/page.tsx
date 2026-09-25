import { mono } from "@/components/ui/type";
import { Sheet } from "@/components/ui/Sheet";
import { InkButton } from "@/components/ui/InkButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DocTable, DocRow, DocCell } from "@/components/ui/DocTable";
import { STAMP_RATIOS } from "@/components/AwardStamps";

export const metadata = {
  title: "Parts List – Kate Kazachkova",
  description: "The parts this site is built from: colour, type, paper, ink and the document table.",
};

/** The palette, read live from the variables rather than retyped here — so the
 *  swatches are the colours the site is actually using, in whichever theme you
 *  are looking at, and cannot quietly disagree with it. The roles are the ones
 *  written beside each token in globals.css. */
const COLOURS: { token: string; role: string }[] = [
  { token: "--bg", role: "The paper. A dirty off-white, never #fff" },
  { token: "--panel", role: "A sheet lying on the paper: cards, documents" },
  { token: "--inner", role: "Recessed — an inner window, a well" },
  { token: "--fg", role: "The ink everything is written in" },
  { token: "--border", role: "A drawn edge, at full ink strength" },
  { token: "--hairline", role: "A thin archive rule between things" },
  { token: "--muted", role: "Secondary text, a touch of plum" },
  { token: "--accent-red", role: "The stamp. Numbering, marks, one thing at a time" },
  { token: "--brand", role: "Saffron: the logo, a selected state, a small label" },
  { token: "--violet", role: "Ultra Violet: episodic — cards, hover, a project's own identity" },
  { token: "--green", role: "Hunter Green: the second big colour, for whole sections" },
];

/** The mono label sizes, counted in the source rather than invented for this
 *  page: this is the scale as it is actually used, one line per cluster. */
const LABELS: { size: number; track: string; uses: number; what: string }[] = [
  { size: 10, track: "0.15em", uses: 11, what: "Field label above a value" },
  { size: 10, track: "0.12em", uses: 7, what: "A mark or tag beside something" },
  { size: 11, track: "0.1em", uses: 7, what: "A link or a button" },
  { size: 10, track: "0.1em", uses: 6, what: "Small print, a reference" },
  { size: 11, track: "0.25em", uses: 4, what: "The eyebrow over a heading" },
];

const STAMPS = ["muse", "cssda", "lda", "davey", "nyx", "indigo", "cssw", "nectar", "nypda", "dn"];

export default function Kit() {
  return (
    <main className="min-h-screen">
      {/* ── The parts list, as a packing document rather than a gallery ── */}
      <section className="px-8 pt-16 pb-12 max-w-5xl mx-auto">
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-4">
          KATE™ · Model №001 · Parts List
        </p>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--fg)" }}>
          What this is made of
        </h1>
        <p className="text-gray-500 leading-relaxed max-w-2xl">
          Every part below is the live one. The swatches read the site&apos;s own variables, the
          table is the table the inspection records are set in, and the stamps are the files the
          Quality Check page presses onto its paper. Nothing here is a picture of a component.
        </p>
      </section>

      {/* ── 01 COLOUR ── */}
      <section className="px-8 py-12 max-w-5xl mx-auto">
        <SectionHeading n="01" title="Colour" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          Eleven tokens, each with a job. A colour with no job is how a palette turns into a mood board.
        </p>
        <Sheet raised className="divide-y" style={{ borderColor: "var(--hairline)" }}>
          {COLOURS.map((c) => (
            <div key={c.token} className="flex items-center gap-5 p-4" style={{ borderTop: "1px solid var(--hairline)" }}>
              <span
                aria-hidden
                className="shrink-0"
                style={{ width: 52, height: 34, background: `var(${c.token})`, border: "1px solid var(--hairline)" }}
              />
              <span style={{ fontFamily: mono, fontSize: 12 }} className="shrink-0 w-[130px]" >{c.token}</span>
              <span className="text-sm text-gray-500">{c.role}</span>
            </div>
          ))}
        </Sheet>
      </section>

      {/* ── 02 TYPE ── */}
      <section className="px-8 py-12 max-w-5xl mx-auto">
        <SectionHeading n="02" title="Type" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          The monospace does the labelling — the small tracked-out capitals a document uses to
          name a field. These five sizes are not a scale someone drew up: they are the sizes the
          site turned out to use, counted in the source.
        </p>
        <Sheet raised>
          <DocTable
            caption="The monospace label sizes, their tracking, what each is used for, and how many times it appears in the source."
            columns={["Size", "Tracking", "Used for", "Occurrences"]}
          >
            {LABELS.map((l) => (
              <DocRow key={`${l.size}-${l.track}`}>
                <DocCell kind="key" className="md:w-[30%] pl-4">
                  <span style={{ fontFamily: mono, fontSize: l.size, letterSpacing: l.track }} className="uppercase">
                    Inspection Record
                  </span>
                </DocCell>
                <DocCell kind="ref" className="md:w-[16%]">{l.size}px / {l.track}</DocCell>
                <DocCell kind="muted">{l.what}</DocCell>
                <DocCell kind="value" className="pr-4">{l.uses}×</DocCell>
              </DocRow>
            ))}
          </DocTable>
        </Sheet>
      </section>

      {/* ── 03 PAPER ── */}
      <section className="px-8 py-12 max-w-5xl mx-auto">
        <SectionHeading n="03" title="Paper" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          One stock, two states. The shadow is the only difference, and it is the difference
          between a sheet lying on the desk and one held above it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Sheet className="p-6">
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-2">Sheet</div>
            <p className="text-sm text-gray-500">Flat on the page. For anything sitting inside something else.</p>
          </Sheet>
          <Sheet raised className="p-6">
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-2">Sheet · raised</div>
            <p className="text-sm text-gray-500">Lifted, with the shadow that says so. For a document in its own right.</p>
          </Sheet>
        </div>
      </section>

      {/* ── 04 INK ── */}
      <section className="px-8 py-12 max-w-5xl mx-auto">
        <SectionHeading n="04" title="Ink" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          The button is a block of ink with the paper knocked out of it. The stamps are the
          juries&apos; own marks, reduced to one channel of coverage and bitten back at the edges —
          they ship as masks, so the colour is CSS and follows the theme.
        </p>
        <Sheet raised className="p-6">
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-4">Button</div>
          <InkButton href="/#recognition">View Verified Work →</InkButton>

          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mt-8 mb-4">Stamps</div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
            {STAMPS.map((k, i) => (
              <span
                key={k}
                aria-hidden
                style={{
                  // Its own proportion, not a box it has to fit: a square seal
                  // squeezed into a wordmark's slot reads as a smaller stamp
                  // rather than a different one.
                  display: "block",
                  height: 40,
                  width: 40 * STAMP_RATIOS[k],
                  backgroundColor: i % 2 ? "var(--fg)" : "var(--accent-red)",
                  opacity: 0.8,
                  WebkitMaskImage: `url(/stamps/awards/${k}.webp)`,
                  maskImage: `url(/stamps/awards/${k}.webp)`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            ))}
          </div>
        </Sheet>
      </section>

      {/* ── 05 THE DOCUMENT TABLE ── */}
      <section className="px-8 py-12 pb-24 max-w-5xl mx-auto">
        <SectionHeading n="05" title="The Document Table" />
        <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
          Four parts, and they carry very different weights. The cell is where the repetition
          was. The table owns what is true of the whole — the rule it hangs from, the caption, and
          stacking into blocks on a phone. The header cell is semantics and no style, because this
          header is read rather than seen. The row draws almost nothing and exists for the
          behaviour coming to it.
        </p>
        <Sheet raised className="p-6">
          <DocTable
            caption="An example of the document table, showing each kind of cell."
            columns={["Reference", "Key", "Detail", "Value"]}
          >
            <DocRow>
              <DocCell kind="ref" className="md:w-[46px]">2026</DocCell>
              <DocCell kind="key" className="md:w-[32%]">DocCell · key</DocCell>
              <DocCell kind="muted">What the row is about, set in the reading face</DocCell>
              <DocCell kind="value">Verified</DocCell>
            </DocRow>
            <DocRow>
              <DocCell kind="ref" className="md:w-[46px]">2025</DocCell>
              <DocCell kind="key" className="md:w-[32%]">DocCell · muted</DocCell>
              <DocCell kind="muted">The supporting detail, a step back in the greys</DocCell>
              <DocCell kind="value">Passed</DocCell>
            </DocRow>
            <DocRow>
              <DocCell kind="ref" className="md:w-[46px]">2024</DocCell>
              <DocCell kind="key" className="md:w-[32%]">DocCell · value</DocCell>
              <DocCell kind="muted">The finding, set against the right edge</DocCell>
              <DocCell kind="value">Silver</DocCell>
            </DocRow>
          </DocTable>
          <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }} className="text-gray-400 uppercase mt-2">
            Column widths belong to the table using it, not to the cell — and only from md up,
            because below that the cells stack
          </p>
        </Sheet>
      </section>
    </main>
  );
}
