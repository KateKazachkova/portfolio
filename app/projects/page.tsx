export default function Projects() {
  return (
    <main className="min-h-screen px-8 py-24 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Projects</h1>
      <p className="text-gray-500 mb-16">Case studies and selected work</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Project cards will go here */}
        <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center">
          <span className="text-gray-400">Project 1</span>
        </div>
        <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center">
          <span className="text-gray-400">Project 2</span>
        </div>
      </div>
    </main>
  );
}
