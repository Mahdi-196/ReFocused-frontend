'use client';

import React, { useState, useEffect } from 'react';
import NumberMood from '@/components/NumberMood';
import PageTransition from '@/components/PageTransition';
import AuthGuard from '@/components/AuthGuard';
import { TrackPageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Import components
import TrackingStats from './components/TrackingStats';
import HabitTracking from './components/HabitTracking';
import CalendarView from './components/CalendarView';
import CacheControls from './components/CacheControls';

// Import hooks
import { useTrackingData } from './hooks/useTrackingData';
import { useCalendarData } from './hooks/useCalendarData';
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

/**
 * Optimized Production Tracking Dashboard
 * Eliminates duplicate API calls and improves performance
 */
export default function TrackPage() {
  const currentDate = useCurrentDate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(currentDate + 'T00:00:00');
  });

  // Backend health tracking
  const [backendHealth, setBackendHealth] = useState<{
    status: 'unknown' | 'healthy' | 'degraded' | 'error';
    lastCheck: Date | null;
    issues: string[];
  }>({
    status: 'unknown',
    lastCheck: null,
    issues: []
  });

  // Authentication state
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    token: string | null;
    user: any;
  }>({
    isAuthenticated: false,
    token: null,
    user: null
  });

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('REF_TOKEN');
    const user = localStorage.getItem('REF_USER');
    const isAuthenticated = !!(token && token !== 'dummy-auth-token');
    
    setAuthStatus({
      isAuthenticated,
      token,
      user: user ? JSON.parse(user) : null
    });
  }, []);

  // Track if user manually changed month to avoid auto-updates
  const [userChangedMonth, setUserChangedMonth] = useState(false);

  // Wrapped setCurrentMonth that tracks manual changes
  const handleMonthChange = (newMonth: Date) => {
    console.log('📅 [TRACK PAGE] User manually changed month to:', newMonth.toISOString().slice(0, 7));
    setCurrentMonth(newMonth);
    setUserChangedMonth(true);
    
    // Reset after 5 seconds to allow auto-update again
    setTimeout(() => {
      setUserChangedMonth(false);
    }, 5000);
  };

  // Update currentMonth when currentDate changes (timezone-aware)
  useEffect(() => {
    // Don't update if time service is not ready
    if (currentDate === 'LOADING_DATE') {
      return;
    }
    
    // Don't auto-update if user manually navigated to a different month
    if (userChangedMonth) {
      return;
    }
    
    const newMonth = new Date(currentDate + 'T00:00:00');
    
    // Only update if the month actually changed to avoid unnecessary re-renders
    if (currentMonth.toISOString().slice(0, 7) !== newMonth.toISOString().slice(0, 7)) {
      console.log('📅 [TRACK PAGE] Updating calendar month from', currentMonth.toISOString().slice(0, 7), 'to', newMonth.toISOString().slice(0, 7));
      setCurrentMonth(newMonth);
    }
  }, [currentDate, currentMonth, userChangedMonth]);

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
    refreshCache
  } = useTrackingData(currentMonth);

  // Use calendar hook to avoid duplicate API calls
  const {
    calendarEntries,
    loading: calendarLoading,
    error: calendarError,
    toggleHabitCompletion: toggleCalendarHabit
  } = useCalendarData(currentMonth, habits);

  // Update backend health based on calendar loading state
  useEffect(() => {
    if (calendarError) {
      setBackendHealth({
        status: 'degraded',
        lastCheck: new Date(),
        issues: ['Calendar data loading issues']
      });
    } else if (!calendarLoading && !calendarError) {
      setBackendHealth({
        status: 'healthy',
        lastCheck: new Date(),
        issues: []
      });
    }
  }, [calendarLoading, calendarError]);

  // Calculate statistics
  const stats = calculateStats();

  // Loading state - wait for time service and data
  if (loading || currentDate === 'LOADING_DATE') {
    return (
      <AuthGuard>
        <PageTransition>
          <TrackPageSkeleton />
        </PageTransition>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PageTransition>
        <SkeletonDemo
          skeleton={<TrackPageSkeleton />}
          delay={100}
          enabled={false}
        >
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
                      refreshCache={refreshCache}
                    />
                  </div>
                </div>
              </header>

              {/* Authentication Status */}
              {!authStatus.isAuthenticated && (
                <div className="mb-6 bg-orange-900/30 border border-orange-600 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-2a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-orange-200 font-medium">Authentication Required</p>
                      <p className="text-orange-300 text-sm mt-1">
                        Please log in to view your tracking data.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.location.href = '/'}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
                        >
                          Go to Login
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {(error || calendarError || backendHealth.status === 'degraded') && (
                <div className={`mb-6 rounded-lg p-4 ${
                  backendHealth.status === 'degraded' 
                    ? 'bg-yellow-900/30 border border-yellow-600' 
                    : 'bg-red-900/50 border border-red-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      backendHealth.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      {error && <p className="text-red-200">{error}</p>}
                      {calendarError && !error && (
                        <p className={backendHealth.status === 'degraded' ? 'text-yellow-200' : 'text-red-200'}>
                          {calendarError}
                        </p>
                      )}
                      
                      {backendHealth.lastCheck && (
                        <p className="text-gray-400 text-xs mt-2">
                          Last checked: {backendHealth.lastCheck.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        refreshCache();
                        setCurrentMonth(new Date(currentMonth));
                      }}
                      className={`ml-auto px-3 py-1 text-white text-sm rounded transition-colors ${
                        backendHealth.status === 'degraded'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Retry All
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
                setCurrentMonth={handleMonthChange}
                habits={habits}
                calendarEntries={calendarEntries}
                loading={calendarLoading}
                error={calendarError}
                onToggleHabit={async (dateStr: string, habitId: string, completed: boolean) => {
                  await toggleCalendarHabit(dateStr, parseInt(habitId), completed);
                }}
                isHabitCompleted={isHabitCompleted}
              />
            </div>
          </div>
        </SkeletonDemo>
      </PageTransition>
    </AuthGuard>
  );
}