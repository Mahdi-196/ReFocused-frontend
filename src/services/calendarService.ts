import { DailyCalendarEntry } from '@/app/track/types';
import { cacheService } from './cacheService';
import { timeService } from './timeService';
import client from '@/api/client';
import { CALENDAR } from '@/api/endpoints';
import { goalsService } from './goalsService';

// Cache configuration
const CALENDAR_CACHE_PREFIX = 'calendar_real';
const CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get current date from time service
function getCurrentDate(): string {
  try {
    return timeService.getCurrentDate();
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Helper function to get timezone headers
 */
function getTimezoneHeaders(): Record<string, string> {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      'X-User-Timezone': userTimezone
    };
  } catch (error) {
    return {};
  }
}

/**
 * Helper function to check if a date is in the past
 */
function isPastDate(date: string): boolean {
  const today = getCurrentDate();
  return date < today;
}

/**
 * Helper function to clear goal-related caches
 */
export function clearGoalCaches(): void {
  // Clear all calendar cache entries
  clearCalendarCache();
}

/**
 * Set up event listeners for goal changes to invalidate calendar cache
 */
if (typeof window !== 'undefined') {
  // Listen for goal creation events
  window.addEventListener('goalCreated', (event: any) => {
    console.log('🔄 [CALENDAR] Goal created, clearing calendar cache');
    clearCalendarCache();
  });

  // Listen for goal progress updates
  window.addEventListener('goalProgressUpdated', (event: any) => {
    console.log('🔄 [CALENDAR] Goal progress updated, clearing calendar cache');
    clearCalendarCache();
  });
}

/**
 * Get calendar entries using the dedicated Calendar API endpoint
 */
export async function getCalendarEntries(startDate: string, endDate: string): Promise<DailyCalendarEntry[]> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_${startDate}_${endDate}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry[]>(cacheKey);
    if (cached) {
      console.log('📦 [CALENDAR] Using cached calendar entries for range:', { 
        startDate, 
        endDate, 
        cacheKey,
        entriesCount: cached.length 
      });
      return cached;
    }

    console.log('🔄 [CALENDAR] Fetching calendar data from API for range:', { 
      startDate, 
      endDate,
      monthYear: startDate.slice(0, 7),
      daysInRange: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    });

    // Use the dedicated Calendar API endpoint
    const response = await client.get(CALENDAR.ENTRIES, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });

    console.log('✅ [CALENDAR] Calendar API response received:', {
      entriesCount: response.data.entries?.length || 0,
      totalEntries: response.data.total_entries,
      startDate: response.data.start_date,
      endDate: response.data.end_date,
      sampleEntry: response.data.entries?.[0],
      goalActivitiesFound: response.data.entries?.some((e: any) => e.goal_activities?.length > 0)
    });

    // Get goal activities for the date range from goals service
    console.log('🎯 [CALENDAR] Fetching goal activities from goals service...');
    let goalsWithProgress: { goals: any[], dailyProgress: any[] } = { goals: [], dailyProgress: [] };
    try {
      goalsWithProgress = await goalsService.getGoalsWithDailyProgress(startDate, endDate);
      console.log('🎯 [CALENDAR] Goals service returned:', {
        goalsCount: goalsWithProgress.goals.length,
        progressEntriesCount: goalsWithProgress.dailyProgress.length,
        dailyProgress: goalsWithProgress.dailyProgress
      });
    } catch (error) {
      console.warn('⚠️ [CALENDAR] Failed to get goal activities from goals service:', error);
    }

    // Transform API response to DailyCalendarEntry format
    const entries: DailyCalendarEntry[] = response.data.entries.map((entry: any) => {
      // Get goal activities for this specific date
      const entryDate = entry.date;
      const dailyGoalProgress = goalsWithProgress.dailyProgress.filter(p => p.date === entryDate);
      
      console.log(`🎯 [CALENDAR] Processing entry for ${entryDate}:`, {
        progressEntriesForDate: dailyGoalProgress.length,
        progressEntries: dailyGoalProgress
      });
      
      // Convert daily progress to goal activities format
      const goalActivitiesFromProgress = dailyGoalProgress.map(progress => {
        const goal = goalsWithProgress.goals.find(g => g.id === progress.goalId);
        return {
          goalId: progress.goalId,
          goalName: goal?.name || 'Unknown Goal',
          activityType: progress.progressType,
          activityTime: new Date(progress.timestamp),
          progressValue: progress.progressValue,
          goalType: goal?.goal_type || 'percentage',
          targetValue: goal?.target_value || 100,
          notes: progress.notes
        };
      });

      // Combine backend goal activities with progress-based activities
      const backendGoalActivities = entry.goal_activities?.map((ga: any) => ({
        goalId: ga.goal_id,
        goalName: ga.goal_name,
        activityType: ga.activity_type,
        activityTime: ga.activity_time ? new Date(ga.activity_time) : undefined,
        progressValue: ga.progress_value,
        goalType: ga.goal_type,
        targetValue: ga.target_value,
        notes: ga.notes
      })) || [];

      const allGoalActivities = [...backendGoalActivities, ...goalActivitiesFromProgress];
      
      console.log(`🎯 [CALENDAR] Goal activities for ${entryDate}:`, {
        backendActivities: backendGoalActivities.length,
        progressActivities: goalActivitiesFromProgress.length,
        totalActivities: allGoalActivities.length,
        activities: allGoalActivities
      });

      return {
        id: entry.id,
        date: entry.date,
        userId: entry.user_id,
        habitCompletions: entry.habit_completions?.map((hc: any) => ({
          habitId: hc.habit_id,
          habitName: hc.habit_name,
          completed: hc.completed,
          completedAt: hc.completed_at ? new Date(hc.completed_at) : undefined,
          wasActiveOnDate: hc.was_active_on_date
        })) || [],
        goalActivities: allGoalActivities,
        gratitudes: entry.gratitudes?.map((g: any) => ({
          id: g.id,
          text: g.text,
          date: g.date,
          createdAt: new Date(g.created_at)
        })) || [],
        moodEntry: entry.mood_entry ? {
          happiness: entry.mood_entry.happiness,
          focus: entry.mood_entry.focus,
          stress: entry.mood_entry.stress
        } : undefined,
        notes: entry.notes,
        isLocked: entry.is_locked || isPastDate(entry.date),
        createdAt: entry.created_at ? new Date(entry.created_at) : undefined,
        updatedAt: entry.updated_at ? new Date(entry.updated_at) : undefined
      };
    });

    // Cache the result
    if (entries.length > 0) {
      cacheService.set(cacheKey, entries, CALENDAR_CACHE_TTL);
    }

    return entries;
    
  } catch (error) {
    console.error('❌ [CALENDAR] Critical error fetching calendar entries:', error);
    throw error; // Let the error propagate instead of returning empty data
  }
}

/**
 * Get a single calendar entry by date using the Calendar API
 */
export async function getCalendarEntry(date: string): Promise<DailyCalendarEntry | null> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_entry_${date}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use the dedicated Calendar API endpoint for single date
    const response = await client.get(CALENDAR.ENTRY_BY_DATE(date));
    
    if (!response.data) {
      return null;
    }

    // Get goal activities for this specific date from goals service
    console.log(`🎯 [CALENDAR] Fetching goal activities for single date: ${date}`);
    let goalActivitiesFromGoalsService: any[] = [];
    try {
      const goalsForDate = await goalsService.getGoalsForDate(date);
      const goalsWithProgress = await goalsService.getGoalsWithDailyProgress(date, date);
      const dailyGoalProgress = goalsWithProgress.dailyProgress.filter(p => p.date === date);
      
      console.log(`🎯 [CALENDAR] Single date goal data:`, {
        goalsForDate: goalsForDate.length,
        progressEntries: dailyGoalProgress.length,
        progressData: dailyGoalProgress
      });
      
      // Convert daily progress to goal activities format
      goalActivitiesFromGoalsService = dailyGoalProgress.map(progress => {
        const goal = goalsWithProgress.goals.find(g => g.id === progress.goalId) || 
                     goalsForDate.find(g => g.id === progress.goalId);
        return {
          goalId: progress.goalId,
          goalName: goal?.name || 'Unknown Goal',
          activityType: progress.progressType,
          activityTime: new Date(progress.timestamp),
          progressValue: progress.progressValue,
          goalType: goal?.goal_type || 'percentage',
          targetValue: goal?.target_value || 100,
          notes: progress.notes
        };
      });
    } catch (error) {
      console.warn('⚠️ [CALENDAR] Failed to get goal activities for single date:', error);
    }

    // Combine backend goal activities with progress-based activities
    const backendGoalActivities = response.data.goal_activities?.map((ga: any) => ({
      goalId: ga.goal_id,
      goalName: ga.goal_name,
      activityType: ga.activity_type,
      activityTime: ga.activity_time ? new Date(ga.activity_time) : undefined,
      progressValue: ga.progress_value,
      goalType: ga.goal_type,
      targetValue: ga.target_value,
      notes: ga.notes
    })) || [];

    const allGoalActivities = [...backendGoalActivities, ...goalActivitiesFromGoalsService];

    console.log(`🎯 [CALENDAR] Single date final goal activities for ${date}:`, {
      backendActivities: backendGoalActivities.length,
      progressActivities: goalActivitiesFromGoalsService.length,
      totalActivities: allGoalActivities.length,
      activities: allGoalActivities
    });

    // Transform API response to DailyCalendarEntry format
    const entry: DailyCalendarEntry = {
      id: response.data.id,
      date: response.data.date,
      userId: response.data.user_id,
      habitCompletions: response.data.habit_completions?.map((hc: any) => ({
        habitId: hc.habit_id,
        habitName: hc.habit_name,
        completed: hc.completed,
        completedAt: hc.completed_at ? new Date(hc.completed_at) : undefined,
        wasActiveOnDate: hc.was_active_on_date
      })) || [],
      goalActivities: allGoalActivities,
      gratitudes: response.data.gratitudes?.map((g: any) => ({
        id: g.id,
        text: g.text,
        date: g.date,
        createdAt: new Date(g.created_at)
      })) || [],
      moodEntry: response.data.mood_entry ? {
        happiness: response.data.mood_entry.happiness,
        focus: response.data.mood_entry.focus,
        stress: response.data.mood_entry.stress
      } : undefined,
      notes: response.data.notes,
      isLocked: response.data.is_locked || isPastDate(response.data.date),
      createdAt: response.data.created_at ? new Date(response.data.created_at) : undefined,
      updatedAt: response.data.updated_at ? new Date(response.data.updated_at) : undefined
    };

    // Cache the result
    cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
    
    return entry;
  } catch (error) {
    console.error('❌ [CALENDAR] Error fetching single calendar entry:', error);
    return null;
  }
}

/**
 * Get calendar entry for a specific date using the Calendar API
 */
export async function getCalendarEntryForDate(date: string): Promise<DailyCalendarEntry | null> {
  // Use the single date API endpoint
  return getCalendarEntry(date);
}

/**
 * Create a calendar entry for today using the Calendar API
 */
export async function createTodayEntry(): Promise<DailyCalendarEntry | null> {
  const today = getCurrentDate();
  return getCalendarEntry(today);
}

/**
 * Toggle habit completion for a specific date (legacy function - redirects to habit service)
 */
export async function toggleHabitInCalendar(date: string, habitId: number, completed: boolean): Promise<DailyCalendarEntry> {
  // Import here to avoid circular dependency
  const { markHabitCompletion } = await import('./habitsService');
  
  try {
    // Update via habit service
    await markHabitCompletion(habitId, date, completed);
    
    // Clear cache and fetch updated entry
    cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_*`);
    
    const updatedEntry = await getCalendarEntry(date);
    if (!updatedEntry) {
      throw new Error('Failed to fetch updated calendar entry');
    }
    
    return updatedEntry;
  } catch (error) {
    throw error;
  }
}

/**
 * Create calendar entry using the Calendar API
 */
export async function createCalendarEntry(entry: Omit<DailyCalendarEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyCalendarEntry> {
  try {
    const requestData = {
      date: entry.date,
      notes: entry.notes,
      habit_completions: entry.habitCompletions.map(hc => ({
        habit_id: hc.habitId,
        habit_name: hc.habitName,
        completed: hc.completed
      })),
      mood_entry: entry.moodEntry ? {
        happiness: entry.moodEntry.happiness,
        focus: entry.moodEntry.focus,
        stress: entry.moodEntry.stress
      } : undefined
    };

    const response = await client.post(CALENDAR.ENTRIES, requestData);
    
    // Transform response back to DailyCalendarEntry format
    const createdEntry: DailyCalendarEntry = {
      id: response.data.id,
      date: response.data.date,
      userId: response.data.user_id,
      habitCompletions: response.data.habit_completions?.map((hc: any) => ({
        habitId: hc.habit_id,
        habitName: hc.habit_name,
        completed: hc.completed,
        completedAt: hc.completed_at ? new Date(hc.completed_at) : undefined,
        wasActiveOnDate: hc.was_active_on_date
      })) || [],
      goalActivities: entry.goalActivities || [],
      gratitudes: response.data.gratitudes?.map((g: any) => ({
        id: g.id,
        text: g.text,
        date: g.date,
        createdAt: new Date(g.created_at)
      })) || [],
      moodEntry: response.data.mood_entry ? {
        happiness: response.data.mood_entry.happiness,
        focus: response.data.mood_entry.focus,
        stress: response.data.mood_entry.stress
      } : undefined,
      notes: response.data.notes,
      isLocked: response.data.is_locked || isPastDate(response.data.date),
      createdAt: response.data.created_at ? new Date(response.data.created_at) : undefined,
      updatedAt: response.data.updated_at ? new Date(response.data.updated_at) : undefined
    };

    // Clear cache to ensure fresh data on next fetch
    clearCalendarCache();
    
    return createdEntry;
  } catch (error) {
    console.error('❌ [CALENDAR] Error creating calendar entry:', error);
    throw error;
  }
}

/**
 * Save calendar entry (legacy function - now creates entry via API)
 */
export async function saveCalendarEntry(entry: DailyCalendarEntry): Promise<DailyCalendarEntry> {
  if (entry.id) {
    // If entry has ID, it already exists - return as-is for backward compatibility
    return entry;
  } else {
    // Create new entry via API
    return createCalendarEntry(entry);
  }
}

/**
 * Update calendar entry (legacy function - now updates individual services)
 */
export async function updateCalendarEntry(date: string, updates: Partial<DailyCalendarEntry>): Promise<DailyCalendarEntry> {
  // This function is deprecated in favor of using individual services
  // Return updated entry for backward compatibility
  
  const entry = await getCalendarEntry(date);
  if (!entry) {
    throw new Error('Calendar entry not found');
  }
  
  return { ...entry, ...updates };
}

/**
 * Clear calendar cache
 */
export function clearCalendarCache(): void {
  console.log('🗑️ [CALENDAR] Clearing calendar cache...');
  cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_*`);
  console.log('✅ [CALENDAR] Cache cleared, next request will fetch fresh data');
}

/**
 * Get calendar summary using the Calendar API
 */
export async function getCalendarSummary(days: number = 30): Promise<any> {
  try {
    const response = await client.get(CALENDAR.SUMMARY, {
      params: { days }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ [CALENDAR] Error fetching calendar summary:', error);
    throw error;
  }
}

/**
 * Check if calendar entry exists for a date
 */
export async function hasCalendarEntry(date: string): Promise<boolean> {
  const entry = await getCalendarEntry(date);
  if (!entry) return false;
  
  return (
    (entry.habitCompletions?.length ?? 0) > 0 ||
    (!!entry.moodEntry) ||
    (entry.goalActivities?.length ?? 0) > 0 ||
    (entry.gratitudes?.length ?? 0) > 0
  );
} 