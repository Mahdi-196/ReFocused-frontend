'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
}

interface QuoteOfTheDayProps {
  quote?: Quote;
  resetIntervalHours?: number;
  onRefresh?: () => void;
}

const DEFAULT_QUOTES: Quote[] = [
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
    text: "The quieter you become, the more you can hear.",
    author: "Ram Dass"
  },
  {
    text: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra"
  },
  {
    text: "Wherever you are, be there totally.",
    author: "Eckhart Tolle"
  }
];

export default function QuoteOfTheDay({ 
  quote: initialQuote, 
  resetIntervalHours = 24,
  onRefresh 
}: QuoteOfTheDayProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote || DEFAULT_QUOTES[0]);
  const [isFading, setIsFading] = useState(false);

  const getRandomQuote = useCallback(() => {
    const currentIndex = DEFAULT_QUOTES.findIndex(q => q.text === quote.text);
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * DEFAULT_QUOTES.length);
    } while (randomIndex === currentIndex && DEFAULT_QUOTES.length > 1);
    return DEFAULT_QUOTES[randomIndex];
  }, [quote.text]);

  const refreshQuote = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      if (onRefresh) {
        onRefresh();
      } else {
        setQuote(getRandomQuote());
      }
      setIsFading(false);
    }, 500);
  }, [onRefresh, getRandomQuote]);

  useEffect(() => {
    if (!initialQuote) {
      setQuote(getRandomQuote());
    }

    const interval = setInterval(
      refreshQuote,
      resetIntervalHours * 60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [initialQuote, resetIntervalHours]);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm p-8">
      <div className={`transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <blockquote className="text-2xl italic text-gray-800 mb-4">
          "{quote.text}"
        </blockquote>
        <p className="text-right text-gray-600">
          — {quote.author}
        </p>
      </div>
      
      <button
        onClick={refreshQuote}
        className="mt-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Refresh quote"
      >
        <RefreshCw className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
} 