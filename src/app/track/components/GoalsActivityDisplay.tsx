import React from "react";
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
}

interface GoalsActivityDisplayProps {
  goalActivities: GoalActivity[];
}

export default function GoalsActivityDisplay({
  goalActivities,
}: GoalsActivityDisplayProps) {
  if (goalActivities.length === 0) {
    return null; // Don't show goals section if no activities
  }

  // Calculate the correct percentage based on goal type
  const calculateProgressPercentage = (activity: GoalActivity): number => {
    if (!activity.progressValue || activity.activityType === 'created') {
      return 0;
    }

    if (activity.activityType === 'completed') {
      return 100;
    }

    // For progress updates, calculate based on goal type
    if (activity.goalType === 'percentage') {
      return Math.min(100, activity.progressValue);
    } else if (activity.goalType === 'counter' && activity.targetValue) {
      return Math.min(100, Math.round((activity.progressValue / activity.targetValue) * 100));
    } else if (activity.goalType === 'checklist') {
      return activity.progressValue === 1 ? 100 : 0;
    }

    // Default fallback
    return Math.min(100, activity.progressValue);
  };

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
    } else if (activity.activityType === "created") {
      return (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <PiPlusMinusBold className="w-4 h-4 text-white" />
        </div>
      );
    }
  };

  const getBorderColor = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "border-green-500/20";
    } else if (activity.activityType === "created") {
      return "border-blue-500/20";
    } else {
      return "border-amber-500/20";
    }
  };

  const getBackgroundColor = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "bg-green-500/10";
    } else if (activity.activityType === "created") {
      return "bg-blue-500/10";
    } else {
      return "bg-amber-500/10";
    }
  };

  const getActivityDescription = (activity: GoalActivity) => {
    if (activity.activityType === "completed") {
      return "Goal completed successfully!";
    } else if (activity.activityType === "created") {
      return "New goal created";
    } else if (activity.activityType === "progress_update") {
      if (activity.goalType === 'counter' && activity.targetValue) {
        const progressPercentage = calculateProgressPercentage(activity);
        return `Made ${progressPercentage}% progress (${activity.progressValue}/${activity.targetValue})`;
      } else if (activity.goalType === 'percentage') {
        return `Made ${activity.progressValue}% progress`;
      } else if (activity.goalType === 'checklist') {
        return activity.progressValue === 1 ? "Completed successfully" : "In progress";
      }
      const progressPercentage = calculateProgressPercentage(activity);
      return `Made ${progressPercentage}% progress`;
    }
    return "Goal activity";
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
        Goals Activity
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {goalActivities
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
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getBackgroundColor(
                activity
              )} ${getBorderColor(activity)}`}
            >
              {getActivityIcon(activity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium truncate">
                    {activity.goalName}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  {getActivityDescription(activity)}
                </p>
                {activity.progressValue && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          activity.activityType === "completed" ? "bg-green-500" : "bg-amber-500"
                        }`}
                        style={{
                          width: `${calculateProgressPercentage(activity)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {calculateProgressPercentage(activity)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
} 