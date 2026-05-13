import { getCertificates } from "@/lib/notion";

export const revalidate = 60;

export default async function ResumePage() {
  const certificates = await getCertificates();

  const grouped = certificates.reduce((acc: any, cert: any) => {
    const cat = cert.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cert);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-8 py-24 max-w-3xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Resume</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Experience & Certificates</h1>

      {certificates.length === 0 ? (
        <p className="text-gray-400 text-lg">Certificates coming soon.</p>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([category, certs]: any) => (
            <div key={category}>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">{category}</h2>
              <div className="space-y-4">
                {certs.map((cert: any) => (
                  <div key={cert.id} className="flex items-start justify-between gap-4 py-4 border-b border-gray-100">
                    <div>
                      {cert.url ? (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:underline">
                          {cert.name}
                        </a>
                      ) : (
                        <p className="font-medium text-gray-900">{cert.name}</p>
                      )}
                      {cert.issuer && (
                        <p className="text-sm text-gray-500 mt-1">{cert.issuer}</p>
                      )}
                    </div>
                    {cert.date && (
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {new Date(cert.date).getFullYear()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
