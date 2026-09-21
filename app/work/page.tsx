import { getProjects } from "@/lib/notion";
import CASES from "@/content/work";

export const revalidate = 60;

/** The grid's card, whether it comes from Notion or from a local case file. */
type Card = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  tags: string[];
};

export default async function ProjectsPage() {
  // null means the Notion fetch failed; [] means nothing is published yet.
  // Either way the locally-written case studies still show — they don't
  // depend on Notion being up.
  const notion = await getProjects().catch((error) => {
    console.error("Notion projects error:", error);
    return null;
  });

  const notionCards: Card[] = (notion ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    cover: p.cover ?? null,
    tags: p.tags ?? [],
  }));

  // Cases written up as annotated documents that Notion doesn't list yet.
  // Notion stays the source of truth where it has an entry; anything it is
  // missing falls back to the case file so the page is still reachable.
  const seen = new Set(notionCards.map((c) => c.slug));
  const localCards: Card[] = Object.values(CASES)
    .filter((c) => !seen.has(c.slug))
    .map((c) => ({
      id: `local-${c.slug}`,
      slug: c.slug,
      title: c.title,
      description: c.subtitle,
      cover: null,
      tags: [c.years],
    }));

  const cards: Card[] = [...notionCards, ...localCards];

  return (
    <main className="min-h-screen px-8 py-24 max-w-5xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Case Files</p>
      <h1 className="t-display mb-12">Projects & Case Studies</h1>

      {cards.length === 0 ? (
        notion === null ? (
          <p className="text-gray-400 text-lg">
            The project list isn&rsquo;t loading just now. Please try again shortly.
          </p>
        ) : (
          <p className="text-gray-400 text-lg">Projects coming soon.</p>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((project: Card) => (
            <a
              key={project.id}
              href={`/work/${project.slug}`}
              className="group block border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              {project.cover && (
                <div className="aspect-video overflow-hidden bg-gray-50">
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tags.map((tag: string) => (
                    <span key={tag} className="text-xs text-gray-400 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="t-lead mb-2">{project.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{project.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
