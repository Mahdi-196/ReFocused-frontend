"use client";

import { useState, useEffect, useRef } from 'react';
import { perAccountDailyStorage, getTodayDateString, migrateLegacyDateKeyToScoped, migrateLegacyUserDateKeyToScoped, cleanupOldDateEntries } from '@/utils/scopedStorage';
import dynamic from 'next/dynamic';
import PageTransition from '@/components/PageTransition';
import logger from '@/utils/logger';

import { HomePageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Priority 1: Critical above-the-fold components with SSR enabled
const DailyMomentum = dynamic(() => import('../homeComponents/DailyMomentum'), {
  ssr: true,
});

const QuoteOfTheDay = dynamic(() => import('../../components/QuoteOfTheDay'), {
  ssr: true,
});

const WordOfTheDay = dynamic(() => import('../homeComponents/WordOfTheDay'), {
  ssr: true,
});

// Secondary components
const GoalTracker = dynamic(() => import('../homeComponents/GoalTracker'), {
  ssr: false,
});

const MindFuel = dynamic(() => import('../homeComponents/MindFuel'), {
  ssr: false,
});

const ProductivityScore = dynamic(() => import('../homeComponents/ProductivityScore'), {
  ssr: false,
});

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

const loadTodayTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Primary: per-account daily key
    const saved = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY);
    if (saved && Array.isArray(saved)) return saved;

    // Migration 1: from legacy date-only (pre-account) key
    migrateLegacyDateKeyToScoped(TASKS_BASE_KEY, getTodayDate());
    const migrated1 = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY);
    if (migrated1 && Array.isArray(migrated1)) return migrated1;

    // Migration 2: from legacy per-user key pattern refocused_tasks_${userId}_${date}
    const userId = getUserId();
    if (userId) {
      migrateLegacyUserDateKeyToScoped(TASKS_BASE_KEY, userId, getTodayDate());
      const migrated2 = perAccountDailyStorage.getJSON<Task[]>(TASKS_BASE_KEY);
      if (migrated2 && Array.isArray(migrated2)) return migrated2;
    }

    logTasks('loadTodayTasks:empty');
    return [];
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return [];
  }
};

const saveTodayTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    perAccountDailyStorage.setJSON<Task[]>(TASKS_BASE_KEY, tasks);
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
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const isFirstTasksEffect = useRef(true);
  const hasHydratedRef = useRef(false);
  const hydrationGuardActiveRef = useRef(true);
  // Removed progressive loading; page renders as a whole after skeleton delay

  // No per-user clearing; tasks are shared per day

  // Load today's tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = loadTodayTasks();
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
  }, []);
  

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
        const existing = loadTodayTasks();
        if (tasks.length === 0 && existing.length > 0) {
          logTasks('effect:skip-prevent-clobber', { existingLen: existing.length });
          return;
        }
      } catch {}
    }
    // Always persist to today's key after any subsequent state update
    logTasks('effect:save', { length: tasks.length });
    saveTodayTasks(tasks);
  }, [tasks]);

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