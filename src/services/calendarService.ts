import { DailyCalendarEntry, DailyHabitCompletion, DailyGoalActivity } from '@/app/track/types';
import { cacheService } from './cacheService';
import { timeService } from './timeService';

// Import real services
import { getHabits, getHabitCompletions } from './habitsService';
import { getMoodEntries } from './moodService';
import { GoalsService } from './goalsService';

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
      cacheService.remove(key);
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
      return cached;
    }

    // Fetch all required data in parallel
    const [habits, habitCompletions, moodEntries, goalData] = await Promise.all([
      getHabits().catch(err => {
        return [];
      }),
      getHabitCompletions(startDate, endDate).catch(err => {
        return [];
      }),
      getMoodEntries(startDate, endDate).catch(err => {
        return [];
      }),
      fetchGoalsForDateRange(startDate, endDate) // Use enhanced goal fetching
    ]);

    const { goals: allGoals, dailyProgress } = goalData;

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
          isLocked: isPastDate(date)
        };
      }
      return entriesMap[date];
    };

    // Process habit completions
    habitCompletions.forEach(completion => {
      const entry = ensureCalendarEntry(completion.date);
      const habit = habits.find(h => h.id === completion.habitId);
      
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

    // Add all current habits to dates that don't have completions (showing them as not completed)
    const allDates = new Set<string>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate date range using backend time as reference
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.add(d.toISOString().split('T')[0]);
    }
    
    allDates.forEach(date => {
      habits.forEach(habit => {
        const entry = ensureCalendarEntry(date);
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
    });

    // Process mood entries
    moodEntries.forEach(mood => {
      const entry = ensureCalendarEntry(mood.date);
      entry.moodEntry = {
        happiness: mood.happiness || 0,
        focus: mood.focus || 0,
        stress: mood.stress || 0
      };
    });

    // Process goal activities with improved day-specific filtering
    let goalActivitiesAdded = 0;
    
    // Helper function to ensure goal activity is unique per day
    const addGoalActivity = (date: string, activity: any, goalId: number) => {
      const entry = ensureCalendarEntry(date);
      entry.goalActivities = entry.goalActivities || [];
      
      // Check if we already have this type of activity for this goal on this date
      const existingActivity = entry.goalActivities.find(a => 
        a.goalId === goalId && a.activityType === activity.activityType
      );
      
      if (!existingActivity) {
        entry.goalActivities.push(activity);
        goalActivitiesAdded++;
      }
    };
    
    // Process client-side daily progress data
    dailyProgress.forEach(progress => {
      
      // Find the corresponding goal
      const goal = allGoals.find(g => g.id === progress.goalId);
      if (goal) {
        // Try to get previous value from localStorage or use 0 as default
        let previousValue = 0;
        try {
          const stored = localStorage.getItem('goal_previous_values');
          if (stored) {
            const previousValues = JSON.parse(stored);
            previousValue = previousValues[progress.goalId] || 0;
          }
        } catch (error) {
          // console.warn('Could not get previous value from localStorage:', error);
        }
        
        addGoalActivity(progress.date, {
          goalId: progress.goalId,
          goalName: goal.name,
          activityType: progress.progressType === 'complete' ? 'completed' : 'progress_update',
          activityTime: new Date(progress.timestamp),
          progressValue: progress.progressValue,
          goalType: goal.goal_type,
          targetValue: goal.target_value,
          previousValue: previousValue,
          notes: progress.notes || 'Progress updated'
        }, progress.goalId);
      }
    });

    // Process goal activities from backend with previous value tracking
    allGoals.forEach(goal => {
      
      // Process goal creation
      if (goal.created_at) {
        const createdDate = goal.created_at.split('T')[0];
        if (createdDate >= startDate && createdDate <= endDate) {
          const activity = {
            goalId: goal.id,
            goalName: goal.name,
            activityType: 'created',
            activityTime: new Date(goal.created_at),
            notes: `Created new ${goal.goal_type} goal`
          };
          addGoalActivity(createdDate, activity, goal.id);
        }
      }
      
      // Process goal completion
      if (goal.completed_at) {
        const completedDate = goal.completed_at.split('T')[0];
        if (completedDate >= startDate && completedDate <= endDate) {
          addGoalActivity(completedDate, {
            goalId: goal.id,
            goalName: goal.name,
            activityType: 'completed',
            activityTime: new Date(goal.completed_at),
            notes: `Completed ${goal.goal_type} goal`
          }, goal.id);
        }
      }
      
      // Enhanced progress tracking logic with proper percentage calculation
      const hasProgress = goal.current_value > 0;
      const isCompleted = Boolean(goal.is_completed) || (goal.completed_at !== null);
      const progressPercentage = goal.progress_percentage ?? 0;
      
      if (hasProgress && !isCompleted) {
        
        // For progress tracking, we need to be smarter about when to show activity
        // Strategy: Show progress on updated_at date if it's different from created_at
        const createdDate = goal.created_at ? goal.created_at.split('T')[0] : null;
        const updatedDate = goal.updated_at ? goal.updated_at.split('T')[0] : null;
        
        // Case 1: Progress was made on a different day than creation
        if (updatedDate && createdDate && updatedDate !== createdDate) {
          
          if (updatedDate >= startDate && updatedDate <= endDate) {
            // Try to get previous value from localStorage or use a smarter default
            let previousValue = 0;
            try {
              const stored = localStorage.getItem('goal_previous_values');
              if (stored) {
                const previousValues = JSON.parse(stored);
                previousValue = previousValues[goal.id] || 0;
              }
            } catch (error) {
              // console.warn('Could not get previous value from localStorage:', error);
            }
            
            // If we don't have a stored previous value, try to estimate it
            // For newly created goals, assume they started at 0
            // For existing goals, we'll show current progress without change indication
            const isNewGoal = createdDate === updatedDate;
            const shouldShowChange = !isNewGoal && previousValue > 0;
            
            const activity = {
              goalId: goal.id,
              goalName: goal.name,
              activityType: 'progress_update',
              activityTime: goal.updated_at ? new Date(goal.updated_at) : new Date(),
              progressValue: goal.current_value,
              goalType: goal.goal_type,
              targetValue: goal.target_value,
              previousValue: previousValue,
              notes: shouldShowChange 
                ? (goal.current_value > previousValue 
                    ? `You gained ${Math.round(goal.current_value - previousValue)}% progress`
                    : `You lost ${Math.round(previousValue - goal.current_value)}% progress`)
                : goal.goal_type === 'percentage' 
                ? `Progress updated to ${Math.round(goal.current_value)}%`
                : goal.goal_type === 'counter'
                ? `Progress: ${goal.current_value}/${goal.target_value} (${Math.round(progressPercentage)}%)`
                : goal.goal_type === 'checklist'
                ? `Progress: ${Math.round(progressPercentage)}%`
                : 'Progress updated'
            };
            addGoalActivity(updatedDate, activity, goal.id);
          }
        }
      }
    });

    // Convert map to array
    const entries = Object.values(entriesMap);
    
    // Count entries with goal activities
    const entriesWithGoals = entries.filter(entry => entry.goalActivities && entry.goalActivities.length > 0);
    
    // Cache the results
    cacheService.set(cacheKey, entries, CALENDAR_CACHE_TTL);
    
    return entries;
  } catch (error) {
    cacheService.invalidate(cacheKey);
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
    const [habits, habitCompletions, moodEntries, dayGoals] = await Promise.all([
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
      
      if (goalUpdatedDate === date && goalUpdatedDate !== goalCreatedDate && !Boolean(goal.is_completed)) {
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
    (entry.goalActivities?.length ?? 0) > 0
  );
} 