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
      console.log('🔍 Loading REAL calendar data for range:', { startDate, endDate });
      
      // Load calendar entries from REAL services (not mock API)
      const entries = await getCalendarEntries(startDate, endDate);
      console.log('📥 Received REAL calendar entries:', entries.length, 'entries');
      
      // Convert to map for easy lookup
      const entriesMap: { [key: string]: DailyCalendarEntry } = {};
      entries.forEach(entry => {
        entriesMap[entry.date] = entry;
      });
      
      console.log('📋 Real calendar entries map has', Object.keys(entriesMap).length, 'entries');
      if (Object.keys(entriesMap).length > 0) {
        console.log('📋 Available dates:', Object.keys(entriesMap).slice(0, 5).join(', ') + 
                   (Object.keys(entriesMap).length > 5 ? '...' : ''));
      }
      
      setCalendarEntries(entriesMap);
      
    } catch (err) {
      console.error('Failed to load REAL calendar data:', err);
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
      
      console.error('Failed to toggle habit completion:', err);
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
      console.error('Failed to save mood data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save mood data.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Get calendar entry for a specific date
   */
  const getCalendarEntryForDate = (date: string): DailyCalendarEntry | null => {
    const entry = calendarEntries[date] || null;
    // Debug logging
    if (entry && process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log(`🔍 getCalendarEntryForDate(${date}):`, {
        hasHabits: entry.habitCompletions?.length || 0,
        hasMood: !!entry.moodEntry,
        hasGoals: entry.goalActivities?.length || 0
      });
    }
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
    console.log('🧹 Clearing REAL calendar cache and reloading data...');
    clearCalendarCache();
    loadCalendarData();
  };

  // Load data when month changes or habits change
  useEffect(() => {
    // Force clear cache on initial load to ensure fresh data
    if (Object.keys(calendarEntries).length === 0) {
      console.log('🔄 Initial load - clearing REAL calendar cache...');
      clearCalendarCache();
    }
    loadCalendarData();
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