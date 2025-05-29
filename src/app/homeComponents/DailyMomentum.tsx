"use client";

import React from 'react';
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

const DailyMomentum: React.FC<DailyMomentumProps> = ({
  tasks,
  newTask,
  setNewTask,
  handleAddTask,
  handleDeleteTask,
  setTasks,
}) => (
  <section 
    className="lg:col-span-2" 
    aria-labelledby="daily-momentum"
  >
    <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
      <h2 id="daily-momentum" className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-800">
        🎯 Daily Momentum
      </h2>

      <div className="mb-6">
        <label htmlFor="daily-goal" className="flex items-center gap-2 mb-2 font-medium text-gray-700">
          Today's Focus Goal
        </label>
        <input
          id="daily-goal"
          type="text"
          placeholder="Set your main goal for today..."
          className="w-full p-2 bg-transparent text-lg font-semibold text-gray-800 placeholder-gray-500 focus:outline-none focus:border-b-2 focus:border-blue-300"
          aria-label="Enter your daily mantra or focus goal"
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

export default DailyMomentum; 