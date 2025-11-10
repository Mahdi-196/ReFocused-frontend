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
   * Fetch active goals and recently completed goals
   * Backend tests show we should get ALL goals and filter on frontend
   */
  async getActiveAndRecentGoals(duration?: GoalDuration): Promise<Goal[]> {
    // Based on backend tests: get ALL goals without date filtering
    // Let frontend handle all visibility logic
    const params: GoalsListParams = {
      include_completed: true,
      // Remove time restrictions - get all completed goals
      // Remove expired restrictions - get all goals
    };
    
    if (duration) {
      params.duration = duration;
    }
    
    console.log('🔄 [GOALS_SERVICE] getActiveAndRecentGoals params:', params);
    
    const allGoals = await this.getAllGoals(params);
    
    console.log('📊 [GOALS_SERVICE] Raw goals from backend:', allGoals.length);
    
    // Frontend filtering now properly handles:
    // - 2-week goals: visible until expired (after 2 weeks)
    // - Long-term goals: visible forever
    // - Completed goals: visible for 24 hours only
    const filteredGoals = allGoals.filter(goal => {
      const isVisible = isGoalVisibleInMainView(goal);
      console.log('🔍 [GOALS_SERVICE] Goal visibility check:', {
        id: goal.id,
        name: goal.name,
        duration: goal.duration,
        is_completed: goal.is_completed,
        completed_at: goal.completed_at,
        expires_at: goal.expires_at,
        isVisible
      });
      return isVisible;
    });
    
    console.log('✅ [GOALS_SERVICE] Filtered goals:', filteredGoals.length);
    
    return filteredGoals;
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
      console.log('🔍 [GOALS_SERVICE] Making request to:', url);
      
      const response = await client.get<GoalsHistoryResponse>(url);
      
      console.log('🔍 [GOALS_SERVICE] Raw API response:', response);
      console.log('🔍 [GOALS_SERVICE] Response.status:', response.status);
      console.log('🔍 [GOALS_SERVICE] Response.statusText:', response.statusText);
      console.log('🔍 [GOALS_SERVICE] Response.data:', response.data);
      console.log('🔍 [GOALS_SERVICE] Response.data type:', typeof response.data);
      console.log('🔍 [GOALS_SERVICE] Response.data keys:', response.data ? Object.keys(response.data) : 'null');
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      console.log('🔍 [GOALS_SERVICE] Goals array:', response.data.goals);
      console.log('🔍 [GOALS_SERVICE] Goals array type:', typeof response.data.goals);
      console.log('🔍 [GOALS_SERVICE] Is goals array?', Array.isArray(response.data.goals));
      
      // Ensure goals is always an array
      if (!Array.isArray(response.data.goals)) {
        console.warn('🔍 [GOALS_SERVICE] Goals is not an array, converting to empty array');
        response.data.goals = [];
      }
      
      // Log each goal for debugging
      response.data.goals.forEach((goal, index) => {
        console.log(`🔍 [GOALS_SERVICE] Goal ${index}:`, {
          id: goal.id,
          name: goal.name,
          goal_type: goal.goal_type,
          completed_at: goal.completed_at,
          completion_days: goal.completion_days
        });
      });
      
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
      
      console.log('🎯 [GOALS_SERVICE] getGoalsWithDailyProgress called:', {
        startDate,
        endDate,
        start: start.toISOString(),
        today: today.toISOString(),
        daysDiff,
        willFetchHistory: true
      });
      
      // Fetch goals with extended time range
      const [currentGoals, historicalGoals] = await Promise.all([
        this.getAllGoals({
          include_completed: true,
          include_expired: true,
          completed_within_hours: Math.max(24, daysDiff * 24)
        }),
        
        // Always fetch goals history for debugging - remove daysDiff check temporarily
        this.getGoalsHistory({
          days_back: Math.max(30, Math.abs(daysDiff) + 7), // Use absolute value and minimum 30 days
          limit: 100
        }).then(response => response.goals).catch(() => [])
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
      
      // Only use real progress data from localStorage - no fallback data
      
      console.log('🎯 [GOALS_SERVICE] Daily progress analysis:', {
        startDate,
        endDate,
        allProgressEntries: allProgress.length,
        relevantProgressEntries: relevantProgress.length,
        allProgress: allProgress,
        relevantProgress: relevantProgress,
        goalsWithProgress: allGoals.filter(g => g.current_value > 0).length
      });
      
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
   * Create a new goal
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    try {
      // Debug logging to help identify the issue
      console.log('🔍 GOALS_SERVICE.createGoal - request:', request);
      console.log('🔍 GOALS_SERVICE.createGoal - request.name type:', typeof request.name, 'value:', request.name);
      
      // Validate input
      const validationError = validateGoalInput(request.name, request.goal_type, request.duration, request.target_value);
      if (validationError) {
        throw new Error(validationError);
      }

      // Sanitize name
      const sanitizedName = sanitizeGoalName(request.name);

      const goalData = {
        name: sanitizedName,
        goal_type: request.goal_type,
        duration: request.duration,
        target_value: request.target_value
      };

      logger.info('Creating new goal', goalData, 'GOALS_SERVICE');
      
      console.log('🔍 CREATE GOAL REQUEST:', { 
        method: 'POST', 
        url: GOALS.CREATE, 
        payload: goalData 
      });
      
      const response = await client.post<Goal>(GOALS.CREATE, goalData);
      
      console.log('📡 CREATE GOAL RESPONSE:', { 
        url: GOALS.CREATE, 
        status: response.status, 
        data: response.data 
      });
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      
      const newGoal = response.data;
      
      // Dispatch event to notify calendar and other components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('goalCreated', {
          detail: {
            goalId: newGoal.id,
            goal: newGoal,
            goalType: newGoal.goal_type,
            duration: newGoal.duration
          }
        });
        window.dispatchEvent(event);
        console.log('📢 Dispatched goalCreated event:', event.detail);
      }
      
      logger.info('Successfully created goal', { goalId: newGoal.id }, 'GOALS_SERVICE');
      return newGoal;
    } catch (error) {
      logger.error('Failed to create goal', error, 'GOALS_SERVICE');
      throw new Error('Unable to create goal. Please try again.');
    }
  }

  /**
   * Update goal progress with proper backend integration
   */
  async updateGoalProgress(payload: GoalProgressUpdatePayload): Promise<Goal> {
    try {
      const { goalId, goalType, action, value } = payload;
      
      // Get current goal to save previous progress value
      let previousProgress = 0;
      try {
        const currentGoal = await this.getGoalById(goalId);
        previousProgress = currentGoal.current_value || 0;
        console.log('📊 Previous progress value from backend:', previousProgress, 'for goal', goalId);
        
        // Store this value as the "previous" value for the next update
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('goal_previous_values');
            const previousValues = stored ? JSON.parse(stored) : {};
            previousValues[goalId] = previousProgress;
            localStorage.setItem('goal_previous_values', JSON.stringify(previousValues));
            console.log('📊 Stored current value as previous for next update:', previousProgress, 'for goal', goalId);
          } catch (error) {
            console.warn('Could not store previous value:', error);
          }
        }
        
        // If we got 0 from backend, try to get from localStorage as fallback for display
        if (previousProgress === 0 && typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('goal_previous_values');
            if (stored) {
              const previousValues = JSON.parse(stored);
              const storedValue = previousValues[goalId];
              if (storedValue !== undefined && storedValue > 0) {
                previousProgress = storedValue;
                console.log('📊 Using stored previous value for display:', previousProgress, 'for goal', goalId);
              }
            }
          } catch (error) {
            console.warn('Could not get stored previous value:', error);
          }
        }
      } catch (error) {
        console.warn('Could not get previous progress value from backend:', error);
        
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('goal_previous_values');
            if (stored) {
              const previousValues = JSON.parse(stored);
              const storedValue = previousValues[goalId];
              if (storedValue !== undefined) {
                previousProgress = storedValue;
                console.log('📊 Using stored previous value as fallback:', previousProgress, 'for goal', goalId);
              }
            }
          } catch (error) {
            console.warn('Could not get stored previous value as fallback:', error);
          }
        }
      }
      
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

      logger.info('Updating goal progress', { goalId, action, previousProgress }, 'GOALS_SERVICE');
      
      console.log('🔍 UPDATE PROGRESS REQUEST:', { 
        method: 'PATCH', 
        url: GOALS.PROGRESS(goalId), 
        payload: updateRequest,
        goalId,
        goalType,
        action,
        value,
        previousProgress
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
      
      // Calculate progress change for better notes
      const progressChange = Math.abs(progressValue - previousProgress);
      const isIncrease = progressValue > previousProgress;
      const direction = isIncrease ? 'gained' : 'lost';
      
      console.log('📊 PROGRESS CALCULATION:', {
        goalId,
        previousProgress,
        progressValue,
        progressChange,
        isIncrease,
        direction
      });
      
      saveDailyProgress({
        goalId,
        date: today,
        progressValue,
        progressType,
        timestamp: getCurrentDateTime(),
        notes: isCompleted 
          ? `Goal completed!`
          : progressChange > 0
          ? goalType === 'percentage' 
            ? `You ${direction} ${Math.round(progressChange)}% progress`
            : goalType === 'counter'
            ? `You ${direction} ${Math.round(progressChange)}% progress (${progressValue}/${response.data.target_value})`
            : goalType === 'checklist'
            ? (progressValue === 1 ? 'Completed' : 'Pending')
            : `You ${direction} ${Math.round(progressChange)}% progress`
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
      
      // Dispatch event to notify calendar and other components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('goalProgressUpdated', {
          detail: {
            goalId,
            goal: response.data,
            action,
            previousValue: previousProgress,
            newValue: progressValue,
            isCompleted,
            progressType,
            progressChange,
            isIncrease
          }
        });
        window.dispatchEvent(event);
        console.log('📢 Dispatched goalProgressUpdated event:', event.detail);
      }
      
      logger.info('Goal progress updated successfully', { 
        goalId, 
        previousValue: previousProgress,
        newValue: progressValue,
        change: progressChange,
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

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: number): Promise<void> {
    try {
      logger.info('Deleting goal', { goalId }, 'GOALS_SERVICE');
      await client.delete(GOALS.DELETE(goalId));

      // Dispatch event to notify components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('goalDeleted', {
          detail: { goalId }
        });
        window.dispatchEvent(event);
        console.log('📢 Dispatched goalDeleted event:', event.detail);
      }

      logger.info('Successfully deleted goal', { goalId }, 'GOALS_SERVICE');
    } catch (error) {
      logger.error('Failed to delete goal', error, 'GOALS_SERVICE');
      throw new Error('Unable to delete goal. Please try again.');
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
    
    // Event already dispatched by updateGoalProgress
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
    
    // Event already dispatched by updateGoalProgress
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
    
    // Event already dispatched by updateGoalProgress
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
    
    // Event already dispatched by updateGoalProgress
    return result;
  }
}

// Create and export service instance
export const goalsService = new GoalsService();
export default goalsService; 