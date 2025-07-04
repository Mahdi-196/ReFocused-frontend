'use client';

import React, { useState, useEffect } from 'react';
import { saveMoodRating, getTodaysMood } from '@/services/moodService';
import { useCurrentDate } from '@/contexts/TimeContext';

interface MoodRating {
  happiness: number | null;
  focus: number | null;
  stress: number | null;
}

export default function NumberMood() {
  const [moodRatings, setMoodRatings] = useState<MoodRating>({
    happiness: null,
    focus: null,
    stress: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load today's mood on component mount
  useEffect(() => {
    const loadTodaysMood = async () => {
      try {
        const todaysMood = await getTodaysMood();
        if (todaysMood) {
          setMoodRatings({
            happiness: todaysMood.happiness ?? null,
            focus: todaysMood.focus ?? null,
            stress: todaysMood.stress ?? null
          });
          setLastSaved(new Date(todaysMood.updatedAt || todaysMood.createdAt || Date.now()));
        }
      } catch (error) {
        console.error('Failed to load today\'s mood:', error);
        setError('Failed to load your previous mood data');
      } finally {
        setLoading(false);
      }
    };

    loadTodaysMood();
  }, []);

  // Auto-save mood rating with retry logic - Only save when all fields are complete
  const handleRatingChange = async (type: keyof MoodRating, value: string) => {
    const numValue = parseInt(value);
    
    // Validate the rating value is within range
    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      console.warn('Invalid rating value:', value);
      return;
    }
    
    // Update local state immediately for UI responsiveness
    const newRatings = {
      ...moodRatings,
      [type]: numValue
    };
    setMoodRatings(newRatings);
    setError(null); // Clear any previous errors

    // Only save if we have all three VALID values and not in initial loading state
    if (!loading && 
        typeof newRatings.happiness === 'number' && 
        typeof newRatings.focus === 'number' &&
        typeof newRatings.stress === 'number' &&
        newRatings.happiness >= 1 && newRatings.happiness <= 5 &&
        newRatings.focus >= 1 && newRatings.focus <= 5 &&
        newRatings.stress >= 1 && newRatings.stress <= 5) {
      
      console.log('Saving complete mood rating:', newRatings);
      await saveWithRetry({
        happiness: newRatings.happiness,
        focus: newRatings.focus,
        stress: newRatings.stress
      });
    } else {
      console.log('Mood rating incomplete, waiting for all values:', {
        happiness: newRatings.happiness,
        focus: newRatings.focus,
        stress: newRatings.stress,
        loading
      });
    }
  };

  // Save with retry logic for better UX
  const saveWithRetry = async (ratings: { happiness: number; focus: number; stress: number }, attempt = 1) => {
    setSaving(true);
    setRetryCount(attempt - 1);
    
    try {
      await saveMoodRating(ratings);
      setLastSaved(new Date());
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error(`Mood save attempt ${attempt} failed:`, error);
      
      if (attempt < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s delays
        setTimeout(() => {
          saveWithRetry(ratings, attempt + 1);
        }, delay);
      } else {
        // All retries failed
        setError('Failed to save mood rating. Please try again.');
        setRetryCount(0);
      }
    } finally {
      if (attempt >= 3) {
        setSaving(false);
      }
    }
  };

  const getRatingStyle = (rating: number | null, type: 'normal' | 'stress' = 'normal') => {
    const defaultStyle = {
      background: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    };

    if (rating === null) {
      return defaultStyle;
    }

    if (type === 'stress') {
      switch (rating) {
        case 1: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 2: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 3: 
          return {
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 4:
        case 5: 
          return {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        default: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
      }
    } else {
      switch (rating) {
        case 1:
        case 2: 
          return {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 3: 
          return {
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 4: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        case 5: 
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
        default: 
          return {
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          };
      }
    }
  };

  return (
    <div 
      className="rounded-lg p-6 shadow-md"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-white">Mood Tracking</h2>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Saving...'}
            </div>
          )}
          {error && !saving && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {lastSaved && !saving && !error && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Loading your mood data...
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Happiness</h3>
          <p className="text-gray-300 mb-4">How happy do you feel today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.happiness || ''}
            onChange={(e) => {
              handleRatingChange('happiness', e.target.value);
            }}
            disabled={loading}
          />
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.happiness)}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.happiness ? `${moodRatings.happiness}/5` : 'Rate'}</span>
          </div>
        </div>

        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Focus</h3>
          <p className="text-gray-300 mb-4">How focused are you feeling today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.focus || ''}
            onChange={(e) => {
              handleRatingChange('focus', e.target.value);
            }}
            disabled={loading}
          />
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.focus)}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.focus ? `${moodRatings.focus}/5` : 'Rate'}</span>
          </div>
        </div>

        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Stress</h3>
          <p className="text-gray-300 mb-4">How stressed do you feel today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.stress || ''}
            onChange={(e) => {
              handleRatingChange('stress', e.target.value);
            }}
            disabled={loading}
          />
          <div className="flex justify-between text-gray-300 mt-2">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
          <div 
            className="text-center py-2 rounded mt-4 text-white font-medium transition-colors duration-300 relative overflow-hidden"
            style={getRatingStyle(moodRatings.stress, 'stress')}
          >
            <div 
              className="absolute inset-0 rounded opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
              }}
            />
            <span className="relative z-10">{moodRatings.stress ? `${moodRatings.stress}/5` : 'Rate'}</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
} 