import client from "@/api/client";
import { STATISTICS } from "@/api/endpoints";
import logger from "@/utils/logger";

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
function logApiError(endpoint: string, error: unknown, payload?: unknown) {
  const apiError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  logger.error(`API Error - Endpoint: ${endpoint}`, {
    endpoint,
    payload,
    status: apiError.response?.status,
    data: apiError.response?.data,
    message: apiError.response?.data?.message || apiError.message
  }, 'API');
  
  if (apiError.response?.status === 422) {
    const response = apiError.response as { 
      status: number; 
      statusText?: string; 
      data?: { detail?: unknown; errors?: unknown; message?: string };
      headers?: unknown;
    };
    const config = (apiError as { config?: { method?: string; url?: string; data?: unknown } }).config;
    
    logger.error('API Validation Error (422)', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      config: {
        method: config?.method,
        url: config?.url,
        data: config?.data
      }
    }, 'API');
    
    // Try to parse and show validation errors with more detail
    if (response.data?.detail) {
      logger.error('Validation errors', response.data.detail, 'API');
      
      // If it's an array, expand each item
      if (Array.isArray(response.data.detail)) {
        response.data.detail.forEach((errorItem: { loc?: unknown; msg?: unknown; type?: unknown; input?: unknown }, index: number) => {
          logger.error(`Validation Error ${index + 1}`, {
            location: errorItem.loc,
            message: errorItem.msg,
            type: errorItem.type,
            input: errorItem.input
          }, 'API');
        });
      }
    }
    if (response.data?.errors) {
      logger.error('Field errors', response.data.errors, 'API');
    }
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
      logger.apiCall(STATISTICS.BASE, 'GET', { startDate, endDate });
      const response = await client.get<StatisticsEntry[]>(STATISTICS.BASE, {
        params: { startDate, endDate }
      });
      logger.info(`Statistics retrieved: ${response.data?.length || 0} entries`, undefined, 'API');
      return response.data || [];
    } catch (error: unknown) {
      logApiError(STATISTICS.BASE, error, { startDate, endDate });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to load statistics from server.'
        : 'Failed to load statistics from server.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Add focus time
   */
  async addFocusTime(minutes: number): Promise<StatisticsEntry> {
    try {
      logger.apiCall(STATISTICS.FOCUS, 'POST', { minutes });
      const response = await client.post<StatisticsEntry>(STATISTICS.FOCUS, {
        minutes: minutes  // Backend expects: {"minutes": int}
      });
      logger.info('Focus time added successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.FOCUS, error, { minutes });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record focus time.'
        : 'Failed to record focus time.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Increment sessions
   */
  async incrementSessions(count: number = 1): Promise<StatisticsEntry> {
    try {
      logger.apiCall(STATISTICS.SESSIONS, 'POST', { increment: count });
      const response = await client.post<StatisticsEntry>(STATISTICS.SESSIONS, {
        increment: count  // Backend expects: {"increment": int}
      });
      logger.info('Sessions incremented successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.SESSIONS, error, { increment: count });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record session.'
        : 'Failed to record session.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Increment tasks
   */
  async incrementTasks(count: number = 1): Promise<StatisticsEntry> {
    try {
      logger.apiCall(STATISTICS.TASKS, 'POST', { increment: count });
      const response = await client.post<StatisticsEntry>(STATISTICS.TASKS, {
        increment: count  // Backend expects: {"increment": int}
      });
      logger.info('Tasks incremented successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(STATISTICS.TASKS, error, { increment: count });
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to record task completion.'
        : 'Failed to record task completion.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update statistics for a specific date
   */
  async updateStatistics(date: string, updates: StatisticsRequest): Promise<StatisticsEntry> {
    try {
      logger.apiCall(`${STATISTICS.BASE}/${date}`, 'PUT', updates);
      const response = await client.put<StatisticsEntry>(`${STATISTICS.BASE}/${date}`, updates);
      logger.info('Statistics updated successfully', undefined, 'API');
      return response.data;
    } catch (error: unknown) {
      logApiError(`${STATISTICS.BASE}/${date}`, error, updates);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to update statistics.'
        : 'Failed to update statistics.';
      throw new Error(errorMessage);
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
      logger.warn('Health check failed - API not available', error, 'API');
      return false;
    }
  }
}; 