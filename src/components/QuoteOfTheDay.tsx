'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuoteOfTheDaySimple as useQuoteOfTheDay } from '../hooks/useDailyContentSimple';

interface Quote {
  text: string;
  author: string;
}

interface QuoteOfTheDayProps {
  resetIntervalHours?: number; // Legacy prop, no longer used
  onRefresh?: () => void; // Legacy prop, no longer used  
}

export default function QuoteOfTheDay({ 
  resetIntervalHours = 24, // Legacy compatibility
  onRefresh 
}: QuoteOfTheDayProps = {}) {
  const { data: quote, loading, error, refresh, isCached } = useQuoteOfTheDay();
  const [isFading, setIsFading] = useState(false);

  // Manual refresh removed

  return (
    <section 
      className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[17rem] sm:h-[19rem] lg:h-[19rem] xl:h-[19rem] 2xl:h-[19rem] flex flex-col justify-between"
      aria-labelledby="quote-of-the-day"
    >
      <div className="min-h-0 flex-1 flex-grow overflow-y-auto custom-scrollbar pr-2">
        <div className="flex items-center justify-between mb-4">
          <h2 id="quote-of-the-day" className="flex items-center gap-2 text-lg font-semibold text-white">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Quote of the Day
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
            <p className="text-xs text-red-400">Failed to load quote. Please try again.</p>
          </div>
        )}

        {!quote && loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mb-3"></div>
            <p className="text-gray-400 text-sm">Loading your daily quote...</p>
          </div>
        )}

        {quote && (
          <div className={`transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <blockquote className="text-xl italic text-white mb-4 break-words leading-relaxed">
              "{quote.text}"
            </blockquote>
            <p className="text-right text-gray-300 break-words">
              — {quote.author}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <p className="text-xs text-gray-400 text-center break-words hyphens-auto overflow-wrap-anywhere px-2 leading-tight">
          Daily inspiration to fuel your journey
        </p>
      </div>
    </section>
  );
} 