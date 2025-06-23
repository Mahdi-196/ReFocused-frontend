"use client";

import { useState, useEffect } from 'react';
import { statisticsService } from "@/services/statisticsService";
import { useAuth } from '@/contexts/AuthContext';

export function useStatistics() {
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M'>('D');
  const [stats, setStats] = useState({
    focusTime: 0,
    sessions: 0,
    tasksDone: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
        console.log('🔐 [AUTH] User authenticated:', isAuthenticated, 'User:', user?.email);
        
        // Check authentication first
        if (!isAuthenticated) {
          console.warn('⚠️ [AUTH] User not authenticated, using fallback data');
          setStats({
            focusTime: 0,
            sessions: 0,
            tasksDone: 0
          });
          return;
        }

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
  }, [isClient, timeFilter, isAuthenticated, user]);

  // Listen for statistics updates (enhanced to support all filter auto-refresh)
  useEffect(() => {
    if (!isClient) return;

    const handleStatisticsUpdate = async () => {
      console.log('🔔 [AUTO-REFRESH] Statistics update event received, refreshing with filter:', timeFilter);
      
      // Don't reload if user is not authenticated
      if (!isAuthenticated) {
        console.warn('⚠️ [AUTO-REFRESH] Skipping update - user not authenticated');
        return;
      }
      
      try {
        setStatsLoading(true);
        const filteredStats = await statisticsService.getFilteredStats(timeFilter);
        console.log('📊 [AUTO-REFRESH] Statistics reloaded after update with filter', timeFilter, ':', filteredStats);
        
        setStats({
          focusTime: filteredStats.focusTime,
          sessions: filteredStats.sessions,
          tasksDone: filteredStats.tasksDone
        });
      } catch (error) {
        console.error('❌ [AUTO-REFRESH] Failed to reload statistics after update:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    // Listen to general update event and specific filter events
    window.addEventListener('statisticsUpdated', handleStatisticsUpdate);
    
    // Also listen to specific filter events for better performance in the future
    const filterEventName = `statisticsUpdated:${timeFilter === 'D' ? 'daily' : timeFilter === 'W' ? 'weekly' : 'monthly'}`;
    window.addEventListener(filterEventName, handleStatisticsUpdate);

    return () => {
      window.removeEventListener('statisticsUpdated', handleStatisticsUpdate);
      window.removeEventListener(filterEventName, handleStatisticsUpdate);
    };
  }, [isClient, timeFilter, isAuthenticated]);

  // Force refresh function for manual reload
  const forceRefresh = async () => {
    if (!isAuthenticated) {
      console.warn('⚠️ [REFRESH] Cannot refresh - user not authenticated');
      return;
    }

    setStatsLoading(true);
    try {
      console.log('🔄 [MANUAL REFRESH] Force refreshing statistics...');
      const refreshedStats = await statisticsService.refreshStatistics(timeFilter);
      console.log('📊 [MANUAL REFRESH] Statistics refreshed:', refreshedStats);
      
      setStats({
        focusTime: refreshedStats.focusTime,
        sessions: refreshedStats.sessions,
        tasksDone: refreshedStats.tasksDone
      });
    } catch (error) {
      console.error('Failed to force refresh statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  return {
    timeFilter,
    setTimeFilter,
    stats,
    setStats,
    statsLoading,
    setStatsLoading,
    forceRefresh,
    isAuthenticated
  };
}