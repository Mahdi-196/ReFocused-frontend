import client from '@/api/client';
import { DASHBOARD } from '@/api/endpoints';
import { cacheService } from './cacheService';
import { timeService } from './timeService';

// Dashboard data interfaces
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
  notes?: string;
  focusTime?: number;
  tasks?: number;
  sessions?: number;
}

export interface DashboardStats {
  totalFocusTime: number;
  totalSessions: number;
  totalTasks: number;
  averageMood: number;
  habitStreak: number;
  weeklyGoalProgress: number;
}

export interface WeeklyData {
  week: string;
  focusTime: number;
  sessions: number;
  tasks: number;
  averageMood: number;
}

export interface MonthlyData {
  month: string;
  focusTime: number;
  sessions: number;
  tasks: number;
  averageMood: number;
  habitsCompleted: number;
}

// Cache configuration
const DASHBOARD_CACHE_PREFIX = 'dashboard';
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get daily entries for a specific month
 * Returns a map with date as key and DailyEntry as value
 */
export async function getDailyEntries(month: string): Promise<{[key: string]: DailyEntry}> {
  const cacheKey = `dashboard_entries_${month}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<{[key: string]: DailyEntry}>(cacheKey);
    if (cached) {
      console.log('📦 Returning cached dashboard entries for month:', month);
      return cached;
    }

    console.log('🔄 Fetching dashboard entries from API for month:', month);
    const response = await client.get(`/dashboard/entries?month=${month}`);
    
    const entries = response.data || {};
    
    // Cache the results
    cacheService.set(cacheKey, entries, 10 * 60 * 1000); // 10 minutes
    
    return entries;
  } catch (error) {
    console.warn('❌ Failed to fetch dashboard entries:', error);
    
    // Return empty object instead of crashing
    return {};
  }
}

/**
 * Get a single daily entry by date
 */
export async function getDailyEntry(date: string): Promise<DailyEntry | null> {
  const cacheKey = `${DASHBOARD_CACHE_PREFIX}_entry_${date}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<DailyEntry>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get(`/dashboard/entries/${date}`);
    
    const entry = response.data;
    
    // Cache the result
    if (entry) {
      cacheService.set(cacheKey, entry, DASHBOARD_CACHE_TTL);
    }
    
    return entry || null;
  } catch (error) {
    console.warn('Failed to fetch daily entry:', error);
    return null;
  }
}

/**
 * Create or update a daily entry
 */
export async function saveDailyEntry(entry: DailyEntry): Promise<DailyEntry> {
  try {
    const response = await client.post('/dashboard/entries', entry);
    
    const savedEntry = response.data;
    
    // Invalidate related cache entries
    const monthStr = entry.date.slice(0, 7); // YYYY-MM
    cacheService.invalidate(`${DASHBOARD_CACHE_PREFIX}_entries_${monthStr}`);
    cacheService.invalidate(`${DASHBOARD_CACHE_PREFIX}_entry_${entry.date}`);
    cacheService.invalidateByPattern(`${DASHBOARD_CACHE_PREFIX}_stats_*`);
    
    // Cache the new entry
    cacheService.set(`${DASHBOARD_CACHE_PREFIX}_entry_${entry.date}`, savedEntry, DASHBOARD_CACHE_TTL);
    
    return savedEntry;
  } catch (error) {
    console.error('Failed to save daily entry:', error);
    throw error;
  }
}

/**
 * Update an existing daily entry
 */
export async function updateDailyEntry(date: string, updates: Partial<DailyEntry>): Promise<DailyEntry> {
  try {
    const response = await client.put(`/dashboard/entries/${date}`, updates);
    
    const updatedEntry = response.data;
    
    // Invalidate related cache entries
    const monthStr = date.slice(0, 7); // YYYY-MM
    cacheService.invalidate(`${DASHBOARD_CACHE_PREFIX}_entries_${monthStr}`);
    cacheService.invalidate(`${DASHBOARD_CACHE_PREFIX}_entry_${date}`);
    cacheService.invalidateByPattern(`${DASHBOARD_CACHE_PREFIX}_stats_*`);
    
    // Cache the updated entry
    cacheService.set(`${DASHBOARD_CACHE_PREFIX}_entry_${date}`, updatedEntry, DASHBOARD_CACHE_TTL);
    
    return updatedEntry;
  } catch (error) {
    console.error('Failed to update daily entry:', error);
    throw error;
  }
}

/**
 * Get dashboard statistics for a date range
 */
export async function getDashboardStats(startDate: string, endDate: string): Promise<DashboardStats> {
  const cacheKey = `${DASHBOARD_CACHE_PREFIX}_stats_${startDate}_${endDate}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get('/dashboard/stats', {
      params: { startDate, endDate }
    });
    
    const stats = response.data || {
      totalFocusTime: 0,
      totalSessions: 0,
      totalTasks: 0,
      averageMood: 0,
      habitStreak: 0,
      weeklyGoalProgress: 0
    };
    
    // Cache the results
    cacheService.set(cacheKey, stats, DASHBOARD_CACHE_TTL);
    
    return stats;
  } catch (error) {
    console.warn('Failed to fetch dashboard stats:', error);
    
    // Return default stats as fallback
    return {
      totalFocusTime: 0,
      totalSessions: 0,
      totalTasks: 0,
      averageMood: 0,
      habitStreak: 0,
      weeklyGoalProgress: 0
    };
  }
}

/**
 * Get weekly dashboard data
 */
export async function getWeeklyData(weeks: number = 4): Promise<WeeklyData[]> {
  const cacheKey = `${DASHBOARD_CACHE_PREFIX}_weekly_${weeks}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<WeeklyData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get('/dashboard/weekly', {
      params: { weeks }
    });
    
    const weeklyData = response.data || [];
    
    // Cache the results
    cacheService.set(cacheKey, weeklyData, DASHBOARD_CACHE_TTL);
    
    return weeklyData;
  } catch (error) {
    console.warn('Failed to fetch weekly data:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get monthly dashboard data
 */
export async function getMonthlyData(months: number = 6): Promise<MonthlyData[]> {
  const cacheKey = `${DASHBOARD_CACHE_PREFIX}_monthly_${months}`;
  
  try {
    // Try to get from cache first
    const cached = cacheService.get<MonthlyData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await client.get('/dashboard/monthly', {
      params: { months }
    });
    
    const monthlyData = response.data || [];
    
    // Cache the results
    cacheService.set(cacheKey, monthlyData, DASHBOARD_CACHE_TTL);
    
    return monthlyData;
  } catch (error) {
    console.warn('Failed to fetch monthly data:', error);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get today's overview with current dashboard data
 */
export async function getTodayOverview(): Promise<{
  todayEntry: DailyEntry | null;
  stats: DashboardStats;
  recentTrends: {
    focusTimeChange: number;
    moodChange: number;
    habitsChange: number;
  };
}> {
  const today = timeService.getCurrentDate();
  const sevenDaysAgo = timeService.getRelativeDate(-7);
  
  try {
    const [todayEntry, stats] = await Promise.all([
      getDailyEntry(today),
      getDashboardStats(sevenDaysAgo, today)
    ]);
    
    // Calculate recent trends (mock data for now)
    const recentTrends = {
      focusTimeChange: 15, // +15%
      moodChange: 8,      // +8%
      habitsChange: -5    // -5%
    };
    
    return {
      todayEntry,
      stats,
      recentTrends
    };
  } catch (error) {
    console.warn('Failed to fetch today overview:', error);
    
    // Return fallback data
    return {
      todayEntry: null,
      stats: {
        totalFocusTime: 0,
        totalSessions: 0,
        totalTasks: 0,
        averageMood: 0,
        habitStreak: 0,
        weeklyGoalProgress: 0
      },
      recentTrends: {
        focusTimeChange: 0,
        moodChange: 0,
        habitsChange: 0
      }
    };
  }
}

/**
 * Refresh dashboard cache
 * Useful when major updates happen that affect multiple dashboard components
 */
export function refreshDashboardCache(): void {
  cacheService.invalidateByPattern(`${DASHBOARD_CACHE_PREFIX}_*`);
}

/**
 * Clear all dashboard-related cache entries
 */
export function clearDashboardCache(): void {
  cacheService.invalidateByPattern(`${DASHBOARD_CACHE_PREFIX}_*`);
} 