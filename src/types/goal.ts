export type GoalType = 'percentage' | 'counter' | 'checklist';
export type GoalDuration = '2_week' | 'long_term';
export type GoalStatus = 'active' | 'completed_recent' | 'completed_historical' | 'expired';

export interface Goal {
  id: number;
  name: string;
  goal_type: GoalType;
  duration: GoalDuration;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  progress_percentage: number;
  expires_at?: string | null;
  completed_at?: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  date_created?: string;
  goal_duration?: GoalDuration;
  is_expired?: boolean;
}

// New interface for goals history
export interface GoalHistoryEntry {
  id: number;
  name: string;
  goal_type: GoalType;
  duration: GoalDuration;
  target_value: number;
  completed_at: string;
  completion_days: number;
  created_at: string;
}

// New interface for history API responses
export interface GoalsHistoryResponse {
  goals: GoalHistoryEntry[];
  total_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

// API request/response types
export interface CreateGoalRequest {
  name: string;
  goal_type: GoalType;
  duration: GoalDuration;
  target_value?: number;
}

export interface GoalsListResponse {
  goals: Goal[];
  total_count: number;
  active_2_week_goals: number;
  long_term_goals: number;
}

export interface GoalsListParams {
  duration?: GoalDuration;
  include_expired?: boolean;
  include_completed?: boolean;
  completed_within_hours?: number;
  limit?: number;
  offset?: number;
}

export interface UpdateGoalProgressRequest {
  increment?: number;
  new_value?: number;
  complete?: boolean;
}

export interface GoalProgressUpdatePayload {
  goalId: number;
  goalType: GoalType;
  action: 'increment' | 'setValue' | 'toggle';
  value?: number;
}

// New interface for history fetching
export interface GoalsHistoryParams {
  days_back?: number;
  limit?: number;
  offset?: number;
  goal_type?: GoalType;
  duration?: GoalDuration;
}

// Helper function to calculate progress percentage for display
export function calculateGoalProgress(goal: Goal): number {
  switch (goal.goal_type) {
    case 'checklist':
      return goal.current_value === 1 ? 100 : 0;
    case 'percentage':
      return Math.min(100, Math.max(0, goal.current_value));
    case 'counter':
      if (goal.target_value <= 0) return 0;
      const progress = (goal.current_value / goal.target_value) * 100;
      return Math.min(100, Math.max(0, progress));
    default:
      return 0;
  }
}

// Helper function to check if goal is completed
export function isGoalCompleted(goal: Goal): boolean {
  switch (goal.goal_type) {
    case 'checklist':
      return goal.current_value === 1;
    case 'percentage':
      return goal.current_value >= 100;
    case 'counter':
      return goal.current_value >= goal.target_value;
    default:
      return false;
  }
}

// Helper function to get display text for goal progress
export function getGoalProgressText(goal: Goal): string {
  switch (goal.goal_type) {
    case 'checklist':
      return isGoalCompleted(goal) ? 'Complete' : 'checkmark';
    case 'percentage':
      return `${Math.round(goal.current_value)}%`;
    case 'counter':
      return `${goal.current_value} / ${goal.target_value}`;
    default:
      return '0%';
  }
}

// Helper function to get user-friendly duration labels
export function getDurationDisplayName(duration: GoalDuration): string {
  switch (duration) {
    case '2_week': {
      return '2-Week Sprint';
    }
    case 'long_term': {
      return 'Long-Term';
    }
    default: {
      return duration;
    }
  }
}

// Helper function to check if goal is expired (for 2-week goals)
export function isGoalExpired(goal: Goal): boolean {
  if (goal.duration !== '2_week' || !goal.expires_at) {
    return false;
  }
  
  // Import time service for accurate time comparison
  try {
    const { timeService } = require('@/services/timeService');
    const currentDateTime = timeService.getCurrentDateTime();
    return new Date(goal.expires_at) < new Date(currentDateTime);
  } catch (error) {
    // Fallback to system time if time service unavailable
    return new Date(goal.expires_at) < new Date();
  }
}

// Helper function to get expiration display text
export function getExpirationText(goal: Goal): string | null {
  if (goal.duration !== '2_week' || !goal.expires_at) {
    return null;
  }
  
  const expireDate = new Date(goal.expires_at);
  
  // Use time service for accurate current time
  let now: Date;
  try {
    const { timeService } = require('@/services/timeService');
    const currentDateTime = timeService.getCurrentDateTime();
    now = new Date(currentDateTime);
  } catch (error) {
    // Fallback to system time if time service unavailable
    now = new Date();
  }
  
  const diffTime = expireDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${diffDays} days`;
  }
}

// Helper function to validate goal creation input
export function validateGoalInput(name: string, goalType: GoalType, duration: GoalDuration, targetValue?: number): string | null {
  // Ensure name is a string and handle null/undefined cases
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Goal name is required';
  }

  if (!duration) {
    return 'Goal duration is required';
  }
  
  if (goalType === 'counter') {
    if (!targetValue || targetValue < 2 || targetValue > 999) {
      return 'Counter goals must have a target value between 2 and 999';
    }
  }
  
  return null;
}

// Helper function to sanitize user input
export function sanitizeGoalName(name: string): string {
  // Ensure name is a string and handle null/undefined cases
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name.trim().replace(/[<>]/g, '');
}

// Helper function to determine goal status based on completion and time
export function getGoalStatus(goal: Goal): GoalStatus {
  if (isGoalExpired(goal)) {
    return 'expired';
  }
  
  if (!goal.is_completed) {
    return 'active';
  }
  
  // Check if completed within last 24 hours
  if (goal.completed_at) {
    const completedTime = new Date(goal.completed_at);
    
    // Use time service for accurate current time
    let now: Date;
    try {
      const { timeService } = require('@/services/timeService');
      const currentDateTime = timeService.getCurrentDateTime();
      now = new Date(currentDateTime);
    } catch (error) {
      // Fallback to system time if time service unavailable
      now = new Date();
    }
    
    const hoursSinceCompletion = (now.getTime() - completedTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCompletion <= 24) {
      return 'completed_recent';
    }
  }
  
  return 'completed_historical';
}

// Helper function to check if goal should be visible in main view
export function isGoalVisibleInMainView(goal: Goal): boolean {
  const status = getGoalStatus(goal);
  return status === 'active' || status === 'completed_recent';
}

// Helper function to format completion time
export function getCompletionTimeText(goal: Goal): string | null {
  if (!goal.completed_at) return null;
  
  const completedTime = new Date(goal.completed_at);
  
  // Use time service for accurate current time
  let now: Date;
  try {
    const { timeService } = require('@/services/timeService');
    const currentDateTime = timeService.getCurrentDateTime();
    now = new Date(currentDateTime);
  } catch (error) {
    // Fallback to system time if time service unavailable
    now = new Date();
  }
  
  const hoursSinceCompletion = (now.getTime() - completedTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceCompletion < 1) {
    return 'Just completed';
  } else if (hoursSinceCompletion < 24) {
    const hours = Math.floor(hoursSinceCompletion);
    return `Completed ${hours}h ago`;
  } else {
    return `Completed on ${completedTime.toLocaleDateString()}`;
  }
}

// Helper function to calculate completion days
export function getCompletionDays(goal: Goal): number | null {
  if (!goal.completed_at) return null;
  
  const createdTime = new Date(goal.created_at);
  const completedTime = new Date(goal.completed_at);
  const daysDiff = Math.ceil((completedTime.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(1, daysDiff); // At least 1 day
} 