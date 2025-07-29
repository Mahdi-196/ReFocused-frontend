'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveMoodRating, getTodaysMood } from '@/services/moodService';
import { useCurrentDate } from '@/contexts/TimeContext';

interface MoodRating {
  happiness: number | null;
  focus: number | null;
  stress: number | null;
}

export default function NumberMood() {
  const currentDate = useCurrentDate();
  const [moodRatings, setMoodRatings] = useState<MoodRating>({
    happiness: null,
    focus: null,
    stress: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialSave, setHasInitialSave] = useState(false);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing mood data when time service is ready
  useEffect(() => {
    // Don't load if time service is not ready
    if (currentDate === 'LOADING_DATE') {
      return;
    }
    loadTodaysMood();
  }, [currentDate]); // Depend on currentDate to reload when time changes

  // Listen for mood data cleared event
  useEffect(() => {
    const handleMoodDataCleared = () => {
      console.log('📢 [NUMBER MOOD] Received moodDataCleared event, resetting component...');
      setMoodRatings({
        happiness: null,
        focus: null,
        stress: null
      });
      setHasInitialSave(false);
      setError(null);
    };

    window.addEventListener('moodDataCleared', handleMoodDataCleared);
    return () => {
      window.removeEventListener('moodDataCleared', handleMoodDataCleared);
    };
  }, []);

  const loadTodaysMood = async () => {
    try {
      setLoading(true);
      const existingMood = await getTodaysMood();
      
      if (existingMood) {
        setMoodRatings({
          happiness: existingMood.happiness || null,
          focus: existingMood.focus || null,
          stress: existingMood.stress || null
        });
        // If mood data exists, mark as having initial save
        setHasInitialSave(true);
      }
    } catch (err) {
      console.warn('Failed to load existing mood data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save mood ratings to server
  const handleSave = useCallback(async () => {
    // Validate that all ratings are selected
    if (moodRatings.happiness === null || moodRatings.focus === null || moodRatings.stress === null) {
      return; // Silently return if not all ratings are set
    }

    try {
      setError(null);

      await saveMoodRating({
        happiness: moodRatings.happiness,
        focus: moodRatings.focus,
        stress: moodRatings.stress
      });
    } catch (err) {
      console.error('Failed to save mood ratings:', err);
      if (err instanceof Error && err.message.includes('Time service not ready')) {
        setError('Loading... Please wait a moment and try again.');
      } else {
        setError('Failed to save mood ratings. Please try again.');
      }
    }
  }, [moodRatings.happiness, moodRatings.focus, moodRatings.stress]);

  // Auto-save logic with debouncing
  useEffect(() => {
    const allRatingsSet = moodRatings.happiness !== null && 
                         moodRatings.focus !== null && 
                         moodRatings.stress !== null;

    if (!allRatingsSet) return;

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If this is the first time all ratings are set, save immediately
    if (!hasInitialSave) {
      handleSave();
      setHasInitialSave(true);
    } else {
      // For subsequent changes, debounce the save
      debounceTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [moodRatings, hasInitialSave, handleSave]);

  // Handle rating changes without saving
  const handleRatingChange = (type: keyof MoodRating, value: string) => {
    const numValue = parseInt(value);
    
    // Validate the rating value is within range
    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      console.warn('Invalid rating value:', value);
      return;
    }
    
    // Update local state
    setMoodRatings(prev => ({
      ...prev,
      [type]: numValue
    }));

    // Clear any previous error states
    setError(null);
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

  if (loading) {
    return (
      <div 
        className="rounded-lg p-6 shadow-md"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex items-center justify-center h-40">
          <div className="text-white">Loading mood data...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-6 shadow-md"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-white">Mood Tracking</h2>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="p-6 rounded-lg shadow-sm"
          style={{ background: "linear-gradient(135deg, #374151 0%, #2D3748 100%)" }}
        >
          <h3 className="text-lg font-medium mb-2 text-white">Happiness</h3>
          <p className="text-gray-300 mb-4">How happy are you feeling today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.happiness || ''}
            onChange={(e) => {
              handleRatingChange('happiness', e.target.value);
            }}
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
          <p className="text-gray-300 mb-4">How stressed are you feeling today?</p>
          <input 
            type="range" 
            className="w-full my-4" 
            min="1" 
            max="5" 
            value={moodRatings.stress || ''}
            onChange={(e) => {
              handleRatingChange('stress', e.target.value);
            }}
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
    </div>
  );
} 