"use client";

import { useState } from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';

interface WordData {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
}

const WordOfTheDay = () => {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWordData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claude/word-of-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        const contentPayload = JSON.parse(data.content[0].text);
        // Handle new direct JSON format
        if (contentPayload.word && contentPayload.pronunciation && contentPayload.definition && contentPayload.example) {
          console.log('📚 Word source: Claude API (domain-specific generation)');
          console.log('📚 Generated word:', contentPayload.word);
          setWordData(contentPayload);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word data');
    } finally {
      setLoading(false);
    }
  };

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
        </h2>
        <button
          type="button"
          onClick={fetchWordData}
          disabled={loading}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs rounded-md transition duration-200 flex items-center gap-1"
        >
          {loading ? (
            <>
              <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <RotateCcw className="w-3 h-3" />
              Refresh
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
          <p className="text-xs text-red-400">Error: {error}</p>
        </div>
      )}

      {!wordData && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="w-10 h-10 text-green-400 mb-3" />
          <p className="text-gray-400 text-sm mb-4">Click "Refresh" to generate Word of the Day</p>
        </div>
      )}

      {wordData && (
        <div className="space-y-2">
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