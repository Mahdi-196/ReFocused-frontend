"use client";

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
}

const INSPIRATIONAL_QUOTES: Quote[] = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "Be the change you wish to see in the world.",
    author: "Mahatma Gandhi"
  },
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh"
  },
  {
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss"
  }
];

const QuoteOfTheDay = () => {
  const [quote, setQuote] = useState<Quote>(INSPIRATIONAL_QUOTES[0]);
  const [isFading, setIsFading] = useState(false);

  const getRandomQuote = useCallback(() => {
    const currentIndex = INSPIRATIONAL_QUOTES.findIndex(q => q.text === quote.text);
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
    } while (randomIndex === currentIndex && INSPIRATIONAL_QUOTES.length > 1);
    return INSPIRATIONAL_QUOTES[randomIndex];
  }, [quote.text]);

  const refreshQuote = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsFading(false);
    }, 300);
  }, [getRandomQuote]);

  useEffect(() => {
    // Set initial random quote
    setQuote(INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)]);
    
    // Auto-refresh every 24 hours
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
      setQuote(INSPIRATIONAL_QUOTES[randomIndex]);
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  return (
    <section 
      aria-labelledby="daily-quote"
    >
      <article className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[17rem] sm:h-[19rem] lg:h-[19rem] xl:h-[19rem] 2xl:h-[19rem] flex flex-col justify-between">
        <div>
          <header className="flex items-center justify-between mb-4">
            <h2 id="daily-quote" className="text-lg font-semibold text-white">
              💭 Quote of the Day
            </h2>
            <button
              onClick={refreshQuote}
              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
              aria-label="Get a new inspirational quote"
              title="Refresh Quote"
            >
              <RefreshCw className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isFading ? 'rotate-180' : ''}`} />
            </button>
          </header>
          
          <div className={`transition-all duration-300 ${isFading ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
            <blockquote 
              className="text-xl italic leading-relaxed text-gray-200 mb-6 flex-grow flex items-center"
              cite="Daily Inspiration"
            >
              <span className="text-center w-full">"{quote.text}"</span>
            </blockquote>
            <footer className="text-right">
              <cite className="text-lg font-medium text-gray-300 not-italic">
                — {quote.author}
              </cite>
            </footer>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600/50">
          <p className="text-xs text-gray-400 text-center">
            Daily motivation for your productivity journey
          </p>
        </div>
      </article>
    </section>
  );
};

export default QuoteOfTheDay; 