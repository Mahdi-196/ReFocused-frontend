"use client";

import { useState } from 'react';
import { useMonthlyProductivity } from '@/hooks/useMonthlyProductivity';
import { useStatistics } from '@/app/study/hooks/useStatistics';
import { useTrackingData } from '@/app/track/hooks/useTrackingData';
import { useCurrentDate } from '@/contexts/TimeContext';
import { statisticsService } from '@/services/statisticsService';

const ProductivityDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugMode, setDebugMode] = useState<'overview' | 'productivity' | 'statistics' | 'habits'>('overview');
  
  const currentDate = useCurrentDate();
  const currentMonth = new Date(currentDate);
  
  // Get all the data that ProductivityScore uses
  const { 
    currentScore, 
    metrics, 
    loading: productivityLoading,
    error: productivityError,
    refreshCurrentMonth 
  } = useMonthlyProductivity();
  
  const { 
    stats, 
    statsLoading,
    timeFilter,
    setTimeFilter 
  } = useStatistics();
  
  const { 
    calculateStats, 
    habits,
    refreshCache: refreshTrackingCache 
  } = useTrackingData(currentMonth);

  // Calculate the same values as ProductivityScore
  const habitStats = calculateStats();
  const productivityValue = currentScore?.score || 0;
  const tasksDone = stats.tasksDone || 0;
  const pomodoroSessions = stats.sessions || 0;
  const completedHabits = habitStats.habitsCompleted.completed || 0;
  const totalHabits = habitStats.habitsCompleted.total || 0;
  const skippedHabits = Math.max(0, totalHabits - completedHabits);
  
  const taskPoints = tasksDone * 1;
  const pomodoroPoints = pomodoroSessions * 2;
  const habitPenalty = skippedHabits * -1;
  const totalPoints = taskPoints + pomodoroPoints + habitPenalty;

  // Test functions
  const addTestTask = async () => {
    try {
      await statisticsService.incrementTasksDone();
      console.log('✅ Test task added');
    } catch (error) {
      console.error('❌ Failed to add test task:', error);
    }
  };

  const addTestPomodoro = async () => {
    try {
      await statisticsService.incrementSessions();
      await statisticsService.addFocusTime(25); // 25 minutes
      console.log('✅ Test pomodoro added');
    } catch (error) {
      console.error('❌ Failed to add test pomodoro:', error);
    }
  };

  const refreshAllData = async () => {
    console.log('🔄 Refreshing all data...');
    try {
      await Promise.all([
        refreshCurrentMonth(),
        refreshTrackingCache()
      ]);
      console.log('✅ All data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
        >
          🐛 Debug Panel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
      <div className="bg-yellow-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <span className="font-medium">🐛 Productivity Debug Panel</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        {/* Mode Selector */}
        <div className="flex gap-1 mb-4">
          {(['overview', 'productivity', 'statistics', 'habits'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDebugMode(mode)}
              className={`px-2 py-1 text-xs rounded ${
                debugMode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {debugMode === 'overview' && (
          <div className="space-y-3">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-white font-medium mb-2">Current Values</h4>
              <div className="text-sm space-y-1">
                <div className="text-gray-300">
                  Productivity Score: <span className="text-white font-medium">{Math.round(productivityValue)}</span>
                </div>
                <div className="text-gray-300">
                  Tasks Done: <span className="text-white font-medium">{tasksDone}</span>
                </div>
                <div className="text-gray-300">
                  Pomodoros: <span className="text-white font-medium">{pomodoroSessions}</span>
                </div>
                <div className="text-gray-300">
                  Habits: <span className="text-white font-medium">{completedHabits}/{totalHabits}</span>
                </div>
                <div className="text-gray-300">
                  Total Points: <span className="text-white font-medium">{totalPoints}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={addTestTask}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
              >
                ➕ Add Test Task
              </button>
              <button
                onClick={addTestPomodoro}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              >
                🍅 Add Test Pomodoro
              </button>
              <button
                onClick={refreshAllData}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
              >
                🔄 Refresh All Data
              </button>
            </div>
          </div>
        )}

        {/* Productivity Tab */}
        {debugMode === 'productivity' && (
          <div className="space-y-3">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-white font-medium mb-2">Monthly Productivity</h4>
              <div className="text-sm space-y-1">
                <div className="text-gray-300">
                  Loading: <span className="text-white">{productivityLoading.toString()}</span>
                </div>
                <div className="text-gray-300">
                  Error: <span className="text-white">{productivityError || 'None'}</span>
                </div>
                <div className="text-gray-300">
                  Score: <span className="text-white">{currentScore?.score || 'N/A'}</span>
                </div>
                <div className="text-gray-300">
                  Tier: <span className="text-white">{currentScore?.tier || 'N/A'}</span>
                </div>
              </div>
              {metrics && (
                <details className="mt-2">
                  <summary className="text-gray-400 cursor-pointer text-xs">Raw Metrics</summary>
                  <pre className="text-xs text-gray-300 mt-1 overflow-x-auto">
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {debugMode === 'statistics' && (
          <div className="space-y-3">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-white font-medium mb-2">Study Statistics</h4>
              <div className="text-sm space-y-1">
                <div className="text-gray-300">
                  Loading: <span className="text-white">{statsLoading.toString()}</span>
                </div>
                <div className="text-gray-300">
                  Time Filter: <span className="text-white">{timeFilter}</span>
                </div>
                <div className="text-gray-300">
                  Focus Time: <span className="text-white">{stats.focusTime} min</span>
                </div>
                <div className="text-gray-300">
                  Sessions: <span className="text-white">{stats.sessions}</span>
                </div>
                <div className="text-gray-300">
                  Tasks Done: <span className="text-white">{stats.tasksDone}</span>
                </div>
              </div>
              <div className="mt-2 space-x-1">
                {(['D', 'W', 'M'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2 py-1 text-xs rounded ${
                      timeFilter === filter 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {debugMode === 'habits' && (
          <div className="space-y-3">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-white font-medium mb-2">Habit Tracking</h4>
              <div className="text-sm space-y-1">
                <div className="text-gray-300">
                  Total Habits: <span className="text-white">{totalHabits}</span>
                </div>
                <div className="text-gray-300">
                  Completed Today: <span className="text-white">{completedHabits}</span>
                </div>
                <div className="text-gray-300">
                  Skipped Today: <span className="text-white">{skippedHabits}</span>
                </div>
                <div className="text-gray-300">
                  Current Streak: <span className="text-white">{habitStats.currentStreak}</span>
                </div>
                <div className="text-gray-300">
                  Monthly Completion: <span className="text-white">{habitStats.monthlyCompletion}%</span>
                </div>
              </div>
              {habits.length > 0 && (
                <details className="mt-2">
                  <summary className="text-gray-400 cursor-pointer text-xs">
                    Habits ({habits.length})
                  </summary>
                  <div className="text-xs text-gray-300 mt-1 max-h-32 overflow-y-auto">
                    {habits.map((habit) => (
                      <div key={habit.id} className="flex justify-between">
                        <span>{habit.name}</span>
                        <span>🔥{habit.streak}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Console Log Button */}
        <button
          onClick={() => {
            console.log('🐛 PRODUCTIVITY DEBUG DATA:', {
              productivityScore: productivityValue,
              currentScore,
              metrics,
              stats,
              habitStats,
              calculations: {
                taskPoints,
                pomodoroPoints,
                habitPenalty,
                totalPoints
              }
            });
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
        >
          📝 Log All Data to Console
        </button>
      </div>
    </div>
  );
};

export default ProductivityDebugPanel; 