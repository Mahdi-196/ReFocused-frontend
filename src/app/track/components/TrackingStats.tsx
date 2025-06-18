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
            <h3 className="text-sm text-gray-300">Current Streak</h3>
            <div className="text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.currentStreak} days</p>
        </div>

        {/* Habits Completed */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">Habits Completed</h3>
            <div className="text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.habitsCompleted.completed}/{stats.habitsCompleted.total}
          </p>
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

        {/* This Month */}
        <div 
          className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-300">This Month</h3>
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