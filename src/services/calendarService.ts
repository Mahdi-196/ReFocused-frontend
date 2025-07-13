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
    console.warn('Time service not available, using system date:', error);
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
    console.warn('Failed to get user timezone:', error);
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
 * Fetch goals relevant to a specific date range
 * This optimizes goal fetching by including history and recent activity
 */
async function fetchGoalsForDateRange(startDate: string, endDate: string) {
  try {
    // Use enhanced goal tracking that includes client-side progress
    const { goals: allGoals, dailyProgress } = await goalsService.getGoalsWithDailyProgress(startDate, endDate);

    console.log('📊 Fetched goals with daily progress:', {
      startDate,
      endDate,
      totalGoals: allGoals.length,
      progressEntries: dailyProgress.length
    });

    return { goals: allGoals, dailyProgress };
  } catch (error) {
    console.error('Failed to fetch goals for date range:', error);
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
      console.log('📋 Returning cached REAL calendar entries:', cached.length);
      return cached;
    }

    console.log('🔄 Fetching REAL calendar entries for range:', { 
      startDate, 
      endDate,
      currentSystemDate: new Date().toISOString().split('T')[0],
      currentTimeServiceDate: getCurrentDate(),
      dateRangeDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    });
    
    // Fetch all required data in parallel
    const [habits, habitCompletions, moodEntries, goalData] = await Promise.all([
      getHabits().catch(err => {
        console.warn('Failed to fetch habits:', err);
        return [];
      }),
      getHabitCompletions(startDate, endDate).catch(err => {
        console.warn('Failed to fetch habit completions:', err);
        return [];
      }),
      getMoodEntries(startDate, endDate).catch(err => {
        console.warn('Failed to fetch mood entries:', err);
        return [];
      }),
      fetchGoalsForDateRange(startDate, endDate) // Use enhanced goal fetching
    ]);

    const { goals: allGoals, dailyProgress } = goalData;

    console.log('📊 Real data fetched:', {
      habits: habits.length,
      habitCompletions: habitCompletions.length,
      moodEntries: moodEntries.length,
      goals: allGoals.length,
      dailyProgress: dailyProgress.length
    });

    // Debug: Log goal details
    if (allGoals.length > 0) {
      console.log('🎯 Goals found:', allGoals.map(g => ({
        id: g.id,
        name: g.name,
        type: g.goal_type,
        completed: g.is_completed,
        created_at: g.created_at,
        completed_at: g.completed_at,
        updated_at: g.updated_at,
        current_value: g.current_value
      })));
    } else {
      console.log('🎯 No goals found for date range');
    }

    // Debug: Log daily progress
    if (dailyProgress.length > 0) {
      console.log('📊 Daily progress found:', dailyProgress.map(p => ({
        goalId: p.goalId,
        date: p.date,
        progressValue: p.progressValue,
        progressType: p.progressType,
        notes: p.notes
      })));
    } else {
      console.log('📊 No daily progress found for date range');
    }

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
    
    console.log('📅 Generated date range:', {
      startDate,
      endDate, 
      totalDates: allDates.size,
      dates: Array.from(allDates).slice(0, 5),
      backendCurrentDate: getCurrentDate(),
      systemCurrentDate: new Date().toISOString().split('T')[0]
    });

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
    console.log('🎯 Starting goal processing for', allGoals.length, 'goals');
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
        console.log('🎯 Added', activity.activityType, 'activity for goal', goalId, 'on', date);
      } else {
        console.log('🎯 Skipped duplicate', activity.activityType, 'activity for goal', goalId, 'on', date);
      }
    };
    
    allGoals.forEach(goal => {
      console.log('🎯 Processing goal:', { 
        id: goal.id, 
        name: goal.name, 
        type: goal.goal_type,
        completed: goal.is_completed,
        created_at: goal.created_at,
        completed_at: goal.completed_at,
        updated_at: goal.updated_at,
        current_value: goal.current_value,
        target_value: goal.target_value,
        progress_percentage: goal.progress_percentage
      });
      
      // DEBUG: Detailed goal analysis
              console.log('🔍 GOAL DEBUG ANALYSIS:', {
          goalId: goal.id,
          goalName: goal.name,
          rawData: {
            current_value: goal.current_value,
            target_value: goal.target_value,
            progress_percentage: goal.progress_percentage,
            is_completed: goal.is_completed,
            goal_type: goal.goal_type
          },
          calculations: {
            hasProgress: goal.current_value > 0,
            isCompleted: Boolean(goal.is_completed) || (goal.completed_at !== null),
            progressPercentage: goal.progress_percentage ?? 0,
            expectedPercentage: goal.goal_type === 'counter' 
              ? Math.round((goal.current_value / goal.target_value) * 100)
              : goal.progress_percentage,
            // Verify progress percentage calculation
            manualCalculation: goal.goal_type === 'counter' && goal.target_value > 0
              ? Math.round((goal.current_value / goal.target_value) * 100)
              : goal.progress_percentage,
            calculationMatch: goal.goal_type === 'counter' && goal.target_value > 0
              ? (goal.progress_percentage === Math.round((goal.current_value / goal.target_value) * 100))
              : true
          },
          timestamps: {
            created_at: goal.created_at,
            updated_at: goal.updated_at,
            completed_at: goal.completed_at,
            createdDate: goal.created_at ? goal.created_at.split('T')[0] : null,
            updatedDate: goal.updated_at ? goal.updated_at.split('T')[0] : null
          },
          dateRangeChecks: {
            startDate,
            endDate,
            createdInRange: goal.created_at ? 
              (goal.created_at.split('T')[0] >= startDate && goal.created_at.split('T')[0] <= endDate) : false,
            updatedInRange: goal.updated_at ? 
              (goal.updated_at.split('T')[0] >= startDate && goal.updated_at.split('T')[0] <= endDate) : false,
            completedInRange: goal.completed_at ? 
              (goal.completed_at.split('T')[0] >= startDate && goal.completed_at.split('T')[0] <= endDate) : false
          }
        });
      
      // Process goal creation
      if (goal.created_at) {
        const createdDate = goal.created_at.split('T')[0];
        console.log('🎯 Goal created on:', createdDate, 'checking if in range', startDate, 'to', endDate);
        console.log('📅 CREATION DEBUG:', {
          goalId: goal.id,
          goalName: goal.name,
          createdDate,
          startDate,
          endDate,
          inRange: createdDate >= startDate && createdDate <= endDate,
          willAddActivity: createdDate >= startDate && createdDate <= endDate,
          dateComparisons: {
            'created >= start': createdDate >= startDate,
            'created <= end': createdDate <= endDate,
            createdTimestamp: new Date(createdDate).getTime(),
            startTimestamp: new Date(startDate).getTime(),
            endTimestamp: new Date(endDate).getTime()
          }
        });
        
        if (createdDate >= startDate && createdDate <= endDate) {
          const activity = {
            goalId: goal.id,
            goalName: goal.name,
            activityType: 'created',
            activityTime: new Date(goal.created_at),
            notes: `Created new ${goal.goal_type} goal`
          };
          console.log('➕ ADDING CREATION ACTIVITY:', activity);
          addGoalActivity(createdDate, activity, goal.id);
        }
      }
      
      // Process goal completion
      if (goal.completed_at) {
        const completedDate = goal.completed_at.split('T')[0];
        console.log('🎯 Goal completed on:', completedDate, 'checking if in range', startDate, 'to', endDate);
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
        console.log('🎯 Processing progress for goal:', goal.id, 'current_value:', goal.current_value, 'type:', goal.goal_type, 'progress_percentage:', progressPercentage);
        
        // For progress tracking, we need to be smarter about when to show activity
        // Strategy: Show progress on updated_at date if it's different from created_at
        const createdDate = goal.created_at ? goal.created_at.split('T')[0] : null;
        const updatedDate = goal.updated_at ? goal.updated_at.split('T')[0] : null;
        
        // Case 1: Progress was made on a different day than creation
        if (updatedDate && createdDate && updatedDate !== createdDate) {
          console.log('🎯 Progress made on different day than creation:', updatedDate, 'vs', createdDate);
          console.log('📊 PROGRESS DEBUG CASE 1:', {
            goalId: goal.id,
            goalName: goal.name,
            createdDate,
            updatedDate,
            inRange: updatedDate >= startDate && updatedDate <= endDate,
            progressValue: goal.current_value,
            progressPercentage,
            willAddActivity: updatedDate >= startDate && updatedDate <= endDate
          });
          
          if (updatedDate >= startDate && updatedDate <= endDate) {
            const notes = goal.goal_type === 'percentage' 
              ? `Progress updated to ${Math.round(goal.current_value)}%`
              : goal.goal_type === 'counter'
              ? `Progress: ${goal.current_value}/${goal.target_value} (${Math.round(progressPercentage)}%)`
              : goal.goal_type === 'checklist'
              ? `Progress: ${Math.round(progressPercentage)}%`
              : 'Progress updated';
              
            const activity = {
              goalId: goal.id,
              goalName: goal.name,
              activityType: 'progress_update',
              activityTime: goal.updated_at ? new Date(goal.updated_at) : new Date(),
              progressValue: goal.current_value,
              goalType: goal.goal_type,
              targetValue: goal.target_value,
              notes
            };
            console.log('➕ ADDING PROGRESS ACTIVITY (CASE 1):', activity);
            addGoalActivity(updatedDate, activity, goal.id);
          }
        }
        
        // Case 2: Removed - Don't show progress activities on today unless actual activity occurred
        // This prevents showing goal activities on today just because goals exist with progress
      }
      
      // Enhanced creation tracking - ensure ALL goals show creation events
      if (goal.created_at) {
        const createdDate = goal.created_at.split('T')[0];
        console.log('🎯 Checking goal creation:', {
          goalId: goal.id,
          name: goal.name,
          createdDate,
          inRange: createdDate >= startDate && createdDate <= endDate
        });
        
        if (createdDate >= startDate && createdDate <= endDate) {
          // Always add creation activity, regardless of progress
          addGoalActivity(createdDate, {
            goalId: goal.id,
            goalName: goal.name,
            activityType: 'created',
            activityTime: new Date(goal.created_at),
            notes: goal.goal_type === 'counter' 
              ? `Created new counter goal (target: ${goal.target_value})`
              : goal.goal_type === 'percentage'
              ? `Created new percentage goal`
              : goal.goal_type === 'checklist'
              ? `Created new checklist goal`
              : `Created new ${goal.goal_type} goal`
          }, goal.id);
        }
      }
      
      // Special handling for recently completed goals
      if (isCompleted && goal.completed_at) {
        const completedDate = goal.completed_at.split('T')[0];
        const daysSinceCompletion = Math.floor((Date.now() - new Date(goal.completed_at).getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('🎯 Recently completed goal:', {
          id: goal.id,
          completedDate,
          daysSinceCompletion,
          inRange: completedDate >= startDate && completedDate <= endDate
        });
        
        // Already handled above in completion processing
      }
    });

    // Process client-side daily progress data
    console.log('📊 Processing daily progress data:', dailyProgress.length, 'entries');
    dailyProgress.forEach(progress => {
      console.log('📊 Processing progress:', {
        goalId: progress.goalId,
        date: progress.date,
        progressValue: progress.progressValue,
        progressType: progress.progressType,
        notes: progress.notes
      });
      
      // Find the corresponding goal
      const goal = allGoals.find(g => g.id === progress.goalId);
      if (goal) {
        addGoalActivity(progress.date, {
          goalId: progress.goalId,
          goalName: goal.name,
          activityType: progress.progressType === 'complete' ? 'completed' : 'progress_update',
          activityTime: new Date(progress.timestamp),
          progressValue: progress.progressValue,
          goalType: goal.goal_type,
          targetValue: goal.target_value,
          notes: progress.notes || 'Progress updated'
        }, progress.goalId);
      } else {
        console.warn('📊 Goal not found for progress entry:', progress.goalId);
      }
    });

    console.log('🎯 Goal processing complete:', {
      totalGoals: allGoals.length,
      goalActivitiesAdded,
      dateRange: `${startDate} to ${endDate}`
    });

    // Convert map to array
    const entries = Object.values(entriesMap);
    
    // Count entries with goal activities
    const entriesWithGoals = entries.filter(entry => entry.goalActivities && entry.goalActivities.length > 0);
    
    console.log('✅ Successfully aggregated', entries.length, 'real calendar entries');
    console.log('🎯 Entries with goal activities:', entriesWithGoals.length);
    
    if (entries.length > 0) {
      console.log('📅 Real entry dates:', entries.map(e => e.date).slice(0, 5).join(', ') + 
                 (entries.length > 5 ? '...' : ''));
      console.log('📅 Sample real entry structure:', {
        date: entries[0].date,
        habitCompletions: entries[0].habitCompletions?.length || 0,
        goalActivities: entries[0].goalActivities?.length || 0,
        hasMoodEntry: !!entries[0].moodEntry,
        moodEntry: entries[0].moodEntry
      });
    }
    
    // Cache the results
    cacheService.set(cacheKey, entries, CALENDAR_CACHE_TTL);
    
    return entries;
  } catch (error) {
    console.error('❌ Failed to fetch real calendar entries:', error);
    // Clear the cache on error to prevent caching empty results
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
    console.warn('Failed to fetch real calendar entry:', error);
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
      console.log('📋 Returning cached calendar entry for date:', date);
      return cached;
    }

    console.log('🔄 Fetching calendar entry for date:', date);
    
    // Fetch all required data in parallel with date-specific goal fetching
    const [habits, habitCompletions, moodEntries, dayGoals] = await Promise.all([
      getHabits().catch(err => {
        console.warn('Failed to fetch habits:', err);
        return [];
      }),
      getHabitCompletions(date, date).catch(err => {
        console.warn('Failed to fetch habit completions:', err);
        return [];
      }),
      getMoodEntries(date, date).catch(err => {
        console.warn('Failed to fetch mood entries:', err);
        return [];
      }),
      goalsService.getGoalsForDate(date).catch(err => {
        console.warn('Failed to fetch goals for date:', err);
        return [];
      })
    ]);

    console.log('📊 Single day data fetched:', {
      date,
      habits: habits.length,
      habitCompletions: habitCompletions.length,
      moodEntries: moodEntries.length,
      goals: dayGoals.length
    });

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
      console.log('🎯 Processing goal for date:', date, { 
        id: goal.id, 
        name: goal.name, 
        type: goal.goal_type,
        completed: goal.is_completed,
        created_at: goal.created_at,
        completed_at: goal.completed_at,
        updated_at: goal.updated_at
      });
      
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
    
    console.log('✅ Calendar entry for date created:', {
      date,
      habitCompletions: entry.habitCompletions.length,
      goalActivities: entry.goalActivities?.length || 0,
      hasMoodEntry: !!entry.moodEntry
    });
    
    // Cache the result
    cacheService.set(cacheKey, entry, CALENDAR_CACHE_TTL);
    
    return entry;
  } catch (error) {
    console.error('❌ Failed to fetch calendar entry for date:', error);
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
    console.error('Failed to toggle habit in calendar:', error);
    throw error;
  }
}

/**
 * Save calendar entry (legacy function - now saves to individual services)
 */
export async function saveCalendarEntry(entry: DailyCalendarEntry): Promise<DailyCalendarEntry> {
  // This function is deprecated in favor of using individual services
  // Return the entry as-is for backward compatibility
  console.warn('saveCalendarEntry is deprecated - use individual services instead');
  return entry;
}

/**
 * Update calendar entry (legacy function - now updates individual services)
 */
export async function updateCalendarEntry(date: string, updates: Partial<DailyCalendarEntry>): Promise<DailyCalendarEntry> {
  // This function is deprecated in favor of using individual services
  // Return updated entry for backward compatibility
  console.warn('updateCalendarEntry is deprecated - use individual services instead');
  
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
  console.log('🧹 Clearing real calendar cache...');
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