"use client";

import { useState, useEffect, useRef } from 'react';
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

// Helper functions for user-specific local storage
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

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const logTasks = (message: string, data?: unknown) => {
  logger.debug(message, data, 'TASKS');
};

const getGuestTodayKey = (): string => `refocused_tasks_${getTodayDate()}`;
const getUserTodayKey = (userId: string): string => `refocused_tasks_${userId}_${getTodayDate()}`;
const getTodayKey = (): string => {
  const userId = getUserId();
  return userId ? getUserTodayKey(userId) : getGuestTodayKey();
};

const loadTodayTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const userId = getUserId();
    // Try both user and guest keys to survive auth-init race on refresh
    const keysToTry = userId ? [getUserTodayKey(userId), getGuestTodayKey()] : [getGuestTodayKey()];
    logTasks('loadTodayTasks:start', { userId, keysToTry });
    for (const key of keysToTry) {
      logTasks('loadTodayTasks:checking', { key });
      const saved = localStorage.getItem(key);
      logTasks('loadTodayTasks:found?', { key, hasSaved: Boolean(saved) });
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed as Task[];
        } catch {}
      }
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
    // Write to both guest and user keys to avoid losing data during auth init
    const userId = getUserId();
    const guestKey = getGuestTodayKey();
    logTasks('saveTodayTasks:guest', { guestKey, length: tasks.length });
    localStorage.setItem(guestKey, JSON.stringify(tasks));
    if (userId) {
      const userKey = getUserTodayKey(userId);
      logTasks('saveTodayTasks:user', { userKey, length: tasks.length });
      localStorage.setItem(userKey, JSON.stringify(tasks));
    }
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

const cleanupOldTasks = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const taskKeys = keys.filter(key => key.startsWith('refocused_tasks_'));
    const today = getTodayDate();
    const userId = getUserId();
    
    taskKeys.forEach(key => {
      // Clean up both user-specific and legacy task keys
      if (userId) {
        // For user-specific keys, only clean up old dates for current user
        if (key.startsWith(`refocused_tasks_${userId}_`)) {
          const taskDate = key.replace(`refocused_tasks_${userId}_`, '');
          if (taskDate !== today) {
            logTasks('cleanupOldTasks:removeUserKey', { key });
            localStorage.removeItem(key);
          }
        }
      } else {
        // For legacy keys without user ID, clean up old dates
        const taskDate = key.replace('refocused_tasks_', '');
        if (taskDate !== today && !taskDate.includes('_')) { // Not a user-specific key
          logTasks('cleanupOldTasks:removeLegacyKey', { key });
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
  }
};

// Migrate today's tasks between guest <-> user keys when auth changes
const migrateTodayTasks = (fromUserId: string | null, toUserId: string | null) => {
  try {
    const today = getTodayDate();
    const fromKey = fromUserId ? `refocused_tasks_${fromUserId}_${today}` : `refocused_tasks_${today}`;
    const toKey = toUserId ? `refocused_tasks_${toUserId}_${today}` : `refocused_tasks_${today}`;
    if (fromKey === toKey) return;
    logTasks('migrate:start', { fromKey, toKey });
    const data = localStorage.getItem(fromKey);
    if (data) {
      localStorage.setItem(toKey, data);
      localStorage.removeItem(fromKey);
      try {
        const parsed = JSON.parse(data);
        logTasks('migrate:done', { movedCount: Array.isArray(parsed) ? parsed.length : 'unknown' });
      } catch {
        logTasks('migrate:done', { movedCount: 'unknown(JSON parse failed)' });
      }
    }
  } catch (e) {
    console.warn('Task migration skipped:', e);
  }
};

const Home = () => {
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const isFirstTasksEffect = useRef(true);
  const hasHydratedRef = useRef(false);
  const hydrationGuardActiveRef = useRef(true);
  // Removed progressive loading; page renders as a whole after skeleton delay

  // Clear tasks when user changes
  const clearTasks = () => {
    setTasks([]);
    setNewTask('');
  };

  // Load today's tasks from localStorage on component mount and when user changes
  useEffect(() => {
    const savedTasks = loadTodayTasks();
    logTasks('mount:loaded', { length: savedTasks.length });
    setTasks(savedTasks);
    
    // Track current user
    const userId = getUserId();
    logTasks('mount:user', { userId });
    setCurrentUser(userId);
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
    
    // Listen to explicit user change events from AuthProvider (same-tab)
    const handleUserChanged = () => {
      const newUserId = getUserId();
      migrateTodayTasks(currentUser || null, newUserId || null);
      setCurrentUser(newUserId);
      const reloaded = loadTodayTasks();
      logTasks('userChanged', { newUserId, length: reloaded.length });
      setTasks(reloaded);
    };
    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, []);

  // Handle authentication changes
  useEffect(() => {
    // Listen for user logout events (single-shot after tasks are saved)
    const handleUserLogout = () => {
      // Defer migration slightly to avoid racing with components still writing
      setTimeout(() => {
        const prevUserId = currentUser;
        migrateTodayTasks(prevUserId || null, null);
        const migrated = loadTodayTasks();
        logTasks('logout', { prevUserId, length: migrated.length });
        setTasks(migrated);
      }, 0);
    };

    // Listen for storage changes (user login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN' || e.key === 'REF_USER') {
        const newUserId = getUserId();
        const oldUserId = currentUser;
        
        // If user changed (logged in/out or switched users)
        if (newUserId !== oldUserId) {
          setCurrentUser(newUserId);
          
          // Migrate tasks between guest and user keys
          migrateTodayTasks(oldUserId || null, newUserId || null);
          const migrated = loadTodayTasks();
          logTasks('storageChange', { oldUserId, newUserId, length: migrated.length });
          setTasks(migrated);
        }
      }
    };

    // Listen for focus events (user might have logged in/out in another tab)
    const handleFocus = () => {
      const userId = getUserId();
      if (userId !== currentUser) {
        setCurrentUser(userId);
        migrateTodayTasks(currentUser || null, userId || null);
        const migrated = loadTodayTasks();
        logTasks('focusChange', { userId, length: migrated.length });
        setTasks(migrated);
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
    logTasks('effect:save', { length: tasks.length, currentUser });
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