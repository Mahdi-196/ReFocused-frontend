'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { useCurrentDate, useTime } from '@/contexts/TimeContext';
import { getCalendarEntries } from '@/services/calendarService';

/**
 * Production Tracking Dashboard
 * Timezone-aware habit and mood tracking
 */
export default function TrackPage() {
  const currentDate = useCurrentDate();
  const { getCurrentDate } = useTime();
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
    
    console.log('🔐 [TRACK PAGE] Auth status:', {
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      userInfo: user ? JSON.parse(user) : null
    });
  }, []);

  // Update currentMonth when currentDate changes (timezone-aware)
  useEffect(() => {
    const newMonth = new Date(currentDate + 'T00:00:00');
    
    // Only update if the month actually changed to avoid unnecessary re-renders
    if (currentMonth.toISOString().slice(0, 7) !== newMonth.toISOString().slice(0, 7)) {
      setCurrentMonth(newMonth);
    }
  }, [currentDate]); // Remove currentMonth from dependency to prevent infinite loop

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

  // Load calendar data with gratitudes and goal activities
  const [calendarEntries, setCalendarEntries] = useState<{ [key: string]: any }>({});
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

     // Load calendar data when month changes
   useEffect(() => {
     const loadCalendarData = async () => {
       try {
         setCalendarLoading(true);
         setCalendarError(null);
         
         // Use time service current date to determine the correct month
         const timeServiceDate = getCurrentDate ? getCurrentDate() : currentDate;
         const baseDate = new Date(timeServiceDate + 'T00:00:00');
         
         // Calculate the month we want to display (could be currentMonth or the month from time service)
         const targetDate = currentMonth || baseDate;
         const year = targetDate.getFullYear();
         const month = targetDate.getMonth();
         const firstDay = new Date(year, month, 1);
         const lastDay = new Date(year, month + 1, 0);
         
         const startDate = firstDay.toISOString().split('T')[0];
         const endDate = lastDay.toISOString().split('T')[0];
         
         console.log('📅 [CALENDAR] Date calculation:', {
           timeServiceDate,
           currentDate,
           currentMonth: currentMonth.toISOString(),
           calculatedRange: { startDate, endDate },
           year,
           month: month + 1 // +1 for display (0-based to 1-based)
         });
         
         try {
           // Clear any cached data for this month to force fresh fetch
           console.log('🧹 [CALENDAR] Clearing cache for date range:', { startDate, endDate });
           
           // Force cache clear by calling refreshCache first
           refreshCache();
           
           // Try to load from calendar service first
           const entries = await getCalendarEntries(startDate, endDate);
           
           // Convert to map for easy lookup
           const entriesMap: { [key: string]: any } = {};
           entries.forEach(entry => {
             entriesMap[entry.date] = entry;
           });
           
           console.log('📊 [TRACK PAGE] Calendar entries loaded:', {
             totalEntries: entries.length,
             entriesMap: Object.keys(entriesMap),
             entriesForDebug: Object.keys(entriesMap).slice(0, 5), // First 5 dates
             sampleEntry: Object.values(entriesMap)[0],
             dateRange: `${startDate} to ${endDate}`,
             expectedMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
             dataActuallyLoaded: entries.length > 0 ? 'YES' : 'NO'
           });
           
           setCalendarEntries(entriesMap);
           
           // Update backend health status
           setBackendHealth({
             status: 'healthy',
             lastCheck: new Date(),
             issues: []
           });
           
         } catch (calendarError) {
           console.warn('Calendar service failed, falling back to tracking data:', calendarError);
           
           // Analyze the error to provide better messaging
           const errorMessage = calendarError instanceof Error ? calendarError.message : String(calendarError);
           const issues: string[] = [];
           
           if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
             issues.push('Backend database connectivity issues');
           }
           if (errorMessage.includes('day_rating')) {
             issues.push('Mood data format compatibility issue');
           }
           if (errorMessage.includes('Failed to fetch')) {
             issues.push('Network connectivity problems');
           }
           if (issues.length === 0) {
             issues.push('Unknown backend error');
           }
           
           setBackendHealth({
             status: 'degraded',
             lastCheck: new Date(),
             issues
           });
           
           // Fallback: Create calendar entries from existing tracking data
           console.log('⚠️ [TRACK PAGE] Using fallback data. Available data:', {
             dailyEntriesKeys: Object.keys(dailyEntries),
             moodEntriesKeys: Object.keys(moodEntries),
             habitsCount: habits.length,
             calendarError: errorMessage
           });
           
           const fallbackEntries: { [key: string]: any } = {};
           
           // Use daily entries from useTrackingData
           Object.keys(dailyEntries).forEach(date => {
             const dailyEntry = dailyEntries[date];
             const moodEntry = moodEntries[date];
             
             fallbackEntries[date] = {
               date,
               userId: 1,
               habitCompletions: dailyEntry.habitCompletions?.map(hc => ({
                 habitId: hc.habitId,
                 habitName: habits.find(h => h.id === hc.habitId)?.name || 'Unknown Habit',
                 completed: hc.completed,
                 wasActiveOnDate: true
               })) || [],
               moodEntry: moodEntry ? {
                 happiness: moodEntry.happiness || 0,
                 focus: moodEntry.focus || 0,
                 stress: moodEntry.stress || 0
               } : undefined,
               gratitudes: [], // Empty in fallback
               goalActivities: [] // Empty in fallback
             };
           });

           // Add mood-only entries
           Object.keys(moodEntries).forEach(date => {
             if (!fallbackEntries[date]) {
               const moodEntry = moodEntries[date];
               fallbackEntries[date] = {
                 date,
                 userId: 1,
                 habitCompletions: [],
                 moodEntry: {
                   happiness: moodEntry.happiness || 0,
                   focus: moodEntry.focus || 0,
                   stress: moodEntry.stress || 0
                 },
                 gratitudes: [],
                 goalActivities: []
               };
             }
           });
           
           setCalendarEntries(fallbackEntries);
           setCalendarError('Some calendar features may be limited due to backend issues.');
         }
       } catch (err) {
         console.error('Complete calendar loading failure:', err);
         setBackendHealth({
           status: 'error',
           lastCheck: new Date(),
           issues: ['Complete system failure - please refresh']
         });
         setCalendarError('Calendar data temporarily unavailable. Please refresh to try again.');
         setCalendarEntries({});
       } finally {
         setCalendarLoading(false);
       }
     };

     loadCalendarData();
   }, [currentMonth]); // Only depend on currentMonth to prevent infinite loops

  // Calculate statistics
  const stats = calculateStats();

  // Loading state
  if (loading) {
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
          delay={100} // Minimal delay for smooth transition
          enabled={false} // Disable forced demo mode
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
                        Please log in to view your tracking data. The app requires authentication to load personal data.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => window.location.href = '/'}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
                        >
                          Go to Login
                        </button>
                        <button
                          onClick={() => {
                            // For development/testing: set a mock token
                            localStorage.setItem('REF_TOKEN', 'dev-test-token-' + Date.now());
                            localStorage.setItem('REF_USER', JSON.stringify({ id: 1, email: 'test@example.com' }));
                            window.location.reload();
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                        >
                          Dev: Mock Login
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
                      
                      {/* Backend Health Details */}
                      {backendHealth.status === 'degraded' && backendHealth.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-yellow-300 text-sm font-medium">
                            🔧 Known Issues:
                          </p>
                          <ul className="text-yellow-200 text-sm space-y-1">
                            {backendHealth.issues.map((issue, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {backendHealth.status === 'degraded' && (
                        <div className="mt-2 p-2 bg-yellow-800/30 rounded text-yellow-200 text-sm">
                          <p className="font-medium">📱 What's Working:</p>
                          <ul className="mt-1 space-y-0.5">
                            <li>• Mood tracking and habits</li>
                            <li>• Calendar view and navigation</li>
                            <li>• Statistics and progress</li>
                          </ul>
                          <p className="mt-1 font-medium">⚠️ Limited Features:</p>
                          <ul className="mt-1 space-y-0.5">
                            <li>• Gratitude entries</li>
                            <li>• Some goal activity history</li>
                          </ul>
                        </div>
                      )}
                      
                      {backendHealth.lastCheck && (
                        <p className="text-gray-400 text-xs mt-2">
                          Last checked: {backendHealth.lastCheck.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        refreshCache();
                        // Trigger calendar data reload
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
                setCurrentMonth={setCurrentMonth}
                habits={habits}
                calendarEntries={calendarEntries}
                loading={calendarLoading}
                error={calendarError}
                onToggleHabit={async (dateStr: string, habitId: string, completed: boolean) => {
                  await toggleHabitCompletion(parseInt(habitId), dateStr, completed);
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