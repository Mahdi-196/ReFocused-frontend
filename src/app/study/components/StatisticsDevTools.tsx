"use client";

import React, { useState, useEffect } from 'react';
import { statisticsService } from '@/services/statisticsService';
import { timeService } from '@/services/timeService';
import { useTime } from '@/contexts/TimeContext';

interface StatisticsDevToolsProps {
  onRefresh?: () => Promise<void>;
}

export default function StatisticsDevTools({ onRefresh }: StatisticsDevToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState('30');
  const [sessionsCount, setSessionsCount] = useState('1');
  const [tasksCount, setTasksCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const { setMockDateTime, isMockDate, timeData } = useTime();

  // Initialize inputs with current date/time
  useEffect(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    setDateInput(currentDate);
    setTimeInput(currentTime);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddFocusTime = async () => {
    setIsLoading(true);
    try {
      const minutes = parseInt(focusMinutes);
      
      if (isNaN(minutes) || minutes <= 0) {
        showMessage('Please enter a valid number of minutes', true);
        return;
      }
      
      await statisticsService.addFocusTime(minutes);
      showMessage(`Added ${minutes} minutes of focus time`);
    } catch (error) {
      console.error('Failed to add focus time:', error);
      showMessage('Failed to add focus time', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSessions = async () => {
    setIsLoading(true);
    try {
      const count = parseInt(sessionsCount);
      
      if (isNaN(count) || count <= 0) {
        showMessage('Please enter a valid number of sessions', true);
        return;
      }
      
      for (let i = 0; i < count; i++) {
        await statisticsService.incrementSessions();
      }
      
      showMessage(`Added ${count} session${count > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to add sessions:', error);
      showMessage('Failed to add sessions', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTasks = async () => {
    setIsLoading(true);
    try {
      const count = parseInt(tasksCount);
      
      if (isNaN(count) || count <= 0) {
        showMessage('Please enter a valid number of tasks', true);
        return;
      }
      
      for (let i = 0; i < count; i++) {
        await statisticsService.incrementTasksDone();
      }
      
      showMessage(`Added ${count} task${count > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to add tasks:', error);
      showMessage('Failed to add tasks', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMockDate = async () => {
    if (!dateInput || !timeInput) {
      showMessage('Please select both date and time', true);
      return;
    }

    try {
      setIsLoading(true);
      const combinedISOString = `${dateInput}T${timeInput}:00`;
      
      await setMockDateTime(combinedISOString);
      showMessage(`Mock date set to: ${combinedISOString}`);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to set mock date:', error);
      showMessage('Failed to set mock date', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMockDate = async () => {
    try {
      setIsLoading(true);
      await timeService.setMockDateTime(null);
      showMessage('Reset to real time');
      if (onRefresh) await onRefresh();
    } catch (error) {
      showMessage('Failed to reset mock date', true);
      console.error('Error resetting mock date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTimeSkip = async (type: 'day' | 'week' | 'month') => {
    try {
      setIsLoading(true);
      const currentDate = new Date(timeData?.user_current_datetime || new Date());
      
      switch (type) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
      
      await setMockDateTime(currentDate.toISOString());
      showMessage(`Skipped forward 1 ${type}`);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error(`Failed to skip ${type}:`, error);
      showMessage(`Failed to skip ${type}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMockDateTime = () => {
    if (!timeData?.user_current_datetime) return 'Unknown';
    
    try {
      const date = new Date(timeData.user_current_datetime);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return timeData.user_current_datetime;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">📊 Statistics Dev Tools</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Mock Date Status */}
      {isMockDate() && (
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <span className="text-amber-400 text-sm font-medium">
              ⚠️ Mock date active: {formatMockDateTime()}
            </span>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Statistics Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Focus Time */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">⏱️ Focus Time</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={focusMinutes}
                  onChange={(e) => setFocusMinutes(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm"
                  placeholder="Minutes"
                  min="1"
                />
                <button
                  onClick={handleAddFocusTime}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Sessions */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">🎯 Sessions</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sessionsCount}
                  onChange={(e) => setSessionsCount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm"
                  placeholder="Count"
                  min="1"
                />
                <button
                  onClick={handleAddSessions}
                  disabled={isLoading}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">✅ Tasks</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tasksCount}
                  onChange={(e) => setTasksCount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm"
                  placeholder="Count"
                  min="1"
                />
                <button
                  onClick={handleAddTasks}
                  disabled={isLoading}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Time Controls */}
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-white font-medium mb-3">🕰️ Time Controls</h4>
            
            {/* Manual Date/Time Set */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="px-3 py-2 bg-gray-600 text-white rounded text-sm"
              />
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="px-3 py-2 bg-gray-600 text-white rounded text-sm"
              />
              <button
                onClick={handleSetMockDate}
                disabled={isLoading}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded text-sm"
              >
                Set Date/Time
              </button>
            </div>

            {/* Quick Time Skip */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleQuickTimeSkip('day')}
                disabled={isLoading}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded text-sm"
              >
                +1 Day
              </button>
              <button
                onClick={() => handleQuickTimeSkip('week')}
                disabled={isLoading}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white rounded text-sm"
              >
                +1 Week
              </button>
              <button
                onClick={() => handleQuickTimeSkip('month')}
                disabled={isLoading}
                className="px-3 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white rounded text-sm"
              >
                +1 Month
              </button>
              <button
                onClick={handleResetMockDate}
                disabled={isLoading}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded text-sm"
              >
                Reset to Now
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className="bg-gray-700 border border-gray-500 rounded p-3">
              <div className="text-sm text-gray-300">
                {message}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}