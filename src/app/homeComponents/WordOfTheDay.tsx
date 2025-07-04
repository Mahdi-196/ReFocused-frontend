"use client";

const WordOfTheDay = () => (
  <section 
    className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[17rem] sm:h-[19rem] lg:h-[19rem] xl:h-[19rem] 2xl:h-[19rem] flex flex-col justify-between"
    aria-labelledby="word-of-the-day"
  >
    <div>
      <h2 id="word-of-the-day" className="flex items-center gap-2 mb-4 text-lg font-semibold text-white">
        📚 Word of the Day
      </h2>
      
      <div className="space-y-2">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Ephemeral</h3>
          <p className="text-sm text-gray-300 italic mb-2" aria-label="Pronunciation">/əˈfem(ə)rəl/</p>
          <p className="text-sm text-gray-200 leading-relaxed mb-2">
            Lasting for a very short time; transitory; temporary.
          </p>
          <blockquote className="text-sm text-gray-300 italic pl-4 border-l-2 border-gray-600/50">
            "The ephemeral nature of social media trends."
          </blockquote>
        </div>
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-600/50">
      <p className="text-xs text-gray-400 text-center">
        Expand your vocabulary with daily word discoveries
      </p>
    </div>
  </section>
);

export default WordOfTheDay; 