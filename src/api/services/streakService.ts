import client from '../client';
import { STREAK } from '../endpoints';
import { cacheService, CacheKeys } from '../../services/cacheService';

interface StreakStatusResponse {
  success: boolean;
  current_streak: number;
  longest_streak: number;
  today_interactions: number;
  today_interaction_types: string[];
  last_interaction_date: string;
  streak_at_risk: boolean;
  recent_history: Array<{
    date: string;
    has_interaction: boolean;
    interaction_count: number;
    interaction_types: string[];
  }>;
}

interface ManualCheckinResponse {
  success: boolean;
  message: string;
  current_streak: number;
  longest_streak: number;
  interaction_details: {
    interaction_recorded: boolean;
    daily_interaction_count: number;
    interaction_type: string;
    first_today: boolean;
    streak_updated: boolean;
    streak_continued: boolean;
    current_streak: number;
  };
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: Array<{
    user_id: number;
    name: string;
    current_streak: number;
    longest_streak: number;
  }>;
  user_rank: number;
  user_streak: number;
}

interface HistoryResponse {
  success: boolean;
  period_days: number;
  start_date: string;
  end_date: string;
  statistics: {
    total_active_days: number;
    total_interactions: number;
    consistency_rate: number;
    average_interactions_per_active_day: number;
    longest_streak_in_period: number;
  };
  daily_history: Array<{
    date: string;
    has_interaction: boolean;
    interaction_count: number;
    interaction_types: string[];
  }>;
}

interface InteractionTypesResponse {
  success: boolean;
  interaction_types: Array<{
    type: string;
    description: string;
    category: string;
  }>;
}

interface StatsResponse {
  success: boolean;
  all_time_stats: {
    total_active_days: number;
    total_interactions: number;
    average_interactions_per_day: number;
    first_active_date: string;
    last_active_date: string;
    days_since_start: number;
    overall_consistency_rate: number;
  };
  current_streaks: {
    current_streak: number;
    longest_streak: number;
    last_interaction_date: string;
  };
}

/**
 * Streak Service
 * Handles all streak-related API calls with caching and error handling
 */
export const streakService = {
  /**
   * Get current streak status with caching
   */
  async getStatus(): Promise<StreakStatusResponse> {
    try {
      // Check cache first (short TTL for real-time updates)
      const cacheKey = CacheKeys.STREAK_STATUS();
      const cached = cacheService.get(cacheKey) as StreakStatusResponse | null;
      if (cached) {
        return cached;
      }

      const response = await client.get<StreakStatusResponse>(STREAK.STATUS);
      
      // Cache for 5 minutes
      cacheService.set(cacheKey, response.data, 300);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.STATUS}]:`, error);
      
      // Try to return cached data even if API fails
      const cached = cacheService.get(CacheKeys.STREAK_STATUS()) as StreakStatusResponse | null;
      if (cached) {
        return cached;
      }
      
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch streak status.'
        : 'Failed to fetch streak status.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Perform manual check-in
   */
  async manualCheckin(): Promise<ManualCheckinResponse> {
    try {
      const response = await client.post<ManualCheckinResponse>(STREAK.MANUAL_CHECKIN);
      
      // Clear streak status cache to force refresh
      cacheService.delete(CacheKeys.STREAK_STATUS());
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.MANUAL_CHECKIN}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Check-in failed. Please try again.'
        : 'Check-in failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get streak leaderboard
   */
  async getLeaderboard(streakType: 'current' | 'longest' = 'current', limit: number = 10): Promise<LeaderboardResponse> {
    try {
      const cacheKey = `streak_leaderboard_${streakType}_${limit}`;
      const cached = cacheService.get(cacheKey) as LeaderboardResponse | null;
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({
        streak_type: streakType,
        limit: limit.toString()
      });
      
      const response = await client.get<LeaderboardResponse>(`${STREAK.LEADERBOARD}?${params}`);
      
      // Cache for 10 minutes
      cacheService.set(cacheKey, response.data, 600);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.LEADERBOARD}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch leaderboard.'
        : 'Failed to fetch leaderboard.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get streak history
   */
  async getHistory(days: number = 30): Promise<HistoryResponse> {
    try {
      const cacheKey = `streak_history_${days}`;
      const cached = cacheService.get(cacheKey) as HistoryResponse | null;
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({ days: days.toString() });
      const response = await client.get<HistoryResponse>(`${STREAK.HISTORY}?${params}`);
      
      // Cache for 15 minutes
      cacheService.set(cacheKey, response.data, 900);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.HISTORY}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch streak history.'
        : 'Failed to fetch streak history.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get available interaction types
   */
  async getInteractionTypes(): Promise<InteractionTypesResponse> {
    try {
      // Long cache since this rarely changes
      const cacheKey = 'streak_interaction_types';
      const cached = cacheService.get(cacheKey) as InteractionTypesResponse | null;
      if (cached) {
        return cached;
      }

      const response = await client.get<InteractionTypesResponse>(STREAK.INTERACTION_TYPES);
      
      // Cache for 1 hour
      cacheService.set(cacheKey, response.data, 3600);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.INTERACTION_TYPES}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch interaction types.'
        : 'Failed to fetch interaction types.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get comprehensive streak statistics
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const cacheKey = 'streak_comprehensive_stats';
      const cached = cacheService.get(cacheKey) as StatsResponse | null;
      if (cached) {
        return cached;
      }

      const response = await client.get<StatsResponse>(STREAK.STATS);
      
      // Cache for 10 minutes
      cacheService.set(cacheKey, response.data, 600);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STREAK.STATS}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch streak statistics.'
        : 'Failed to fetch streak statistics.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Clear streak-related cache
   */
  clearCache(): void {
    cacheService.delete(CacheKeys.STREAK_STATUS());
    
    // Clear other streak-related cache keys
    const keysToRemove = [
      'streak_leaderboard_current_10',
      'streak_leaderboard_longest_10',
      'streak_history_30',
      'streak_interaction_types',
      'streak_comprehensive_stats'
    ];
    
    keysToRemove.forEach(key => cacheService.delete(key));
    
    console.log('🧹 Cleared streak cache');
  }
};

// Add streak status to cache keys if not already present
declare module '../../services/cacheService' {
  interface CacheKeyMethods {
    STREAK_STATUS(): string;
  }
}