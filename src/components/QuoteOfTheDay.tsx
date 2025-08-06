'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
}

interface QuoteOfTheDayProps {
  quote?: Quote;
  resetIntervalHours?: number;
  onRefresh?: () => void;
}


interface ApiQuoteData {
  text: string;
  author: string;
}

export default function QuoteOfTheDay({ 
  quote: initialQuote, 
  resetIntervalHours = 24,
  onRefresh 
}: QuoteOfTheDayProps) {
  const [quote, setQuote] = useState<Quote | null>(initialQuote || null);
  const [isFading, setIsFading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchQuoteFromApi = async () => {
    setIsApiLoading(true);
    setApiError(null);
    
    try {
      // Use Claude API for generating quotes
      const claudeResponse = await fetch('/api/claude/quote-of-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        
        if (claudeData.content && claudeData.content[0] && claudeData.content[0].text) {
          const contentPayload = JSON.parse(claudeData.content[0].text);
          // Handle new direct JSON format
          if (contentPayload.text && contentPayload.author) {
            console.log('📝 Quote source: Claude API (real historical quotes)');
            console.log('📝 Generated quote from:', contentPayload.author);
            return contentPayload as ApiQuoteData;
          }
        }
      }

      throw new Error('Claude API failed to generate quote');
    } catch (err) {
      setApiError('Failed to generate quote');
      return null;
    } finally {
      setIsApiLoading(false);
    }
  };

  const refreshQuote = useCallback(async () => {
    setIsFading(true);
    
    if (onRefresh) {
      onRefresh();
      setIsFading(false);
    } else {
      // Get quote from API
      const apiQuote = await fetchQuoteFromApi();
      
      setTimeout(() => {
        if (apiQuote) {
          setQuote(apiQuote);
        }
        setIsFading(false);
      }, 500);
    }
  }, [onRefresh]);

  useEffect(() => {
    const interval = setInterval(
      refreshQuote,
      resetIntervalHours * 60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [resetIntervalHours, refreshQuote]);

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
          </h2>
          <button
            type="button"
            onClick={refreshQuote}
            disabled={isApiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-md transition duration-200 flex items-center gap-1"
            aria-label="Refresh quote"
          >
            {isApiLoading ? (
              <>
                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                Refresh
              </>
            )}
          </button>
        </div>
        
        {apiError && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
            <p className="text-xs text-red-400">Error: {apiError}</p>
          </div>
        )}

        {!quote && !isApiLoading && !apiError && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-gray-400 text-sm mb-4">Click "Refresh" to generate Quote of the Day</p>
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