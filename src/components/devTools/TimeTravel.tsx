"use client";

import React, { useState, useEffect } from 'react';
import { useTime } from '@/contexts/TimeContext';
import { useToast } from '@/contexts/ToastContext';

/**
 * TimeTravel Component - Development Tool for Testing Time-Sensitive Features
 * Allows developers to set mock dates and times for comprehensive testing
 */
const TimeTravel: React.FC = () => {
  const { setMockDateTime, isMockDate, timeData } = useTime();
  const toast = useToast();
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize inputs with current date/time on mount
  useEffect(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    setDateInput(currentDate);
    setTimeInput(currentTime);
  }, []);

  // Handle setting mock date
  const handleSetMockDate = async () => {
    if (!dateInput || !timeInput) {
      toast.showInfo('Please select both date and time');
      return;
    }

    // Validate year is 2025
    const selectedYear = new Date(dateInput).getFullYear();
    if (selectedYear !== 2025) {
      toast.showInfo('Date must be within the year 2025 for testing purposes');
      return;
    }

    try {
      setIsLoading(true);
      
      // Combine date and time into ISO-8601 format
      const combinedISOString = `${dateInput}T${timeInput}:00`;
      
      // Call the context function to set mock date
      await setMockDateTime(combinedISOString);
      
      console.log('🕰️ Mock date set successfully:', combinedISOString);
      
    } catch (error) {
      console.error('❌ Failed to set mock date:', error);
      toast.showError(`Failed to set mock date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resetting to real time
  const handleResetToRealTime = async () => {
    try {
      setIsLoading(true);
      
      // Call the context function to reset to real time
      await setMockDateTime(null);
      
      console.log('🔄 Reset to real time successfully');
      
    } catch (error) {
      console.error('❌ Failed to reset to real time:', error);
      toast.showError(`Failed to reset to real time: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format the current mock date for display
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
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
      <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
        🕰️ Time Travel (Development Mode)
      </h3>
      
      {/* Mock Date Warning */}
      {isMockDate() && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
              ⚠️ Mock date is active: {formatMockDateTime()}
            </span>
          </div>
        </div>
      )}

      {/* Date and Time Inputs */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Input */}
          <div>
            <label htmlFor="mock-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date (2025 only)
            </label>
            <input
              id="mock-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              min="2025-01-01"
              max="2025-12-31"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
          </div>

          {/* Time Input */}
          <div>
            <label htmlFor="mock-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <input
              id="mock-time"
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSetMockDate}
            disabled={isLoading || !dateInput || !timeInput}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 
                       dark:bg-purple-700 dark:hover:bg-purple-600 dark:disabled:bg-purple-800
                       text-white font-medium py-2 px-4 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                       disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? '⏳ Setting...' : '🚀 Set Mock Date'}
          </button>

          <button
            onClick={handleResetToRealTime}
            disabled={isLoading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 
                       dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800
                       text-white font-medium py-2 px-4 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                       disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? '⏳ Resetting...' : '🔄 Reset to Real Time'}
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            📋 Usage Instructions
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select any date within 2025 for testing time-sensitive features</li>
            <li>• Changes will propagate instantly across all components</li>
            <li>• Use "Reset to Real Time" to return to current system time</li>
            <li>• Perfect for testing habit streaks, date filters, and time-based logic</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TimeTravel; 