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
  <div className="lg:col-span-2">
    <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl font-semibold">🎯 Daily Momentum</span>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">Today's Focus Goal</span>
        </div>
        <input
          type="text"
          placeholder="Set your main goal for today..."
          className="w-full p-2 bg-transparent text-lg font-semibold text-gray-800 placeholder-gray-500 focus:outline-none focus:border-b-2 focus:border-blue-300"
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
  </div>
);

export default DailyMomentum; 