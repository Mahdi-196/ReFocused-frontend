"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { History } from 'lucide-react';
import { IoCheckmarkDoneSharp, IoCheckmark } from "react-icons/io5";
import { Trophy } from 'lucide-react';
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

// Separate component for percentage input with hover-based progress bar
const PercentageInput: React.FC<{ goal: Goal; onUpdate: (value: number) => void }> = ({ goal, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(goal.current_value);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progress = calculateGoalProgress(goal);
  const completed = isGoalCompleted(goal);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValueFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateValueFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate(Math.round(dragValue));
    }
  };

  // Global mouse event handlers for dragging outside the component
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateValueFromMouse(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(Math.round(dragValue));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragValue, onUpdate]);

  const updateValueFromMouse = (e: React.MouseEvent | MouseEvent) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDragValue(percentage);
  };

  const currentValue = isDragging ? dragValue : goal.current_value;
  const currentProgress = isDragging ? dragValue : progress;

  return (
    <div 
      className="relative h-6 py-2 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsHovered(false);
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Progress bar background */}
      <div 
        ref={progressBarRef}
        className="h-full bg-gray-600/50 rounded-full cursor-pointer relative overflow-visible"
      >
        {/* Progress fill */}
        <div 
          className={`h-full rounded-full ${
            isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'
          } ${
            completed 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`} 
          style={{ width: `${Math.min(100, currentProgress)}%` }}
        />
        
        {/* Blue circle at the progress position - only show when hovering */}
        {isHovered && (
          <div 
            className="absolute w-3 h-3 bg-blue-400 rounded-full border-2 shadow-md z-10"
            style={{ 
              left: `${Math.min(100, currentProgress)}%`, 
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: '#2D3748'
            }}
          />
        )}
      </div>
    </div>
  );
};

const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'2_week' | 'long_term'>('2_week');
  const [editingPercentageGoals, setEditingPercentageGoals] = useState<Set<number>>(new Set());

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the new method that includes recently completed goals
      const fetchedGoals = await goalsService.getActiveAndRecentGoals(selectedTimeframe);
      
      setGoals(fetchedGoals);
    } catch (error) {
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

  const togglePercentageEditing = (goalId: number) => {
    setEditingPercentageGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const renderGoalActions = (goal: Goal): React.ReactNode[] => {
    const actions: React.ReactNode[] = [];
    const expired = isGoalExpired(goal);
    const goalStatus = getGoalStatus(goal);
    
    // Don't show actions for expired goals
    if (expired) {
      return actions;
    }
    
    // Add any additional action buttons here if needed in the future
    // Counter buttons are now handled directly in the layout
    
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
    const [isAnimating, setIsAnimating] = useState(false);
    
    return (
      <div className={`group relative ${
        expired ? 'opacity-60' : ''
      }`}>
        <div className="flex justify-between items-center text-sm mb-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              expired ? 'text-gray-400 line-through' : 'text-gray-200'
            }`}>
              {goal.name}
            </span>
            
            {/* Goal type badges - removed as requested */}
            

            
            {/* Expiration indicator for 2-week goals - only show in development */}
            {process.env.NEXT_PUBLIC_APP_ENV === 'development' && expirationText && goalStatus !== 'completed_recent' && (
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
            {/* Counter decrement button - show on the left for counter goals only on hover */}
            {goal.goal_type === 'counter' && goal.current_value > 0 && (
              <button
                onClick={() => handleCounterDecrement(goal)}
                className="p-1 text-gray-400 hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Subtract progress"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            )}
            
            {goal.goal_type === 'checklist' ? (
              <button
                onClick={() => handleChecklistToggle(goal)}
                className="p-1 rounded-full transition-all duration-200 hover:bg-gray-700/50 hover:scale-105 active:scale-95"
                aria-label={isGoalCompleted(goal) ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {isGoalCompleted(goal) ? (
                  <IoCheckmarkDoneSharp className="w-6 h-6 text-green-500 transition-all duration-300 ease-out transform scale-110 drop-shadow-sm" />
                ) : (
                  <IoCheckmark className="w-6 h-6 text-gray-400 transition-all duration-300 ease-out hover:text-gray-300 drop-shadow-sm" />
                )}
              </button>
            ) : (
              <button
                onClick={() => goal.goal_type === 'percentage' && togglePercentageEditing(goal.id)}
                className={`text-gray-300 text-xs hover:text-white transition-colors ${
                  goal.goal_type === 'percentage' ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {getGoalProgressText(goal)}
              </button>
            )}
            
            {/* Counter increment button - show on the right for counter goals */}
            {goal.goal_type === 'counter' && !isGoalCompleted(goal) && (
              <button
                onClick={() => handleCounterIncrement(goal)}
                className="p-1 text-gray-400 hover:text-blue-400 rounded-full transition-colors"
                aria-label="Add progress"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Progress bar - show for active goals or when editing percentage goals */}
        {goal.goal_type !== 'checklist' && (goalStatus !== 'completed_recent' || editingPercentageGoals.has(goal.id)) && (
          <div className="relative">
            {goal.goal_type === 'percentage' && !expired && (goalStatus !== 'completed_recent' || editingPercentageGoals.has(goal.id)) ? (
              <PercentageInput 
                goal={goal} 
                onUpdate={(value) => handlePercentageUpdate(goal, value)} 
              />
            ) : (
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
          </div>
        )}
        

      </div>
    );
  };

  return (
    <div className="lg:col-span-2">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-semibold text-white">Goals</span>
          </div>
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


        {/* Filter goals based on selected timeframe */}
        {(() => {
          // Goals are now pre-filtered by the backend API call
          return (
            <>
              {/* Empty State */}
              {!isLoading && goals.length === 0 && (
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
              {!isLoading && goals.length > 0 && (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {goals
                    .sort((a, b) => {
                      // Sort by type: checklist -> counter -> percentage
                      const typeOrder = { checklist: 0, counter: 1, percentage: 2 };
                      return typeOrder[a.goal_type] - typeOrder[b.goal_type];
                    })
                    .map(goal => (
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

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  );
};

export default GoalTracker; 