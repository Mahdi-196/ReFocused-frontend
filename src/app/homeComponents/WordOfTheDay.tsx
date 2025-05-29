"use client";

const WordOfTheDay = () => (
  <section 
    className="bg-purple-50 rounded-xl p-6 shadow-sm"
    aria-labelledby="word-of-the-day"
  >
    <h2 id="word-of-the-day" className="flex items-center gap-2 mb-4 text-lg font-semibold text-purple-900">
      📚 Word of the Day
    </h2>
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-purple-900">Ephemeral</h3>
      <p className="text-sm text-gray-600 italic" aria-label="Pronunciation">/əˈfem(ə)rəl/</p>
      <p className="text-sm text-gray-700 leading-relaxed">Lasting for a very short time; transitory; temporary.</p>
      <blockquote className="text-sm text-gray-600 italic">
        "The ephemeral nature of social media trends."
      </blockquote>
    </div>
  </section>
);

export default WordOfTheDay; 