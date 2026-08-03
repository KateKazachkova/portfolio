import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/notion";
import NotionRender from "@/components/NotionRender";

export const revalidate = 60;

const mono = "var(--font-mono), ui-monospace, monospace";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug).catch(() => null);
  if (!project) return { title: "Case Study – Kate Kazachkova" };
  return {
    title: `${project.title} – Kate Kazachkova`,
    description: project.description || undefined,
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug).catch(() => null);
  if (!project) notFound();

  return (
    <main className="min-h-screen px-6 md:px-8 py-16 md:py-24">
      <article className="max-w-3xl mx-auto">
        {/* back */}
        <Link href="/work" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.18em" }} className="uppercase" >
          <span style={{ color: "var(--accent-red)" }}>←</span>{" "}
          <span style={{ color: "var(--muted)" }}>Work</span>
        </Link>

        {/* header */}
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="uppercase mt-10 mb-4" >
          <span style={{ color: "var(--muted)" }}>Case Study</span>
        </p>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>
          {project.title}
        </h1>
        {project.description && (
          <p className="text-lg md:text-xl leading-snug mt-5 max-w-2xl" style={{ color: "var(--muted)" }}>
            {project.description}
          </p>
        )}

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {project.tags.map((t: string) => (
              <span key={t} style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", padding: "3px 8px", border: "1px solid var(--border)", color: "var(--muted)" }} className="uppercase">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* cover */}
        {project.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover} alt={project.title} className="w-full h-auto mt-10" style={{ border: "2px solid var(--border)" }} />
        )}

        {/* body */}
        <div className="mt-10">
          {project.blocks?.length ? (
            <NotionRender blocks={project.blocks} />
          ) : (
            <p style={{ color: "var(--muted)" }}>Case study write-up coming soon.</p>
          )}
        </div>

        {/* footer nav */}
        <div className="mt-16 pt-6" style={{ borderTop: "1px solid var(--hairline)" }}>
          <Link href="/work" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.18em" }} className="uppercase">
            <span style={{ color: "var(--accent-red)" }}>←</span>{" "}
            <span style={{ color: "var(--muted)" }}>All projects</span>
          </Link>
        </div>
      </article>
    </main>
  );
}
