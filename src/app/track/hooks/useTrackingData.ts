import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserHabit, DailyEntry, TrackingStats } from '../types';
import type { MoodEntry as ServiceMoodEntry } from '@/services/moodService';
import { getMoodEntries } from '@/services/moodService';
import { getHabits, createHabit, updateHabit, deleteHabit, markHabitCompletion, getHabitCompletions } from '@/services/habitsService';
import { getDailyEntries } from '@/services/dashboardService';
import { cacheService } from '@/services/cacheService';
import { useCurrentDate } from '@/contexts/TimeContext';

/**
 * Production-ready timezone-aware habit tracking hook
 * Implements on-demand reset check strategy
 */
export function useTrackingData(currentMonth: Date) {
  // State management
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [dailyEntries, setDailyEntries] = useState<{[key: string]: DailyEntry}>({});
  const [moodEntries, setMoodEntries] = useState<{[key: string]: ServiceMoodEntry}>({});
  const [habitCompletions, setHabitCompletions] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date from time service (timezone-aware)
  const currentDate = useCurrentDate();

  // Memoized date calculations
  const todayString = useMemo(() => currentDate, [currentDate]);
  const monthString = useMemo(() => todayString.slice(0, 7), [todayString]);

  /**
   * Load all user data with timezone-aware operations
   */
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load habits (with automatic timezone-aware reset check on backend)
      const habitsData = await getHabits();
      setHabits(habitsData);
      
      // Load daily entries for current month
      const entriesMap = await getDailyEntries(monthString);
      setDailyEntries(entriesMap);

      // Load mood entries for current month
      const currentYear = new Date(todayString).getFullYear();
      const currentMonthNum = new Date(todayString).getMonth();
      const firstDay = new Date(currentYear, currentMonthNum, 1);
      const lastDay = new Date(currentYear, currentMonthNum + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const moodData = await getMoodEntries(startDate, endDate);
      const moodMap: {[key: string]: ServiceMoodEntry} = {};
      moodData?.forEach(entry => {
        moodMap[entry.date] = entry;
      });
      setMoodEntries(moodMap);

      // Load habit completions for today
      const completions = await getHabitCompletions(todayString, todayString);
      const completionMap: {[key: string]: boolean} = {};
      completions.forEach(completion => {
        const key = `${completion.habitId}-${completion.date}`;
        completionMap[key] = completion.completed;
      });
      setHabitCompletions(completionMap);
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load data. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [todayString, monthString]);

  // Load data when dependencies change
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  /**
   * Habit management functions
   */
  const addHabit = async (habitName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!habitName.trim()) {
        return { success: false, error: 'Please enter a habit name' };
      }
      
      // Check for duplicates
      const habitExists = habits.some(
        habit => habit.name.toLowerCase() === habitName.trim().toLowerCase()
      );

      if (habitExists) {
        return { success: false, error: 'This habit already exists' };
      }

      // Create optimistic update
      const optimisticHabit: UserHabit = {
        id: Date.now(),
        name: habitName.trim(),
        streak: 0,
        isFavorite: false,
        createdAt: new Date(),
      };
      
      setHabits(prev => [...prev, optimisticHabit]);

      try {
        // Create on backend
        const newHabit = await createHabit({ name: habitName.trim() });
        
        // Update with real data
        setHabits(prev => 
          prev.map(h => h.id === optimisticHabit.id ? newHabit : h)
        );
        
        return { success: true };
      } catch (err) {
        // Revert optimistic update
        setHabits(prev => prev.filter(h => h.id !== optimisticHabit.id));
        return { success: false, error: 'Failed to create habit. Please try again.' };
      }
    } catch (err) {
      console.error('Unexpected error in addHabit:', err);
      return { success: false, error: 'An unexpected error occurred.' };
    }
  };

  const removeHabit = async (habitId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      
      // Remove related completions
      setHabitCompletions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(`${habitId}-`)) {
            delete updated[key];
          }
        });
        return updated;
      });
      
      return { success: true };
    } catch (err) {
      console.error('Failed to delete habit:', err);
      return { success: false, error: 'Failed to delete habit. Please try again.' };
    }
  };

  const toggleHabitFavorite = async (habitId: number): Promise<{ success: boolean; error?: string }> => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { success: false, error: 'Habit not found' };
    
    const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
    
    // Check favorite limit
    if (!habit.isFavorite && currentFavoriteCount >= 3) {
      return { success: false, error: 'Maximum 3 habits can be pinned' };
    }
    
    try {
      const newFavoriteState = !habit.isFavorite;
      
      // Optimistic update
      setHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, isFavorite: newFavoriteState } : h)
      );
      
      // Update on backend
      await updateHabit(habitId, { isFavorite: newFavoriteState });
      
      return { success: true };
    } catch (err) {
      // Revert optimistic update
      setHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, isFavorite: habit.isFavorite } : h)
      );
      
      console.error('Failed to toggle habit favorite:', err);
      return { success: false, error: 'Failed to update habit. Please try again.' };
    }
  };

  const toggleHabitCompletion = async (
    habitId: number, 
    date?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetDate = date || todayString;
    const completionKey = `${habitId}-${targetDate}`;
    const isCurrentlyCompleted = habitCompletions[completionKey] || false;
    const newCompletionState = !isCurrentlyCompleted;
    
    try {
      // Optimistic update
      setHabitCompletions(prev => ({
        ...prev,
        [completionKey]: newCompletionState
      }));

      // Update on backend (timezone-aware)
      await markHabitCompletion(habitId, targetDate, newCompletionState);
      
      // Refresh habits to get updated streaks from backend
      const updatedHabits = await getHabits();
      setHabits(updatedHabits);
      
      return { success: true };
    } catch (err) {
      // Revert optimistic update
      setHabitCompletions(prev => ({
        ...prev,
        [completionKey]: isCurrentlyCompleted
      }));
      
      console.error('Failed to toggle habit completion:', err);
      return { success: false, error: 'Failed to update habit completion. Please try again.' };
    }
  };

  /**
   * Utility functions
   */
  const isHabitCompleted = (habitId: number, date?: string): boolean => {
    const targetDate = date || todayString;
    const completionKey = `${habitId}-${targetDate}`;
    return habitCompletions[completionKey] || false;
  };

  const calculateStats = (): TrackingStats => {
    const currentStreak = habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak));
    
    // Count today's completed habits
    const todayCompletedCount = habits.filter(habit => 
      isHabitCompleted(habit.id, todayString)
    ).length;
    
    const habitsCompleted = { 
      completed: todayCompletedCount,
      total: habits.length 
    };
    
    const daysTracked = Object.keys(dailyEntries).length;
    
    // Calculate monthly completion rate
    const currentMonthEntries = Object.values(dailyEntries).filter(entry => {
      const entryDate = new Date(entry.date);
      const currentMonthDate = new Date(todayString);
      return entryDate.getMonth() === currentMonthDate.getMonth() && 
             entryDate.getFullYear() === currentMonthDate.getFullYear();
    });
    
    const monthlyCompletion = currentMonthEntries.length === 0 
      ? 0 
      : Math.round((currentMonthEntries.filter(entry => 
          entry.habitCompletions && entry.habitCompletions.some(hc => hc.completed)
        ).length / currentMonthEntries.length) * 100);

    return {
      currentStreak,
      habitsCompleted,
      daysTracked,
      monthlyCompletion
    };
  };

  /**
   * Cache management
   */
  const refreshCache = () => {
    cacheService.clear();
    loadUserData();
  };

  const getCacheStats = () => {
    return cacheService.getStats();
  };

  return {
    // Data
    habits,
    dailyEntries,
    moodEntries,
    habitCompletions,
    loading,
    error,
    
    // Actions
    loadUserData,
    addHabit,
    removeHabit,
    toggleHabitFavorite,
    toggleHabitCompletion,
    
    // Utilities
    calculateStats,
    refreshCache,
    getCacheStats,
    isHabitCompleted
  };
} 