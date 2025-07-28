/**
 * Production Tracking Types
 * Timezone-aware habit and mood tracking interfaces
 */

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

export interface DailyEntry {
  date: string;
  happiness?: number;
  satisfaction?: number;
  stress?: number;
  dayRating?: number;
  habitCompletions?: {
    habitId: number;
    completed: boolean;
  }[];
}

export interface MoodEntry {
  id?: number;
  date: string;
  happiness?: number;
  focus?: number;
  stress?: number;
  dayRating?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SimpleFilter = 'all' | 'active' | 'inactive';

export interface TrackingStats {
  currentStreak: number;
  habitsCompleted: { completed: number; total: number };
  daysTracked: number;
  monthlyCompletion: number;
}

export interface CalendarDay {
  date: string;
  moodScore?: number;
  dayClass: string;
  hasData: boolean;
  habitCompletions?: number; // Number of habits completed
}

export interface DailyGoalActivity {
  goalId: number;
  goalName: string;
  activityType: 'created' | 'completed' | 'progress_update';
  activityTime?: Date;
  progressValue?: number;
  goalType?: string; // 'percentage' | 'counter' | 'checklist'
  targetValue?: number;
  notes?: string;
}

export interface Gratitude {
  id: number;
  text: string;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyCalendarEntry {
  id?: number;
  date: string; // ISO date string (YYYY-MM-DD)
  userId: number;
  habitCompletions: DailyHabitCompletion[];
  goalActivities: DailyGoalActivity[]; // Goal changes that happened on this day (now required)
  gratitudes: Gratitude[]; // Gratitudes recorded on this day (now required)
  moodEntry?: {
    happiness: number;
    focus: number; // Changed from satisfaction to focus for consistency
    stress: number;
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isLocked?: boolean; // Prevents modification of past entries
}

export interface DailyHabitCompletion {
  habitId: number;
  habitName: string; // Store name for historical reference
  completed: boolean;
  completedAt?: Date;
  wasActiveOnDate: boolean; // Was this habit active on this date
}

export interface CacheStats {
  size: number;
  maxSize: number;
  expired: number;
  hitRate: number;
  entries: { 
    key: string; 
    age: number; 
    ttl: number; 
    version: string | undefined; 
  }[];
}

export interface MoodData {
  happiness: number;
  focus: number;
  stress: number;
}

export interface DailyStats {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  happiness: number;
  focus: number;
  stress: number;
  moodScore: number;
} 