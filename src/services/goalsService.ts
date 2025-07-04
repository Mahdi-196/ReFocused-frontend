import client from '@/api/client';
import { GOALS } from '@/api/endpoints';
import { 
  Goal, 
  CreateGoalRequest, 
  UpdateGoalProgressRequest, 
  GoalProgressUpdatePayload,
  GoalsListParams,
  GoalDuration,
  GoalsHistoryResponse,
  GoalsHistoryParams,
  GoalHistoryEntry,
  validateGoalInput,
  sanitizeGoalName,
  isGoalVisibleInMainView
} from '@/types/goal';
import logger from '@/utils/logger';

export class GoalsService {
  /**
   * Fetch goals from backend with optional filtering
   * Now includes completed goals that are within 24 hours
   */
  async getAllGoals(params: GoalsListParams = {}): Promise<Goal[]> {
    try {
      logger.info('Fetching goals', params, 'GOALS_SERVICE');
      
      // Build query parameters for new backend API
      const queryParams = new URLSearchParams();
      if (params.duration) {
        queryParams.append('duration', params.duration);
      }
      if (params.include_expired !== undefined) {
        queryParams.append('include_expired', params.include_expired.toString());
      }
      if (params.include_completed !== undefined) {
        queryParams.append('include_completed', params.include_completed.toString());
      }
      if (params.completed_within_hours !== undefined) {
        queryParams.append('completed_within_hours', params.completed_within_hours.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      const url = queryParams.toString() ? `${GOALS.LIST}?${queryParams}` : GOALS.LIST;
      const response = await client.get<Goal[]>(url);
      
      // Backend now returns array directly with new dual-table structure
      const goals = Array.isArray(response.data) ? response.data : [];
      
      // Normalize legacy fields for backward compatibility
      goals.forEach(goal => {
        if (!goal.date_created && goal.created_at) {
          goal.date_created = goal.created_at;
        }
        if (!goal.goal_duration && goal.duration) {
          goal.goal_duration = goal.duration;
        }
      });
      
      logger.info('Successfully fetched goals', { count: goals.length }, 'GOALS_SERVICE');
      return goals;
    } catch (error) {
      logger.error('Failed to fetch goals', error, 'GOALS_SERVICE');
      throw new Error('Unable to load goals. Please try again.');
    }
  }

  /**
   * Fetch active goals and recently completed goals (within 24 hours)
   */
  async getActiveAndRecentGoals(duration?: GoalDuration): Promise<Goal[]> {
    const params: GoalsListParams = {
      include_completed: true,
      completed_within_hours: 24, // Include goals completed within 24 hours
      include_expired: false
    };
    
    if (duration) {
      params.duration = duration;
    }
    
    const allGoals = await this.getAllGoals(params);
    
    // Filter on frontend as additional safety
    return allGoals.filter(goal => isGoalVisibleInMainView(goal));
  }

  /**
   * Fetch goals completion history for the last N days
   */
  async getGoalsHistory(params: GoalsHistoryParams = {}): Promise<GoalsHistoryResponse> {
    try {
      const { days_back = 90, limit, offset, goal_type, duration } = params;
      
      logger.info('Fetching goals history', params, 'GOALS_SERVICE');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('days_back', days_back.toString());
      
      if (limit) {
        queryParams.append('limit', limit.toString());
      }
      if (offset) {
        queryParams.append('offset', offset.toString());
      }
      if (goal_type) {
        queryParams.append('goal_type', goal_type);
      }
      if (duration) {
        queryParams.append('duration', duration);
      }

      const url = `${GOALS.HISTORY}?${queryParams}`;
      const response = await client.get<GoalsHistoryResponse>(url);
      
      console.log('🔍 [GOALS_SERVICE] Raw API response:', response);
      console.log('🔍 [GOALS_SERVICE] Response.data:', response.data);
      console.log('🔍 [GOALS_SERVICE] Response.data type:', typeof response.data);
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      console.log('🔍 [GOALS_SERVICE] Goals array:', response.data.goals);
      console.log('🔍 [GOALS_SERVICE] Goals array type:', typeof response.data.goals);
      console.log('🔍 [GOALS_SERVICE] Is goals array?', Array.isArray(response.data.goals));
      
      logger.info('Successfully fetched goals history', { 
        count: response.data.goals.length,
        dateRange: response.data.date_range
      }, 'GOALS_SERVICE');
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch goals history', error, 'GOALS_SERVICE');
      throw new Error('Unable to load goals history. Please try again.');
    }
  }



  /**
   * Get summary statistics for completed goals
   */
  async getCompletionStats(daysBack: number = 30): Promise<{
    total_completed: number;
    avg_completion_days: number;
    completion_rate: number;
    by_type: Record<string, number>;
    by_duration: Record<string, number>;
  }> {
    try {
      logger.info('Fetching completion stats', { daysBack }, 'GOALS_SERVICE');
      
      const response = await client.get(`${GOALS.STATS}/completion?days_back=${daysBack}`);
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch completion stats', error, 'GOALS_SERVICE');
      throw new Error('Unable to load completion statistics. Please try again.');
    }
  }

  /**
   * Fetch goals by duration (convenience method)
   * Now includes recently completed goals
   */
  async getGoalsByDuration(duration: GoalDuration, includeExpired: boolean = false): Promise<Goal[]> {
    return this.getActiveAndRecentGoals(duration);
  }

  /**
   * Create a new goal with the backend duration system
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    try {
      // Sanitize and validate input
      const sanitizedName = sanitizeGoalName(request.name);
      const validationError = validateGoalInput(
        sanitizedName, 
        request.goal_type, 
        request.duration, 
        request.target_value
      );
      
      if (validationError) {
        throw new Error(validationError);
      }

      // Prepare payload for new backend API
      const payload: CreateGoalRequest = {
        name: sanitizedName,
        goal_type: request.goal_type,
        duration: request.duration // Using 'duration' field as per backend API
      };

      // Only include target_value for counter goals
      if (request.goal_type === 'counter' && request.target_value) {
        payload.target_value = Math.floor(request.target_value); // Ensure integer
      }

      // Add created_at timestamp for backend compatibility (workaround for backend issue)
      // Use time service for accurate timestamp
      let timestamp: string;
      try {
        const { timeService } = require('@/services/timeService');
        timestamp = timeService.getCurrentDateTime();
      } catch (error) {
        timestamp = new Date().toISOString();
      }
      
      const backendPayload = {
        ...payload,
        created_at: timestamp
      };

      logger.info('Creating new goal', { 
        goalType: request.goal_type, 
        duration: request.duration 
      }, 'GOALS_SERVICE');
      
      const response = await client.post<Goal>(GOALS.CREATE, backendPayload);
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }
      
      // Add legacy fields for backward compatibility
      const goal = response.data;
      if (!goal.date_created && goal.created_at) {
        goal.date_created = goal.created_at;
      }
      if (!goal.goal_duration && goal.duration) {
        goal.goal_duration = goal.duration;
      }
      
      logger.info('Goal created successfully', { 
        goalId: goal.id,
        duration: goal.duration,
        expiresAt: goal.expires_at
      }, 'GOALS_SERVICE');
      
      return goal;
    } catch (error) {
      logger.error('Failed to create goal', error, 'GOALS_SERVICE');
      
      if (error instanceof Error && error.message.includes('validation')) {
        throw error; // Re-throw validation errors as-is
      }
      
      throw new Error('Unable to create goal. Please check your input and try again.');
    }
  }

  /**
   * Update goal progress with proper backend integration
   */
  async updateGoalProgress(payload: GoalProgressUpdatePayload): Promise<Goal> {
    try {
      const { goalId, goalType, action, value } = payload;
      
      // Prepare request based on action type
      let updateRequest: UpdateGoalProgressRequest;
      
      switch (action) {
        case 'increment':
          if (goalType !== 'counter') {
            throw new Error('Increment action is only valid for counter goals');
          }
          updateRequest = { increment: 1 };
          break;
          
        case 'setValue':
          if (goalType === 'percentage') {
            if (value === undefined || value < 0 || value > 100) {
              throw new Error('Percentage value must be between 0 and 100');
            }
            updateRequest = { new_value: Math.floor(value) };
          } else if (goalType === 'counter') {
            if (value === undefined || value < 0 || value > 999) {
              throw new Error('Counter value must be between 0 and 999');
            }
            updateRequest = { new_value: Math.floor(value) };
          } else {
            throw new Error('Set value action is only valid for percentage and counter goals');
          }
          break;
          
        case 'toggle':
          if (goalType !== 'checklist') {
            throw new Error('Toggle action is only valid for checklist goals');
          }
          updateRequest = { complete: value === 1 };
          break;
          
        default:
          throw new Error('Invalid action type');
      }

      logger.info('Updating goal progress', { goalId, action }, 'GOALS_SERVICE');
      const response = await client.patch<Goal>(GOALS.PROGRESS(goalId), updateRequest);
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      logger.info('Goal progress updated successfully', { goalId }, 'GOALS_SERVICE');
      return response.data;
    } catch (error) {
      logger.error('Failed to update goal progress', error, 'GOALS_SERVICE');
      throw new Error('Unable to update goal progress. Please try again.');
    }
  }

  /**
   * Get detailed goal information
   */
  async getGoalById(goalId: number): Promise<Goal> {
    try {
      logger.info('Fetching goal details', { goalId }, 'GOALS_SERVICE');
      const response = await client.get<Goal>(GOALS.DETAIL(goalId));
      
      if (!response.data) {
        throw new Error('Goal not found');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch goal details', error, 'GOALS_SERVICE');
      throw new Error('Unable to load goal details. Please try again.');
    }
  }

  // Convenience methods for specific goal types (unchanged for backward compatibility)
  async updatePercentageGoal(goalId: number, newValue: number): Promise<Goal> {
    return this.updateGoalProgress({
      goalId,
      goalType: 'percentage',
      action: 'setValue',
      value: newValue
    });
  }

  async incrementCounterGoal(goalId: number): Promise<Goal> {
    return this.updateGoalProgress({
      goalId,
      goalType: 'counter',
      action: 'increment'
    });
  }

  async setCounterGoalValue(goalId: number, newValue: number): Promise<Goal> {
    return this.updateGoalProgress({
      goalId,
      goalType: 'counter',
      action: 'setValue',
      value: newValue
    });
  }

  async toggleChecklistGoal(goalId: number, complete: boolean): Promise<Goal> {
    return this.updateGoalProgress({
      goalId,
      goalType: 'checklist',
      action: 'toggle',
      value: complete ? 1 : 0
    });
  }
}

// Create and export service instance
export const goalsService = new GoalsService();
export default goalsService; 