import React from "react";
import type { Para, Span } from "@/content/work/types";

/**
 * The annotation layer, inline: highlighter, ink underline, redaction, and the
 * hatched TK chip for anything still unconfirmed. A TK never renders as prose —
 * it has to look like a gap, or it stops being one.
 */
export default function Spans({ spans }: { spans: Para }) {
  return (
    <>
      {spans.map((s: Span, i) => {
        // A newline in the data is a deliberate line break (field values,
        // stacked labels) — JSX would otherwise collapse it to a space.
        if (typeof s === "string") {
          const lines = s.split("\n");
          return (
            <React.Fragment key={i}>
              {lines.map((line, j) => (
                <React.Fragment key={j}>
                  {line}
                  {j < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
        if ("mark" in s) return <mark key={i}>{s.mark}</mark>;
        if ("pen" in s) return <span key={i} className="pen">{s.pen}</span>;
        if ("strong" in s) return <strong key={i}>{s.strong}</strong>;
        if ("code" in s) return <code key={i}>{s.code}</code>;
        if ("redact" in s) return <s key={i}>{s.redact}</s>;
        return (
          <span key={i} className="tk" title="Not yet confirmed">
            TK — {s.tk}
          </span>
        );
      })}
    </>
  );
}
