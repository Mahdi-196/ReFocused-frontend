import { useState, useEffect, useCallback } from 'react';
import { UserHabit, DailyEntry, MoodEntry, TrackingStats } from '../types';
import { getMoodEntries } from '@/services/moodService';
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/services/habitsService';
import { getDailyEntries } from '@/services/dashboardService';
import { cacheService } from '@/services/cacheService';

export function useTrackingData(currentMonth: Date) {
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [dailyEntries, setDailyEntries] = useState<{[key: string]: DailyEntry}>({});
  const [moodEntries, setMoodEntries] = useState<{[key: string]: MoodEntry}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on component mount (with caching)
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load habits - gracefully handle if endpoint doesn't exist
      try {
        const habitsData = await getHabits();
        setHabits(habitsData || []);
      } catch (habitsError) {
        console.warn('Habits endpoint not available yet:', habitsError);
        setHabits([]); // Empty array so mood tracking still works
      }
      
      // Load daily entries for current month - gracefully handle if endpoint doesn't exist
      try {
        const monthStr = currentMonth.toISOString().slice(0, 7); // YYYY-MM
        const entriesMap = await getDailyEntries(monthStr);
        setDailyEntries(entriesMap);
      } catch (entriesError) {
        console.warn('Daily entries endpoint not available yet:', entriesError);
        setDailyEntries({}); // Empty object so mood tracking still works
      }

      // Load mood entries for current month (cached)
      try {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const moodData = await getMoodEntries(startDate, endDate);
      
        // Convert array to object with date as key
        const moodMap: {[key: string]: MoodEntry} = {};
        if (moodData) {
          moodData.forEach((entry: any) => {
            moodMap[entry.date] = entry;
          });
        }
        setMoodEntries(moodMap);
      } catch (moodError) {
        console.warn('Failed to load mood entries:', moodError);
        setMoodEntries({}); // Empty object if mood data fails
      }
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Some features may not be available. Mood tracking is still functional.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadUserData();
  }, [currentMonth, loadUserData]);

  // Habit management functions
  const addHabit = async (habitName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!habitName.trim()) {
        return { success: false, error: 'Please enter a habit name' };
      }
      
      const habitExists = habits.some(
        (habit) => habit.name.toLowerCase() === habitName.trim().toLowerCase()
      );

      if (habitExists) {
        return { success: false, error: 'This habit already exists' };
      }

      const optimisticHabit: UserHabit = {
        id: Date.now(), 
        name: habitName.trim(),
        streak: 0,
        isFavorite: false,
        createdAt: new Date(),
      };
      
      setHabits((prevHabits) => [...prevHabits, optimisticHabit]);

      try {
        const response = await createHabit({ name: habitName.trim() });
        console.log('🎉 Habit created on server:', response);
        
        // Update local state with server response
        setHabits((prevHabits) => 
          prevHabits.map(h => h.id === optimisticHabit.id ? response : h)
        );
        
        return { success: true };
      } catch (err) {
        console.error('API call failed:', err);
        setHabits((prevHabits) => prevHabits.filter(h => h.id !== optimisticHabit.id));
        
        if (err instanceof Error && err.message.includes('Failed to create habit')) {
          return { success: false, error: 'Habit tracking feature coming soon. Mood tracking is available now.' };
        }
        return { success: false, error: 'Failed to add habit. Please try again.' };
      }
    } catch (err) {
      console.error('🚨 Unexpected error in addHabit:', err);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const removeHabit = async (habitId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteHabit(habitId);
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
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
    
    // If trying to favorite and already at limit
    if (!habit.isFavorite && currentFavoriteCount >= 3) {
      return { success: false, error: 'Maximum 3 habits can be pinned' };
    }
    
    try {
      const updatedHabit = await updateHabit(habit.id, {
        isFavorite: !habit.isFavorite
      });
      
      setHabits(prev => 
        prev.map(h => h.id === habitId ? updatedHabit : h)
      );
      
      return { success: true };
    } catch (err) {
      console.error('Failed to update habit:', err);
      return { success: false, error: 'Failed to update habit. Please try again.' };
    }
  };

  // Calculate statistics
  const calculateStats = (): TrackingStats => {
    const currentStreak = habits.length === 0 ? 0 : Math.max(...habits.map(h => h.streak));
    
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = dailyEntries[today];
    const habitsCompleted = todayEntry?.habitCompletions 
      ? { 
          completed: todayEntry.habitCompletions.filter(hc => hc.completed).length,
          total: habits.length 
        }
      : { completed: 0, total: habits.length };
    
    const daysTracked = Object.keys(dailyEntries).length;
    
    const currentMonthEntries = Object.values(dailyEntries).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth.getMonth() && 
             entryDate.getFullYear() === currentMonth.getFullYear();
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

  // Cache management
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
    loading,
    error,
    
    // Actions
    loadUserData,
    addHabit,
    removeHabit,
    toggleHabitFavorite,
    
    // Utilities
    calculateStats,
    refreshCache,
    getCacheStats
  };
} 