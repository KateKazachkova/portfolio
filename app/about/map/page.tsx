const PLACES = [
  "Place 01",
  "Place 02",
  "Place 03",
  "Place 04",
];

export default function TravelMap() {
  return (
    <main className="min-h-screen px-8 py-20 max-w-6xl mx-auto">
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Travels</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Where I&apos;ve been</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left — places navigation */}
        <aside className="w-full md:w-56 shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold">Places</p>
          <ul className="space-y-1">
            {PLACES.map((place) => (
              <li key={place}>
                <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 border border-transparent hover:border-black hover:bg-[#f5e642] transition-colors">
                  {place}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-300 italic mt-4">More places coming soon</p>
        </aside>

        {/* Right — map placeholder */}
        <div className="flex-1">
          <div className="border-2 border-black overflow-hidden bg-[#d9d4c8]">
            <img
              src="/travel-vhs.jpg"
              alt="Travel places — placeholder"
              className="w-full h-auto block"
            />
          </div>
          <p className="text-sm text-gray-500 italic mt-4 max-w-xl">
            Placeholder. I want to build an interactive map here — click a place on
            the left and the map flies to it, showing photos and notes from that trip,
            styled like a stack of retro VHS tapes.
          </p>
        </div>
      </div>
    </main>
  );
}
