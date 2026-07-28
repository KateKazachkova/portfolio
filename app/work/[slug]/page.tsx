export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen px-8 py-24 max-w-3xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Case Study</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{slug}</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </main>
  );
}
