"use client";

import React from 'react';
import { statisticsService } from "@/services/statisticsService";

interface TestingSectionProps {
  showTesting: boolean;
  setShowTesting: (show: boolean) => void;
  timeFilter: 'D' | 'W' | 'M';
  setStats: (stats: { focusTime: number; sessions: number; tasksDone: number }) => void;
  setStatsLoading: (loading: boolean) => void;
}

export default function TestingSection({
  showTesting,
  setShowTesting,
  timeFilter,
  setStats,
  setStatsLoading
}: TestingSectionProps) {
  
  // Only render in development environment
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') {
    return null;
  }
  
  // Testing functions
  const refreshStats = async () => {
    try {
      console.log(`🔍 Getting filtered stats for timeFilter: ${timeFilter}`);
      const filteredStats = await statisticsService.refreshStatistics(timeFilter);
      console.log('📊 Filtered stats result:', filteredStats);
      setStats({
        focusTime: filteredStats.focusTime,
        sessions: filteredStats.sessions,
        tasksDone: filteredStats.tasksDone
      });
    } catch (error) {
      console.error('❌ Failed to refresh statistics:', error);
      setStats({ focusTime: 0, sessions: 0, tasksDone: 0 });
    }
  };

  const syncOfflineData = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [SYNC] Manually syncing offline data with backend...');
      const refreshedStats = await statisticsService.refreshStatistics(timeFilter);
      console.log('✅ [SYNC] Backend sync completed');
      setStats({
        focusTime: refreshedStats.focusTime,
        sessions: refreshedStats.sessions,
        tasksDone: refreshedStats.tasksDone
      });
    } catch (error) {
      console.error('❌ [SYNC] Failed to sync offline data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testAddFocusTime = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [TEST] Adding 25 minutes of focus time with filter:', timeFilter);
      const updatedStats = await statisticsService.addFocusTime(25, timeFilter);
      setStats(updatedStats);
      console.log('🎉 [TEST] Test completed! Check stats above for changes.');
    } catch (error) {
      console.error('❌ [TEST] Failed to add focus time:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testIncrementSessions = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [TEST] Adding 1 session with filter:', timeFilter);
      const updatedStats = await statisticsService.incrementSessions(timeFilter);
      setStats(updatedStats);
      console.log('🎉 [TEST] Test completed! Check stats above for changes.');
    } catch (error) {
      console.error('❌ [TEST] Failed to increment sessions:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testIncrementTasks = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [TEST] Adding 1 completed task with filter:', timeFilter);
      const updatedStats = await statisticsService.incrementTasksDone(timeFilter);
      setStats(updatedStats);
      console.log('🎉 [TEST] Test completed! Check stats above for changes.');
    } catch (error) {
      console.error('❌ [TEST] Failed to increment tasks:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testSimulateDay = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [TEST] Starting productive day simulation with filter:', timeFilter);
      
      await statisticsService.addFocusTime(100, timeFilter);
      for (let i = 0; i < 4; i++) {
        await statisticsService.incrementSessions(timeFilter);
      }
      for (let i = 0; i < 5; i++) {
        await statisticsService.incrementTasksDone(timeFilter);
      }
      
      await refreshStats();
      console.log('🎉 [TEST] Productive day simulation completed!');
    } catch (error) {
      console.error('❌ [TEST] Failed to simulate day:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testLocalStatsOnly = async () => {
    try {
      setStatsLoading(true);
      console.log('🔄 [LOCAL TEST] Testing local storage fallback...');
      
      await statisticsService.addFocusTime(50);
      await statisticsService.incrementSessions();
      await statisticsService.incrementSessions();
      await statisticsService.incrementTasksDone();
      await statisticsService.incrementTasksDone();
      const finalStats = await statisticsService.incrementTasksDone();
      
      setStats(finalStats);
      console.log('🎉 [LOCAL TEST] Local storage test completed!');
    } catch (error) {
      console.error('❌ [LOCAL TEST] Local storage test failed:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const clearLocalData = async () => {
    try {
      setStatsLoading(true);
      console.log('🗑️ [CLEAR] Clearing all statistics data...');
      await statisticsService.clearAllData();
      setStats({ focusTime: 0, sessions: 0, tasksDone: 0 });
      console.log('🎉 [CLEAR] Local data cleared and UI reset!');
    } catch (error) {
      console.error('❌ [CLEAR] Failed to clear local data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const viewLocalData = async () => {
    try {
      console.log('🔍 [VIEW] Inspecting local data comprehensively...');
      const debugInfo = await statisticsService.getDebugInfo();
      console.log('📊 [DEBUG] Service Debug Info:', debugInfo);
      
      const dailyStats = await statisticsService.getFilteredStats('D');
      const weeklyStats = await statisticsService.getFilteredStats('W');
      const monthlyStats = await statisticsService.getFilteredStats('M');
      
      console.log('📈 [VIEW] Current Statistics by Filter:');
      console.log('  📅 Daily Stats:', dailyStats);
      console.log('  📅 Weekly Stats:', weeklyStats);
      console.log('  📅 Monthly Stats:', monthlyStats);
      console.log('✅ [VIEW] Local data inspection completed!');
    } catch (error) {
      console.error('❌ [VIEW] Failed to view local data:', error);
    }
  };

  const debugDateTime = () => {
    console.log('🕐 [DEBUG] Date/Time Debugging Information');
    const now = new Date();
    console.log('📅 Current Date Object:', now);
    console.log('📅 ISO String:', now.toISOString());
    console.log('📅 Date Only:', now.toISOString().split('T')[0]);
  };

  // Additional test functions (implementing the rest from the original)
  const testBackendAPI = async () => {
    try {
      setStatsLoading(true);
      console.log('🔍 [API TEST] Testing backend API endpoints...');
      
      await statisticsService.addFocusTime(5);
      await statisticsService.incrementSessions();
      const finalStats = await statisticsService.incrementTasksDone();
      
      setStats(finalStats);
      console.log('🎉 [API TEST] All backend endpoints working correctly!');
    } catch (error) {
      console.error('❌ [API TEST] Backend API test failed:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const testCachingSystem = async () => {
    try {
      setStatsLoading(true);
      console.log('💾 [CACHE TEST] Testing caching system behavior...');
      
      await statisticsService.refreshStatistics(timeFilter);
      await statisticsService.getFilteredStats(timeFilter);
      await statisticsService.addFocusTime(5);
      const stats3 = await statisticsService.getFilteredStats(timeFilter);
      
      setStats(stats3);
      console.log('🎉 [CACHE TEST] Caching system test completed!');
    } catch (error) {
      console.error('❌ [CACHE TEST] Caching system test failed:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Quick test to add sample data
  const handleQuickTest = async () => {
    console.log('🚀 [QUICK TEST] Adding sample data for debugging...');
    setStatsLoading(true);
    
    try {
      // Add some sample data
      await statisticsService.addFocusTime(25);
      await statisticsService.incrementSessions();
      await statisticsService.incrementTasksDone();
      
      console.log('✅ [QUICK TEST] Sample data added successfully!');
      
      // Wait a moment then refresh stats
      setTimeout(async () => {
        const refreshedStats = await statisticsService.getFilteredStats(timeFilter);
        setStats(refreshedStats);
        console.log('📊 [QUICK TEST] Stats after sample data:', refreshedStats);
      }, 1000);
      
    } catch (error) {
      console.error('❌ [QUICK TEST] Failed to add sample data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Clear cache and refresh
  const handleClearCache = async () => {
    console.log('🗑️ [TEST] Clearing all cache and refreshing...');
    setStatsLoading(true);
    
    try {
      // Clear the statistics cache
      await statisticsService.clearAllData();
      
      // Wait a moment then refresh
      setTimeout(async () => {
        const refreshedStats = await statisticsService.getFilteredStats(timeFilter);
        setStats(refreshedStats);
        console.log('📊 [TEST] Stats after cache clear:', refreshedStats);
        setStatsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('❌ [TEST] Failed to clear cache:', error);
      setStatsLoading(false);
    }
  };

  // Reset API availability and refresh
  const handleResetAPI = async () => {
    console.log('🔄 [API RESET] Resetting API availability and refreshing...');
    setStatsLoading(true);
    
    try {
      // Clear ALL cache first
      await statisticsService.clearAllData();
      console.log('🗑️ [API RESET] Cache cleared');
      
      // Reset the API availability cache to force a fresh health check
      statisticsService.resetApiAvailability();
      console.log('🔄 [API RESET] API availability reset');
      
      // Wait a moment then refresh statistics
      setTimeout(async () => {
        const refreshedStats = await statisticsService.getFilteredStats(timeFilter);
        setStats(refreshedStats);
        console.log('📊 [API RESET] Stats after API reset:', refreshedStats);
        setStatsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ [API RESET] Failed to reset API:', error);
      setStatsLoading(false);
    }
  };

  // Direct API test (bypass all caching)
  const handleDirectAPITest = async () => {
    console.log('🔥 [DIRECT API] Testing API directly (bypass cache)...');
    setStatsLoading(true);
    
    try {
      // Import the direct API service
      const { statisticsApiService } = await import('@/api/services/statisticsService');
      
      // Get local date directly
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      console.log(`🔥 [DIRECT API] Querying for local date: ${localDate}`);
      
      // Call API directly without any caching
      const backendStats = await statisticsApiService.getStatistics(localDate, localDate);
      console.log(`🔥 [DIRECT API] Raw API response:`, backendStats);
      
      // Convert to display format
      const directStats = {
        focusTime: backendStats.focus_time || 0,
        sessions: backendStats.sessions || 0,
        tasksDone: backendStats.tasks_done || 0
      };
      
      setStats(directStats);
      console.log(`🔥 [DIRECT API] Converted stats:`, directStats);
      
    } catch (error) {
      console.error('❌ [DIRECT API] Failed to call API directly:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Statistics Testing</h2>
        <button
          onClick={() => setShowTesting(!showTesting)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {showTesting ? 'Hide Testing' : 'Show Testing'}
        </button>
      </div>

      {showTesting && (
        <div 
          className="rounded-lg p-6 shadow-md"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Test Buttons */}
            <button onClick={testAddFocusTime} className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add 25min Focus
            </button>

            <button onClick={testIncrementSessions} className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Add 1 Session
            </button>

            <button onClick={testIncrementTasks} className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Add 1 Task
            </button>

            <button onClick={testSimulateDay} className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Simulate Full Day
            </button>

            <button onClick={testLocalStatsOnly} className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Local Test
            </button>

            <button onClick={viewLocalData} className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Data
            </button>

            <button onClick={clearLocalData} className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Data
            </button>

            <button onClick={debugDateTime} className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Debug Date
            </button>

            <button onClick={testBackendAPI} className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Backend Debug
            </button>

            <button onClick={testCachingSystem} className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Caching System
            </button>

            <button onClick={syncOfflineData} className="flex items-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Offline Data
            </button>

            <button onClick={handleQuickTest} className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
              </svg>
              Quick Test
            </button>

            <button onClick={handleClearCache} className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
              </svg>
              Clear Cache
            </button>

            <button onClick={handleResetAPI} className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
              </svg>
              Reset API
            </button>

            <button onClick={handleDirectAPITest} className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Direct API Test
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Testing Instructions:</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li><strong>Add 25min Focus:</strong> Adds 25 minutes of focus time to today's record</li>
              <li><strong>Add 1 Session:</strong> Increments completed sessions count for today</li>
              <li><strong>Add 1 Task:</strong> Increments completed tasks count for today</li>
              <li><strong>Simulate Full Day:</strong> Adds 4 sessions, 100 minutes focus time, and 5 tasks</li>
              <li><strong>Local Test:</strong> Uses only local statistics service to verify fixes</li>
              <li><strong>View Data:</strong> Logs current localStorage data to browser console (F12)</li>
              <li><strong>Clear All Data:</strong> Removes all statistics data from localStorage</li>
              <li><strong>Debug Date:</strong> Logs current date calculations to identify date issues</li>
              <li><strong>Backend Debug:</strong> Tests API validation to see what the backend expects</li>
              <li><strong>Caching System:</strong> Tests the new caching system</li>
              <li><strong>Sync Offline Data:</strong> Manually syncs offline queue with backend</li>
              <li><strong>Quick Test:</strong> Adds sample data for debugging</li>
              <li><strong>Clear Cache:</strong> Clears the statistics cache and refreshes the data</li>
              <li><strong>Reset API:</strong> Resets the API availability cache and refreshes the data</li>
              <li><strong>Direct API Test:</strong> Bypasses all caching and calls the API directly</li>
            </ul>
            <p className="text-yellow-400 text-sm mt-3">
              💡 Try switching between Day/Week/Month filters to see how time-based filtering works!
            </p>
          </div>
        </div>
      )}
    </section>
  );
} 