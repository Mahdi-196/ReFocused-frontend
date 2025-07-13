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
   * Helper function to load habit completions for the last 30 days
   */
  const loadHabitCompletions = useCallback(async (bypassCache: boolean = false): Promise<{[key: string]: boolean}> => {
    const today = new Date(todayString);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Clear completion cache if bypassing
    if (bypassCache) {
      cacheService.invalidateByPattern('habits_completions_*');
    }
    
    const completions = await getHabitCompletions(thirtyDaysAgoString, todayString);
    const completionMap: {[key: string]: boolean} = {};
    completions.forEach(completion => {
      const key = `${completion.habitId}-${completion.date}`;
      completionMap[key] = completion.completed;
    });
    
    return completionMap;
  }, [todayString]);

  /**
   * Calculate correct streak for a habit based on completion history
   * Implements proper business logic: streak only resets after missing an entire day
   */
  const calculateCorrectStreak = useCallback((habitId: number, completions: {[key: string]: boolean}): number => {
    const today = new Date(todayString);
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Go backwards day by day until we find a gap
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      const completionKey = `${habitId}-${dateString}`;
      const wasCompleted = completions[completionKey] || false;
      
      if (wasCompleted) {
        currentStreak++;
      } else {
        // If this is today and it's not completed, that's OK - streak continues from yesterday
        // Only break the streak if we hit a day that's not today and wasn't completed
        if (dateString !== todayString) {
          break;
        }
      }
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Prevent infinite loop - only check last 100 days max
      if (currentStreak > 100) break;
    }
    
    return currentStreak;
  }, [todayString]);

  /**
   * Get habits with corrected streak calculations
   */
  const getHabitsWithCorrectStreaks = useCallback((rawHabits: UserHabit[], completions: {[key: string]: boolean}): UserHabit[] => {
    return rawHabits.map(habit => ({
      ...habit,
      streak: calculateCorrectStreak(habit.id, completions)
    }));
  }, [calculateCorrectStreak]);

  /**
   * Load all user data with timezone-aware operations
   */
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let habitsData: UserHabit[] = [];
      
      // Load habits from backend
      habitsData = await getHabits();
      
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

      // Load habit completions for the last 30 days (not just today)
      // This provides historical context for proper streak calculation and display
      const completionMap = await loadHabitCompletions();
      setHabitCompletions(completionMap);
      
      // Apply correct streak calculations using completion data
      const correctedHabits = getHabitsWithCorrectStreaks(habitsData, completionMap);
      setHabits(correctedHabits);
      
      // Track current user
      const userToken = localStorage.getItem('REF_TOKEN');
      setCurrentUser(userToken);
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load data. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [todayString, monthString, loadHabitCompletions, getHabitsWithCorrectStreaks]);

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
      clearUserData();
    };

    // Listen for storage changes (user login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN') {
        const newToken = e.newValue;
        const oldToken = currentUser;
        
        // If token changed (user logged in/out or switched users)
        if (newToken !== oldToken) {
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
    
    const habitBefore = habits.find(h => h.id === habitId);
    console.log(`🔄 Toggling habit ${habitId} (${habitBefore?.name}) completion for ${targetDate}:`);
    console.log(`   Current state: ${isCurrentlyCompleted} -> ${newCompletionState}`);
    console.log(`   Current streak: ${habitBefore?.streak}`);
    
    try {
      // Optimistic update
      setHabitCompletions(prev => ({
        ...prev,
        [completionKey]: newCompletionState
      }));

      // Update on backend (timezone-aware)
      await markHabitCompletion(habitId, targetDate, newCompletionState);
      
      // Clear habits cache aggressively to ensure fresh data
      cacheService.invalidateByPattern('habits_*');
      
      // Small delay to ensure backend has processed the completion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh habit completions for last 30 days to ensure frontend state consistency
      const completionMap = await loadHabitCompletions(true);
      setHabitCompletions(completionMap);
      
      // Get fresh habits data (but ignore backend streak calculations)
      const updatedHabits = await getHabits(true);
      
      // Apply correct frontend streak calculations
      const correctedHabits = getHabitsWithCorrectStreaks(updatedHabits, completionMap);
      const habitAfter = correctedHabits.find(h => h.id === habitId);
      console.log(`✅ After frontend correction:`);
      console.log(`   Habit ${habitId} streak: ${habitBefore?.streak} -> ${habitAfter?.streak}`);
      console.log(`   All corrected habit streaks:`, correctedHabits.map(h => ({ id: h.id, name: h.name, streak: h.streak })));
      setHabits(correctedHabits);
      
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