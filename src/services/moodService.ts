import client from '@/api/client';
import { MOOD } from '@/api/endpoints';
import { cacheService } from './cacheService';
import { timeService } from './timeService';

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
  const cacheKey = `mood_entries_${startDate}_${endDate}`;
  
  try {
    // Validate date format
    if (!startDate || !endDate || 
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || 
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      console.warn('❌ Invalid date format for mood entries:', { startDate, endDate });
      return [];
    }

    // Try to get from cache first
    const cached = cacheService.get<MoodEntry[]>(cacheKey);
    if (cached) {
      console.log('📦 Returning cached mood entries');
      return cached;
    }

    console.log('🔄 Fetching mood entries from API:', { startDate, endDate });
    
    // Get user timezone for header
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const response = await client.get('/mood/entries', {
      params: { 
        start_date: startDate,  // Use snake_case to match backend
        end_date: endDate 
      },
      headers: {
        'X-User-Timezone': userTimezone
      }
    });
    
    const entries = Array.isArray(response.data) ? response.data : [];
    
    // Cache the results
    cacheService.set(cacheKey, entries, 10 * 60 * 1000); // 10 minutes
    
    return entries;
  } catch (error) {
    console.warn('❌ Failed to fetch mood entries:', error);
    
    // Return empty array instead of crashing
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

    // Get user timezone for header
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Fetch from API
    const response = await client.get(`/mood/entries/${date}`, {
      headers: {
        'X-User-Timezone': userTimezone
      }
    });
    
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
    // Validate required fields
    if (!moodEntry.date || 
        moodEntry.happiness === undefined || 
        moodEntry.satisfaction === undefined || 
        moodEntry.stress === undefined) {
      throw new Error('Missing required fields: date, happiness, satisfaction, and stress are required');
    }

    // Validate field ranges (1-5)
    const validateRange = (value: number, field: string) => {
      if (value < 1 || value > 5) {
        throw new Error(`${field} must be between 1 and 5`);
      }
    };
    
    validateRange(moodEntry.happiness, 'happiness');
    validateRange(moodEntry.satisfaction, 'satisfaction');
    validateRange(moodEntry.stress, 'stress');

    // Get user timezone for header
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Prepare payload with required fields only
    const payload = {
      happiness: moodEntry.happiness,
      satisfaction: moodEntry.satisfaction,
      stress: moodEntry.stress,
      date: moodEntry.date
    };
    
    const response = await client.post('/mood/', payload, {
      headers: {
        'X-User-Timezone': userTimezone
      }
    });
    
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
    // Get user timezone for header
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Prepare payload with only the fields that can be updated
    const payload: any = {};
    if (updates.happiness !== undefined) payload.happiness = updates.happiness;
    if (updates.satisfaction !== undefined) payload.satisfaction = updates.satisfaction;
    if (updates.stress !== undefined) payload.stress = updates.stress;
    
    const response = await client.put(`/mood/${date}`, payload, {
      headers: {
        'X-User-Timezone': userTimezone
      }
    });
    
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
    // Get user timezone for header
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    await client.delete(`/mood/${date}`, {
      headers: {
        'X-User-Timezone': userTimezone
      }
    });
    
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
    const response = await client.get(`${MOOD.BASE}/stats`, {
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
 * Get current date safely (respecting mock date for testing)
 */
export function getCurrentDate(): string {
  return timeService.getCurrentDate();
}

/**
 * Get today's mood entry
 */
export async function getTodaysMood(): Promise<MoodEntry | null> {
  const today = timeService.getCurrentDate();
  return getMoodEntry(today);
}

/**
 * Save today's mood rating
 */
export async function saveMoodRating(ratings: {
  happiness: number;
  satisfaction: number;
  stress: number;
}): Promise<MoodEntry> {
  const today = timeService.getCurrentDate();
  
  const moodEntry: MoodEntry = {
    date: today,
    happiness: ratings.happiness,
    satisfaction: ratings.satisfaction,
    stress: ratings.stress,
    notes: ''
  };
  
  return saveMoodEntry(moodEntry);
}

/**
 * Clear all mood-related cache entries
 */
export function clearMoodCache(): void {
  cacheService.invalidateByPattern(`${MOOD_CACHE_PREFIX}_*`);
} 