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
import { timeService } from '@/services/timeService';

// Client-side progress tracking for better calendar integration
interface DailyGoalProgress {
  goalId: number;
  date: string;
  progressValue: number;
  progressType: 'increment' | 'setValue' | 'toggle' | 'complete';
  timestamp: string;
  notes?: string;
}

const PROGRESS_STORAGE_KEY = 'goal_daily_progress';
const PROGRESS_RETENTION_DAYS = 30; // Keep progress data for 30 days

// Helper functions for client-side progress tracking
function saveDailyProgress(progress: DailyGoalProgress) {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    let progressData: DailyGoalProgress[] = stored ? JSON.parse(stored) : [];
    
    // Remove old entries
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PROGRESS_RETENTION_DAYS);
    progressData = progressData.filter(p => new Date(p.date) >= cutoffDate);
    
    // Add new progress entry
    progressData.push(progress);
    
    // Keep only the latest progress per goal per day
    const uniqueProgress = progressData.reduce((acc, curr) => {
      const key = `${curr.goalId}-${curr.date}`;
      if (!acc[key] || new Date(curr.timestamp) > new Date(acc[key].timestamp)) {
        acc[key] = curr;
      }
      return acc;
    }, {} as Record<string, DailyGoalProgress>);
    
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(Object.values(uniqueProgress)));
    console.log('📊 Saved daily progress:', progress);
  } catch (error) {
    console.warn('Failed to save daily progress:', error);
  }
}

function getDailyProgress(goalId?: number, date?: string): DailyGoalProgress[] {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    let progressData: DailyGoalProgress[] = stored ? JSON.parse(stored) : [];
    
    if (goalId) {
      progressData = progressData.filter(p => p.goalId === goalId);
    }
    
    if (date) {
      progressData = progressData.filter(p => p.date === date);
    }
    
    return progressData;
  } catch (error) {
    console.warn('Failed to get daily progress:', error);
    return [];
  }
}

function clearOldProgress() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PROGRESS_RETENTION_DAYS);
    
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      const progressData: DailyGoalProgress[] = JSON.parse(stored);
      const filtered = progressData.filter(p => new Date(p.date) >= cutoffDate);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.warn('Failed to clear old progress:', error);
  }
}

// Helper function to get current date from time service
function getCurrentDate(): string {
  try {
    return timeService.getCurrentDate();
  } catch (error) {
    console.warn('Time service not available, using system date:', error);
    return new Date().toISOString().split('T')[0];
  }
}

// Helper function to get current datetime from time service
function getCurrentDateTime(): string {
  try {
    return timeService.getCurrentDateTime();
  } catch (error) {
    console.warn('Time service not available, using system datetime:', error);
    return new Date().toISOString();
  }
}

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
      console.log('🔍 API REQUEST:', { method: 'GET', url, params });
      
      const response = await client.get<Goal[]>(url);
      console.log('📡 API RESPONSE:', { url, status: response.status, data: response.data });
      
      // Backend now returns array directly with new dual-table structure
      const goals = Array.isArray(response.data) ? response.data : [];
      
      // DEBUG: Log each goal's key data
      goals.forEach(goal => {
        console.log('📊 GOAL DATA:', {
          id: goal.id,
          name: goal.name,
          type: goal.goal_type,
          current_value: goal.current_value,
          target_value: goal.target_value,
          progress_percentage: goal.progress_percentage,
          is_completed: goal.is_completed,
          created_at: goal.created_at,
          updated_at: goal.updated_at,
          completed_at: goal.completed_at
        });
      });
      
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
   * Get goals completion history for the last N days
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
   * Get goals with activity on a specific date
   * This includes goals created, completed, or updated on the specified date
   */
  async getGoalsForDate(date: string): Promise<Goal[]> {
    try {
      logger.info('Fetching goals for specific date', { date }, 'GOALS_SERVICE');
      
      // Calculate days back from the specified date to today
      const targetDate = new Date(date);
      const today = new Date();
      const daysDiff = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Fetch goals with extended time range to ensure we get all relevant goals
      const [currentGoals, historicalGoals] = await Promise.all([
        // Get active goals and recently completed ones
        this.getAllGoals({
          include_completed: true,
          include_expired: true,
          completed_within_hours: Math.max(24, daysDiff * 24)
        }),
        
        // Get historical goals if looking at past dates
        daysDiff > 0 ? this.getGoalsHistory({
          days_back: daysDiff + 7, // Add buffer for goals created around that time
          limit: 50
        }).then(response => response.goals).catch(() => []) : Promise.resolve([])
      ]);
      
      // Combine and filter goals for the specific date
      const allGoals = [...currentGoals];
      
      // Add historical goals that aren't already included
      historicalGoals.forEach(histGoal => {
        const exists = currentGoals.some(goal => goal.id === histGoal.id);
        if (!exists) {
          allGoals.push({
            id: histGoal.id,
            name: histGoal.name,
            goal_type: histGoal.goal_type,
            duration: histGoal.duration,
            target_value: histGoal.target_value,
            current_value: histGoal.target_value,
            is_completed: true,
            progress_percentage: 100,
            completed_at: histGoal.completed_at,
            created_at: histGoal.created_at,
            updated_at: histGoal.completed_at,
            user_id: 0
          });
        }
      });
      
      // Get client-side progress data for the date
      const dailyProgress = getDailyProgress(undefined, date);
      
      // Filter goals that have activity on the specified date
      const relevantGoals = allGoals.filter(goal => {
        const goalCreatedDate = goal.created_at ? goal.created_at.split('T')[0] : null;
        const goalCompletedDate = goal.completed_at ? goal.completed_at.split('T')[0] : null;
        const goalUpdatedDate = goal.updated_at ? goal.updated_at.split('T')[0] : null;
        
        // Check if goal was created, completed, or updated on the specified date
        const hasBackendActivity = goalCreatedDate === date || 
                                   goalCompletedDate === date || 
                                   (goalUpdatedDate === date && goalUpdatedDate !== goalCreatedDate);
        
        // Check if goal has client-side progress on the specified date
        const hasClientProgress = dailyProgress.some(p => p.goalId === goal.id);
        
        return hasBackendActivity || hasClientProgress;
      });
      
      logger.info('Successfully fetched goals for date', { 
        date,
        totalGoals: allGoals.length,
        relevantGoals: relevantGoals.length,
        clientProgressEntries: dailyProgress.length
      }, 'GOALS_SERVICE');
      
      return relevantGoals;
      
    } catch (error) {
      logger.error('Failed to fetch goals for date', error, 'GOALS_SERVICE');
      throw new Error('Unable to load goals for the specified date. Please try again.');
    }
  }

  /**
   * Get goals with enhanced activity tracking for calendar integration
   * This combines backend data with client-side progress tracking
   */
  async getGoalsWithDailyProgress(startDate: string, endDate: string): Promise<{goals: Goal[], dailyProgress: DailyGoalProgress[]}> {
    try {
      logger.info('Fetching goals with daily progress', { startDate, endDate }, 'GOALS_SERVICE');
      
      // Calculate days back from the start date to today
      const start = new Date(startDate);
      const today = new Date();
      const daysDiff = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Fetch goals with extended time range
      const [currentGoals, historicalGoals] = await Promise.all([
        this.getAllGoals({
          include_completed: true,
          include_expired: true,
          completed_within_hours: Math.max(24, daysDiff * 24)
        }),
        
        daysDiff > 0 ? this.getGoalsHistory({
          days_back: daysDiff + 7,
          limit: 100
        }).then(response => response.goals).catch(() => []) : Promise.resolve([])
      ]);
      
      // Combine goals
      const allGoals = [...currentGoals];
      historicalGoals.forEach(histGoal => {
        const exists = currentGoals.some(goal => goal.id === histGoal.id);
        if (!exists) {
          allGoals.push({
            id: histGoal.id,
            name: histGoal.name,
            goal_type: histGoal.goal_type,
            duration: histGoal.duration,
            target_value: histGoal.target_value,
            current_value: histGoal.target_value,
            is_completed: true,
            progress_percentage: 100,
            completed_at: histGoal.completed_at,
            created_at: histGoal.created_at,
            updated_at: histGoal.completed_at,
            user_id: 0
          });
        }
      });
      
      // Get client-side progress data for the date range
      const allProgress = getDailyProgress();
      const relevantProgress = allProgress.filter(p => p.date >= startDate && p.date <= endDate);
      
      logger.info('Successfully fetched goals with daily progress', {
        startDate,
        endDate,
        totalGoals: allGoals.length,
        progressEntries: relevantProgress.length
      }, 'GOALS_SERVICE');
      
      return {
        goals: allGoals,
        dailyProgress: relevantProgress
      };
      
    } catch (error) {
      logger.error('Failed to fetch goals with daily progress', error, 'GOALS_SERVICE');
      throw new Error('Unable to load goals with progress data. Please try again.');
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
      const timestamp = getCurrentDateTime();
      
      const backendPayload = {
        ...payload,
        created_at: timestamp
      };

      logger.info('Creating new goal', { 
        goalType: request.goal_type, 
        duration: request.duration 
      }, 'GOALS_SERVICE');
      
      console.log('🔍 CREATE GOAL REQUEST:', { 
        method: 'POST', 
        url: GOALS.CREATE, 
        payload: backendPayload 
      });
      
      const response = await client.post<Goal>(GOALS.CREATE, backendPayload);
      
      console.log('📡 CREATE GOAL RESPONSE:', { 
        url: GOALS.CREATE, 
        status: response.status, 
        data: response.data 
      });
      
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
      
      console.log('🔍 UPDATE PROGRESS REQUEST:', { 
        method: 'PATCH', 
        url: GOALS.PROGRESS(goalId), 
        payload: updateRequest,
        goalId,
        goalType,
        action,
        value
      });
      
      const response = await client.patch<Goal>(GOALS.PROGRESS(goalId), updateRequest);
      
      console.log('📡 UPDATE PROGRESS RESPONSE:', { 
        url: GOALS.PROGRESS(goalId), 
        status: response.status, 
        data: response.data 
      });
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Save client-side progress tracking
      const today = getCurrentDate();
      const progressValue = response.data.current_value;
      
      // Determine if goal was completed
      const isCompleted = response.data.is_completed || 
                          (goalType === 'percentage' && progressValue >= 100) ||
                          (goalType === 'counter' && progressValue >= response.data.target_value) ||
                          (goalType === 'checklist' && progressValue === 1);
      
      const progressType = isCompleted ? 'complete' : action;
      
      saveDailyProgress({
        goalId,
        date: today,
        progressValue,
        progressType,
        timestamp: getCurrentDateTime(),
        notes: isCompleted 
          ? `Goal completed!`
          : goalType === 'percentage' 
          ? `Progress updated to ${Math.round(progressValue)}%`
          : goalType === 'counter'
          ? `Progress: ${progressValue}/${response.data.target_value}`
          : goalType === 'checklist'
          ? (progressValue === 1 ? 'Completed' : 'Pending')
          : 'Progress updated'
      });
      
      // Clear old progress data
      clearOldProgress();
      
      logger.info('Goal progress updated successfully', { 
        goalId, 
        newValue: progressValue,
        isCompleted,
        progressType 
      }, 'GOALS_SERVICE');
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
    const result = await this.updateGoalProgress({
      goalId,
      goalType: 'percentage',
      action: 'setValue',
      value: newValue
    });
    
    // Check if goal was completed and save completion progress
    if (result.is_completed || result.current_value >= 100) {
      const today = getCurrentDate();
      saveDailyProgress({
        goalId,
        date: today,
        progressValue: result.current_value,
        progressType: 'complete',
        timestamp: getCurrentDateTime(),
        notes: `Goal completed at ${Math.round(result.current_value)}%`
      });
    }
    
    return result;
  }

  async incrementCounterGoal(goalId: number): Promise<Goal> {
    const result = await this.updateGoalProgress({
      goalId,
      goalType: 'counter',
      action: 'increment'
    });
    
    // Check if goal was completed and save completion progress
    if (result.is_completed || result.current_value >= result.target_value) {
      const today = getCurrentDate();
      saveDailyProgress({
        goalId,
        date: today,
        progressValue: result.current_value,
        progressType: 'complete',
        timestamp: getCurrentDateTime(),
        notes: `Goal completed: ${result.current_value}/${result.target_value}`
      });
    }
    
    return result;
  }

  async setCounterGoalValue(goalId: number, newValue: number): Promise<Goal> {
    const result = await this.updateGoalProgress({
      goalId,
      goalType: 'counter',
      action: 'setValue',
      value: newValue
    });
    
    // Check if goal was completed and save completion progress
    if (result.is_completed || result.current_value >= result.target_value) {
      const today = getCurrentDate();
      saveDailyProgress({
        goalId,
        date: today,
        progressValue: result.current_value,
        progressType: 'complete',
        timestamp: getCurrentDateTime(),
        notes: `Goal completed: ${result.current_value}/${result.target_value}`
      });
    }
    
    return result;
  }

  async toggleChecklistGoal(goalId: number, complete: boolean): Promise<Goal> {
    const result = await this.updateGoalProgress({
      goalId,
      goalType: 'checklist',
      action: 'toggle',
      value: complete ? 1 : 0
    });
    
    // Save completion progress for checklist goals
    if (complete) {
      const today = getCurrentDate();
      saveDailyProgress({
        goalId,
        date: today,
        progressValue: 1,
        progressType: 'complete',
        timestamp: getCurrentDateTime(),
        notes: 'Checklist goal completed'
      });
    }
    
    return result;
  }
}

// Create and export service instance
export const goalsService = new GoalsService();
export default goalsService; 