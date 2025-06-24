'use client';

import React, { useState, useEffect } from 'react';
import NumberMood from '@/components/NumberMood';
import PageTransition from '@/components/PageTransition';
import AuthGuard from '@/components/AuthGuard';

// Import components
import TrackingStats from './components/TrackingStats';
import HabitTracking from './components/HabitTracking';
import CalendarView from './components/CalendarView';
import CacheControls from './components/CacheControls';

// Import hooks
import { useTrackingData } from './hooks/useTrackingData';
import { useCurrentDate } from '@/contexts/TimeContext';

/**
 * Production Tracking Dashboard
 * Timezone-aware habit and mood tracking
 */
export default function TrackPage() {
  const currentDate = useCurrentDate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(currentDate + 'T00:00:00');
  });

  // Update currentMonth when currentDate changes (timezone-aware)
  useEffect(() => {
    setCurrentMonth(new Date(currentDate + 'T00:00:00'));
  }, [currentDate]);

  // Use tracking data hook
  const {
    habits,
    dailyEntries,
    moodEntries,
    loading,
    error,
    addHabit,
    removeHabit,
    toggleHabitFavorite,
    toggleHabitCompletion,
    isHabitCompleted,
    calculateStats,
    refreshCache,
    getCacheStats
  } = useTrackingData(currentMonth);

  // Calculate statistics
  const stats = calculateStats();

  // Loading state
  if (loading) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-b from-[#0a1220] to-[#10182B] text-white">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#42b9e5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading your tracking data...</p>
              </div>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PageTransition>
        <div 
          className="min-h-screen py-8"
          style={{ backgroundColor: "#1A2537" }}
        >
          <div className="container mx-auto px-4">
            {/* Header */}
            <header className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Tracking Dashboard</h1>
                  <p className="text-white/80">Monitor your mood, habits, and daily progress</p>
                </div>
                
                {/* Cache Controls */}
                <div className="relative">
                  <CacheControls
                    getCacheStats={getCacheStats}
                    refreshCache={refreshCache}
                  />
                </div>
              </div>
            </header>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 bg-red-900/50 border border-red-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-200">{error}</p>
                  <button
                    onClick={refreshCache}
                    className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Stats Section */}
            <TrackingStats stats={stats} />

            {/* Habit Tracking Section */}
            <HabitTracking
              habits={habits}
              loading={loading}
              onAddHabit={addHabit}
              onDeleteHabit={removeHabit}
              onToggleFavorite={toggleHabitFavorite}
              onToggleCompletion={toggleHabitCompletion}
              isHabitCompleted={isHabitCompleted}
            />

            {/* Mood Tracking Section */}
            <section className="mb-8">
              <NumberMood />
            </section>

            {/* Calendar Section */}
            <CalendarView
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              habits={habits}
            />
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  );
} 