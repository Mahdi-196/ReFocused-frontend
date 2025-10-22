"use client";

import { useState, useEffect, useRef } from 'react';
import { useCurrentDate } from '@/contexts/TimeContext';
import { perAccountDailyStorage, getTodayDateString, migrateLegacyDateKeyToScoped, migrateLegacyUserDateKeyToScoped, cleanupOldDateEntries } from '@/utils/scopedStorage';
import PageTransition from '@/components/PageTransition';
import logger from '@/utils/logger';

import { HomePageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Import components directly for faster loading (no lazy loading)
import DailyMomentum from '../homeComponents/DailyMomentum';
import QuoteOfTheDay from '../../components/QuoteOfTheDay';
import WordOfTheDay from '../homeComponents/WordOfTheDay';
import GoalTracker from '../homeComponents/GoalTracker';
import MindFuel from '../homeComponents/MindFuel';
import ProductivityScore from '../homeComponents/ProductivityScore';

// Removed ApiTestingBox

import { Task } from '../homeComponents/TaskList';

// Helper functions for local storage
const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    const userString = localStorage.getItem('REF_USER');
    if (userString) {
      const user = JSON.parse(userString);
      return user.id?.toString() || '';
    }
    return '';
  } catch {
    return '';
  }
};

const getTodayDate = (): string => getTodayDateString();

const logTasks = (message: string, data?: unknown) => {
  logger.debug(message, data, 'TASKS');
};

const TASKS_BASE_KEY = 'refocused_tasks';

const loadTasksForDate = (date: string): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Primary: per-account daily key
    const saved = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY, date);
    if (saved && Array.isArray(saved)) return saved;

    // Migration 1: from legacy date-only (pre-account) key
    migrateLegacyDateKeyToScoped(TASKS_BASE_KEY, date);
    const migrated1 = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY, date);
    if (migrated1 && Array.isArray(migrated1)) return migrated1;

    // Migration 2: from legacy per-user key pattern refocused_tasks_${userId}_${date}
    const userId = getUserId();
    if (userId) {
      migrateLegacyUserDateKeyToScoped(TASKS_BASE_KEY, userId, date);
      const migrated2 = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY, date);
      if (migrated2 && Array.isArray(migrated2)) return migrated2;
    }

    logTasks('loadTodayTasks:empty');
    return [];
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return [];
  }
};

const saveTasksForDate = (date: string, tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    perAccountDailyStorage.setJSON<Task[]>(TASKS_BASE_KEY, tasks, date);
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

const cleanupOldTasks = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep last 7 days of tasks for current account; remove older
    cleanupOldDateEntries(TASKS_BASE_KEY, 7);
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
  }
};

// No-op: user-specific migration is no longer needed; tasks are shared by date

const Home = () => {
  const userDate = useCurrentDate();
  const [newTask, setNewTask] = useState('');
  // Initialize tasks with saved data to prevent flash
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Use getTodayDateString() directly since we can't call hooks in initializer
    const initialDate = getTodayDateString();
    const savedTasks = loadTasksForDate(initialDate);
    logTasks('initial:loaded', { length: savedTasks.length, date: initialDate });
    return savedTasks;
  });
  const isFirstTasksEffect = useRef(true);
  const hasHydratedRef = useRef(false);
  const hydrationGuardActiveRef = useRef(true);
  // Removed progressive loading; page renders as a whole after skeleton delay

  // No per-user clearing; tasks are shared per day

  // Re-load tasks when userDate changes
  useEffect(() => {
    const savedTasks = loadTasksForDate(userDate);
    logTasks('mount:loaded', { length: savedTasks.length });
    setTasks(savedTasks);
    // Defer hydration readiness to next tick to avoid clobbering storage with []
    setTimeout(() => {
      hasHydratedRef.current = true;
    }, 0);
    // Disable the clobber guard shortly after mount
    setTimeout(() => {
      hydrationGuardActiveRef.current = false;
    }, 500);

    // Clean up old task entries to keep localStorage tidy
    cleanupOldTasks();
  }, [userDate]);
  

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    // Skip the very first run to avoid wiping storage with an empty array
    if (isFirstTasksEffect.current) {
      isFirstTasksEffect.current = false;
      logTasks('effect:skip-initial');
      return;
    }
    // Also skip until we've hydrated from storage (handles React StrictMode double-invoke)
    if (!hasHydratedRef.current) {
      logTasks('effect:skip-unhydrated');
      return;
    }
    // Prevent clobbering existing saved tasks with [] during initial hydration only
    if (hydrationGuardActiveRef.current) {
      try {
        const existing = loadTasksForDate(userDate);
        if (tasks.length === 0 && existing.length > 0) {
          logTasks('effect:skip-prevent-clobber', { existingLen: existing.length });
          return;
        }
      } catch {}
    }
    // Always persist to today's key after any subsequent state update
    logTasks('effect:save', { length: tasks.length });
    saveTasksForDate(userDate, tasks);
  }, [tasks, userDate]);

  // Save immediately before page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      logTasks('beforeunload:save', { length: tasks.length });
      saveTasksForDate(userDate, tasks);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tasks, userDate]);

  // No manual dayChanged listener needed; tasks reload when userDate changes

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.length < 3 && newTask.trim()) {
      logTasks('addTask', { text: newTask.trim() });
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (taskId: number) => {
    logTasks('deleteTask', { id: taskId });
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <PageTransition>
      <main className="container mx-auto p-6 max-w-7xl">
        <h1 className="sr-only">ReFocused Dashboard - Daily Productivity and Mindfulness</h1>
        <SkeletonDemo skeleton={<HomePageSkeleton />} enabled={false}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DailyMomentum
              tasks={tasks}
              newTask={newTask}
              setNewTask={setNewTask}
              handleAddTask={handleAddTask}
              handleDeleteTask={handleDeleteTask}
              setTasks={setTasks}
            />

            <div className="lg:col-span-1">
              <div className="flex flex-col gap-6">
                <QuoteOfTheDay />
                <WordOfTheDay />
              </div>
            </div>

            <GoalTracker />

            <MindFuel />

            <ProductivityScore />
          </div>

          {/* API Testing section removed */}
        </SkeletonDemo>
      </main>
    </PageTransition>
  );
};

export default Home; 