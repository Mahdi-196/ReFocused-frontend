import client from '@/api/client';
import { cacheService } from './cacheService';

// Mood entry interface
export interface MoodEntry {
  id?: number;
  date: string;
  happiness?: number;
  satisfaction?: number;
  stress?: number;
  dayRating?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Cache configuration
const MOOD_CACHE_PREFIX = 'mood';
const MOOD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get mood entries for a date range
 * Uses caching to improve performance
 */
export async function getMoodEntries(startDate: string, endDate: string): Promise<MoodEntry[]> {
  const cacheKey = `${MOOD_CACHE_PREFIX}_entries_${startDate}_${endDate}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<MoodEntry[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get(`/api/mood/entries`, {
      params: { startDate, endDate }
    });
    
    const entries = response.data || [];
    
    // Cache the results
    cacheService.set(cacheKey, entries, MOOD_CACHE_TTL);
    
    return entries;
  } catch (error) {
    console.warn('Failed to fetch mood entries:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get a single mood entry by date
 */
export async function getMoodEntry(date: string): Promise<MoodEntry | null> {
  const cacheKey = `${MOOD_CACHE_PREFIX}_entry_${date}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<MoodEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get(`/api/mood/entries/${date}`);
    
    const entry = response.data;
    
    // Cache the result
    if (entry) {
      cacheService.set(cacheKey, entry, MOOD_CACHE_TTL);
    }
    
    return entry || null;
  } catch (error) {
    console.warn('Failed to fetch mood entry:', error);
    return null;
  }
}

/**
 * Create or update a mood entry
 */
export async function saveMoodEntry(moodEntry: MoodEntry): Promise<MoodEntry> {
  try {
    const response = await client.post('/api/mood/entries', moodEntry);
    
    const savedEntry = response.data;
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${MOOD_CACHE_PREFIX}_entries_*`);
    cacheService.invalidate(`${MOOD_CACHE_PREFIX}_entry_${moodEntry.date}`);
    
    // Cache the new entry
    cacheService.set(`${MOOD_CACHE_PREFIX}_entry_${moodEntry.date}`, savedEntry, MOOD_CACHE_TTL);
    
    return savedEntry;
  } catch (error) {
    console.error('Failed to save mood entry:', error);
    throw error;
  }
}

/**
 * Update an existing mood entry
 */
export async function updateMoodEntry(date: string, updates: Partial<MoodEntry>): Promise<MoodEntry> {
  try {
    const response = await client.put(`/api/mood/entries/${date}`, updates);
    
    const updatedEntry = response.data;
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${MOOD_CACHE_PREFIX}_entries_*`);
    cacheService.invalidate(`${MOOD_CACHE_PREFIX}_entry_${date}`);
    
    // Cache the updated entry
    cacheService.set(`${MOOD_CACHE_PREFIX}_entry_${date}`, updatedEntry, MOOD_CACHE_TTL);
    
    return updatedEntry;
  } catch (error) {
    console.error('Failed to update mood entry:', error);
    throw error;
  }
}

/**
 * Delete a mood entry
 */
export async function deleteMoodEntry(date: string): Promise<void> {
  try {
    await client.delete(`/api/mood/entries/${date}`);
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${MOOD_CACHE_PREFIX}_entries_*`);
    cacheService.invalidate(`${MOOD_CACHE_PREFIX}_entry_${date}`);
  } catch (error) {
    console.error('Failed to delete mood entry:', error);
    throw error;
  }
}

/**
 * Get mood statistics for a date range
 */
export async function getMoodStats(startDate: string, endDate: string): Promise<{
  averageHappiness: number;
  averageSatisfaction: number;
  averageStress: number;
  averageDayRating: number;
  totalEntries: number;
}> {
  const cacheKey = `${MOOD_CACHE_PREFIX}_stats_${startDate}_${endDate}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<typeof stats>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get(`/api/mood/stats`, {
      params: { startDate, endDate }
    });
    
    const stats = response.data || {
      averageHappiness: 0,
      averageSatisfaction: 0,
      averageStress: 0,
      averageDayRating: 0,
      totalEntries: 0
    };
    
    // Cache the results
    cacheService.set(cacheKey, stats, MOOD_CACHE_TTL);
    
    return stats;
  } catch (error) {
    console.warn('Failed to fetch mood stats:', error);
    
    // Return default stats as fallback
    return {
      averageHappiness: 0,
      averageSatisfaction: 0,
      averageStress: 0,
      averageDayRating: 0,
      totalEntries: 0
    };
  }
}

/**
 * Get current date safely (avoiding system clock issues)
 */
function getCurrentDateSafe(): string {
  // Use reliable method with en-CA locale for YYYY-MM-DD format
  return new Date(Date.now()).toLocaleDateString('en-CA');
}

/**
 * Get today's mood entry
 * Helper function for NumberMood component
 */
export async function getTodaysMood(): Promise<MoodEntry | null> {
  const today = getCurrentDateSafe();
  return await getMoodEntry(today);
}

/**
 * Save mood rating for today
 * Helper function for NumberMood component
 */
export async function saveMoodRating(ratings: {
  happiness: number;
  satisfaction: number;
  stress: number;
}): Promise<MoodEntry> {
  const today = getCurrentDateSafe();
  
  const moodEntry: MoodEntry = {
    date: today,
    happiness: ratings.happiness,
    satisfaction: ratings.satisfaction,
    stress: ratings.stress
  };
  
  return await saveMoodEntry(moodEntry);
}

/**
 * Clear all mood-related cache entries
 */
export function clearMoodCache(): void {
  cacheService.invalidateByPattern(`${MOOD_CACHE_PREFIX}_*`);
} 