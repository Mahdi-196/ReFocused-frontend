"use client";

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useWordOfTheDaySimple as useWordOfTheDay } from '../../hooks/useDailyContentSimple';

const WordOfTheDay = () => {
  const { data: wordData, loading, error, refresh, isCached } = useWordOfTheDay();
  const [isFading, setIsFading] = useState(false);

  // Manual refresh removed

  return (
  <section 
    className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[17rem] sm:h-[19rem] lg:h-[19rem] xl:h-[19rem] 2xl:h-[19rem] flex flex-col justify-between"
    aria-labelledby="word-of-the-day"
  >
    <div className="min-h-0 flex-1 flex-grow overflow-y-auto custom-scrollbar pr-2">
      <div className="flex items-center justify-between mb-4">
        <h2 id="word-of-the-day" className="flex items-center gap-2 text-lg font-semibold text-white">
          <BookOpen className="w-5 h-5 text-green-400" />
          Word of the Day
          {isCached && process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded" title="Loaded from cache">
              📋
            </span>
          )}
        </h2>
        {/* Refresh removed */}
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
          <p className="text-xs text-red-400">Failed to load the word. Please try again.</p>
        </div>
      )}

      {!wordData && loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-400 border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-400 text-sm">Loading your daily word...</p>
        </div>
      )}

      {wordData && (
        <div className={`space-y-2 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <div>
            <h3 className="text-xl font-bold text-white mb-1 break-words">{wordData.word}</h3>
            <p className="text-sm text-gray-300 italic mb-2 break-words" aria-label="Pronunciation">{wordData.pronunciation}</p>
            <p className="text-sm text-gray-200 leading-relaxed mb-2 break-words">
              {wordData.definition}
            </p>
            <blockquote className="text-sm text-gray-300 italic pl-4 border-l-2 border-gray-600/50 break-words">
              "{wordData.example}"
            </blockquote>
          </div>
        </div>
      )}
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-600/50">
      <p className="text-xs text-gray-400 text-center break-words hyphens-auto overflow-wrap-anywhere px-2 leading-tight">
        Expand your vocabulary with daily word discoveries
      </p>
    </div>
  </section>
  );
};

export default WordOfTheDay; 