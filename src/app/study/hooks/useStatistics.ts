"use client";

import { useState, useEffect } from 'react';
import { statisticsService } from "@/services/statisticsService";

export function useStatistics() {
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M'>('D');
  const [stats, setStats] = useState({
    focusTime: 0,
    sessions: 0,
    tasksDone: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load statistics based on selected time filter
  useEffect(() => {
    if (!isClient) return;
    
    const loadStatistics = async () => {
      setStatsLoading(true);
      try {
        console.log('🔄 [STUDY PAGE] Loading statistics for filter:', timeFilter);
        const filteredStats = await statisticsService.getFilteredStats(timeFilter);
        console.log('📊 [STUDY PAGE] Statistics loaded:', filteredStats);
        
        setStats({
          focusTime: filteredStats.focusTime,
          sessions: filteredStats.sessions,
          tasksDone: filteredStats.tasksDone
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
        setStats({
          focusTime: 0,
          sessions: 0,
          tasksDone: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadStatistics();
  }, [isClient, timeFilter]);

  // Listen for statistics updates
  useEffect(() => {
    if (!isClient) return;

    const handleStatisticsUpdate = async (event: CustomEvent) => {
      console.log('🔔 Statistics update event received:', event.detail);
      
      try {
        const filteredStats = await statisticsService.getFilteredStats(timeFilter);
        console.log('📊 [AUTO-REFRESH] Statistics reloaded after update:', filteredStats);
        
        setStats({
          focusTime: filteredStats.focusTime,
          sessions: filteredStats.sessions,
          tasksDone: filteredStats.tasksDone
        });
      } catch (error) {
        console.error('Failed to reload statistics after update:', error);
      }
    };

    window.addEventListener('statistics-updated', handleStatisticsUpdate);

    return () => {
      window.removeEventListener('statistics-updated', handleStatisticsUpdate);
    };
  }, [isClient, timeFilter]);

  return {
    timeFilter,
    setTimeFilter,
    stats,
    setStats,
    statsLoading,
    setStatsLoading
  };
} 