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
  date: string;
  happiness: number;
  satisfaction: number;
  stress: number;
  created_at?: string;
  updated_at?: string;
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