import React, { useState, useEffect, useMemo } from "react";
import { PiPlusMinusBold } from "react-icons/pi";

interface GoalActivity {
  goalId: number;
  goalName: string;
  activityType: 'created' | 'completed' | 'progress_update';
  activityTime?: Date;
  progressValue?: number;
  goalType?: string;
  targetValue?: number;
  notes?: string;
  previousValue?: number; // Add previous value for change calculation
}

interface GoalsActivityDisplayProps {
  goalActivities: GoalActivity[];
}

// Global progress history to track changes across days
const globalGoalProgressHistory: Record<number, number> = {};

export default function GoalsActivityDisplay({
  goalActivities,
}: GoalsActivityDisplayProps) {
  console.log('🎯 [GOALS DISPLAY] Received goal activities:', {
    count: goalActivities.length,
    activities: goalActivities
  });
  // Calculate the correct percentage based on goal type
  const calculateProgressPercentage = (activity: GoalActivity): number => {
    if (!activity.progressValue && activity.progressValue !== 0) {
      return 0;
    }

    if (activity.activityType === 'completed') {
      return 100;
    }

    // For progress updates, calculate based on goal type
    if (activity.goalType === 'percentage') {
      return Math.min(100, Math.max(0, activity.progressValue));
    } else if (activity.goalType === 'counter' && activity.targetValue) {
      return Math.min(100, Math.max(0, Math.round((activity.progressValue / activity.targetValue) * 100)));
    } else if (activity.goalType === 'checklist') {
      return activity.progressValue === 1 ? 100 : 0;
    }

    // Default fallback
    return Math.min(100, Math.max(0, activity.progressValue));
  };

  // Calculate previous progress percentage
  const calculatePreviousProgressPercentage = (activity: GoalActivity): number => {
    if (!activity.previousValue && activity.previousValue !== 0) {
      return 0;
    }

    if (activity.goalType === 'percentage') {
      return Math.min(100, Math.max(0, activity.previousValue));
    } else if (activity.goalType === 'counter' && activity.targetValue) {
      return Math.min(100, Math.max(0, Math.round((activity.previousValue / activity.targetValue) * 100)));
    } else if (activity.goalType === 'checklist') {
      return activity.previousValue === 1 ? 100 : 0;
    }

    return Math.min(100, Math.max(0, activity.previousValue));
  };

  // Calculate progress change by comparing with previous value
  const getProgressChange = (activity: GoalActivity): { change: number; isIncrease: boolean; hasValidChange: boolean; previousValue: number } => {
    if (activity.activityType === 'completed') {
      return { change: 0, isIncrease: true, hasValidChange: true, previousValue: 0 };
    }

    if (activity.activityType !== 'progress_update' || !activity.progressValue) {
      return { change: 0, isIncrease: false, hasValidChange: false, previousValue: 0 };
    }

    // For percentage goals, compare raw values directly
    if (activity.goalType === 'percentage') {
      const currentValue = activity.progressValue;
      const previousValue = activity.previousValue || 0;
      
      const change = Math.abs(currentValue - previousValue);
      const isIncrease = currentValue > previousValue;
      // Consider it a valid change if we have a previous value > 0, or if current value > 0
      const hasValidChange = change > 0 && (previousValue > 0 || currentValue > 0);
      
      return { change, isIncrease, hasValidChange, previousValue };
    }
    
    // For counter goals, compare percentage values
    if (activity.goalType === 'counter' && activity.targetValue) {
      const currentProgress = calculateProgressPercentage(activity);
      const previousProgress = calculatePreviousProgressPercentage(activity);
      
      const change = Math.abs(currentProgress - previousProgress);
      const isIncrease = currentProgress > previousProgress;
      // Consider it a valid change if we have a previous value > 0, or if current value > 0
      const hasValidChange = change > 0 && (previousProgress > 0 || currentProgress > 0);
      
      return { change, isIncrease, hasValidChange, previousValue: previousProgress };
    }
    
    // For checklist goals, compare raw values
    if (activity.goalType === 'checklist') {
      const currentValue = activity.progressValue;
      const previousValue = activity.previousValue || 0;
      
      const change = Math.abs(currentValue - previousValue);
      const isIncrease = currentValue > previousValue;
      // Consider it a valid change if we have a previous value > 0, or if current value > 0
      const hasValidChange = change > 0 && (previousValue > 0 || currentValue > 0);
      
      return { change, isIncrease, hasValidChange, previousValue };
    }
    
    // Default fallback - compare percentage values
    const currentProgress = calculateProgressPercentage(activity);
    let previousProgress = 0;
    if (activity.previousValue !== undefined) {
      previousProgress = calculatePreviousProgressPercentage(activity);
    } else {
      previousProgress = globalGoalProgressHistory[activity.goalId] || 0;
    }
    
    const change = Math.abs(currentProgress - previousProgress);
    const isIncrease = currentProgress > previousProgress;
    // Consider it a valid change if we have a previous value > 0, or if current value > 0
    const hasValidChange = change > 0 && (previousProgress > 0 || currentProgress > 0);
    
    // Update global history for next comparison
    globalGoalProgressHistory[activity.goalId] = currentProgress;
    
    return { change, isIncrease, hasValidChange, previousValue: previousProgress };
  };

  // Enhanced filtering that properly handles progress updates
  const filteredActivities = goalActivities.filter(activity => {
    console.log('🎯 [GOALS FILTER] Checking activity:', {
      activityType: activity.activityType,
      progressValue: activity.progressValue,
      goalName: activity.goalName
    });
    
    if (activity.activityType === 'created') {
      console.log('🎯 [GOALS FILTER] Showing created goal');
      return true; // TEMPORARILY show created goals for debugging
    }
    
    if (activity.activityType === 'completed') {
      console.log('🎯 [GOALS FILTER] Showing completed goal');
      return true; // Always show completed goals
    }
    
    if (activity.activityType === 'progress_update') {
      // Show progress updates that have meaningful progress
      const hasProgress = activity.progressValue !== undefined && activity.progressValue !== null;
      console.log('🎯 [GOALS FILTER] Progress update check:', { hasProgress, progressValue: activity.progressValue });
      
      if (!hasProgress) {
        console.log('🎯 [GOALS FILTER] No progress value, showing anyway for debugging');
        return true; // TEMPORARILY show even without progress for debugging
      }
      
      // Show if there's any progress (since this is daily activity)
      const progressPercentage = calculateProgressPercentage(activity);
      console.log('🎯 [GOALS FILTER] Progress percentage:', progressPercentage);
      return progressPercentage >= 0; // Show any progress including 0
    }
    
    console.log('🎯 [GOALS FILTER] Unknown activity type, showing for debugging');
    return true; // TEMPORARILY show all for debugging
  });

  console.log('🎯 [GOALS DISPLAY] After filtering:', {
    originalCount: goalActivities.length,
    filteredCount: filteredActivities.length,
    filteredActivities: filteredActivities
  });

  if (filteredActivities.length === 0) {
    console.log('🎯 [GOALS DISPLAY] No filtered activities, returning null');
    return null; // Don't show goals section if no activities
  }

  const getActivityIcon = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );
    } else {
      // Show yellow for progress updates (not green)
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
          <PiPlusMinusBold className="w-4 h-4 text-white" />
        </div>
      );
    }
  };

  const getBorderColor = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "border-green-500/20";
    } else {
      // Show yellow border for progress updates
      return "border-yellow-500/20";
    }
  };

  const getBackgroundColor = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "bg-green-500/10";
    } else {
      // Show yellow background for progress updates
      return "bg-yellow-500/10";
    }
  };

  const getActivityDescription = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "";
    } else if (activity.activityType === "progress_update") {
      // Handle case where we don't have progressValue
      if (!activity.progressValue && activity.progressValue !== 0) {
        return "Progress update";
      }
      
      const { change, isIncrease, hasValidChange, previousValue } = getProgressChange(activity);
      const currentProgress = calculateProgressPercentage(activity);
      
      // Check if we have a meaningful previous value (not 0 or undefined)
      const hasMeaningfulPreviousValue = previousValue !== undefined && previousValue !== null && previousValue > 0;
      
      if (!hasValidChange || !hasMeaningfulPreviousValue) {
        // No change detected or no meaningful previous value, show simple status
        if (activity.goalType === 'counter' && activity.targetValue) {
          return '';
        } else if (activity.goalType === 'percentage') {
          return '';
        } else if (activity.goalType === 'checklist') {
          return activity.progressValue === 1 ? "Completed successfully" : "In progress";
        }
        return '';
      }
      
      // Show gained/lost progress
      const direction = isIncrease ? "gained" : "lost";
      const roundedChange = Math.round(change);
      
      if (activity.goalType === 'counter' && activity.targetValue) {
        return `You ${direction} ${roundedChange}% progress (${activity.progressValue}/${activity.targetValue})`;
      } else if (activity.goalType === 'percentage') {
        return `You ${direction} ${roundedChange}% progress`;
      } else if (activity.goalType === 'checklist') {
        return activity.progressValue === 1 ? "Completed successfully" : "In progress";
      }
      
      return `You ${direction} ${roundedChange}% progress`;
    }
    return "";
  };

  const getProgressBarColor = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "bg-green-500";
    } else if (activity.activityType === "progress_update") {
      // Show yellow for progress updates
      return "bg-yellow-500";
    }
    return "bg-amber-500";
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="font-medium text-white mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Goals
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {filteredActivities
          .sort((a, b) => {
            // Sort by activity time if available, otherwise by goal name
            if (a.activityTime && b.activityTime) {
              return b.activityTime.getTime() - a.activityTime.getTime();
            }
            return a.goalName.localeCompare(b.goalName);
          })
          .map((activity, index) => (
            <div
              key={`${activity.goalId}-${index}`}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${getBackgroundColor(
                activity
              )} ${getBorderColor(activity)}`}
            >
              {getActivityIcon(activity)}
              <div className="flex-1 min-w-0">
                {/* Goal Title below icon, above bar */}
                <div className="flex flex-col mb-1">
                  <span className="text-white text-sm font-medium truncate mt-1">
                    {activity.goalName}
                  </span>
                </div>
                {/* Progress bar and percentage in a row */}
                {activity.progressValue !== undefined && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getProgressBarColor(activity)}`}
                        style={{
                          width: `${calculateProgressPercentage(activity)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-300 font-medium min-w-[2.5rem] text-right">
                      {calculateProgressPercentage(activity)}%
                    </span>
                  </div>
                )}
                {/* Activity description below bar */}
                <p className="text-xs text-gray-300 mt-2">
                  {getActivityDescription(activity)}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
} 