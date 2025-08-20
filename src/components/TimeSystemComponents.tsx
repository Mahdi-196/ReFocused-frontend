/**
 * Example Components demonstrating proper Time System usage
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useTime, useCurrentDate, useDateFormatting, useTimezone } from '@/contexts/TimeContext';
import type { TimezoneInfo, WeekInfo } from '@/types/time';

/**
 * Time Status Display - Shows current time info and sync status
 */
export const TimeStatusDisplay: React.FC = () => {
  const { 
    timeData, 
    loading, 
    error, 
    isMockDate, 
    syncTime, 
    checkSyncStatus,
    getServiceState 
  } = useTime();

  const [syncStatus, setSyncStatus] = useState<string>('Unknown');

  useEffect(() => {
    const checkSync = async () => {
      const status = await checkSyncStatus();
      setSyncStatus(status?.is_synchronized ? 'Synced' : 'Out of sync');
    };
    
    checkSync();
  }, [checkSyncStatus, timeData]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="text-sm text-blue-600">🕰️ Synchronizing time...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-sm text-red-700 mb-2">❌ Time service error: {error}</div>
        <button 
          onClick={syncTime}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${
      isMockDate() ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
    }`}>
      <div className="text-sm space-y-1">
        <div className="font-medium flex items-center gap-2">
          🕰️ Time Status
          <span className={`px-2 py-1 rounded text-xs ${
            syncStatus === 'Synced' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {syncStatus}
          </span>
        </div>
        
        <div>📅 Date: <span className="font-mono">{timeData?.user_current_date}</span></div>
        <div>🌍 Timezone: <span className="font-mono">{timeData?.user_timezone}</span></div>
        <div>📊 Day: {timeData?.day_of_week} (Week {timeData?.week_number})</div>
        
        {isMockDate() && (
          <div className="text-yellow-700 font-medium">
            ⚠️ Using mock date for testing
          </div>
        )}
        
        <button 
          onClick={syncTime}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mt-2"
        >
          🔄 Force Sync
        </button>
      </div>
    </div>
  );
};

/**
 * Habit Tracker Component - Demonstrates proper date usage for habits
 */
interface HabitTrackerProps {
  habitId: number;
  habitName: string;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habitId, habitName }) => {
  const { getCurrentDate, timeData } = useTime();
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const markComplete = async () => {
    try {
      setLoading(true);
      
      // ✅ Always use backend date for habit operations
      const completionDate = getCurrentDate();
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.error('Missing NEXT_PUBLIC_BACKEND_URL');
        return;
      }
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/habits/${habitId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          completed_date: completionDate
        })
      });

      if (response.ok) {
        setIsCompleted(true);
        console.log(`✅ Habit ${habitId} marked complete for ${completionDate}`);
      }
    } catch (error) {
      console.error('Failed to mark habit complete:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{habitName}</h3>
          <p className="text-sm text-gray-600">
            Today: {timeData?.user_current_date} ({timeData?.day_of_week})
          </p>
          <p className="text-xs text-gray-500">
            Timezone: {timeData?.user_timezone}
          </p>
        </div>
        
        <button
          onClick={markComplete}
          disabled={loading || isCompleted}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isCompleted 
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? '⏳ Saving...' : isCompleted ? '✅ Completed' : '📝 Mark Complete'}
        </button>
      </div>
    </div>
  );
};

/**
 * Date Range Picker - Shows how to get date ranges for analytics
 */
export const DateRangePicker: React.FC = () => {
  const { getDateRange, timeData } = useTime();
  const [selectedFilter, setSelectedFilter] = useState<'D' | 'W' | 'M'>('D');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    const range = getDateRange(selectedFilter);
    setDateRange(range);
  }, [selectedFilter, getDateRange, timeData]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium mb-3">📊 Analytics Date Range</h3>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          {(['D', 'W', 'M'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded text-sm ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'D' ? 'Daily' : filter === 'W' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
        
        <div className="text-sm">
          <div>📅 Start: <span className="font-mono">{dateRange.start}</span></div>
          <div>📅 End: <span className="font-mono">{dateRange.end}</span></div>
        </div>
        
        <div className="text-xs text-gray-500">
          Uses backend time: {timeData?.user_current_date} ({timeData?.user_timezone})
        </div>
      </div>
    </div>
  );
};

/**
 * Timezone Selector - Allows users to change their timezone
 */
export const TimezoneSelector: React.FC = () => {
  const toast = useToast();
  const { 
    getUserTimezone, 
    detectAndSetTimezone, 
    updateUserTimezone, 
    getAvailableTimezones 
  } = useTimezone();
  
  const [timezones, setTimezones] = useState<TimezoneInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getUserTimezone());

  useEffect(() => {
    const loadTimezones = async () => {
      const availableTimezones = await getAvailableTimezones();
      setTimezones(availableTimezones);
    };
    
    loadTimezones();
    setSelectedTimezone(getUserTimezone());
  }, [getAvailableTimezones, getUserTimezone]);

  const handleAutoDetect = async () => {
    setLoading(true);
    const success = await detectAndSetTimezone();
    
    if (success) {
      setSelectedTimezone(getUserTimezone());
      toast.showSuccess('Timezone auto-detected and updated!');
    } else {
      toast.showError('Failed to auto-detect timezone');
    }
    
    setLoading(false);
  };

  const handleManualUpdate = async () => {
    if (selectedTimezone === getUserTimezone()) return;
    
    setLoading(true);
    const success = await updateUserTimezone(selectedTimezone);
    
    if (success) {
      toast.showSuccess('Timezone updated successfully!');
    } else {
      toast.showError('Failed to update timezone');
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium mb-3">🌍 Timezone Settings</h3>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-600 mb-1">Current Timezone:</div>
          <div className="font-mono text-sm">{getUserTimezone()}</div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={loading}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            🔍 Auto-Detect
          </button>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">Manual Selection:</label>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            disabled={loading}
          >
            {timezones.map((tz) => (
              <option key={tz.name} value={tz.name}>
                {tz.display_name} ({tz.offset})
              </option>
            ))}
          </select>
          
          {selectedTimezone !== getUserTimezone() && (
            <button
              onClick={handleManualUpdate}
              disabled={loading}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              💾 Update Timezone
            </button>
          )}
        </div>
        
        {loading && (
          <div className="text-sm text-gray-600">⏳ Updating timezone...</div>
        )}
      </div>
    </div>
  );
};

/**
 * Date Formatter Demo - Shows different date formatting options
 */
export const DateFormatterDemo: React.FC = () => {
  const { formatUserDate, formatRelativeDate } = useDateFormatting();
  const currentDate = useCurrentDate();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium mb-3">📅 Date Formatting Examples</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Raw date:</span> 
          <span className="font-mono ml-2">{currentDate}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Formatted:</span> 
          <span className="ml-2">{formatUserDate(currentDate)}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Short format:</span> 
          <span className="ml-2">{formatUserDate(currentDate, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Relative (today):</span> 
          <span className="ml-2">{formatRelativeDate(currentDate)}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Relative (yesterday):</span> 
          <span className="ml-2">{formatRelativeDate(yesterdayStr)}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Relative (tomorrow):</span> 
          <span className="ml-2">{formatRelativeDate(tomorrowStr)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Week Info Display - Shows week-related information
 */
export const WeekInfoDisplay: React.FC = () => {
  const { getWeekInfo } = useTime();
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadWeekInfo = async () => {
      setLoading(true);
      const info = await getWeekInfo();
      setWeekInfo(info);
      setLoading(false);
    };
    
    loadWeekInfo();
  }, [getWeekInfo]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse text-sm text-gray-600">Loading week info...</div>
      </div>
    );
  }

  if (!weekInfo) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-sm text-red-700">Failed to load week information</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium mb-3">📅 Week Information</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Week #{weekInfo.week_number}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Start:</span> 
          <span className="font-mono ml-2">{weekInfo.week_start}</span>
        </div>
        
        <div>
          <span className="text-gray-600">End:</span> 
          <span className="font-mono ml-2">{weekInfo.week_end}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Days in week:</span>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {weekInfo.days_in_week.map((day, index) => (
              <div 
                key={day}
                className="text-center py-1 px-2 bg-gray-100 rounded text-xs font-mono"
              >
                {day.split('-')[2]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get auth token (replace with your auth system)
function getToken(): string {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('auth_token') || '';
} 