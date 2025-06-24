import React from 'react';
import { TrackingStats as Stats } from '../types';

interface TrackingStatsProps {
  stats: Stats;
}

export default function TrackingStats({ stats }: TrackingStatsProps) {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">Best Streak</h3>
            <div className={`${stats.currentStreak > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
              {stats.currentStreak > 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"/>
                </svg>
              ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            <span className="text-gray-300 text-sm">day{stats.currentStreak !== 1 ? 's' : ''}</span>
            {stats.currentStreak > 0 && (
              <span className="text-orange-400 text-lg">🔥</span>
            )}
          </div>
        </div>

        {/* Habits Completed */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">Today's Progress</h3>
            <div className="text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
          <p className="text-2xl font-bold text-white">
            {stats.habitsCompleted.completed}/{stats.habitsCompleted.total}
          </p>
            {stats.habitsCompleted.total > 0 && (
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(stats.habitsCompleted.completed / stats.habitsCompleted.total) * 100}%` 
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Days Tracked */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">Days Tracked</h3>
            <div className="text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.daysTracked}</p>
        </div>

        {/* Last 30 Days */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">Last 30 Days</h3>
            <div className="text-yellow-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.monthlyCompletion}%</p>
        </div>
      </div>
    </section>
  );
} 