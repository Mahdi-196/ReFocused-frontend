"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Target, TrendingUp, Filter } from 'lucide-react';
import { 
  GoalHistoryEntry, 
  GoalsHistoryResponse, 
  GoalType, 
  GoalDuration,
  getDurationDisplayName 
} from '@/types/goal';
import { goalsService } from '@/services/goalsService';

interface GoalsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoalsHistoryModal: React.FC<GoalsHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<GoalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{
    type?: GoalType;
    duration?: GoalDuration;
    daysBack: number;
  }>({ daysBack: 90 });
  const [stats, setStats] = useState<{
    total_completed: number;
    avg_completion_days: number;
    completion_rate: number;
    by_type: Record<string, number>;
    by_duration: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadStats();
    }
  }, [isOpen, selectedFilter.daysBack, selectedFilter.type, selectedFilter.duration]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [GOALS_HISTORY] Loading history with filters:', {
        daysBack: selectedFilter.daysBack,
        type: selectedFilter.type,
        duration: selectedFilter.duration
      });
      
      const response = await goalsService.getGoalsHistory({
        days_back: selectedFilter.daysBack,
        goal_type: selectedFilter.type,
        duration: selectedFilter.duration,
        limit: 100
      });
      
      console.log('📋 [GOALS_HISTORY] Response received:', {
        goalsCount: response.goals.length,
        totalCount: response.total_count,
        dateRange: response.date_range,
        goals: response.goals
      });
      
      console.log('📋 [GOALS_HISTORY] Raw response object:', response);
      console.log('📋 [GOALS_HISTORY] Response.goals type:', typeof response.goals);
      console.log('📋 [GOALS_HISTORY] Response.goals is array:', Array.isArray(response.goals));
      console.log('📋 [GOALS_HISTORY] First goal sample:', response.goals[0]);
      
      setHistory(response.goals);
    } catch (error) {
      console.error('❌ [GOALS_HISTORY] Failed to load history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 [GOALS_STATS] Loading stats for days back:', selectedFilter.daysBack);
      const statsData = await goalsService.getCompletionStats(selectedFilter.daysBack);
      
      console.log('📊 [GOALS_STATS] Stats received:', {
        totalCompleted: statsData.total_completed,
        avgDays: statsData.avg_completion_days,
        completionRate: statsData.completion_rate,
        byType: statsData.by_type,
        byDuration: statsData.by_duration
      });
      
      setStats(statsData);
    } catch (error) {
      console.error('❌ [GOALS_STATS] Failed to load stats:', error);
    }
  };

  const handleClose = () => {
    setHistory([]);
    setStats(null);
    setError(null);
    onClose();
  };

  // Group goals by completion date with date validation
  const groupedHistory = history.reduce((groups, goal) => {
    try {
      console.log('🔍 [GROUPING] Processing goal:', {
        id: goal.id,
        name: goal.name,
        completed_at: goal.completed_at,
        completed_at_type: typeof goal.completed_at
      });
      
      // Handle null/undefined completed_at
      if (!goal.completed_at) {
        console.warn('🔍 [GROUPING] Goal has no completed_at:', goal.id, goal.name);
        return groups;
      }
      
      // Fix malformed ISO date string with both +00:00 and Z
      let cleanedDateString = goal.completed_at;
      if (cleanedDateString.includes('+00:00Z')) {
        cleanedDateString = cleanedDateString.replace('+00:00Z', 'Z');
        console.log('🔍 [GROUPING] Fixed malformed date:', goal.completed_at, '->', cleanedDateString);
      }
      
      // Validate and parse the date
      const completedDate = new Date(cleanedDateString);
      
      // Check if date is valid
      if (isNaN(completedDate.getTime())) {
        console.warn('🔍 [GROUPING] Invalid date found for goal:', goal.id, 'completed_at:', goal.completed_at);
        return groups;
      }
      
      const dateString = completedDate.toDateString();
      console.log('🔍 [GROUPING] Using date string:', dateString, 'for goal:', goal.id);
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(goal);
      
      console.log('🔍 [GROUPING] Added goal to group:', dateString, 'total in group:', groups[dateString].length);
    } catch (error) {
      console.error('🔍 [GROUPING] Error parsing date for goal:', goal.id, error);
    }
    return groups;
  }, {} as Record<string, GoalHistoryEntry[]>);

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  console.log('🔍 [SORTING] Grouped history keys:', Object.keys(groupedHistory));
  console.log('🔍 [SORTING] Sorted dates:', sortedDates);
  console.log('🔍 [SORTING] Total groups:', Object.keys(groupedHistory).length);
  console.log('🔍 [SORTING] History length:', history.length);

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'percentage': return '📊';
      case 'counter': return '🔢';
      case 'checklist': return '✅';
      default: return '🎯';
    }
  };

  const getCompletionBadgeColor = (days: number) => {
    if (days <= 3) return 'bg-green-600/20 text-green-400';
    if (days <= 7) return 'bg-blue-600/20 text-blue-400';
    if (days <= 14) return 'bg-yellow-600/20 text-yellow-400';
    return 'bg-purple-600/20 text-purple-400';
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Goals History</h2>
                    <p className="text-gray-400 text-sm">
                      Completed goals from the last {selectedFilter.daysBack} days
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>



              {/* Statistics Cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.total_completed}</span>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Avg Days</span>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.avg_completion_days.toFixed(1)}</span>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-400">Success Rate</span>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.completion_rate.toFixed(0)}%</span>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Filter className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400">Showing</span>
                    </div>
                    <span className="text-xl font-bold text-white">{history.length}</span>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                <select
                  value={selectedFilter.daysBack}
                  onChange={(e) => {
                    const newDaysBack = parseInt(e.target.value);
                    console.log('📅 [FILTER] Changing daysBack from', selectedFilter.daysBack, 'to', newDaysBack);
                    setSelectedFilter(prev => ({ ...prev, daysBack: newDaysBack }));
                  }}
                  className="px-3 py-1 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>

                <select
                  value={selectedFilter.type || ''}
                  onChange={(e) => {
                    const newType = e.target.value as GoalType || undefined;
                    console.log('🎯 [FILTER] Changing type from', selectedFilter.type, 'to', newType);
                    setSelectedFilter(prev => ({ 
                      ...prev, 
                      type: newType 
                    }));
                  }}
                  className="px-3 py-1 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All Types</option>
                  <option value="percentage">📊 Percentage</option>
                  <option value="counter">🔢 Counter</option>
                  <option value="checklist">✅ Checklist</option>
                </select>

                <select
                  value={selectedFilter.duration || ''}
                  onChange={(e) => {
                    const newDuration = e.target.value as GoalDuration || undefined;
                    console.log('⏱️ [FILTER] Changing duration from', selectedFilter.duration, 'to', newDuration);
                    setSelectedFilter(prev => ({ 
                      ...prev, 
                      duration: newDuration 
                    }));
                  }}
                  className="px-3 py-1 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All Durations</option>
                  <option value="2_week">2-Week Sprint</option>
                  <option value="long_term">Long-Term</option>
                </select>

                {/* Debug Button */}
                <button
                  onClick={() => {
                    console.log('🐛 [DEBUG] Current filter state:', selectedFilter);
                    console.log('🐛 [DEBUG] History length:', history.length);
                    console.log('🐛 [DEBUG] History data:', history);
                    console.log('🐛 [DEBUG] Stats:', stats);
                    console.log('🐛 [DEBUG] Grouped history:', groupedHistory);
                    console.log('🐛 [DEBUG] Sorted dates:', sortedDates);
                    console.log('🐛 [DEBUG] Loading state:', isLoading);
                    console.log('🐛 [DEBUG] Error state:', error);
                    
                    // Force reload
                    loadHistory();
                    loadStats();
                  }}
                  className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition-colors"
                >
                  🐛 Debug
                </button>

                {/* Raw API Test Button */}
                <button
                  onClick={async () => {
                    try {
                      console.log('🧪 [RAW_API_TEST] Testing direct API call...');
                      
                      // Get auth token
                      const token = localStorage.getItem('REF_TOKEN');
                      console.log('🧪 [RAW_API_TEST] Auth token:', token ? 'present' : 'missing');
                      
                      const url = 'http://localhost:8000/api/v1/goals/history?days_back=90&limit=100';
                      console.log('🧪 [RAW_API_TEST] Request URL:', url);
                      
                      const headers: HeadersInit = {
                        'Content-Type': 'application/json',
                      };
                      
                      if (token) {
                        headers.Authorization = `Bearer ${token}`;
                      }
                      
                      console.log('🧪 [RAW_API_TEST] Request headers:', headers);
                      
                      const response = await fetch(url, {
                        method: 'GET',
                        headers,
                        credentials: 'include'
                      });
                      
                      console.log('🧪 [RAW_API_TEST] Response status:', response.status);
                      console.log('🧪 [RAW_API_TEST] Response ok:', response.ok);
                      console.log('🧪 [RAW_API_TEST] Response headers:', Object.fromEntries(response.headers));
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('🧪 [RAW_API_TEST] Error response:', errorText);
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                      }
                      
                      const data = await response.json();
                      console.log('🧪 [RAW_API_TEST] Response data:', data);
                      console.log('🧪 [RAW_API_TEST] Goals array length:', data?.goals?.length || 'N/A');
                      
                      // Show alert with results
                      alert(`API Test Results:
Status: ${response.status}
Goals found: ${data?.goals?.length || 0}
Total count: ${data?.total_count || 0}
Date range: ${data?.date_range?.start || 'N/A'} to ${data?.date_range?.end || 'N/A'}

Check console for full details.`);
                      
                    } catch (error) {
                      console.error('🧪 [RAW_API_TEST] Error:', error);
                      alert(`API Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
                >
                  🧪 Test API
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[50vh]">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-300">Loading history...</span>
                </div>
              )}

              {error && (
                <div className="p-6">
                  <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button
                      onClick={loadHistory}
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {!isLoading && !error && history.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">No completed goals found</p>
                  <p className="text-gray-500 text-sm">
                    Complete some goals to see them appear in your history!
                  </p>
                </div>
              )}

              {!isLoading && !error && history.length > 0 && sortedDates.length === 0 && (
                <div className="p-6">
                  <div className="p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-sm mb-2">Debug: Goals found but not grouped properly</p>
                    <pre className="text-xs text-yellow-200 bg-yellow-900/20 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify({
                        historyLength: history.length,
                        sampleGoal: history[0],
                        groupedHistoryKeys: Object.keys(groupedHistory),
                        sortedDatesLength: sortedDates.length
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!isLoading && !error && sortedDates.length > 0 && (
                <div className="p-6 space-y-6">
                  {sortedDates.map(date => (
                    <div key={date} className="space-y-3">
                      {/* Date Header */}
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
                        <span className="text-sm font-medium text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
                          {(() => {
                            try {
                              // The date parameter here is already a dateString from toDateString(), so no need to fix format
                              const displayDate = new Date(date);
                              if (isNaN(displayDate.getTime())) {
                                return 'Invalid Date';
                              }
                              return displayDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            } catch (error) {
                              console.error('Error formatting date header:', date, error);
                              return 'Unknown Date';
                            }
                          })()}
                        </span>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
                      </div>

                      {/* Goals for this date */}
                      <div className="grid gap-3">
                        {groupedHistory[date].map(goal => (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium text-white">{goal.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">
                                      {getDurationDisplayName(goal.duration)}
                                    </span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-xs text-gray-400">
                                      Target: {goal.target_value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {(() => {
                                    try {
                                      // Fix malformed ISO date string with both +00:00 and Z
                                      let cleanedDateString = goal.completed_at;
                                      if (cleanedDateString.includes('+00:00Z')) {
                                        cleanedDateString = cleanedDateString.replace('+00:00Z', 'Z');
                                      }
                                      
                                      const completedDate = new Date(cleanedDateString);
                                      if (isNaN(completedDate.getTime())) {
                                        return 'Invalid time';
                                      }
                                      return completedDate.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      });
                                    } catch (error) {
                                      console.error('Error formatting time for goal:', goal.id, error);
                                      return 'Unknown time';
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GoalsHistoryModal; 