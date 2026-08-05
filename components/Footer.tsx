const mono = "var(--font-mono), ui-monospace, monospace";

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2" style={{ borderColor: "var(--border)", background: "transparent" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* top row */}
        <div className="flex flex-wrap items-start justify-between gap-8 mb-10">
          <div>
            <div className="font-black uppercase tracking-tight text-2xl" style={{ color: "var(--fg)" }}>
              KATE<span style={{ color: "var(--accent-red)" }}>™</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em" }} className="uppercase mt-1" >
              Product Designer Doll™ · Model №001
            </div>
          </div>
          <span className="stamp" style={{ fontSize: 11 }}>Inspected</span>
        </div>

        {/* spec small print */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-6" style={{ borderColor: "var(--hairline)" }}>
          {[
            ["SERIAL", "PD-001"],
            ["ASSEMBLED", "Ukraine"],
            ["STATUS", "Verified"],
            ["CONTACT", "Customer Support →"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="doc-ref mb-1">{k}</div>
              {k === "CONTACT" ? (
                <a href="/contact" style={{ fontFamily: mono, fontSize: 12 }} className="font-semibold underline hover:no-underline">{v}</a>
              ) : (
                <div style={{ fontFamily: mono, fontSize: 12 }} className="font-semibold">{v}</div>
              )}
            </div>
          ))}
        </div>

        {/* care instructions – one small smile */}
        <p className="text-xs text-gray-500 max-w-md mt-8 leading-relaxed">
          Care instructions: handle with curiosity. Keep away from bad briefs and
          direct hype. Contents may settle during shipping.
        </p>

        {/* bottom line */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t" style={{ borderColor: "var(--hairline)" }}>
          <span className="doc-ref">© 2026 Kate Kazachkova · uxuikazachkova.xyz</span>
          {/* faux barcode */}
          <div className="flex items-end gap-[2px] h-5" aria-hidden>
            {[3,1,2,1,3,2,1,1,3,1,2,3,1,2,1,3,1,1,2,3].map((w, i) => (
              <span key={i} style={{ width: w, height: "100%", background: "var(--fg)" }} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
