"use client";

import { useState } from 'react';
import { HiChartBar, HiFire } from 'react-icons/hi2';
import { useStreakData } from '@/hooks/useStreakData';

const StreakCircularProgress = ({ value, maxValue = 100 }: { value: number; maxValue?: number }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeDasharray = `${percentage * 2.76} 276`; // 2 * PI * 44 approx 276
  
  return (
    <div className="relative w-24 h-24 mb-2">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-gray-600"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="44"
          cx="50"
          cy="50"
        />
        <circle
          className={value > 0 ? "text-orange-400" : "text-gray-500"}
          strokeWidth="8"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="44"
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
};


const ProductivityScore = () => {
  const { streakData, loading, error, manualCheckin } = useStreakData();
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);

  const handleCheckin = async () => {
    try {
      setIsCheckinLoading(true);
      const result = await manualCheckin();
      
      // Show success feedback
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          message: `Streak maintained! Current streak: ${result.current_streak} days`
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          message: errorMessage
        }
      });
      window.dispatchEvent(event);
    } finally {
      setIsCheckinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-3">
        <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl font-semibold text-white flex items-center gap-2">
              <HiFire className="w-5 h-5 text-orange-400" />
              Daily Streak
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-2 bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-3">
        <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl font-semibold text-white flex items-center gap-2">
              <HiFire className="w-5 h-5 text-orange-400" />
              Daily Streak
            </span>
          </div>
          <div className="text-center text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    current_streak = 0,
    longest_streak = 0,
    today_interactions = 0,
    streak_at_risk = false,
    recent_history = []
  } = streakData || {};

  return (
    <div className="lg:col-span-3">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-semibold text-white flex items-center gap-2">
            <HiFire className="w-5 h-5 text-orange-400" />
            Daily Streak
          </span>
          {streak_at_risk && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
              ⚠️ At Risk
            </span>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <StreakCircularProgress value={current_streak} maxValue={Math.max(current_streak, longest_streak, 30)} />
          
          <div className="text-center mb-4">
            <p className="text-sm text-gray-300">
              Best: <span className="text-orange-400 font-semibold">{longest_streak}</span> days
            </p>
          </div>
          
          {today_interactions === 0 && (
            <button 
              onClick={handleCheckin}
              disabled={isCheckinLoading}
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckinLoading ? 'Checking in...' : 'Check In to Maintain Streak'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityScore; 