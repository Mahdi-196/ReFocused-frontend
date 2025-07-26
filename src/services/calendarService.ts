import { DailyCalendarEntry, DailyHabitCompletion, DailyGoalActivity } from '@/app/track/types';
import { cacheService } from './cacheService';
import { timeService } from './timeService';

// Import real services
import { getHabits, getHabitCompletions } from './habitsService';
import { getMoodEntries } from './moodService';
import { GoalsService } from './goalsService';
import { getGratitudeEntries } from '@/api/services/gratitudeService';

// Cache configuration
const CALENDAR_CACHE_PREFIX = 'calendar_real';
const CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize goals service
const goalsService = new GoalsService();

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
  
  // Clear any goal-specific cache entries
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(CALENDAR_CACHE_PREFIX) || key.startsWith('goal_')
  );
  
  cacheKeys.forEach(key => {
    if (key.startsWith(CALENDAR_CACHE_PREFIX)) {
      cacheService.delete(key);
    }
  });
  
}

/**
 * Fetch goals relevant to a specific date range
 * This optimizes goal fetching by including history and recent activity
 */
async function fetchGoalsForDateRange(startDate: string, endDate: string) {
  try {
    // Use enhanced goal tracking that includes client-side progress
    const { goals: allGoals, dailyProgress } = await goalsService.getGoalsWithDailyProgress(startDate, endDate);

    return { goals: allGoals, dailyProgress };
  } catch (error) {
    return { goals: [], dailyProgress: [] };
  }
}

/**
 * Get real calendar entries with habit, mood, and goal data
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

    console.log('🔄 [CALENDAR] Fetching fresh calendar data for range:', { 
      startDate, 
      endDate,
      monthYear: startDate.slice(0, 7),
      daysInRange: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    });

    // Check authentication before making API calls
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    console.log('🔐 [CALENDAR] Auth check:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
    });

    // Fetch all required data in parallel with individual error handling
    const [habits, habitCompletions, moodEntries, goalData, gratitudeResponse] = await Promise.allSettled([
      getHabits(),
      getHabitCompletions(startDate, endDate),
      getMoodEntries(startDate, endDate),
      fetchGoalsForDateRange(startDate, endDate),
      getGratitudeEntries({ start_date: startDate, end_date: endDate, limit: 1000 })
    ]);

    // Extract successful results or use fallbacks
    const successfulHabits = habits.status === 'fulfilled' ? habits.value : [];
    const successfulCompletions = habitCompletions.status === 'fulfilled' ? habitCompletions.value : [];
    const successfulMoodEntries = moodEntries.status === 'fulfilled' ? moodEntries.value : [];
    const successfulGoalData = goalData.status === 'fulfilled' ? goalData.value : { goals: [], dailyProgress: [] };
    const successfulGratitudes = gratitudeResponse.status === 'fulfilled' 
      ? gratitudeResponse.value 
      : { gratitude_entries: [], total: 0, page: 1, size: 0, has_next: false, has_prev: false };

    // Log any failures for debugging
    if (habits.status === 'rejected') {
      console.warn('⚠️ [CALENDAR] Failed to fetch habits:', habits.reason);
    }
    if (habitCompletions.status === 'rejected') {
      console.warn('⚠️ [CALENDAR] Failed to fetch habit completions:', habitCompletions.reason);
    }
    if (moodEntries.status === 'rejected') {
      console.warn('⚠️ [CALENDAR] Failed to fetch mood entries:', moodEntries.reason);
    }
    if (goalData.status === 'rejected') {
      console.warn('⚠️ [CALENDAR] Failed to fetch goal data:', goalData.reason);
    }
    if (gratitudeResponse.status === 'rejected') {
      console.warn('⚠️ [CALENDAR] Failed to fetch gratitude entries:', gratitudeResponse.reason);
    }

    const { goals: allGoals, dailyProgress } = successfulGoalData;

    // Create a map to store calendar entries by date
    const entriesMap: { [key: string]: DailyCalendarEntry } = {};

    // Helper function to ensure calendar entry exists for a date
    const ensureCalendarEntry = (date: string): DailyCalendarEntry => {
      if (!entriesMap[date]) {
        entriesMap[date] = {
          date,
          userId: 1, // Default user ID
          habitCompletions: [],
          goalActivities: [],
          gratitudes: [],
          isLocked: isPastDate(date)
        };
      }
      return entriesMap[date];
    };

    // Process habit completions
    successfulCompletions.forEach(completion => {
      const entry = ensureCalendarEntry(completion.date);
      const habit = successfulHabits.find(h => h.id === completion.habitId);
      
      if (habit) {
        const existingCompletion = entry.habitCompletions.find(hc => hc.habitId === completion.habitId);
        if (!existingCompletion) {
          entry.habitCompletions.push({
            habitId: completion.habitId,
            habitName: habit.name,
            completed: completion.completed,
            completedAt: completion.completedAt,
            wasActiveOnDate: habit.isActive !== false
          });
        }
      }
    });

    // Process mood entries with safe property access
    successfulMoodEntries.forEach(mood => {
      const entry = ensureCalendarEntry(mood.date);
      entry.moodEntry = {
        happiness: mood.happiness || 0,
        focus: mood.focus || 0,
        stress: mood.stress || 0
      };
    });

    // Process gratitude entries
    successfulGratitudes.gratitude_entries?.forEach(gratitude => {
      const entry = ensureCalendarEntry(gratitude.date);
      if (!entry.gratitudes) {
        entry.gratitudes = [];
      }
      entry.gratitudes.push({
        id: gratitude.id,
        text: gratitude.text,
        date: gratitude.date,
        createdAt: gratitude.created_at ? new Date(gratitude.created_at) : undefined
      });
    });

    // Process goal activities
    dailyProgress.forEach(progress => {
      const entry = ensureCalendarEntry(progress.date);
      if (!entry.goalActivities) {
        entry.goalActivities = [];
      }
      
      const goal = allGoals.find(g => g.id === progress.goalId);
      if (goal) {
        entry.goalActivities.push({
          goalId: progress.goalId,
          goalName: goal.name,
          activityType: 'progress_update',
          progressValue: progress.currentValue,
          goalType: goal.type,
          targetValue: goal.targetValue,
          activityTime: new Date(progress.date + 'T12:00:00')
        });
      }
    });

    // Convert map to array
    const result = Object.values(entriesMap);
    
    console.log('📊 [CALENDAR] Successfully processed calendar entries:', {
      totalEntries: result.length,
      entriesWithMood: result.filter(e => e.moodEntry).length,
      entriesWithHabits: result.filter(e => e.habitCompletions.length > 0).length,
      entriesWithGratitudes: result.filter(e => e.gratitudes && e.gratitudes.length > 0).length,
      entriesWithGoals: result.filter(e => e.goalActivities && e.goalActivities.length > 0).length
    });

    // Cache the result if we have any successful data
    if (result.length > 0) {
      cacheService.set(cacheKey, result, CALENDAR_CACHE_TTL);
    }

    return result;
    
  } catch (error) {
    console.error('❌ [CALENDAR] Critical error fetching calendar entries:', error);
    
    // Return empty array on complete failure
    // The calling code will handle this gracefully
    return [];
  }
}

/**
 * Get a single calendar entry by date using real data
 */
export async function getCalendarEntry(date: string): Promise<DailyCalendarEntry | null> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_entry_${date}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch entries for a single day (use same date for start and end)
    const entries = await getCalendarEntries(date, date);
    const entry = entries.find(e => e.date === date) || null;
    
    // Cache the result
    if (entry) {
      cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
    }
    
    return entry;
  } catch (error) {
    return null;
  }
}

/**
 * Get calendar entry for a specific date with optimized goal fetching
 * This is more efficient for single-day queries
 */
export async function getCalendarEntryForDate(date: string): Promise<DailyCalendarEntry | null> {
  const cacheKey = `${CALENDAR_CACHE_PREFIX}_single_${date}`;
  
  try {
    // Check cache first
    const cached = cacheService.get<DailyCalendarEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch all required data in parallel with date-specific goal fetching
    const [habits, habitCompletions, moodEntries, dayGoals, gratitudeResponse] = await Promise.all([
      getHabits().catch(err => {
        return [];
      }),
      getHabitCompletions(date, date).catch(err => {
        return [];
      }),
      getMoodEntries(date, date).catch(err => {
        return [];
      }),
      goalsService.getGoalsForDate(date).catch(err => {
        return [];
      }),
      getGratitudeEntries({ start_date: date, end_date: date, limit: 100 }).catch(err => {
        console.error('Failed to fetch gratitude entries for date:', date, err);
        return { gratitude_entries: [], total: 0, page: 1, size: 0, has_next: false, has_prev: false };
      })
    ]);

    // Create calendar entry
    const entry: DailyCalendarEntry = {
      date,
      userId: 1, // Default user ID
      habitCompletions: [],
      goalActivities: [],
      isLocked: isPastDate(date)
    };

    // Process habit completions
    habitCompletions.forEach(completion => {
      const habit = habits.find(h => h.id === completion.habitId);
      if (habit) {
        entry.habitCompletions.push({
          habitId: completion.habitId,
          habitName: habit.name,
          completed: completion.completed,
          completedAt: completion.completedAt,
          wasActiveOnDate: habit.isActive !== false
        });
      }
    });

    // Add habits that don't have completions
    habits.forEach(habit => {
      const existingCompletion = entry.habitCompletions.find(hc => hc.habitId === habit.id);
      if (!existingCompletion) {
        entry.habitCompletions.push({
          habitId: habit.id,
          habitName: habit.name,
          completed: false,
          wasActiveOnDate: habit.isActive !== false
        });
      }
    });

    // Process mood entries
    const moodEntry = moodEntries.find(mood => mood.date === date);
    if (moodEntry) {
      entry.moodEntry = {
        happiness: moodEntry.happiness || 0,
        focus: moodEntry.focus || 0,
        stress: moodEntry.stress || 0
      };
    }

    // Process gratitude entries
    const gratitudeEntries = gratitudeResponse.gratitude_entries || [];
    console.log('🙏 [CALENDAR-SINGLE] Processing gratitude entries for date:', date, {
      count: gratitudeEntries.length,
      entries: gratitudeEntries
    });
    
    entry.gratitudes = gratitudeEntries.map(gratitude => ({
      id: gratitude.id,
      text: gratitude.text,
      date: gratitude.date,
      createdAt: new Date(gratitude.created_at)
    }));
    
    console.log('📅 [CALENDAR-SINGLE] Final gratitudes for date:', date, entry.gratitudes);

    // Process goal activities for this specific date
    dayGoals.forEach(goal => {
      
      // Add goal activities that occurred on this date
      const goalCreatedDate = goal.created_at ? goal.created_at.split('T')[0] : null;
      const goalCompletedDate = goal.completed_at ? goal.completed_at.split('T')[0] : null;
      const goalUpdatedDate = goal.updated_at ? goal.updated_at.split('T')[0] : null;
      
      if (goalCreatedDate === date) {
        entry.goalActivities = entry.goalActivities || [];
        entry.goalActivities.push({
          goalId: goal.id,
          goalName: goal.name,
          activityType: 'created',
          activityTime: new Date(goal.created_at!),
          notes: `Created new ${goal.goal_type} goal`
        });
      }
      
      if (goalCompletedDate === date) {
        entry.goalActivities = entry.goalActivities || [];
        entry.goalActivities.push({
          goalId: goal.id,
          goalName: goal.name,
          activityType: 'completed',
          activityTime: new Date(goal.completed_at!),
          notes: `Completed ${goal.goal_type} goal`
        });
      }
      
      if (goalUpdatedDate === date && goalUpdatedDate !== goalCreatedDate && !goal.is_completed) {
        entry.goalActivities = entry.goalActivities || [];
        entry.goalActivities.push({
          goalId: goal.id,
          goalName: goal.name,
          activityType: 'progress_update',
          activityTime: new Date(goal.updated_at!),
          progressValue: goal.current_value,
          goalType: goal.goal_type,
          targetValue: goal.target_value,
          notes: goal.goal_type === 'percentage' 
            ? `Progress updated to ${Math.round(goal.current_value)}%`
            : `Progress: ${goal.current_value}/${goal.target_value}`
        });
      }
    });
    
    // Cache the result
    cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
    
    return entry;
  } catch (error) {
    return null;
  }
}

/**
 * Create a calendar entry for today with current habits (legacy function - now reads real data)
 */
export async function createTodayEntry(): Promise<DailyCalendarEntry | null> {
  try {
    const today = getCurrentDate();
    return getCalendarEntry(today);
  } catch (error) {
    // Fallback for server-side rendering
    const today = new Date().toISOString().split('T')[0];
    return getCalendarEntry(today);
  }
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
 * Save calendar entry (legacy function - now saves to individual services)
 */
export async function saveCalendarEntry(entry: DailyCalendarEntry): Promise<DailyCalendarEntry> {
  // This function is deprecated in favor of using individual services
  // Return the entry as-is for backward compatibility
  return entry;
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
  cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_*`);
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