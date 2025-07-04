"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PageTransition from '@/components/PageTransition';

import { HomePageSkeleton, SkeletonDemo } from '@/components/skeletons';

// Dynamically import heavy components
const DailyMomentum = dynamic(() => import('../homeComponents/DailyMomentum'), {
  ssr: false,
});

const QuoteOfTheDay = dynamic(() => import('../homeComponents/QuickAccess'), {
  ssr: false,
});

const WordOfTheDay = dynamic(() => import('../homeComponents/WordOfTheDay'), {
  ssr: false,
});

const GoalTracker = dynamic(() => import('../homeComponents/GoalTracker'), {
  ssr: false,
});

const MindFuel = dynamic(() => import('../homeComponents/MindFuel'), {
  ssr: false,
});

const ProductivityScore = dynamic(() => import('../homeComponents/ProductivityScore'), {
  ssr: false,
});
import { Task } from '../homeComponents/TaskList';

// Helper functions for local storage
const getTodayKey = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `refocused_tasks_${today}`;
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
    
    taskKeys.forEach(key => {
      const taskDate = key.replace('refocused_tasks_', '');
      if (taskDate !== today) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
  }
};

const Home = () => {
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load today's tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = loadTodayTasks();
    setTasks(savedTasks);
    
    // Clean up old task entries to keep localStorage tidy
    cleanupOldTasks();
  }, []);

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
        
        <SkeletonDemo
          skeleton={<HomePageSkeleton />}
          delay={100} // Minimal delay for smooth transition
          enabled={false} // Disable forced demo mode
        >
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
        </SkeletonDemo>

      </main>
    </PageTransition>
  );
};

export default Home; 