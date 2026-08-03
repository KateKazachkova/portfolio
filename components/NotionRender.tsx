import React from "react";

/**
 * Minimal Notion block → JSX renderer for case-study bodies.
 * Server component (no client JS). Styled to the site's editorial palette.
 * Supports: paragraph, heading 1–3, bulleted/numbered lists, to-do, quote,
 * callout, divider, image (with caption), code, and one level of nesting.
 */

const mono = "var(--font-mono), ui-monospace, monospace";

type RT = {
  plain_text: string;
  href: string | null;
  annotations?: {
    bold?: boolean; italic?: boolean; code?: boolean;
    strikethrough?: boolean; underline?: boolean;
  };
};

function RichText({ rich }: { rich?: RT[] }) {
  if (!rich || rich.length === 0) return null;
  return (
    <>
      {rich.map((t, i) => {
        const a = t.annotations ?? {};
        let node: React.ReactNode = t.plain_text;
        if (a.code)
          node = (
            <code style={{ fontFamily: mono, fontSize: "0.9em", background: "var(--inner)", padding: "1px 5px", borderRadius: 3 }}>
              {node}
            </code>
          );
        if (a.bold) node = <strong>{node}</strong>;
        if (a.italic) node = <em>{node}</em>;
        if (a.strikethrough) node = <s>{node}</s>;
        if (a.underline) node = <u>{node}</u>;
        if (t.href)
          node = (
            <a href={t.href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--accent-red)" }}>
              {node}
            </a>
          );
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

function Block({ block }: { block: any }) {
  const { type } = block;
  const data = block[type];

  switch (type) {
    case "paragraph":
      if (!data.rich_text?.length) return <div style={{ height: 12 }} />;
      return <p className="leading-relaxed my-4" style={{ color: "var(--fg)" }}><RichText rich={data.rich_text} /></p>;

    case "heading_1":
      return <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-12 mb-4" style={{ color: "var(--fg)" }}><RichText rich={data.rich_text} /></h2>;
    case "heading_2":
      return <h3 className="text-xl md:text-2xl font-bold mt-10 mb-3" style={{ color: "var(--fg)" }}><RichText rich={data.rich_text} /></h3>;
    case "heading_3":
      return <h4 style={{ fontFamily: mono, fontSize: 13, letterSpacing: "0.12em", color: "var(--muted)" }} className="uppercase mt-8 mb-2"><RichText rich={data.rich_text} /></h4>;

    case "quote":
      return (
        <blockquote className="my-6 pl-5 py-1 italic" style={{ borderLeft: "3px solid var(--accent-red)", color: "var(--fg)" }}>
          <RichText rich={data.rich_text} />
        </blockquote>
      );

    case "callout":
      return (
        <div className="my-6 flex gap-3 p-4" style={{ background: "var(--inner)", border: "1px solid var(--border)" }}>
          {data.icon?.emoji && <span aria-hidden>{data.icon.emoji}</span>}
          <div style={{ color: "var(--fg)" }}><RichText rich={data.rich_text} /></div>
        </div>
      );

    case "divider":
      return <hr className="my-10" style={{ borderColor: "var(--hairline)" }} />;

    case "to_do":
      return (
        <label className="flex items-start gap-2 my-1.5" style={{ color: "var(--fg)" }}>
          <input type="checkbox" checked={!!data.checked} readOnly className="mt-1.5" />
          <span><RichText rich={data.rich_text} /></span>
        </label>
      );

    case "code":
      return (
        <pre className="my-6 p-4 overflow-x-auto" style={{ background: "var(--inner)", border: "1px solid var(--border)" }}>
          <code style={{ fontFamily: mono, fontSize: 13, color: "var(--fg)" }}>{data.rich_text?.map((t: RT) => t.plain_text).join("")}</code>
        </pre>
      );

    case "image": {
      const src = data.file?.url ?? data.external?.url;
      if (!src) return null;
      const caption = data.caption?.length ? data.caption.map((c: RT) => c.plain_text).join("") : null;
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption ?? ""} className="w-full h-auto" style={{ border: "1px solid var(--border)" }} />
          {caption && <figcaption style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }} className="mt-2 uppercase">{caption}</figcaption>}
        </figure>
      );
    }

    default:
      // Unhandled block type — render its text if any, else skip silently.
      if (data?.rich_text?.length) return <p className="leading-relaxed my-4" style={{ color: "var(--fg)" }}><RichText rich={data.rich_text} /></p>;
      return null;
  }
}

// Group consecutive list items into <ul>/<ol>; render everything else inline.
export default function NotionRender({ blocks }: { blocks: any[] }) {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const t = b.type;

    if (t === "bulleted_list_item" || t === "numbered_list_item") {
      const ordered = t === "numbered_list_item";
      const items: any[] = [];
      while (i < blocks.length && blocks[i].type === t) {
        items.push(blocks[i]);
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag key={b.id} className={`my-4 pl-6 space-y-1.5 ${ordered ? "list-decimal" : "list-disc"}`} style={{ color: "var(--fg)" }}>
          {items.map((it) => (
            <li key={it.id}>
              <RichText rich={it[it.type].rich_text} />
              {it.children?.length ? <NotionRender blocks={it.children} /> : null}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    out.push(<Block key={b.id} block={b} />);
    i++;
  }
  return <>{out}</>;
}
