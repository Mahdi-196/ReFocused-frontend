import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserHabit, DailyEntry, TrackingStats } from '../types';
import type { MoodEntry as ServiceMoodEntry } from '@/services/moodService';
import { getMoodEntries } from '@/services/moodService';
import { getHabits, createHabit, updateHabit, deleteHabit, markHabitCompletion, getHabitCompletions } from '@/services/habitsService';
import { getDailyEntries } from '@/services/dashboardService';
import { cacheService, CacheInvalidation } from '@/services/cacheService';
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
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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
      
      // Track current user
      const userToken = localStorage.getItem('REF_TOKEN');
      setCurrentUser(userToken);
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load data. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [todayString, monthString]);

  /**
   * Clear all user data when user logs out
   */
  const clearUserData = useCallback(() => {
    setHabits([]);
    setDailyEntries({});
    setMoodEntries({});
    setHabitCompletions({});
    setCurrentUser(null);
    setError(null);
  }, []);

  // Load data when dependencies change
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle authentication changes
  useEffect(() => {
    // Listen for user logout events
    const handleUserLogout = () => {
      console.log('🔄 User logged out - clearing tracking data');
      clearUserData();
    };

    // Listen for storage changes (user login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN') {
        const newToken = e.newValue;
        const oldToken = currentUser;
        
        // If token changed (user logged in/out or switched users)
        if (newToken !== oldToken) {
          console.log('🔄 User authentication changed - refreshing tracking data');
          
          if (newToken) {
            // User logged in or switched - reload data
            loadUserData();
          } else {
            // User logged out - clear data and cache
            clearUserData();
            CacheInvalidation.clearUserCache();
          }
        }
      }
    };

    // Listen for focus events (user might have logged in/out in another tab)
    const handleFocus = () => {
      const userToken = localStorage.getItem('REF_TOKEN');
      if (userToken !== currentUser) {
        console.log('🔄 User changed on focus - refreshing tracking data');
        if (userToken) {
          loadUserData();
        } else {
          clearUserData();
          CacheInvalidation.clearUserCache();
        }
      }
    };

    // Add event listeners
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser, loadUserData, clearUserData]);

  /**
   * Habit management functions
   */
  const addHabit = async (habitName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!habitName.trim()) {
        return { success: false, error: 'Please enter a habit name' };
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
        // Create on backend - let backend handle validation
        const newHabit = await createHabit({ name: habitName.trim() });
        
        // Update with real data
        setHabits(prev => 
          prev.map(h => h.id === optimisticHabit.id ? newHabit : h)
        );
        
        return { success: true };
      } catch (err) {
        // Revert optimistic update
        setHabits(prev => prev.filter(h => h.id !== optimisticHabit.id));
        
        // Extract error message from backend response
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to create habit. Please try again.';
          
        return { success: false, error: errorMessage };
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
    
    try {
      const newFavoriteState = !habit.isFavorite;
      
      // Optimistic update
      setHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, isFavorite: newFavoriteState } : h)
      );
      
      // Update on backend - let backend handle validation
      await updateHabit(habitId, { isFavorite: newFavoriteState });
      
      return { success: true };
    } catch (err) {
      // Revert optimistic update on error
      setHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, isFavorite: habit.isFavorite } : h)
      );
      
      console.error('Failed to toggle habit favorite:', err);
      
      // Extract error message from backend response
      const errorMessage = err instanceof Error && err.message.includes('favorite') 
        ? err.message 
        : 'Failed to update habit. Please try again.';
      
      return { success: false, error: errorMessage };
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
    
    // Calculate last 30 days stats
    const today = new Date(todayString);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Get all habit completions in last 30 days
    let totalCompletedHabits = 0;
    let daysWithActivity = 0;
    const activeDays = new Set<string>();
    
    // Check habit completions for last 30 days
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      let dayHasActivity = false;
      
      habits.forEach(habit => {
        const completionKey = `${habit.id}-${dateString}`;
        if (habitCompletions[completionKey]) {
          totalCompletedHabits++;
          dayHasActivity = true;
        }
      });
      
      if (dayHasActivity) {
        activeDays.add(dateString);
      }
    }
    
    daysWithActivity = activeDays.size;
    
    // Calculate completion percentage: completed habits / total possible habits on active days
    const totalPossibleHabits = daysWithActivity * habits.length;
    const monthlyCompletion = totalPossibleHabits === 0 
      ? 0 
      : Math.round((totalCompletedHabits / totalPossibleHabits) * 100);
    
    // Days tracked = days where at least one habit was checked
    const daysTracked = daysWithActivity;

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