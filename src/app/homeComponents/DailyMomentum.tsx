"use client";

import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import MoodStats from './MoodStats';
import HabitStreaks from './HabitStreaks';
import TaskList, { Task } from './TaskList'; // Import Task type as well

type DailyMomentumProps = {
  tasks: Task[];
  newTask: string;
  setNewTask: (task: string) => void;
  handleAddTask: (e: React.FormEvent) => void;
  handleDeleteTask: (id: number) => void;
  setTasks: (updateFn: (tasks: Task[]) => Task[]) => void;
};

const STORAGE_KEY_PREFIX = 'focus_goal_';
const getTodayKey = () => `${STORAGE_KEY_PREFIX}${new Date().toISOString().split('T')[0]}`;

const DailyMomentum: React.FC<DailyMomentumProps> = ({
  tasks,
  newTask,
  setNewTask,
  handleAddTask,
  handleDeleteTask,
  setTasks,
}) => {
  const [focusGoal, setFocusGoal] = useState('');

  // Load today's focus goal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = getTodayKey();
      const saved = localStorage.getItem(key);
      if (saved) setFocusGoal(saved);

      // Cleanup old focus_goal_* keys
      const today = key;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_PREFIX) && k !== today) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }, []);

  // Persist on change (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(getTodayKey(), focusGoal.trim());
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [focusGoal]);

  return (
  <section 
    className="lg:col-span-2" 
    aria-labelledby="daily-momentum"
  >
    <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
      <h2 id="daily-momentum" className="flex items-center gap-2 mb-6 text-xl font-semibold text-white">
        <Target className="w-5 h-5 text-blue-400" />
        Daily Momentum
      </h2>

      <div className="mb-6">
        <label htmlFor="daily-goal" className="flex items-center gap-2 mb-2 font-medium text-gray-300">
          Today's Focus Goal
        </label>
        <input
          id="daily-goal"
          type="text"
          placeholder="Set your main goal for today..."
          className="w-full p-2 bg-transparent text-lg font-semibold text-white placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-blue-400"
          aria-label="Enter your daily mantra or focus goal"
          value={focusGoal}
          onChange={(e) => setFocusGoal(e.target.value)}
        />
      </div>

      <MoodStats />
      <HabitStreaks />
      <TaskList
        tasks={tasks}
        newTask={newTask}
        setNewTask={setNewTask}
        handleAddTask={handleAddTask}
        handleDeleteTask={handleDeleteTask}
        setTasks={setTasks}
      />
    </div>
  </section>
  );
};

export default DailyMomentum; 