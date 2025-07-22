import { useState, useEffect, useCallback } from 'react';
import { streakService } from '@/api/services/streakService';

interface StreakData {
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

interface UseStreakDataReturn {
  streakData: StreakData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  manualCheckin: () => Promise<{ success: boolean; message: string; current_streak: number }>;
}

/**
 * React hook for managing streak data
 * Provides streak status, manual check-in functionality, and real-time updates
 */
export const useStreakData = (): UseStreakDataReturn => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreakData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await streakService.getStatus();
      
      if (response.success) {
        setStreakData({
          current_streak: response.current_streak,
          longest_streak: response.longest_streak,
          today_interactions: response.today_interactions,
          today_interaction_types: response.today_interaction_types,
          last_interaction_date: response.last_interaction_date,
          streak_at_risk: response.streak_at_risk,
          recent_history: response.recent_history,
        });
      } else {
        throw new Error('Failed to fetch streak data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching streak data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const manualCheckin = useCallback(async () => {
    try {
      const response = await streakService.manualCheckin();
      
      if (response.success) {
        // Update local state with new streak data
        setStreakData(prev => prev ? {
          ...prev,
          current_streak: response.current_streak,
          longest_streak: response.longest_streak,
          today_interactions: prev.today_interactions + 1,
          today_interaction_types: [...prev.today_interaction_types, 'manual_checkin'],
          streak_at_risk: false // Manual check-in removes risk
        } : null);

        return {
          success: true,
          message: response.message,
          current_streak: response.current_streak
        };
      } else {
        throw new Error(response.message || 'Check-in failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      throw new Error(errorMessage);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Listen for data changes from other parts of the app
  useEffect(() => {
    const handleStreakUpdate = () => {
      fetchStreakData();
    };

    const handleUserActivity = () => {
      // Refresh streak data when user performs tracked activities
      setTimeout(fetchStreakData, 1000); // Small delay to ensure backend processing
    };

    // Listen for custom events
    window.addEventListener('streakUpdated', handleStreakUpdate);
    window.addEventListener('userActivity', handleUserActivity);

    return () => {
      window.removeEventListener('streakUpdated', handleStreakUpdate);
      window.removeEventListener('userActivity', handleUserActivity);
    };
  }, [fetchStreakData]);

  // Auto-refresh streak data periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStreakData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, fetchStreakData]);

  return {
    streakData,
    loading,
    error,
    refetch: fetchStreakData,
    manualCheckin,
  };
};

export default useStreakData;