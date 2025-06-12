"use client";

import React from 'react';
// Removed unused client import
import { UIGoal, GoalView } from '@/types/goal';

type GoalTrackerProps = {
  sprintGoals: UIGoal[];
  visionGoals: UIGoal[];
  activeGoalView: GoalView;
  setActiveGoalView: (view: GoalView) => void;
  newGoalName: string;
  setNewGoalName: (name: string) => void;
  handleAddGoal: (e: React.FormEvent) => void;
  handleOpenEditGoalModal: (goal: UIGoal, type: 'sprint' | 'vision') => void;
  handleDeleteGoal: (id: number, type: 'sprint' | 'vision') => Promise<void>;
};

const GoalTracker: React.FC<GoalTrackerProps> = ({
  sprintGoals,
  visionGoals,
  activeGoalView,
  setActiveGoalView,
  newGoalName,
  setNewGoalName,
  handleAddGoal,
  handleOpenEditGoalModal,
  handleDeleteGoal,
}) => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl font-semibold text-white">✅ Goal Tracker</span>
        </div>

        {/* Goal Type Selector */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveGoalView('sprint')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeGoalView === 'sprint'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            2-Week Sprint
          </button>
          <button
            onClick={() => setActiveGoalView('vision')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeGoalView === 'vision'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            Long-term Vision
          </button>
        </div>

        {/* Sprint View */}
        {activeGoalView === 'sprint' && (
          <div className="space-y-4">
            {sprintGoals.map(goal => (
              <div key={goal.id} className="group relative pr-8">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-gray-200">{goal.name}</span>
                  <div className="flex items-center">
                    <span className="text-gray-300">{goal.progress}%</span>
                    <button
                      onClick={() => handleOpenEditGoalModal(goal, 'sprint')}
                      className="ml-2 p-1 text-gray-400 hover:text-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-600/50"
                      aria-label="Edit sprint goal"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, 'sprint')}
                      className="ml-1 p-1 text-gray-400 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-600/50"
                      aria-label="Delete sprint goal"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-600/50">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Add a new sprint goal..."
                  className="flex-grow p-2 bg-gray-600/50 border border-gray-500/50 rounded-md text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
                <button 
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!newGoalName.trim()}
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vision View */}
        {activeGoalView === 'vision' && (
          <div className="space-y-4">
            {visionGoals.map(goal => (
              <div key={goal.id} className="group relative pr-8">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-gray-200">{goal.name}</span>
                  <div className="flex items-center">
                    <span className="text-gray-300">{goal.progress}%</span>
                    <button
                      onClick={() => handleOpenEditGoalModal(goal, 'vision')}
                      className="ml-2 p-1 text-gray-400 hover:text-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-600/50"
                      aria-label="Edit vision goal"
                    >
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, 'vision')}
                      className="ml-1 p-1 text-gray-400 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-600/50"
                      aria-label="Delete vision goal"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-600/50">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Add a new vision goal..."
                  className="flex-grow p-2 bg-gray-600/50 border border-gray-500/50 rounded-md text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
                <button 
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!newGoalName.trim()}
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker; 