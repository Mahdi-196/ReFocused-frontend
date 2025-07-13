import client from '@/api/client';
import { HABITS } from '@/api/endpoints';
import { cacheService } from './cacheService';

/**
 * Production Habits Service
 * Timezone-aware habit tracking with on-demand reset functionality
 */

// Core interfaces
export interface UserHabit {
  id: number;
  name: string;
  streak: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isActive?: boolean;
  lastCompletedDate?: string; // ISO date string for timezone handling
}

export interface HabitCompletion {
  id?: number;
  habitId: number;
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt?: Date;
  timezone?: string;
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
const HABITS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Send user's timezone with all requests that need it
 */
function getTimezoneHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      'X-User-Timezone': userTimezone
    };
  } catch (error) {
    console.warn('Failed to get user timezone:', error);
    return {};
  }
}

/**
 * Convert backend snake_case to frontend camelCase
 */
function transformHabitFromBackend(rawHabit: any): UserHabit {
  return {
    id: rawHabit.id,
    name: rawHabit.name,
    streak: rawHabit.streak || 0,
    isFavorite: rawHabit.is_favorite || false,
    isActive: rawHabit.is_active !== false, // Default to true
    createdAt: new Date(rawHabit.created_at),
    updatedAt: rawHabit.updated_at ? new Date(rawHabit.updated_at) : undefined,
    lastCompletedDate: rawHabit.last_completed_date
  };
}

/**
 * Convert habit completion from backend
 */
function transformCompletionFromBackend(rawCompletion: any): HabitCompletion {
  return {
    id: rawCompletion.id,
    habitId: rawCompletion.habit_id,
    date: rawCompletion.date,
    completed: rawCompletion.completed,
    completedAt: rawCompletion.completed_at ? new Date(rawCompletion.completed_at) : undefined,
    timezone: rawCompletion.timezone
  };
}

/**
 * Get all user habits with timezone-aware reset check
 */
export async function getHabits(bypassCache: boolean = false): Promise<UserHabit[]> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_all`;
  
  try {
    // Check cache first (unless bypassing)
    if (!bypassCache) {
      const cached = cacheService.get<UserHabit[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API with timezone header
    const response = await client.get(HABITS.BASE, {
      headers: getTimezoneHeaders()
    });
    
    // Transform and cache results
    const rawHabits = response.data || [];
    const habits: UserHabit[] = rawHabits.map(transformHabitFromBackend);
    
    // Always update cache with fresh data
    cacheService.set(cacheKey, habits, HABITS_CACHE_TTL);
    return habits;
  } catch (error) {
    console.warn('Failed to fetch habits:', error);
    return [];
  }
}

/**
 * Create a new habit
 */
export async function createHabit(habitData: CreateHabitRequest): Promise<UserHabit> {
  const backendPayload = {
    name: habitData.name,
    is_favorite: habitData.isFavorite || false
  };
  
  const response = await client.post(HABITS.BASE, backendPayload, {
    headers: getTimezoneHeaders()
  });
  
  const newHabit = transformHabitFromBackend(response.data);
  
  // Invalidate cache
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
  
  return newHabit;
}

/**
 * Update an existing habit
 */
export async function updateHabit(habitId: number, updates: UpdateHabitRequest): Promise<UserHabit> {
  const backendPayload: any = {};
  if (updates.name !== undefined) backendPayload.name = updates.name;
  if (updates.isFavorite !== undefined) backendPayload.is_favorite = updates.isFavorite;
  if (updates.isActive !== undefined) backendPayload.is_active = updates.isActive;
  
  const response = await client.put(HABITS.DETAIL(habitId), backendPayload, {
    headers: getTimezoneHeaders()
  });
  
  const updatedHabit = transformHabitFromBackend(response.data);
  
  // Invalidate cache
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
  
  return updatedHabit;
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: number): Promise<void> {
  await client.delete(HABITS.DETAIL(habitId), {
    headers: getTimezoneHeaders()
  });
  
  // Invalidate cache
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
}

/**
 * Get habit completions for a date range
 */
export async function getHabitCompletions(startDate: string, endDate: string): Promise<HabitCompletion[]> {
  const cacheKey = `${HABITS_CACHE_PREFIX}_completions_${startDate}_${endDate}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<HabitCompletion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await client.get(`${HABITS.BASE}/completions`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getTimezoneHeaders()
    });
    
    const rawCompletions = response.data || [];
    const completions = rawCompletions.map(transformCompletionFromBackend);
    
    // Cache for shorter time since completions change frequently
    cacheService.set(cacheKey, completions, 60000); // 1 minute
    
    return completions;
  } catch (error) {
    console.warn('Failed to fetch habit completions:', error);
    return [];
  }
}

/**
 * Mark habit completion/incompletion
 * This is the core timezone-aware operation
 */
export async function markHabitCompletion(
  habitId: number, 
  date: string, 
  completed: boolean
): Promise<HabitCompletion> {
  const payload = {
    habitId: habitId,
    date: date, // ISO date string (YYYY-MM-DD)
    completed: completed
  };
  
  const response = await client.post(`${HABITS.BASE}/completions`, payload, {
    headers: getTimezoneHeaders()
  });
  
  const completion = transformCompletionFromBackend(response.data);
  
  // Invalidate relevant caches
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
  
  return completion;
}

/**
 * Get habit statistics
 */
export async function getHabitStats(habitId: number, startDate?: string, endDate?: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}> {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  try {
    const response = await client.get(`${HABITS.BASE}/${habitId}/stats`, {
      params,
      headers: getTimezoneHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch habit stats:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0
    };
  }
}

/**
 * Clear all habits-related cache entries
 */
export function clearHabitsCache(): void {
  cacheService.invalidateByPattern(`${HABITS_CACHE_PREFIX}_*`);
}

/**
 * Toggle habit completion status
 * Alias for markHabitCompletion for backwards compatibility
 */
export async function toggleHabitCompletion(
  habitId: number, 
  date: string, 
  completed: boolean
): Promise<HabitCompletion> {
  return markHabitCompletion(habitId, date, completed);
} 