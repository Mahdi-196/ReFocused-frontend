"use client";

import { useState, useEffect } from 'react';
import { statisticsService } from "@/services/statisticsService";
import { useAuth } from '@/contexts/AuthContext';
import { useTime } from '@/contexts/TimeContext';

export function useStatistics() {
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M'>('D');
  const [stats, setStats] = useState({
    focusTime: 0,
    sessions: 0,
    tasksDone: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { timeData } = useTime();

  // Load statistics when filter, authentication, or timeData changes
  useEffect(() => {
    const loadStatistics = async () => {
      if (!isAuthenticated) {
        setStats({ focusTime: 0, sessions: 0, tasksDone: 0 });
        return;
      }

      // Wait for timeData to be available to avoid race condition
      if (!timeData?.user_current_datetime) {
        return;
      }

      setStatsLoading(true);
      try {
        // Always bypass cache for real-time statistics display
        const filteredStats = await statisticsService.getFilteredStats(timeFilter, true);
        setStats(filteredStats);
      } catch (error) {
        console.error('Failed to load statistics:', error);
        setStats({ focusTime: 0, sessions: 0, tasksDone: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadStatistics();
  }, [timeFilter, isAuthenticated, timeData?.user_current_datetime]);

  // Listen for statistics updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStatisticsUpdate = async () => {
      try {
        setStatsLoading(true);
        // Always bypass cache for real-time updates
        const filteredStats = await statisticsService.getFilteredStats(timeFilter, true);
        setStats(filteredStats);
      } catch (error) {
        console.error('Failed to update statistics:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    window.addEventListener('statisticsUpdated', handleStatisticsUpdate);
    return () => window.removeEventListener('statisticsUpdated', handleStatisticsUpdate);
  }, [timeFilter, isAuthenticated]);

  // Force refresh function - bypasses cache completely
  const forceRefresh = async () => {
    if (!isAuthenticated) return;

    setStatsLoading(true);
    try {
      // Use refreshStatistics which completely bypasses cache
      const refreshedStats = await statisticsService.refreshStatistics(timeFilter);
      setStats(refreshedStats);
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  return {
    timeFilter,
    setTimeFilter,
    stats,
    statsLoading,
    forceRefresh,
    isAuthenticated
  };
}