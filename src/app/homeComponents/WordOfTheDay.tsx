"use client";

const WordOfTheDay = () => (
  <section 
    className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6"
    aria-labelledby="word-of-the-day"
  >
    <h2 id="word-of-the-day" className="flex items-center gap-2 mb-4 text-lg font-semibold text-white">
      📚 Word of the Day
    </h2>
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-white">Ephemeral</h3>
      <p className="text-sm text-gray-300 italic" aria-label="Pronunciation">/əˈfem(ə)rəl/</p>
      <p className="text-sm text-gray-200 leading-relaxed">Lasting for a very short time; transitory; temporary.</p>
      <blockquote className="text-sm text-gray-300 italic">
        "The ephemeral nature of social media trends."
      </blockquote>
    </div>
  </section>
);

export default WordOfTheDay; 