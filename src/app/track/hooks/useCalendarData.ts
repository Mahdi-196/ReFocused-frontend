import { useState, useEffect, useCallback } from 'react';
import { DailyCalendarEntry, UserHabit } from '../types';
import { getDailyEntries, clearDashboardCache } from '@/services/dashboardService';
import { getHabits } from '@/services/habitsService';
import { saveMoodRating } from '@/services/moodService';
import { markHabitCompletion } from '@/services/habitsService';
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

// Store previous progress values from goal update events
const goalPreviousValues: Record<number, number> = {};

// Helper function to get current date
function getCurrentDate(): string {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Enhanced Calendar Data Hook
 * Manages calendar entries with real data from habit, mood, and goal services
 */
export function useCalendarData(currentMonth: Date, habits: UserHabit[]) {
  const [calendarEntries, setCalendarEntries] = useState<{ [key: string]: DailyCalendarEntry }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDate = useCurrentDate();
  const { getCurrentDate } = useTime();

  // Get date range for current month
  const getMonthDateRange = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    };
  }, [currentMonth]);

  /**
   * Load calendar entries for current month using dashboard data
   */
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getMonthDateRange();
      const monthStr = currentMonth.toISOString().slice(0, 7); // YYYY-MM format
      
      console.log('📊 [CALENDAR HOOK] Loading dashboard data for month:', { 
        monthStr, 
        startDate, 
        endDate, 
        currentMonth: currentMonth.toISOString().split('T')[0] 
      });
      
      // Load dashboard entries (includes mood, habits, gratitudes)
      const [dashboardEntries, habits] = await Promise.all([
        getDailyEntries(monthStr),
        getHabits()
      ]);
      
      console.log('📊 [CALENDAR HOOK] Dashboard data received:', { 
        entriesCount: Object.keys(dashboardEntries).length,
        habitsCount: habits.length,
        sampleEntry: Object.keys(dashboardEntries)[0] ? dashboardEntries[Object.keys(dashboardEntries)[0]] : null
      });
      
      // Convert dashboard entries to calendar format
      const entriesMap: { [key: string]: DailyCalendarEntry } = {};
      
      // Process each date in range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dashboardEntry = dashboardEntries[dateStr];
        
        // Create calendar entry
        const calendarEntry: DailyCalendarEntry = {
          date: dateStr,
          userId: 1,
          habitCompletions: [],
          goalActivities: [],
          gratitudes: [],
          isLocked: dateStr < getCurrentDate()
        };
        
        // Process dashboard data if it exists
        if (dashboardEntry) {
          console.log(`📊 [CALENDAR HOOK] Processing ${dateStr}:`, {
            hasGratitudes: !!dashboardEntry.gratitudes?.length,
            gratitudeCount: dashboardEntry.gratitudes?.length || 0,
            hasHabits: !!dashboardEntry.habitCompletions?.length,
            hasMood: !!(dashboardEntry.happiness || dashboardEntry.focus || dashboardEntry.stress)
          });
          
          // Add mood data
          if (dashboardEntry.happiness || dashboardEntry.focus || dashboardEntry.stress) {
            calendarEntry.moodEntry = {
              happiness: dashboardEntry.happiness || 0,
              focus: dashboardEntry.focus || 0,
              stress: dashboardEntry.stress || 0
            };
          }
          
          // Add habit completions
          if (dashboardEntry.habitCompletions) {
            dashboardEntry.habitCompletions.forEach(completion => {
              const habit = habits.find(h => h.id === completion.habitId);
              if (habit) {
                calendarEntry.habitCompletions.push({
                  habitId: completion.habitId,
                  habitName: habit.name,
                  completed: completion.completed,
                  completedAt: completion.completed ? new Date() : undefined,
                  wasActiveOnDate: habit.isActive !== false
                });
              }
            });
          }
          
          // Add gratitudes (KEY FIX!)
          if (dashboardEntry.gratitudes) {
            console.log(`🙏 [CALENDAR HOOK] Adding ${dashboardEntry.gratitudes.length} gratitudes for ${dateStr}`);
            dashboardEntry.gratitudes.forEach(gratitude => {
              calendarEntry.gratitudes.push({
                id: gratitude.id,
                text: gratitude.text,
                date: gratitude.date,
                createdAt: gratitude.created_at ? new Date(gratitude.created_at) : undefined
              });
            });
          }
        }
        
        entriesMap[dateStr] = calendarEntry;
      }
      
      console.log('📊 [CALENDAR HOOK] Calendar entries created:', {
        totalEntries: Object.keys(entriesMap).length,
        entriesWithGratitudes: Object.values(entriesMap).filter(e => e.gratitudes.length > 0).length,
        entriesWithMood: Object.values(entriesMap).filter(e => e.moodEntry).length,
        entriesWithHabits: Object.values(entriesMap).filter(e => e.habitCompletions.length > 0).length
      });
      
      setCalendarEntries(entriesMap);
      
    } catch (err) {
      console.error('❌ [CALENDAR HOOK] Failed to load calendar data:', err);
      setError('Failed to load calendar data. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [getMonthDateRange, currentMonth]);

  /**
   * Toggle habit completion for a specific date using REAL habit service
   */
  const toggleHabitCompletion = async (
    date: string, 
    habitId: number, 
    completed: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if it's a past date
      const today = getCurrentDate();
      if (date < today) {
        return { success: false, error: 'Cannot modify habit completions for past dates.' };
      }

      // Optimistic update
      setCalendarEntries(prev => {
        const entry = prev[date];
        if (!entry) return prev;
        
        const updatedCompletions = entry.habitCompletions.map(hc =>
          hc.habitId === habitId 
            ? { ...hc, completed, completedAt: completed ? new Date() : undefined }
            : hc
        );
        
        return {
          ...prev,
          [date]: {
            ...entry,
            habitCompletions: updatedCompletions
          }
        };
      });

      // Update via REAL habit service
      await markHabitCompletion(habitId, date, completed);
      
      // Clear cache and reload to get fresh data
      clearDashboardCache();
      await loadCalendarData();
      
      return { success: true };
    } catch (err) {
      // Revert optimistic update
      setCalendarEntries(prev => {
        const entry = prev[date];
        if (!entry) return prev;
        
        const revertedCompletions = entry.habitCompletions.map(hc =>
          hc.habitId === habitId 
            ? { ...hc, completed: !completed, completedAt: !completed ? new Date() : undefined }
            : hc
        );
        
        return {
          ...prev,
          [date]: {
            ...entry,
            habitCompletions: revertedCompletions
          }
        };
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update habit completion.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Save mood data using REAL mood service
   */
  const saveMoodData = async (
    ratings: { happiness: number; focus: number; stress: number },
    date?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetDate = date || currentDate;
      
      // Save mood via REAL mood service
      await saveMoodRating(ratings);
      
      // Clear cache and reload to get fresh data
      clearDashboardCache();
      await loadCalendarData();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save mood data.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Get calendar entry for a specific date
   */
  const getCalendarEntryForDate = (date: string): DailyCalendarEntry | null => {
    const entry = calendarEntries[date] || null;
    return entry;
  };

  /**
   * Check if date is read-only (past date)
   */
  const isDateReadOnly = (date: string): boolean => {
    const today = getCurrentDate();
    return date < today;
  };

  /**
   * Get habit completion status for a date
   */
  const getHabitCompletionForDate = (date: string, habitId: number): boolean => {
    const entry = calendarEntries[date];
    if (!entry) return false;
    
    const completion = entry.habitCompletions.find(hc => hc.habitId === habitId);
    return completion?.completed || false;
  };

  /**
   * Get all habits that existed on a specific date
   */
  const getHabitsForDate = (date: string): Array<{ habit: UserHabit; completed: boolean; wasActive: boolean }> => {
    const entry = calendarEntries[date];
    if (!entry) {
      // Return current habits if no entry exists
      return habits.map(habit => ({
        habit,
        completed: false,
        wasActive: habit.isActive !== false
      }));
    }

    // Match calendar completion data with current habits
    return entry.habitCompletions.map(hc => {
      const currentHabit = habits.find(h => h.id === hc.habitId);
      return {
        habit: currentHabit || {
          id: hc.habitId,
          name: hc.habitName, // Use historical name
          streak: 0,
          isFavorite: false,
          createdAt: new Date(),
          isActive: hc.wasActiveOnDate
        },
        completed: hc.completed,
        wasActive: hc.wasActiveOnDate
      };
    });
  };

  /**
   * Refresh calendar data - now uses dashboard data
   */
  const refreshCalendarData = () => {
    clearDashboardCache();
    loadCalendarData();
  };

  // Load data when month changes only - wait for time service to be ready  
  useEffect(() => {
    // Don't load if time service is not ready
    if (currentDate === 'LOADING_DATE') {
      return;
    }
    loadCalendarData();
  }, [currentMonth, currentDate]); // Also depend on currentDate to ensure sync

  // Listen for goal updates and refresh calendar
  useEffect(() => {
    const handleGoalUpdate = (event: CustomEvent) => {
      // Store the previous value for smart messages
      const { goalId, previousValue, newValue } = event.detail;
      if (previousValue !== undefined) {
        goalPreviousValues[goalId] = previousValue;
      }
      
      // Clear cache and reload to get fresh goal data
      clearDashboardCache();
      loadCalendarData();
    };

    const handleGoalCreation = (event: CustomEvent) => {
      // Clear cache and reload to get fresh goal data
      clearDashboardCache();
      loadCalendarData();
    };

    const handleGratitudeChange = (event: CustomEvent) => {
      console.log('🙏 [CALENDAR] Gratitude changed, refreshing calendar data');
      // Clear cache and reload to get fresh gratitude data
      clearDashboardCache();
      loadCalendarData();
    };

    // Listen for goal and gratitude updates
    if (typeof window !== 'undefined') {
      window.addEventListener('goalProgressUpdated', handleGoalUpdate as EventListener);
      window.addEventListener('goalCreated', handleGoalCreation as EventListener);
      window.addEventListener('gratitudeCreated', handleGratitudeChange as EventListener);
      window.addEventListener('gratitudeUpdated', handleGratitudeChange as EventListener);
      window.addEventListener('gratitudeDeleted', handleGratitudeChange as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('goalProgressUpdated', handleGoalUpdate as EventListener);
        window.removeEventListener('goalCreated', handleGoalCreation as EventListener);
        window.removeEventListener('gratitudeCreated', handleGratitudeChange as EventListener);
        window.removeEventListener('gratitudeUpdated', handleGratitudeChange as EventListener);
        window.removeEventListener('gratitudeDeleted', handleGratitudeChange as EventListener);
      }
    };
  }, [loadCalendarData]);

  return {
    // Data
    calendarEntries,
    loading,
    error,
    
    // Actions
    toggleHabitCompletion,
    saveMoodData,
    refreshCalendarData,
    
    // Utilities
    getCalendarEntryForDate,
    isDateReadOnly,
    getHabitCompletionForDate,
    getHabitsForDate
  };
} 