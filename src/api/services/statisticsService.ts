import client from "@/api/client";
import { STATISTICS } from "@/api/endpoints";

/**
 * Statistics API Models - Backend Response Types
 */
export interface StatisticsEntry {
  id: number;
  user_id: number;
  focus_time: number; // minutes
  sessions: number;
  tasks_done: number;
  date: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

export interface StatisticsRequest {
  focus_time?: number;
  sessions?: number;
  tasks_done?: number;
  date?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Enhanced error logging for debugging API issues
 */
function logApiError(endpoint: string, error: any, payload?: any) {
  console.error(`🔍 [API DEBUG] Endpoint: ${endpoint}`);
  console.error(`🔍 [API DEBUG] Payload sent:`, payload);
  console.error(`🔍 [API DEBUG] Error status:`, error.response?.status);
  console.error(`🔍 [API DEBUG] Error data:`, error.response?.data);
  console.error(`🔍 [API DEBUG] Error message:`, error.response?.data?.message || error.message);
  
  if (error.response?.status === 422) {
    console.error(`🔍 [API DEBUG] 422 Details:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      }
    });
    
    // Try to parse and show validation errors with more detail
    if (error.response.data?.detail) {
      console.error(`🔍 [API DEBUG] Validation errors:`, error.response.data.detail);
      
      // If it's an array, expand each item
      if (Array.isArray(error.response.data.detail)) {
        error.response.data.detail.forEach((errorItem: any, index: number) => {
          console.error(`🔍 [API DEBUG] Validation Error ${index + 1}:`, errorItem);
          if (errorItem.loc) console.error(`🔍 [API DEBUG] Field Location:`, errorItem.loc);
          if (errorItem.msg) console.error(`🔍 [API DEBUG] Error Message:`, errorItem.msg);
          if (errorItem.type) console.error(`🔍 [API DEBUG] Error Type:`, errorItem.type);
          if (errorItem.input) console.error(`🔍 [API DEBUG] Input Value:`, errorItem.input);
        });
      }
    }
    if (error.response.data?.errors) {
      console.error(`🔍 [API DEBUG] Field errors:`, error.response.data.errors);
    }
    
    // Show the full error object structure
    console.error(`🔍 [API DEBUG] Full Error Object Keys:`, Object.keys(error.response.data));
  }
}

/**
 * Statistics API Service
 * Pure API layer - no caching, no business logic
 */
export const statisticsApiService = {
  /**
   * Get statistics for a specific date range
   */
  async getStatistics(startDate: string, endDate: string): Promise<StatisticsEntry[]> {
    try {
      console.log(`🌐 [API] GET statistics: ${startDate} to ${endDate}`);
      const response = await client.get<StatisticsEntry[]>(STATISTICS.BASE, {
        params: { startDate, endDate }
      });
      console.log(`✅ [API] Statistics retrieved: ${response.data?.length || 0} entries`);
      return response.data || [];
    } catch (error: any) {
      logApiError(STATISTICS.BASE, error, { startDate, endDate });
      throw new Error(error.response?.data?.message || 'Failed to load statistics from server.');
    }
  },

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number): Promise<StatisticsEntry> {
    try {
      console.log(`🌐 [API] POST focus time: ${minutes} minutes`);
      const response = await client.post<StatisticsEntry>(STATISTICS.FOCUS, {
        minutes: minutes  // Backend expects: {"minutes": int}
      });
      console.log(`✅ [API] Focus time added successfully`);
      return response.data;
    } catch (error: any) {
      logApiError(STATISTICS.FOCUS, error, { minutes });
      throw new Error(error.response?.data?.message || 'Failed to record focus time.');
    }
  },

  /**
   * Increment sessions
   */
  async incrementSessions(count: number = 1): Promise<StatisticsEntry> {
    try {
      console.log(`🌐 [API] POST sessions: increment by ${count}`);
      const response = await client.post<StatisticsEntry>(STATISTICS.SESSIONS, {
        increment: count  // Backend expects: {"increment": int}
      });
      console.log(`✅ [API] Sessions incremented successfully`);
      return response.data;
    } catch (error: any) {
      logApiError(STATISTICS.SESSIONS, error, { increment: count });
      throw new Error(error.response?.data?.message || 'Failed to record session.');
    }
  },

  /**
   * Increment tasks
   */
  async incrementTasks(count: number = 1): Promise<StatisticsEntry> {
    try {
      console.log(`🌐 [API] POST tasks: increment by ${count}`);
      const response = await client.post<StatisticsEntry>(STATISTICS.TASKS, {
        increment: count  // Backend expects: {"increment": int}
      });
      console.log(`✅ [API] Tasks incremented successfully`);
      return response.data;
    } catch (error: any) {
      logApiError(STATISTICS.TASKS, error, { increment: count });
      throw new Error(error.response?.data?.message || 'Failed to record task completion.');
    }
  },

  /**
   * Update statistics for a specific date
   */
  async updateStatistics(date: string, updates: StatisticsRequest): Promise<StatisticsEntry> {
    try {
      console.log(`🌐 [API] PUT statistics for ${date}:`, updates);
      const response = await client.put<StatisticsEntry>(`${STATISTICS.BASE}/${date}`, updates);
      console.log(`✅ [API] Statistics updated successfully`);
      return response.data;
    } catch (error: any) {
      logApiError(`${STATISTICS.BASE}/${date}`, error, updates);
      throw new Error(error.response?.data?.message || 'Failed to update statistics.');
    }
  },

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.getStatistics(today, today);
      return true;
    } catch (error) {
      console.warn('🔍 [API] Health check failed - API not available');
      return false;
    }
  }
}; 