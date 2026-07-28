import { getAwards, getCertificates } from "@/lib/notion";

export const revalidate = 60;

type Item = {
  id: string;
  kind: "award" | "certificate";
  title: string;
  meta: string;
  year: number | null;
  url: string | null;
};

export default async function RecognitionPage() {
  const [awards, certificates] = await Promise.all([getAwards(), getCertificates()]);

  const items: Item[] = [
    ...awards.map((a: any) => ({
      id: a.id,
      kind: "award" as const,
      title: a.name,
      meta: [a.project, a.issuer].filter(Boolean).join(" · "),
      year: a.year ?? null,
      url: a.url,
    })),
    ...certificates.map((c: any) => ({
      id: c.id,
      kind: "certificate" as const,
      title: c.name,
      meta: c.issuer ?? "",
      year: c.date ? new Date(c.date).getFullYear() : null,
      url: c.url,
    })),
  ].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <main className="min-h-screen px-8 py-24 max-w-3xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Recognition</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Awards &amp; Certificates</h1>

      {items.length === 0 ? (
        <p className="text-gray-400 text-lg">Recognition coming soon.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-6 py-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                    item.kind === "award"
                      ? "border-black bg-[#f5e642] text-black"
                      : "border-gray-300 text-gray-500"
                  }`}>
                    {item.kind === "award" ? "Award" : "Certificate"}
                  </span>
                </div>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:underline">
                    {item.title}
                  </a>
                ) : (
                  <p className="font-medium text-gray-900">{item.title}</p>
                )}
                {item.meta && <p className="text-sm text-gray-500 mt-1">{item.meta}</p>}
              </div>
              {item.year && (
                <span className="text-sm text-gray-400 whitespace-nowrap pt-1">{item.year}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
