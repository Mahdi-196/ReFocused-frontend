"use client";

import React, { useState, useEffect } from 'react';
import { getTodaysMood } from '@/services/moodService';
import type { MoodEntry } from '@/services/moodService';
import { SkeletonWrapper, Skeleton } from '@/components/skeletons/SkeletonConfig';

const MoodStats = () => {
  const [moodData, setMoodData] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTodaysMood = async () => {
      try {
        setLoading(true);
        setError(null);
        const todaysMood = await getTodaysMood();
        setMoodData(todaysMood);
      } catch (err) {
        console.error('Failed to load today\'s mood data:', err);
        setError('Failed to load mood data');
      } finally {
        setLoading(false);
      }
    };

    loadTodaysMood();
  }, []);

  if (loading) {
    return (
      <SkeletonWrapper>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton height={16} width={64} />
            <Skeleton height={16} width={48} />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton height={16} width={48} />
            <Skeleton height={16} width={48} />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton height={16} width={64} />
            <Skeleton height={16} width={48} />
          </div>
        </div>
      </SkeletonWrapper>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-red-400 text-sm text-center py-2">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 font-medium text-sm tracking-wide">Happiness</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base tracking-normal">
            {moodData?.happiness ? `${moodData.happiness}/5` : '-/5'}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300 font-medium text-sm tracking-wide">Focus</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base tracking-normal">
            {moodData?.focus ? `${moodData.focus}/5` : '-/5'}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300 font-medium text-sm tracking-wide">Stress</span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base tracking-normal">
            {moodData?.stress ? `${moodData.stress}/5` : '-/5'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MoodStats; 