import client from '@/api/client';
import { cacheService } from './cacheService';
import { DailyCalendarEntry, DailyHabitCompletion } from '@/app/track/types';

/**
 * Calendar Service - Manages daily calendar entries with database persistence
 * Handles mood + habit completion data with read-only protection for past dates
 */

// Cache configuration
const CALENDAR_CACHE_PREFIX = 'calendar';
const CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get timezone headers for API requests
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
 * Check if a date is in the past (read-only)
 */
function isPastDate(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date < today;
}

/**
 * Transform backend data to frontend format
 */
function transformCalendarEntryFromBackend(rawEntry: any): DailyCalendarEntry {
  return {
    id: rawEntry.id,
    date: rawEntry.date,
    userId: rawEntry.user_id,
    habitCompletions: rawEntry.habit_completions?.map((hc: any) => ({
      habitId: hc.habit_id,
      habitName: hc.habit_name,
      completed: hc.completed,
      completedAt: hc.completed_at ? new Date(hc.completed_at) : undefined,
      wasActiveOnDate: hc.was_active_on_date
    })) || [],
    moodEntry: rawEntry.mood_entry ? {
      happiness: rawEntry.mood_entry.happiness,
      focus: rawEntry.mood_entry.focus,
      stress: rawEntry.mood_entry.stress
    } : undefined,
    notes: rawEntry.notes,
    createdAt: rawEntry.created_at ? new Date(rawEntry.created_at) : undefined,
    updatedAt: rawEntry.updated_at ? new Date(rawEntry.updated_at) : undefined,
    isLocked: rawEntry.is_locked || isPastDate(rawEntry.date)
  };
}

/**
 * Transform frontend data to backend format
 */
function transformCalendarEntryToBackend(entry: DailyCalendarEntry): any {
  return {
    date: entry.date,
    habit_completions: entry.habitCompletions.map(hc => ({
      habit_id: hc.habitId,
      habit_name: hc.habitName,
      completed: hc.completed,
      completed_at: hc.completedAt?.toISOString(),
      was_active_on_date: hc.wasActiveOnDate
    })),
    mood_entry: entry.moodEntry ? {
      happiness: entry.moodEntry.happiness,
      focus: entry.moodEntry.focus,
      stress: entry.moodEntry.stress
    } : null,
    notes: entry.notes || null
  };
}

/**
 * Get calendar entries for a date range
 */
export async function getCalendarEntries(startDate: string, endDate: string): Promise<DailyCalendarEntry[]> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_entries_${startDate}_${endDate}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry[]>(cacheKey);
    if (cached) {
      console.log('📦 Returning cached calendar entries');
      return cached;
    }

    console.log('🔄 Fetching calendar entries from API:', { startDate, endDate });
    
    const response = await client.get('/calendar/entries', {
      params: { 
        start_date: startDate,
        end_date: endDate 
      },
      headers: getTimezoneHeaders()
    });
    
    const entries = Array.isArray(response.data) ? response.data.map(transformCalendarEntryFromBackend) : [];
    
    // Cache the results
    cacheService.set(cacheKey, entries, CALENDAR_CACHE_TTL);
    
    return entries;
  } catch (error) {
    console.warn('❌ Failed to fetch calendar entries:', error);
    return [];
  }
}

/**
 * Get a single calendar entry by date
 */
export async function getCalendarEntry(date: string): Promise<DailyCalendarEntry | null> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_entry_${date}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await client.get(`/calendar/entries/${date}`, {
      headers: getTimezoneHeaders()
    });
    
    const entry = response.data ? transformCalendarEntryFromBackend(response.data) : null;
    
    // Cache the result
    if (entry) {
      cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
    }
    
    return entry;
  } catch (error) {
    console.warn('Failed to fetch calendar entry:', error);
    return null;
  }
}

/**
 * Save or update a calendar entry
 */
export async function saveCalendarEntry(entry: DailyCalendarEntry): Promise<DailyCalendarEntry> {
  try {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    // Check if entry is locked (past date)
    if (isPastDate(entry.date)) {
      throw new Error('Cannot modify calendar entries for past dates.');
    }

    // Validate habit completions
    if (!entry.habitCompletions || entry.habitCompletions.length === 0) {
      throw new Error('Calendar entry must include habit completion data.');
    }

    const payload = transformCalendarEntryToBackend(entry);
    
    const response = await client.post('/calendar/entries', payload, {
      headers: getTimezoneHeaders()
    });
    
    const savedEntry = transformCalendarEntryFromBackend(response.data);
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_entries_*`);
    cacheService.invalidate(`${CALENDAR_CACHE_PREFIX}_entry_${entry.date}`);
    
    // Cache the new entry
    cacheService.set(`${CALENDAR_CACHE_PREFIX}_entry_${entry.date}`, savedEntry, CALENDAR_CACHE_TTL);
    
    return savedEntry;
  } catch (error) {
    console.error('Failed to save calendar entry:', error);
    throw error;
  }
}

/**
 * Update an existing calendar entry (only for today or future dates)
 */
export async function updateCalendarEntry(date: string, updates: Partial<DailyCalendarEntry>): Promise<DailyCalendarEntry> {
  try {
    // Check if entry is locked (past date)
    if (isPastDate(date)) {
      throw new Error('Cannot modify calendar entries for past dates.');
    }

    const payload = updates.habitCompletions 
      ? { habit_completions: updates.habitCompletions.map(hc => ({
          habit_id: hc.habitId,
          habit_name: hc.habitName,
          completed: hc.completed,
          completed_at: hc.completedAt?.toISOString(),
          was_active_on_date: hc.wasActiveOnDate
        }))}
      : {};

    if (updates.moodEntry) {
      (payload as any).mood_entry = updates.moodEntry;
    }

    if (updates.notes !== undefined) {
      (payload as any).notes = updates.notes;
    }

    const response = await client.put(`/calendar/entries/${date}`, payload, {
      headers: getTimezoneHeaders()
    });
    
    const updatedEntry = transformCalendarEntryFromBackend(response.data);
    
    // Invalidate related cache entries
    cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_entries_*`);
    cacheService.invalidate(`${CALENDAR_CACHE_PREFIX}_entry_${date}`);
    
    // Cache the updated entry
    cacheService.set(`${CALENDAR_CACHE_PREFIX}_entry_${date}`, updatedEntry, CALENDAR_CACHE_TTL);
    
    return updatedEntry;
  } catch (error) {
    console.error('Failed to update calendar entry:', error);
    throw error;
  }
}

/**
 * Create a calendar entry for today with current habits
 */
export async function createTodayEntry(habits: any[], moodData?: { happiness: number; focus: number; stress: number }): Promise<DailyCalendarEntry> {
  const today = new Date().toISOString().split('T')[0];
  
  const entry: DailyCalendarEntry = {
    date: today,
    userId: 0, // Will be set by backend
    habitCompletions: habits.map(habit => ({
      habitId: habit.id,
      habitName: habit.name,
      completed: false, // Default to not completed
      wasActiveOnDate: habit.isActive !== false
    })),
    moodEntry: moodData,
    notes: ''
  };

  return saveCalendarEntry(entry);
}

/**
 * Toggle habit completion for a specific date
 */
export async function toggleHabitInCalendar(date: string, habitId: number, completed: boolean): Promise<DailyCalendarEntry> {
  try {
    // Check if entry is locked (past date)
    if (isPastDate(date)) {
      throw new Error('Cannot modify habit completions for past dates.');
    }

    // Get existing entry or create new one
    let entry = await getCalendarEntry(date);
    
    if (!entry) {
      throw new Error('Calendar entry not found. Please create an entry first.');
    }

    // Update the specific habit completion
    const updatedCompletions = entry.habitCompletions.map(hc => 
      hc.habitId === habitId 
        ? { 
            ...hc, 
            completed, 
            completedAt: completed ? new Date() : undefined 
          }
        : hc
    );

    return updateCalendarEntry(date, { habitCompletions: updatedCompletions });
  } catch (error) {
    console.error('Failed to toggle habit in calendar:', error);
    throw error;
  }
}

/**
 * Clear calendar cache
 */
export function clearCalendarCache(): void {
  cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_*`);
}

/**
 * Check if calendar entry exists for date
 */
export async function hasCalendarEntry(date: string): Promise<boolean> {
  try {
    const entry = await getCalendarEntry(date);
    return entry !== null;
  } catch (error) {
    return false;
  }
} 