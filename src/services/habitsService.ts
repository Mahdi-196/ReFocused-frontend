import client from '@/api/client';
import { cacheService } from './cacheService';

// Habit interfaces
export interface UserHabit {
  id: number;
  name: string;
  streak: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface HabitCompletion {
  id?: number;
  habitId: number;
  date: string;
  completed: boolean;
  createdAt?: Date;
}

export interface CreateHabitRequest {
  name: string;
  isFavorite?: boolean;
}

export interface UpdateHabitRequest {
  name?: string;
  isFavorite?: boolean;
  isActive?: boolean;
}

// Cache configuration
const HABITS_CACHE_PREFIX = 'habits';
const HABITS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get all user habits
 * Uses caching to improve performance
 */
export async function getHabits(): Promise<UserHabit[]> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_all`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<UserHabit[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get('/api/habits');
    
    const habits = response.data || [];
    
    // Cache the results
    cacheService.set(cacheKey, habits, HABITS_CACHE_TTL);
    
    return habits;
  } catch (error) {
    console.warn('Failed to fetch habits:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get a single habit by ID
 */
export async function getHabit(habitId: number): Promise<UserHabit | null> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_${habitId}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<UserHabit>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get(`/api/habits/${habitId}`);
    
    const habit = response.data;
    
    // Cache the result
    if (habit) {
      cacheService.set(cacheKey, habit, HABITS_CACHE_TTL);
    }
    
    return habit || null;
  } catch (error) {
    console.warn('Failed to fetch habit:', error);
    return null;
  }
}

/**
 * Create a new habit
 */
export async function createHabit(habitData: CreateHabitRequest): Promise<UserHabit> {
  try {
    const response = await client.post('/api/habits', habitData);
    
    const newHabit = response.data;
    
    // Invalidate habits cache
    cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
    
    // Cache the new habit
    cacheService.set(`${HABITS_CACHE_PREFIX}_${newHabit.id}`, newHabit, HABITS_CACHE_TTL);
    
    return newHabit;
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
}

/**
 * Update an existing habit
 */
export async function updateHabit(habitId: number, updates: UpdateHabitRequest): Promise<UserHabit> {
  try {
    const response = await client.put(`/api/habits/${habitId}`, updates);
    
    const updatedHabit = response.data;
    
    // Invalidate related cache entries
    cacheService.invalidate(`${HABITS_CACHE_PREFIX}_all`);
    cacheService.invalidate(`${HABITS_CACHE_PREFIX}_${habitId}`);
    
    // Cache the updated habit
    cacheService.set(`${HABITS_CACHE_PREFIX}_${habitId}`, updatedHabit, HABITS_CACHE_TTL);
    
    return updatedHabit;
  } catch (error) {
    console.error('Failed to update habit:', error);
    throw error;
  }
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: number): Promise<void> {
  try {
    await client.delete(`/api/habits/${habitId}`);
    
    // Invalidate related cache entries
    cacheService.invalidate(`${HABITS_CACHE_PREFIX}_all`);
    cacheService.invalidate(`${HABITS_CACHE_PREFIX}_${habitId}`);
    cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_completions_*`);
  } catch (error) {
    console.error('Failed to delete habit:', error);
    throw error;
  }
}

/**
 * Get habit completions for a date range
 */
export async function getHabitCompletions(startDate: string, endDate: string): Promise<HabitCompletion[]> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_completions_${startDate}_${endDate}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<HabitCompletion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get('/api/habits/completions', {
      params: { startDate, endDate }
    });
    
    const completions = response.data || [];
    
    // Cache the results
    cacheService.set(cacheKey, completions, HABITS_CACHE_TTL);
    
    return completions;
  } catch (error) {
    console.warn('Failed to fetch habit completions:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Mark a habit as completed or uncompleted for a specific date
 */
export async function markHabitCompletion(habitId: number, date: string, completed: boolean): Promise<HabitCompletion> {
  try {
    const response = await client.post('/api/habits/completions', {
      habitId,
      date,
      completed
    });
    
    const completion = response.data;
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_completions_*`);
    cacheService.invalidate(`${HABITS_CACHE_PREFIX}_all`); // Might affect streaks
    
    return completion;
  } catch (error) {
    console.error('Failed to mark habit completion:', error);
    throw error;
  }
}

/**
 * Get habit statistics for a specific habit
 */
export async function getHabitStats(habitId: number, startDate?: string, endDate?: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_stats_${habitId}_${startDate || 'all'}_${endDate || 'all'}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await client.get(`/api/habits/${habitId}/stats`, { params });
    
    const stats = response.data || {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0
    };
    
    // Cache the results
    cacheService.set(cacheKey, stats, HABITS_CACHE_TTL);
    
    return stats;
  } catch (error) {
    console.warn('Failed to fetch habit stats:', error);
    
    // Return default stats as fallback
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0
    };
  }
}

/**
 * Get overall habits statistics
 */
export async function getOverallHabitsStats(startDate?: string, endDate?: string): Promise<{
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  averageCompletionRate: number;
}> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_overall_stats_${startDate || 'all'}_${endDate || 'all'}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await client.get('/api/habits/stats', { params });
    
    const stats = response.data || {
      totalHabits: 0,
      activeHabits: 0,
      totalCompletions: 0,
      averageCompletionRate: 0
    };
    
    // Cache the results
    cacheService.set(cacheKey, stats, HABITS_CACHE_TTL);
    
    return stats;
  } catch (error) {
    console.warn('Failed to fetch overall habits stats:', error);
    
    // Return default stats as fallback
    return {
      totalHabits: 0,
      activeHabits: 0,
      totalCompletions: 0,
      averageCompletionRate: 0
    };
  }
}

/**
 * Clear all habits-related cache entries
 */
export function clearHabitsCache(): void {
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
} 