import { DailyCalendarEntry, DailyHabitCompletion, DailyGoalActivity } from '@/app/track/types';
import { cacheService } from './cacheService';
import { timeService } from './timeService';
import client from '@/api/client';
import { CALENDAR } from '@/api/endpoints';

// Import real services for fallback
import { getHabits, getHabitCompletions } from './habitsService';
import { getMoodEntries } from './moodService';
import { GoalsService } from './goalsService';
import { getDailyEntries } from './dashboardService';
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
  
  // Clear dashboard cache as well since we now use it
  import('./dashboardService').then(({ clearDashboardCache }) => {
    clearDashboardCache();
  });
  
  // Clear any goal-specific cache entries
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(CALENDAR_CACHE_PREFIX) || key.startsWith('goal_') || key.startsWith('dashboard_')
  );
  
  cacheKeys.forEach(key => {
    if (key.startsWith(CALENDAR_CACHE_PREFIX) || key.startsWith('dashboard_')) {
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

    try {
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
        endDate: response.data.end_date
      });

      // Transform API response to DailyCalendarEntry format
      const entries: DailyCalendarEntry[] = response.data.entries.map((entry: any) => ({
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
        goalActivities: [], // Will be populated from goal data if needed
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
      }));

      // Cache the result
      if (entries.length > 0) {
        cacheService.set(cacheKey, entries, CALENDAR_CACHE_TTL);
      }

      return entries;

    } catch (apiError) {
      console.warn('⚠️ [CALENDAR] Calendar API failed, falling back to dashboard service:', apiError);
      
      // Fallback to dashboard service approach
      const monthStr = startDate.slice(0, 7); // YYYY-MM format
      
      // Fetch dashboard entries (includes mood, habits, and gratitudes)
      console.log('📞 [CALENDAR] Fetching dashboard entries for month:', monthStr);
      const dashboardEntries = await getDailyEntries(monthStr);
      console.log('✅ [CALENDAR] Dashboard entries received:', { 
        entriesCount: Object.keys(dashboardEntries).length,
        sampleEntry: Object.keys(dashboardEntries)[0] ? dashboardEntries[Object.keys(dashboardEntries)[0]] : null
      });

      // Fetch additional data that's not in dashboard
      const [habits, goalData] = await Promise.all([
        getHabits().catch(err => {
          console.error('❌ Failed to fetch habits:', err);
          return [];
        }),
        fetchGoalsForDateRange(startDate, endDate).catch(err => {
          console.error('❌ Failed to fetch goals:', err);
          return { goals: [], dailyProgress: [] };
        })
      ]);

      const { goals: allGoals, dailyProgress } = goalData;

      // Create calendar entries from dashboard data
      const entriesMap: { [key: string]: DailyCalendarEntry } = {};

      console.log('🔄 [CALENDAR] Processing dashboard entries into calendar format');

      // Process each date in the range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dashboardEntry = dashboardEntries[dateStr];

        // Create calendar entry for this date
        const calendarEntry: DailyCalendarEntry = {
          date: dateStr,
          userId: 1, // Default user ID
          habitCompletions: [],
          goalActivities: [],
          gratitudes: [],
          isLocked: isPastDate(dateStr)
        };

        // Process dashboard data if it exists
        if (dashboardEntry) {
          console.log(`📊 [CALENDAR] Processing dashboard entry for ${dateStr}:`, {
            hasHabits: !!dashboardEntry.habitCompletions?.length,
            hasMood: !!(dashboardEntry.happiness || dashboardEntry.focus || dashboardEntry.stress),
            hasGratitudes: !!dashboardEntry.gratitudes?.length,
            gratitudeCount: dashboardEntry.gratitudes?.length || 0
          });

          // Add mood data
          if (dashboardEntry.happiness || dashboardEntry.focus || dashboardEntry.stress) {
            calendarEntry.moodEntry = {
              happiness: dashboardEntry.happiness || 0,
              focus: dashboardEntry.focus || 0,
              stress: dashboardEntry.stress || 0
            };
          }

          // Add habit completions
          if (dashboardEntry.habitCompletions) {
            dashboardEntry.habitCompletions.forEach(completion => {
              const habit = habits.find(h => h.id === completion.habitId);
              if (habit) {
                calendarEntry.habitCompletions.push({
                  habitId: completion.habitId,
                  habitName: habit.name,
                  completed: completion.completed,
                  completedAt: completion.completed ? new Date() : undefined,
                  wasActiveOnDate: habit.isActive !== false
                });
              }
            });
          }

          // Add gratitudes
          if (dashboardEntry.gratitudes) {
            console.log(`🙏 [CALENDAR] Adding ${dashboardEntry.gratitudes.length} gratitudes for ${dateStr}`);
            if (!calendarEntry.gratitudes) calendarEntry.gratitudes = [];
            dashboardEntry.gratitudes.forEach(gratitude => {
              calendarEntry.gratitudes.push({
                id: gratitude.id,
                text: gratitude.text,
                date: gratitude.date,
                createdAt: gratitude.created_at ? new Date(gratitude.created_at) : undefined
              });
            });
          }
        }

        // Add goal activities from separate goal data
        const dateGoalProgress = dailyProgress.filter(p => p.date === dateStr);
        dateGoalProgress.forEach(progress => {
          const goal = allGoals.find(g => g.id === progress.goalId);
          if (goal) {
            calendarEntry.goalActivities.push({
              goalId: progress.goalId,
              goalName: goal.name,
              activityType: 'progress_update',
              progressValue: progress.progressValue,
              goalType: goal.goal_type,
              targetValue: goal.target_value,
              activityTime: new Date(progress.date + 'T12:00:00')
            });
          }
        });

        entriesMap[dateStr] = calendarEntry;
      }

      // Convert map to array
      const result = Object.values(entriesMap);
      
      console.log('📊 [CALENDAR] Successfully processed fallback calendar entries:', {
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
    }
    
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

    try {
      // Use the dedicated Calendar API endpoint for single date
      const response = await client.get(CALENDAR.ENTRY_BY_DATE(date));
      
      if (!response.data) {
        return null;
      }

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
        goalActivities: [], // Will be populated from goal data if needed
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

    } catch (apiError) {
      console.warn('⚠️ [CALENDAR] Single entry API failed, falling back to range query:', apiError);
      
      // Fallback to range query approach
      const entries = await getCalendarEntries(date, date);
      const entry = entries.find(e => e.date === date) || null;
      
      // Cache the result
      if (entry) {
        cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
      }
      
      return entry;
    }
  } catch (error) {
    console.error('❌ [CALENDAR] Error fetching single calendar entry:', error);
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
      gratitudes: [], // Ensure required property is present
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
  console.log('🗑️ [CALENDAR] Clearing all calendar cache...');
  cacheService.invalidateByPattern(`${CALENDAR_CACHE_PREFIX}_*`);
  
  // Clear dashboard cache since we now use it for calendar data
  cacheService.invalidateByPattern('dashboard_*');
  
  // Also clear individual cache keys
  const cacheKeys = ['habits_', 'completions_', 'moods_', 'goals_', 'gratitudes_'];
  cacheKeys.forEach(prefix => {
    cacheService.invalidateByPattern(prefix + '*');
  });
  
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