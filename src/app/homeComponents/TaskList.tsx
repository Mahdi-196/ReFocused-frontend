"use client";

import React, { useRef } from 'react';
import logger from '@/utils/logger';
import { CheckIcon } from '@/components/icons';
import { incrementTasksDone } from "@/services/statisticsService";

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
  const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium text-gray-300">Today's Tasks</span>
      </div>
      <div className="w-full bg-gray-600/50 border border-gray-500/50 rounded-lg p-4">
        {/* Fixed height container to prevent layout shifts - shows minimum 3 tasks worth of space */}
        <div className="min-h-[120px] mb-3">
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="group relative flex items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-3 flex-grow">
                  {/* Custom Checkbox (matches habit style) */}
                  <button
                    type="button"
                    onClick={() => {
                      logger.debug('toggleTask', { id: task.id, from: task.completed, to: !task.completed }, 'TASKS');
                      const wasCompleted = task.completed;
                      
                      // Use functional update for setting tasks
                      setTasks(currentTasks =>
                        currentTasks.map(t =>
                          t.id === task.id ? { ...t, completed: !t.completed } : t
                        )
                      );
                      
                      // Track task completion when checking off (not unchecking)
                      if (!wasCompleted) {
                        // Clear any existing timeout
                        if (apiTimeoutRef.current) {
                          clearTimeout(apiTimeoutRef.current);
                        }
                        
                        // Set new timeout to delay API call by 1 second
                        apiTimeoutRef.current = setTimeout(() => {
                          try {
                            incrementTasksDone();
                          } catch (error) {
                            if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
                              console.error('Failed to track task completion:', error);
                            }
                          }
                        }, 1000);
                      }
                    }}
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${task.completed
                        ? 'border-emerald-400 text-emerald-400 bg-transparent'
                        : 'border-gray-400 hover:border-emerald-400 hover:bg-emerald-400/10'}
                    `}
                  >
                    {task.completed && (
                      <CheckIcon className="w-4 h-4" color="#34d399" />
                    )}
                  </button>
                  
                  <span className={`
                    text-sm transition-all duration-300 ease-out
                    ${task.completed 
                      ? 'text-gray-400' 
                      : 'text-gray-200 hover:text-white'
                    }
                  `}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logger.debug('deleteTask', { id: task.id }, 'TASKS');
                    handleDeleteTask(task.id);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-600/50"
                  aria-label="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleAddTask} className="flex items-center gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={tasks.length >= 3 ? "Task limit reached" : "Add a new task..."}
            className="flex-grow p-2 bg-gray-600/50 border border-gray-500/50 rounded-md text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-gray-700/50 disabled:cursor-not-allowed disabled:text-gray-500"
            disabled={tasks.length >= 3}
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
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