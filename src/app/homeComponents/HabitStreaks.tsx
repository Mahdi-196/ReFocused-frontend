"use client";

import React, { useState, useEffect } from 'react';
import { getHabits, getHabitCompletions, clearHabitsCache } from '@/services/habitsService';
import type { UserHabit, HabitCompletion } from '@/services/habitsService';
import { FireIcon, CheckIcon } from '@/components/icons';
import { timeService } from '@/services/timeService';
import { SkeletonWrapper, Skeleton } from '@/components/skeletons/SkeletonConfig';
import { CacheInvalidation } from '@/services/cacheService';

const HabitStreaks = () => {
  const [pinnedHabits, setPinnedHabits] = useState<UserHabit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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
      
      // Store current user identifier for tracking user changes
      const userToken = localStorage.getItem('REF_TOKEN');
      setCurrentUser(userToken);
      
    } catch (err) {
      console.error('Failed to load pinned habits:', err);
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const clearUserData = () => {
    setPinnedHabits([]);
    setHabitCompletions({});
    setCurrentUser(null);
    setError(null);
  };

  useEffect(() => {
    // Initial load
    loadPinnedHabitsAndCompletions();

    // Listen for user logout events
    const handleUserLogout = () => {
      console.log('🔄 User logged out - clearing habit streaks data');
      clearUserData();
      // Cache will be cleared by auth service
    };

    // Listen for storage changes (user login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN') {
        const newToken = e.newValue;
        const oldToken = currentUser;
        
        // If token changed (user logged in/out or switched users)
        if (newToken !== oldToken) {
          console.log('🔄 User authentication changed - refreshing habit streaks');
          
          if (newToken) {
            // User logged in or switched - reload data
            loadPinnedHabitsAndCompletions();
          } else {
            // User logged out - clear data and cache
            clearUserData();
            CacheInvalidation.clearUserCache();
          }
        }
      }
    };

    // Listen for focus events (user might have logged in/out in another tab)
    const handleFocus = () => {
      const userToken = localStorage.getItem('REF_TOKEN');
      if (userToken !== currentUser) {
        console.log('🔄 User changed on focus - refreshing habit streaks');
        if (userToken) {
          loadPinnedHabitsAndCompletions();
        } else {
          clearUserData();
          CacheInvalidation.clearUserCache();
        }
      }
    };

    // Add event listeners
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

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