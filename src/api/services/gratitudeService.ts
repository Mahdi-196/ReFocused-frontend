import client from '../client';
import { JOURNAL } from '../endpoints';
import { initializeAuth } from '../client';

export interface Gratitude {
  id: number;
  user_id: number;
  text: string;
  date: string;
  created_at: string;
}

export interface CreateGratitudeRequest {
  text: string;
  date?: string;
}

export interface GratitudeResponse {
  gratitude_entries: Gratitude[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GetGratitudeParams {
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * Retry helper for API calls with authentication refresh
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on 401 errors and if we have attempts left
      if (error.response?.status === 401 && attempt < maxRetries) {
        console.log(`🔄 [GRATITUDE RETRY] Attempt ${attempt + 1} failed with 401, refreshing auth and retrying...`);
        
        // Refresh authentication
        try {
          await initializeAuth();
          // Small delay to let auth settle
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (authError) {
          console.error('❌ [GRATITUDE RETRY] Auth refresh failed:', authError);
          throw lastError; // Throw original error if auth refresh fails
        }
      } else {
        // Don't retry for non-401 errors or if out of attempts
        throw error;
      }
    }
  }
  
  throw lastError;
};

/**
 * Create a new gratitude entry
 */
export const createGratitude = async (gratitudeData: CreateGratitudeRequest): Promise<Gratitude> => {
  try {
    const response = await withRetry(async () => {
      return await client.post(JOURNAL.GRATITUDE, gratitudeData);
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ [GRATITUDE SERVICE] Failed to create gratitude:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create gratitude entry');
  }
};

/**
 * Get gratitude entries with optional filtering and pagination
 */
export const getGratitudeEntries = async (params: GetGratitudeParams = {}): Promise<GratitudeResponse> => {
  try {
    // Check authentication before making request
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    console.log('🔐 [GRATITUDE API] Auth check:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
      tokenLength: token?.length || 0
    });

    // Build query parameters according to API docs - order matters for some APIs
    const queryParams = new URLSearchParams();
    
    // Add skip first
    if (params.skip !== undefined) {
      queryParams.append('skip', params.skip.toString());
    }
    
    // Add limit second  
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    
    // Add date filters last
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }

    const url = `${JOURNAL.GRATITUDE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔍 [GRATITUDE API] Fetching gratitudes with parameters:', params);
    console.log('🔍 [GRATITUDE API] Final URL:', url);
    
    const response = await withRetry(async () => {
      return await client.get(url);
    });
    console.log('✅ [GRATITUDE API] Raw response:', response.data);
    console.log('✅ [GRATITUDE API] Gratitude entries count:', response.data?.gratitude_entries?.length || 0);
    
    if (response.data?.gratitude_entries?.length > 0) {
      console.log('🙏 [GRATITUDE API] Filtered gratitude entries:');
      response.data.gratitude_entries.forEach((gratitude: Gratitude, index: number) => {
        console.log(`  ${index + 1}. Date: ${gratitude.date}, Text: "${gratitude.text}", ID: ${gratitude.id}`);
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [GRATITUDE SERVICE] Failed to fetch gratitude entries:', error);
    console.error('❌ [GRATITUDE SERVICE] Error details:', error.response?.data);
    console.error('❌ [GRATITUDE SERVICE] Request URL:', error.config?.url);
    console.error('❌ [GRATITUDE SERVICE] Request headers:', error.config?.headers);
    
    // Don't return fallback data - let errors propagate
    
    throw new Error(error.response?.data?.detail || 'Failed to fetch gratitude entries');
  }
};

/**
 * Get gratitude entries for a specific date
 */
export const getGratitudeByDate = async (date: string): Promise<Gratitude[]> => {
  try {
    const response = await getGratitudeEntries({
      start_date: date,
      end_date: date,
      limit: 100
    });
    return response.gratitude_entries;
  } catch (error: any) {
    console.error('❌ [GRATITUDE SERVICE] Failed to fetch gratitude for date:', date, error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch gratitude entries for date');
  }
};

/**
 * Get recent gratitude entries (default 20 most recent)
 */
export const getRecentGratitude = async (limit: number = 20): Promise<Gratitude[]> => {
  try {
    const response = await getGratitudeEntries({ limit });
    return response.gratitude_entries;
  } catch (error: any) {
    console.error('❌ [GRATITUDE SERVICE] Failed to fetch recent gratitude:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch recent gratitude entries');
  }
};