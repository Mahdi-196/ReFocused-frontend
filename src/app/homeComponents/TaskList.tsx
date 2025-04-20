"use client";

import React from 'react';

// Define Task type locally or import from a shared types file
export type Task = {
  id: number;
  text: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  newTask: string;
  setNewTask: (task: string) => void;
  handleAddTask: (e: React.FormEvent) => void;
  handleDeleteTask: (id: number) => void;
  setTasks: (updateFn: (tasks: Task[]) => Task[]) => void; // Accept function for state update
};

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  newTask,
  setNewTask,
  handleAddTask,
  handleDeleteTask,
  setTasks,
}) => {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium text-gray-700">✅ Today's Tasks</span>
      </div>
      <div className="bg-white rounded-lg p-4">
        <ul className="space-y-2 mb-3">
          {tasks.map(task => (
            <li key={task.id} className="group relative flex items-center justify-between gap-2 pr-8">
              <div className="flex items-center gap-2 flex-grow">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {
                    // Use functional update for setting tasks
                    setTasks(currentTasks =>
                      currentTasks.map(t =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      )
                    );
                  }}
                  className="flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.text}
                </span>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                aria-label="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddTask} className="flex items-center gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={tasks.length >= 3 ? "Task limit reached" : "Add a new task..."}
            className="flex-grow p-2 bg-white rounded-md border border-gray-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={tasks.length >= 3}
          />
          <button
            type="submit"
            className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={tasks.length >= 3 || !newTask.trim()}
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskList; 