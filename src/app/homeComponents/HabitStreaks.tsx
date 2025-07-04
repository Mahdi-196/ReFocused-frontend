"use client";

import React, { useState, useEffect } from 'react';
import { getHabits, getHabitCompletions } from '@/services/habitsService';
import type { UserHabit, HabitCompletion } from '@/services/habitsService';
import { FireIcon, CheckIcon } from '@/components/icons';
import { timeService } from '@/services/timeService';
import { SkeletonWrapper, Skeleton } from '@/components/skeletons/SkeletonConfig';

const HabitStreaks = () => {
  const [pinnedHabits, setPinnedHabits] = useState<UserHabit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPinnedHabitsAndCompletions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current date for today's completions
        const today = timeService.getCurrentDate();
        
        // Load habits and today's completions in parallel
        const [allHabits, completions] = await Promise.all([
          getHabits(),
          getHabitCompletions(today, today)
        ]);
        
        // Filter for only pinned (favorite) habits
        const pinned = allHabits.filter(habit => habit.isFavorite);
        setPinnedHabits(pinned);
        
        // Build completion lookup map
        const completionMap: Record<string, boolean> = {};
        completions.forEach(completion => {
          const key = `${completion.habitId}-${completion.date}`;
          completionMap[key] = completion.completed;
        });
        setHabitCompletions(completionMap);
        
      } catch (err) {
        console.error('Failed to load pinned habits:', err);
        setError('Failed to load habits');
      } finally {
        setLoading(false);
      }
    };

    loadPinnedHabitsAndCompletions();
  }, []);

  const isHabitCompleted = (habitId: number): boolean => {
    const today = timeService.getCurrentDate();
    const completionKey = `${habitId}-${today}`;
    return habitCompletions[completionKey] || false;
  };

  const getHabitEmoji = (habitName: string) => {
    const name = habitName.toLowerCase();
    if (name.includes('meditat') || name.includes('mindful')) return '🧘';
    if (name.includes('exercise') || name.includes('workout') || name.includes('gym')) return '💪';
    if (name.includes('read') || name.includes('book')) return '📚';
    if (name.includes('water') || name.includes('hydrat')) return '💧';
    if (name.includes('sleep') || name.includes('rest')) return '😴';
    if (name.includes('walk') || name.includes('run')) return '🚶';
    if (name.includes('journal') || name.includes('write')) return '✍️';
    if (name.includes('code') || name.includes('program')) return '💻';
    if (name.includes('clean') || name.includes('tidy')) return '🧹';
    if (name.includes('study') || name.includes('learn')) return '📖';
    return '✅'; // Default emoji for other habits
  };

  if (loading) {
    return (
      <SkeletonWrapper>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton height={16} width={96} />
            <Skeleton height={16} width={64} />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton height={16} width={80} />
            <Skeleton height={16} width={64} />
          </div>
        </div>
      </SkeletonWrapper>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="text-red-400 text-sm text-center py-2">
          {error}
        </div>
      </div>
    );
  }

  if (pinnedHabits.length === 0) {
    return (
      <div className="mt-6">
        <div className="text-gray-400 text-sm text-center py-4">
          No pinned habits yet. Pin habits from the Track page to see them here!
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {pinnedHabits.map(habit => {
        const isCompleted = isHabitCompleted(habit.id);
        
        return (
          <div key={habit.id} className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-gray-300">
              <span>{getHabitEmoji(habit.name)}</span>
              <span className={isCompleted ? 'line-through text-gray-400' : ''}>{habit.name}</span>
              {isCompleted && <CheckIcon className="w-4 h-4" />}
            </span>
            <span className="text-gray-200 font-medium flex items-center gap-1">
              {habit.streak} {habit.streak === 1 ? 'day' : 'days'} <FireIcon className="w-4 h-4" />
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default HabitStreaks; 