"use client";

import React from 'react';

// Define types locally or import from a shared types file
export type Goal = {
  id: number;
  name: string;
  progress: number; // Percentage 0-100
};

export type GoalView = 'sprint' | 'vision';

type GoalTrackerProps = {
  sprintGoals: Goal[];
  visionGoals: Goal[];
  activeGoalView: GoalView;
  setActiveGoalView: (view: GoalView) => void;
  newGoalName: string;
  setNewGoalName: (name: string) => void;
  handleAddGoal: (e: React.FormEvent) => void;
  handleOpenEditGoalModal: (goal: Goal, type: 'sprint' | 'vision') => void;
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
}) => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-xl p-6 shadow-sm h-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl font-semibold">✅ Goal Tracker</span>
        </div>

        {/* Goal Type Selector */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveGoalView('sprint')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeGoalView === 'sprint'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            2-Week Sprint
          </button>
          <button
            onClick={() => setActiveGoalView('vision')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeGoalView === 'vision'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <span className="font-medium">{goal.name}</span>
                  <div className="flex items-center">
                    <span>{goal.progress}%</span>
                    <button
                      onClick={() => handleOpenEditGoalModal(goal, 'sprint')}
                      className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                      aria-label="Edit sprint goal"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Add a new sprint goal..."
                  className="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                />
                <button 
                  type="submit"
                  className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400"
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
                  <span className="font-medium">{goal.name}</span>
                  <div className="flex items-center">
                    <span>{goal.progress}%</span>
                    <button
                      onClick={() => handleOpenEditGoalModal(goal, 'vision')}
                      className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100"
                      aria-label="Edit vision goal"
                    >
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
            <form onSubmit={handleAddGoal} className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Add a new vision goal..."
                  className="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                />
                <button 
                  type="submit"
                  className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400"
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