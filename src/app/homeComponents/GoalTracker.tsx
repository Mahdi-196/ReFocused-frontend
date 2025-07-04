"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { History } from 'lucide-react';
import { 
  Goal, 
  CreateGoalRequest, 
  calculateGoalProgress, 
  getGoalProgressText, 
  isGoalCompleted,
  getExpirationText,
  isGoalExpired,
  getGoalStatus,
  getCompletionTimeText
} from '@/types/goal';
import { goalsService } from '@/services/goalsService';
import GoalCreationModal from '@/components/GoalCreationModal';
import GoalsHistoryModal from '@/components/GoalsHistoryModal';
import { SkeletonWrapper, Skeleton } from '@/components/skeletons/SkeletonConfig';

// Separate component for percentage input to fix React hooks issue
const PercentageInput: React.FC<{ goal: Goal; onUpdate: (value: number) => void }> = ({ goal, onUpdate }) => {
  const [inputValue, setInputValue] = useState(goal.current_value.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = () => {
    const newValue = parseInt(inputValue);
    if (newValue >= 0 && newValue <= 100) {
      onUpdate(newValue);
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(goal.current_value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        min="0"
        max="100"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyPress={handleKeyPress}
        className="w-16 px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-gray-300 text-xs hover:text-white transition-colors"
    >
      {Math.round(goal.current_value)}%
    </button>
  );
};

const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'2_week' | 'long_term'>('2_week');

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎯 [GOAL_TRACKER] Loading goals for timeframe:', selectedTimeframe);
      
      // Use the new method that includes recently completed goals
      const fetchedGoals = await goalsService.getActiveAndRecentGoals(selectedTimeframe);
      
      console.log('🎯 [GOAL_TRACKER] Goals loaded:', {
        count: fetchedGoals.length,
        timeframe: selectedTimeframe,
        goals: fetchedGoals.map(g => ({
          id: g.id,
          name: g.name,
          type: g.goal_type,
          status: g.is_completed ? 'completed' : 'active',
          completed_at: g.completed_at,
          expires_at: g.expires_at
        }))
      });
      
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('❌ [GOAL_TRACKER] Failed to load goals:', error);
      setError(error instanceof Error ? error.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe]);

  // Fetch goals on component mount
  useEffect(() => {
    loadGoals();
  }, [loadGoals]); // Reload when loadGoals changes

  const handleGoalCreation = async (data: CreateGoalRequest) => {
    // Add the selected timeframe to the goal data
    const goalData = {
      ...data,
      duration: selectedTimeframe
    };
    const newGoal = await goalsService.createGoal(goalData);
    setGoals(prevGoals => [...prevGoals, newGoal]);
    setIsCreationModalOpen(false);
  };

  const handlePercentageUpdate = async (goal: Goal, newValue: number) => {
    if (goal.goal_type !== 'percentage') return;
    
    const originalValue = goal.current_value;
    
    // Optimistic update
    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === goal.id 
          ? { ...g, current_value: newValue }
          : g
      )
    );

    try {
      const updatedGoal = await goalsService.updatePercentageGoal(goal.id, newValue);
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === goal.id ? updatedGoal : g)
      );
    } catch (error) {
      // Revert optimistic update
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goal.id 
            ? { ...g, current_value: originalValue }
            : g
        )
      );
      console.error('Failed to update goal:', error);
    }
  };

  const handleCounterIncrement = async (goal: Goal) => {
    if (goal.goal_type !== 'counter' || isGoalCompleted(goal)) return;
    
    const originalValue = goal.current_value;
    const newValue = originalValue + 1;
    
    // Optimistic update
    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === goal.id 
          ? { ...g, current_value: newValue }
          : g
      )
    );

    try {
      const updatedGoal = await goalsService.incrementCounterGoal(goal.id);
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === goal.id ? updatedGoal : g)
      );
    } catch (error) {
      // Revert optimistic update
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goal.id 
            ? { ...g, current_value: originalValue }
            : g
        )
      );
      console.error('Failed to increment goal:', error);
    }
  };

  const handleCounterDecrement = async (goal: Goal) => {
    if (goal.goal_type !== 'counter' || goal.current_value <= 0) return;
    
    const originalValue = goal.current_value;
    const newValue = Math.max(0, originalValue - 1);
    
    // Optimistic update
    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === goal.id 
          ? { ...g, current_value: newValue }
          : g
      )
    );

    try {
      // Use direct update since we don't have a decrement endpoint
      const updatedGoal = await goalsService.setCounterGoalValue(goal.id, newValue);
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === goal.id ? updatedGoal : g)
      );
    } catch (error) {
      // Revert optimistic update
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goal.id 
            ? { ...g, current_value: originalValue }
            : g
        )
      );
      console.error('Failed to decrement goal:', error);
    }
  };

  const handleChecklistToggle = async (goal: Goal) => {
    if (goal.goal_type !== 'checklist') return;
    
    const originalValue = goal.current_value;
    const newValue = originalValue === 1 ? 0 : 1;
    
    // Optimistic update
    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === goal.id 
          ? { ...g, current_value: newValue }
          : g
      )
    );

    try {
      const updatedGoal = await goalsService.toggleChecklistGoal(goal.id, newValue === 1);
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === goal.id ? updatedGoal : g)
      );
    } catch (error) {
      // Revert optimistic update
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goal.id 
            ? { ...g, current_value: originalValue }
            : g
        )
      );
      console.error('Failed to toggle goal:', error);
    }
  };

  const renderGoalActions = (goal: Goal): React.ReactNode[] => {
    const actions: React.ReactNode[] = [];
    const expired = isGoalExpired(goal);
    const goalStatus = getGoalStatus(goal);
    
    // Don't show actions for expired goals or recently completed goals
    if (expired || goalStatus === 'completed_recent') {
      return actions;
    }
    
    // Add type-specific action buttons
    if (goal.goal_type === 'checklist') {
      const isCompleted = isGoalCompleted(goal);
      actions.push(
        <button
          key="toggle"
          onClick={() => handleChecklistToggle(goal)}
          className={`p-1 rounded-full transition-colors ${
            isCompleted 
              ? 'text-green-400 hover:text-green-300' 
              : 'text-gray-400 hover:text-green-400'
          }`}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCompleted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            )}
          </svg>
        </button>
      );
    } else if (goal.goal_type === 'counter') {
      // Decrement button (only show if current_value > 0)
      if (goal.current_value > 0) {
        actions.push(
          <button
            key="decrement"
            onClick={() => handleCounterDecrement(goal)}
            className="p-1 text-gray-400 hover:text-red-400 rounded-full transition-colors"
            aria-label="Subtract progress"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        );
      }
      
      // Increment button (only show if not completed)
      if (!isGoalCompleted(goal)) {
        actions.push(
          <button
            key="increment"
            onClick={() => handleCounterIncrement(goal)}
            className="p-1 text-gray-400 hover:text-blue-400 rounded-full transition-colors"
            aria-label="Add progress"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        );
      }
    }
    
    return actions;
  };

  // Updated component for individual goal display with completion status
  const GoalItem: React.FC<{ goal: Goal }> = ({ goal }) => {
    const progress = calculateGoalProgress(goal);
    const completed = isGoalCompleted(goal);
    const expired = isGoalExpired(goal);
    const expirationText = getExpirationText(goal);
    const goalStatus = getGoalStatus(goal);
    const completionText = getCompletionTimeText(goal);
    
    return (
      <div className={`group relative ${
        expired ? 'opacity-60' : 
        goalStatus === 'completed_recent' ? 'ring-1 ring-green-500/30 bg-green-500/5' : ''
      }`}>
        <div className="flex justify-between items-center text-sm mb-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              expired ? 'text-gray-400 line-through' : 
              goalStatus === 'completed_recent' ? 'text-green-200' :
              'text-gray-200'
            }`}>
              {goal.name}
            </span>
            
            {/* Goal type badges */}
            {goal.goal_type === 'checklist' && (
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                 Checklist
              </span>
            )}
            {goal.goal_type === 'counter' && (
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                🔢 {goal.current_value}/{goal.target_value}
              </span>
            )}
            {goal.goal_type === 'percentage' && (
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                📊 Percentage
              </span>
            )}
            
            {/* Completion status indicator */}
            {goalStatus === 'completed_recent' && completionText && (
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                🏆 {completionText}
              </span>
            )}
            
            {/* Expiration indicator for 2-week goals */}
            {expirationText && goalStatus !== 'completed_recent' && (
              <span className={`text-xs px-2 py-1 rounded ${
                expired 
                  ? 'bg-red-600/20 text-red-400' 
                  : 'bg-yellow-600/20 text-yellow-400'
              }`}>
                ⏰ {expirationText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {goal.goal_type === 'percentage' && !expired && goalStatus !== 'completed_recent' ? (
              <PercentageInput 
                goal={goal} 
                onUpdate={(value) => handlePercentageUpdate(goal, value)} 
              />
            ) : (
              <span className="text-gray-300 text-xs">
                {getGoalProgressText(goal)}
              </span>
            )}
            {renderGoalActions(goal)}
          </div>
        </div>
        
        {/* Progress bar - hide for completed recent goals or checklists */}
        {goal.goal_type !== 'checklist' && goalStatus !== 'completed_recent' && (
          <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                completed 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`} 
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>
        )}
        
        {/* Completion celebration for recently completed goals */}
        {goalStatus === 'completed_recent' && (
          <div className="mt-2 p-2 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-400">🎉</span>
              <span className="text-xs text-green-300">Goal completed!</span>
              <span className="text-xs text-gray-400">
                This will move to history in {24 - Math.floor((Date.now() - new Date(goal.completed_at!).getTime()) / (1000 * 60 * 60))} hours
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:col-span-2">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-semibold text-white">🎯 Goals</span>
          <div className="flex items-center gap-2">
            {/* History Button */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-colors"
              aria-label="View goals history"
              title="View completed goals history"
            >
              <History className="w-4 h-4" />
            </button>
            
            {/* Add Goal Button */}
            <button
              onClick={() => setIsCreationModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Goal
            </button>
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray-700/50 rounded-lg p-1 border border-gray-600/50">
            <button
              onClick={() => setSelectedTimeframe('2_week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedTimeframe === '2_week'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              2 Week
            </button>
            <button
              onClick={() => setSelectedTimeframe('long_term')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedTimeframe === 'long_term'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              Long Term
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {selectedTimeframe === '2_week' ? '2-week focused goals' : 'Long-term objectives'}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <SkeletonWrapper>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-600/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton height={16} width={120} />
                    <Skeleton height={20} width={60} />
                  </div>
                  <Skeleton height={12} count={2} className="mb-2" />
                  <Skeleton height={6} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <Skeleton height={12} width={40} />
                    <Skeleton height={12} width={50} />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonWrapper>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg mb-4">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={loadGoals}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter goals based on selected timeframe */}
        {(() => {
          // Goals are now pre-filtered by the backend API call
          return (
            <>
              {/* Empty State */}
              {!isLoading && !error && goals.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2">
                    No {selectedTimeframe === '2_week' ? '2-week' : 'long-term'} goals yet.
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Create your first {selectedTimeframe === '2_week' ? 'sprint' : 'long-term'} goal to get started!
                  </p>
                </div>
              )}

              {/* Goals List */}
              {!isLoading && !error && goals.length > 0 && (
                <div className="space-y-4">
                  {goals.map(goal => (
                    <GoalItem key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Goal Creation Modal */}
        <GoalCreationModal
          isOpen={isCreationModalOpen}
          onClose={() => setIsCreationModalOpen(false)}
          onCreateGoal={handleGoalCreation}
          duration={selectedTimeframe}
        />
        
        {/* Goals History Modal */}
        <GoalsHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default GoalTracker; 