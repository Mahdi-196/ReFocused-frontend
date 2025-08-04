"use client";

import React from 'react';

interface StatisticsSectionProps {
  timeFilter: 'D' | 'W' | 'M';
  stats: {
    focusTime: number;
    sessions: number;
    tasksDone: number;
  };
  statsLoading: boolean;
  onTimeFilterChange: (filter: 'D' | 'W' | 'M') => void;
}

export default function StatisticsSection({
  timeFilter,
  stats,
  statsLoading,
  onTimeFilterChange,
}: StatisticsSectionProps) {
  // Helper function to format focus time
  const formatFocusTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );


  return (
    <section>
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-4">
      {/* Time Period Toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button 
            onClick={() => onTimeFilterChange('D')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeFilter === 'D' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
            }`}
          >
            D
          </button>
          <button 
            onClick={() => onTimeFilterChange('W')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeFilter === 'W' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
            }`}
          >
            W
          </button>
          <button 
            onClick={() => onTimeFilterChange('M')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeFilter === 'M' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-600'
            }`}
          >
            M
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focus Time Card */}
        <div 
          className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="text-blue-600 mb-2">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm text-gray-300 mb-1">Focus Time</h4>
          {statsLoading ? (
            <LoadingSpinner />
          ) : (
            <p className="text-2xl font-bold text-white">{formatFocusTime(stats.focusTime)}</p>
          )}
        </div>

        {/* Sessions Card */}
        <div 
          className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="text-blue-600 mb-2">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h4 className="text-sm text-gray-300 mb-1">Sessions</h4>
          {statsLoading ? (
            <LoadingSpinner />
          ) : (
            <p className="text-2xl font-bold text-white">{stats.sessions}</p>
          )}
        </div>

        {/* Tasks Done Card */}
        <div 
          className="shadow-md rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="text-blue-600 mb-2">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h4 className="text-sm text-gray-300 mb-1">Tasks Done</h4>
          {statsLoading ? (
            <LoadingSpinner />
          ) : (
            <p className="text-2xl font-bold text-white">{stats.tasksDone}</p>
          )}
        </div>
      </div>
    </section>
  );
} 