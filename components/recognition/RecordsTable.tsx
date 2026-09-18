"use client";

/**
 * The inspection record, banded by year, with a desktop-only certificate
 * preview. Hovering a row that carries a scan lifts the certificate up beside
 * the cursor — the way you would tilt a framed thing toward the light rather
 * than open a new page for it. Rows with no scan stay inert, and touch devices
 * (no fine pointer) never arm the preview at all.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DocTable, DocRow, DocCell } from "@/components/ui/DocTable";
import { mono } from "@/components/ui/type";
import type { AwardRecord } from "@/lib/awards";

type Preview = { record: AwardRecord; x: number; y: number };

// Portrait scans; the card is sized to that and clamped to the viewport.
const CARD_W = 300;
const CARD_H = 428;
const GAP = 24;

export function RecordsTable({ records }: { records: AwardRecord[] }) {
  // The record reads as a dated ledger: newest year first, each year its own
  // banded section. The year is stated once, on the divider that opens the
  // section, so the rows below it stop repeating it. Undated entries fall to
  // the end under their own heading.
  const years = [...new Set(records.map((r) => r.year))].sort(
    (a, b) => (b ?? 0) - (a ?? 0),
  );

  const [mounted, setMounted] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    setMounted(true);
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // Warm the image the moment the pointer lands, so the card is not a blank
  // rectangle that fills in a beat later.
  const seen = useRef<Set<string>>(new Set());
  function warm(src: string) {
    if (seen.current.has(src)) return;
    seen.current.add(src);
    const img = new Image();
    img.src = src;
  }

  function place(e: React.MouseEvent, record: AwardRecord): Preview {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer the right of the cursor; flip left when it would overflow.
    let x = e.clientX + GAP;
    if (x + CARD_W + GAP > vw) x = e.clientX - GAP - CARD_W;
    x = Math.max(GAP, Math.min(x, vw - CARD_W - GAP));
    // Centre on the cursor vertically, clamped to the viewport.
    let y = e.clientY - CARD_H / 2;
    y = Math.max(GAP, Math.min(y, vh - CARD_H - GAP));
    return { record, x, y };
  }

  return (
    <>
      <DocTable
        caption="Inspection record, grouped by year: each award, the category it was entered in, and the recognition it received. Where a certificate has been digitised, hovering the row previews it."
        columns={["Year", "Award", "Category", "Recognition"]}
      >
        {years.map((y) => (
          <Fragment key={y ?? "undated"}>
            <tr className="max-md:block">
              <th
                scope="colgroup"
                colSpan={4}
                className="text-left uppercase pt-5 pb-1.5 border-t-2 max-md:block"
                style={{
                  borderColor: "var(--border)",
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--faint)",
                }}
              >
                {y ?? "Undated"}
              </th>
            </tr>
            {records
              .filter((r) => r.year === y)
              .map((r) => {
                const hoverable = canHover && !!r.certificate;
                return (
                  <DocRow
                    key={r.id}
                    className={hoverable ? "cursor-zoom-in" : ""}
                    onMouseEnter={
                      hoverable
                        ? (e) => {
                            warm(r.certificate!);
                            setPreview(place(e, r));
                          }
                        : undefined
                    }
                    onMouseMove={
                      hoverable ? (e) => setPreview(place(e, r)) : undefined
                    }
                    onMouseLeave={hoverable ? () => setPreview(null) : undefined}
                  >
                    <DocCell kind="ref" className="md:w-[46px]" />
                    {/* One entry, one link on the name. A row that still stands
                        for several entries keeps the name plain and takes a
                        numbered link per page instead — sending them all to the
                        first would be a small lie about what was won. */}
                    <DocCell kind="key" className="md:w-[32%]">
                      {r.externalUrls.length === 1 ? (
                        <a href={r.externalUrls[0]} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{r.awardName}</a>
                      ) : (
                        r.awardName
                      )}
                      {r.externalUrls.length > 1 && (
                        <span className="ml-1.5 whitespace-nowrap">
                          {r.externalUrls.map((u, i) => (
                            <a
                              key={u}
                              href={u}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline ml-1"
                              style={{ fontFamily: mono, fontSize: 10, color: "var(--accent-red)" }}
                              aria-label={`${r.awardName} — entry ${i + 1} of ${r.externalUrls.length} on the organisers' site`}
                            >
                              {i + 1}
                            </a>
                          ))}
                        </span>
                      )}
                      {r.certificate && (
                        <span
                          aria-hidden
                          className="ml-2 align-middle max-md:hidden"
                          style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "var(--faint)" }}
                        >
                          ◱ CERT
                        </span>
                      )}
                    </DocCell>
                    <DocCell kind="muted">{r.category ?? ""}</DocCell>
                    <DocCell kind="value">{r.recognition}</DocCell>
                  </DocRow>
                );
              })}
          </Fragment>
        ))}
      </DocTable>

      {mounted &&
        preview &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: preview.x,
              top: preview.y,
              width: CARD_W,
              background: "var(--panel)",
              border: "1px solid var(--border)",
              padding: 8,
              boxShadow: "0 18px 40px rgba(30,24,16,0.28)",
            }}
          >
            <img
              src={preview.record.certificate}
              alt={`Certificate — ${preview.record.awardName}, ${preview.record.category ?? preview.record.recognition}`}
              width={CARD_W - 16}
              className="block w-full h-auto"
            />
            <div
              className="uppercase pt-2 pb-0.5"
              style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.14em", color: "var(--faint)" }}
            >
              Certificate · {preview.record.category ?? preview.record.recognition}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
