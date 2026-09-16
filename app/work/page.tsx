import { getProjects } from "@/lib/notion";

export const revalidate = 60;

type Project = Awaited<ReturnType<typeof getProjects>>[number];

export default async function ProjectsPage() {
  // null means the fetch failed; [] means nothing is published yet. Without
  // the catch, a Notion outage or an expired token took the whole route down
  // with a 500 — while the case-study route next door already degrades to a
  // 404 rather than throwing.
  const projects = await getProjects().catch((error) => {
    console.error("Notion projects error:", error);
    return null;
  });

  return (
    <main className="min-h-screen px-8 py-24 max-w-5xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Work</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Projects & Case Studies</h1>

      {projects === null ? (
        <p className="text-gray-400 text-lg">
          The project list isn&rsquo;t loading just now. Please try again shortly.
        </p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400 text-lg">Projects coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project: Project) => (
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{project.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
