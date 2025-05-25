export interface Goal {
  id: number;
  user_id: number;
  goal_text: string;
  category: 'sprint' | 'long_term';
  created_at: string;
  updated_at: string;
  completed: boolean;
  progress?: number; // Optional for UI calculations
}

export type GoalView = 'sprint' | 'vision';

export interface UIGoal extends Goal {
  name: string; // Alias for goal_text for UI compatibility
  type?: 'sprint' | 'vision'; // Mapped from category for UI
}

// API request/response types
export interface CreateGoalRequest {
  goal_text: string;
  category: 'sprint' | 'long_term';
}

export interface UpdateGoalRequest {
  goal_text?: string;
  completed?: boolean;
  progress?: number;
  category?: 'sprint' | 'long_term';
}

// Helper function to convert backend Goal to UI-friendly format
export function goalToUIGoal(goal: Goal): UIGoal {
  return {
    ...goal,
    name: goal.goal_text,
    type: goal.category === 'sprint' ? 'sprint' : 'vision',
    progress: goal.progress || (goal.completed ? 100 : 0),
  };
}

// Helper function to convert UI goal back to backend format
export function uiGoalToGoal(uiGoal: UIGoal): Goal {
  return {
    id: uiGoal.id,
    user_id: uiGoal.user_id,
    goal_text: uiGoal.goal_text || uiGoal.name,
    category: uiGoal.category,
    created_at: uiGoal.created_at,
    updated_at: uiGoal.updated_at,
    completed: uiGoal.completed,
    progress: uiGoal.progress,
  };
} 