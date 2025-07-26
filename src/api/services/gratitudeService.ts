import client from '../client';
import { JOURNAL } from '../endpoints';

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
 * Create a new gratitude entry
 */
export const createGratitude = async (gratitudeData: CreateGratitudeRequest): Promise<Gratitude> => {
  try {
    const response = await client.post(JOURNAL.GRATITUDE, gratitudeData);
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
    // Backend doesn't support query parameters - always use simple GET
    const url = JOURNAL.GRATITUDE;
    
    console.log('🔍 [GRATITUDE API] Fetching ALL gratitudes from:', url);
    console.log('🔍 [GRATITUDE API] Note: Backend filtering not supported, fetching all entries');
    
    const response = await client.get(url);
    console.log('✅ [GRATITUDE API] Raw response:', response.data);
    console.log('✅ [GRATITUDE API] Gratitude entries count:', response.data?.gratitude_entries?.length || 0);
    
    if (response.data?.gratitude_entries?.length > 0) {
      console.log('🙏 [GRATITUDE API] All gratitude entries:');
      response.data.gratitude_entries.forEach((gratitude, index) => {
        console.log(`  ${index + 1}. Date: ${gratitude.date}, Text: "${gratitude.text}", ID: ${gratitude.id}`);
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [GRATITUDE SERVICE] Failed to fetch gratitude entries:', error);
    console.error('❌ [GRATITUDE SERVICE] Error details:', error.response?.data);
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