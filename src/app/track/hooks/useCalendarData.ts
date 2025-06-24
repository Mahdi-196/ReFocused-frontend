import { useState, useEffect, useCallback } from 'react';
import { DailyCalendarEntry, UserHabit } from '../types';
import { 
  getCalendarEntries, 
  getCalendarEntry, 
  saveCalendarEntry, 
  updateCalendarEntry,
  toggleHabitInCalendar,
  createTodayEntry,
  hasCalendarEntry,
  clearCalendarCache 
} from '@/services/calendarService';
import { getMoodEntries, saveMoodRating } from '@/services/moodService';
import { useCurrentDate } from '@/contexts/TimeContext';

/**
 * Enhanced Calendar Data Hook
 * Manages calendar entries with database persistence and read-only protection
 */
export function useCalendarData(currentMonth: Date, habits: UserHabit[]) {
  const [calendarEntries, setCalendarEntries] = useState<{ [key: string]: DailyCalendarEntry }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDate = useCurrentDate();

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
   * Load calendar entries for current month
   */
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getMonthDateRange();
      
      // Load calendar entries from new calendar service
      const entries = await getCalendarEntries(startDate, endDate);
      
      // Convert to map for easy lookup
      const entriesMap: { [key: string]: DailyCalendarEntry } = {};
      entries.forEach(entry => {
        entriesMap[entry.date] = entry;
      });
      
      setCalendarEntries(entriesMap);
      
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load calendar data. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [getMonthDateRange]);

  /**
   * Create or update calendar entry for a specific date
   */
  const saveCalendarEntryForDate = async (
    date: string, 
    habitCompletions: { habitId: number; completed: boolean }[],
    moodData?: { happiness: number; satisfaction: number; stress: number }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if it's a past date
      const today = new Date().toISOString().split('T')[0];
      if (date < today) {
        return { success: false, error: 'Cannot modify calendar entries for past dates.' };
      }

      // Get habits that existed on this date (for now, use current habits)
      const habitsOnDate = habits.filter(h => h.isActive !== false);
      
      // Create habit completion data with historical names
      const completionData = habitsOnDate.map(habit => {
        const completion = habitCompletions.find(hc => hc.habitId === habit.id);
        return {
          habitId: habit.id,
          habitName: habit.name,
          completed: completion?.completed || false,
          completedAt: completion?.completed ? new Date() : undefined,
          wasActiveOnDate: true
        };
      });

      // Check if entry already exists
      const existingEntry = await getCalendarEntry(date);
      
      if (existingEntry) {
        // Update existing entry
        const updatedEntry = await updateCalendarEntry(date, {
          habitCompletions: completionData,
          moodEntry: moodData
        });
        
        // Update local state
        setCalendarEntries(prev => ({
          ...prev,
          [date]: updatedEntry
        }));
      } else {
        // Create new entry
        const newEntry: DailyCalendarEntry = {
          date,
          userId: 0, // Will be set by backend
          habitCompletions: completionData,
          moodEntry: moodData,
          notes: ''
        };
        
        const savedEntry = await saveCalendarEntry(newEntry);
        
        // Update local state
        setCalendarEntries(prev => ({
          ...prev,
          [date]: savedEntry
        }));
      }
      
      return { success: true };
    } catch (err) {
      console.error('Failed to save calendar entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save calendar entry.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Toggle habit completion for a specific date
   */
  const toggleHabitCompletion = async (
    date: string, 
    habitId: number, 
    completed: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if it's a past date
      const today = new Date().toISOString().split('T')[0];
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

      // Update on backend
      const updatedEntry = await toggleHabitInCalendar(date, habitId, completed);
      
      // Update with real data
      setCalendarEntries(prev => ({
        ...prev,
        [date]: updatedEntry
      }));
      
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
   * Save mood data and integrate with calendar
   */
  const saveMoodData = async (
    ratings: { happiness: number; satisfaction: number; stress: number },
    date?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetDate = date || currentDate;
      
      // Save mood via mood service
      await saveMoodRating(ratings);
      
      // Get existing calendar entry or create completion data
      const existingEntry = calendarEntries[targetDate];
      const habitCompletions = existingEntry?.habitCompletions.map(hc => ({
        habitId: hc.habitId,
        completed: hc.completed
      })) || [];
      
      // Save or update calendar entry with mood data
      return await saveCalendarEntryForDate(targetDate, habitCompletions, ratings);
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
    return calendarEntries[date] || null;
  };

  /**
   * Check if date is read-only (past date)
   */
  const isDateReadOnly = (date: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
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
   * Refresh calendar data
   */
  const refreshCalendarData = () => {
    clearCalendarCache();
    loadCalendarData();
  };

  // Load data when month changes or habits change
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  return {
    // Data
    calendarEntries,
    loading,
    error,
    
    // Actions
    saveCalendarEntryForDate,
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