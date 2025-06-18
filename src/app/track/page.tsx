'use client';

import { useState } from 'react';
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

export default function TrackPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Use custom hook for data management
  const {
    habits,
    dailyEntries,
    moodEntries,
    loading,
    error,
    addHabit,
    removeHabit,
    toggleHabitFavorite,
    calculateStats,
    refreshCache,
    getCacheStats
  } = useTrackingData(currentMonth);

  // Calculate statistics
  const stats = calculateStats();

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-b from-[#0a1220] to-[#10182B] text-white">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={refreshCache}
                  className="px-4 py-2 bg-[#42b9e5] text-white rounded-lg hover:bg-[#3a9fd4] transition-colors"
                >
                  Try Again
                </button>
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
                  <p className="text-white">Monitor your mood, habits, and daily progress</p>
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

            {/* Stats Section */}
            <TrackingStats stats={stats} />

            {/* Habit Tracking Section */}
            <HabitTracking
              habits={habits}
              loading={loading}
              onAddHabit={addHabit}
              onDeleteHabit={removeHabit}
              onToggleFavorite={toggleHabitFavorite}
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
              dailyEntries={dailyEntries}
              moodEntries={moodEntries}
            />
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  );
} 