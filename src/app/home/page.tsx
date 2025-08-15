"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PageTransition from '@/components/PageTransition';

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

const getTodayKey = (): string => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const userId = getUserId();
  return userId ? `refocused_tasks_${userId}_${today}` : `refocused_tasks_${today}`;
};

const loadTodayTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const todayKey = getTodayKey();
    const savedTasks = localStorage.getItem(todayKey);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return [];
  }
};

const saveTodayTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    const todayKey = getTodayKey();
    localStorage.setItem(todayKey, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

const cleanupOldTasks = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const taskKeys = keys.filter(key => key.startsWith('refocused_tasks_'));
    const today = new Date().toISOString().split('T')[0];
    const userId = getUserId();
    
    taskKeys.forEach(key => {
      // Clean up both user-specific and legacy task keys
      if (userId) {
        // For user-specific keys, only clean up old dates for current user
        if (key.startsWith(`refocused_tasks_${userId}_`)) {
          const taskDate = key.replace(`refocused_tasks_${userId}_`, '');
          if (taskDate !== today) {
            localStorage.removeItem(key);
          }
        }
      } else {
        // For legacy keys without user ID, clean up old dates
        const taskDate = key.replace('refocused_tasks_', '');
        if (taskDate !== today && !taskDate.includes('_')) { // Not a user-specific key
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
  }
};

const Home = () => {
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  // Removed progressive loading; page renders as a whole after skeleton delay

  // Clear tasks when user changes
  const clearTasks = () => {
    setTasks([]);
    setNewTask('');
  };

  // Load today's tasks from localStorage on component mount and when user changes
  useEffect(() => {
    const savedTasks = loadTodayTasks();
    setTasks(savedTasks);
    
    // Track current user
    const userId = getUserId();
    setCurrentUser(userId);
    
    // Clean up old task entries to keep localStorage tidy
    cleanupOldTasks();
    
  }, []);

  // Handle authentication changes
  useEffect(() => {
    // Listen for user logout events
    const handleUserLogout = () => {
      clearTasks();
    };

    // Listen for storage changes (user login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN' || e.key === 'REF_USER') {
        const newUserId = getUserId();
        const oldUserId = currentUser;
        
        // If user changed (logged in/out or switched users)
        if (newUserId !== oldUserId) {
          setCurrentUser(newUserId);
          
          if (newUserId) {
            // User logged in or switched - reload tasks for new user
            const newUserTasks = loadTodayTasks();
            setTasks(newUserTasks);
          } else {
            // User logged out - clear tasks
            clearTasks();
          }
        }
      }
    };

    // Listen for focus events (user might have logged in/out in another tab)
    const handleFocus = () => {
      const userId = getUserId();
      if (userId !== currentUser) {
        setCurrentUser(userId);
        
        if (userId) {
          const newUserTasks = loadTodayTasks();
          setTasks(newUserTasks);
        } else {
          clearTasks();
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

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (tasks.length > 0 || tasks.length === 0) { // Save even when empty to clear old data
      saveTodayTasks(tasks);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasks.length < 3 && newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (taskId: number) => {
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