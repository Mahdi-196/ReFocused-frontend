import { useState, useEffect, useCallback } from 'react';
import { DailyCalendarEntry, UserHabit } from '../types';
import { 
  getCalendarEntries, 
  getCalendarEntry, 
  toggleHabitInCalendar,
  hasCalendarEntry,
  clearCalendarCache 
} from '@/services/calendarService';
import { saveMoodRating } from '@/services/moodService';
import { markHabitCompletion } from '@/services/habitsService';
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

// Store previous progress values from goal update events
const goalPreviousValues: Record<number, number> = {};

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
   * Load calendar entries for current month using REAL data
   */
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getMonthDateRange();
      console.log('📊 [CALENDAR HOOK] Loading calendar for month:', { startDate, endDate, currentMonth: currentMonth.toISOString().split('T')[0] });
      
      // Load calendar entries from REAL services (not mock API)
      const entries = await getCalendarEntries(startDate, endDate);
      
      // Convert to map for easy lookup
      const entriesMap: { [key: string]: DailyCalendarEntry } = {};
      entries.forEach(entry => {
        entriesMap[entry.date] = entry;
        if (entry.gratitudes && entry.gratitudes.length > 0) {
          console.log('🙏 [CALENDAR HOOK] Found gratitudes for date:', entry.date, entry.gratitudes);
        }
      });
      
      console.log('📊 [CALENDAR HOOK] Loaded entries count:', entries.length);
      setCalendarEntries(entriesMap);
      
    } catch (err) {
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
      clearCalendarCache();
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
      clearCalendarCache();
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
   * Refresh calendar data - now uses REAL data
   */
  const refreshCalendarData = () => {
    clearCalendarCache();
    loadCalendarData();
  };

  // Load data when month changes only
  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]); // Only depend on currentMonth to prevent loops

  // Listen for goal updates and refresh calendar
  useEffect(() => {
    const handleGoalUpdate = (event: CustomEvent) => {
      // Store the previous value for smart messages
      const { goalId, previousValue, newValue } = event.detail;
      if (previousValue !== undefined) {
        goalPreviousValues[goalId] = previousValue;
      }
      
      // Clear cache and reload to get fresh goal data
      clearCalendarCache();
      loadCalendarData();
    };

    const handleGoalCreation = (event: CustomEvent) => {
      // Clear cache and reload to get fresh goal data
      clearCalendarCache();
      loadCalendarData();
    };

    // Listen for goal progress updates and creation
    if (typeof window !== 'undefined') {
      window.addEventListener('goalProgressUpdated', handleGoalUpdate as EventListener);
      window.addEventListener('goalCreated', handleGoalCreation as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('goalProgressUpdated', handleGoalUpdate as EventListener);
        window.removeEventListener('goalCreated', handleGoalCreation as EventListener);
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