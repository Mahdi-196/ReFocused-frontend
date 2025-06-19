import client from "@/api/client";
import { STUDY } from "@/api/endpoints";
import { cacheService, CacheKeys, CacheTTL, CacheInvalidation } from "./cacheService";
import logger from "@/utils/logger";

interface Card {
  id: string;
  front: string;
  back: string;
}

interface StudySet {
  id: string;
  name: string;
  cards: Card[];
  user_id?: string | number;
  last_updated?: string;
}

interface CreateStudySetRequest {
  title: string;
  cards: {
    front_content: string;
    back_content: string;
  }[];
}

interface UpdateStudySetRequest {
  title?: string;
  cards?: {
    front_content: string;
    back_content: string;
  }[];
}

// Get current user ID helper
function getCurrentUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const userData = localStorage.getItem('REF_USER');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id?.toString();
    }
  } catch (error) {
    console.error('Failed to get current user ID:', error);
  }
  
  return undefined;
}

// Check if endpoints are available
const isEndpointAvailable = (error: unknown): boolean => {
  const apiError = error as { code?: string; response?: { status?: number } };
  return !(apiError.code === 'ERR_NETWORK' || 
           apiError.response?.status === 404 || 
           apiError.response?.status === 500 ||
           apiError.response?.status === 502 ||
           apiError.response?.status === 503);
};

// Get all study sets (with enhanced caching)
export const getStudySets = async (): Promise<StudySet[]> => {
  const userId = getCurrentUserId();
  const cacheKey = CacheKeys.STUDY_SETS(userId);
  
  logger.debug('getStudySets called', { cacheKey }, 'STUDY');
  
  // Check cache first
  const cachedSets = cacheService.get<StudySet[]>(cacheKey);
  if (cachedSets) {
    logger.cacheHit(cacheKey);
    return cachedSets;
  }

  try {
    logger.cacheMiss(cacheKey);
    const response = await client.get(STUDY.SETS);
    
    if (response.status === 200 && response.data) {
      let fetchedSets: unknown = response.data;
      
      // Handle possible array wrapping
      const responseWithData = fetchedSets as { data?: unknown };
      if (!Array.isArray(fetchedSets) && fetchedSets && typeof fetchedSets === 'object' && responseWithData.data && Array.isArray(responseWithData.data)) {
        fetchedSets = responseWithData.data;
      }
      
      if (Array.isArray(fetchedSets)) {
        // Transform the backend data format to our frontend format
        const transformedSets: StudySet[] = (fetchedSets as unknown[]).map((rawSet: unknown) => {
          const set = rawSet as Record<string, unknown>;
          return {
          id: String(set.id),
          name: String(set.title || 'Untitled Set'),
          cards: ((set.cards as Record<string, unknown>[]) || []).map((card: Record<string, unknown>) => ({
            id: String(card.id),
            front: String(card.front_content || ''),
            back: String(card.back_content || '')
          })),
          user_id: typeof set.user_id === 'string' || typeof set.user_id === 'number' ? set.user_id : undefined,
          last_updated: String(set.updated_at || set.created_at)
        };
        });
        
        // Cache the results with user-specific key and appropriate TTL
        cacheService.set(cacheKey, transformedSets, CacheTTL.MEDIUM);
        logger.debug('Cached study sets', { 
          count: transformedSets.length, 
          ttlSeconds: CacheTTL.MEDIUM / 1000 
        }, 'STUDY');
        
        return transformedSets;
      }
    }
    
    return [];
  } catch (error: unknown) {
    console.warn('Study sets endpoint not available:', error);
    
    // Always return empty array if backend endpoint fails
    // This prevents errors from breaking the study page
    return [];
  }
};

// Create a new study set
export const createStudySet = async (studySetData: CreateStudySetRequest): Promise<StudySet> => {
  try {
    const response = await client.post(STUDY.SETS, studySetData);
    const newSet = response.data;
    
    // Invalidate study sets cache to force refresh
    const userId = getCurrentUserId();
    CacheInvalidation.invalidateStudyData(userId);
    
    // Transform backend response to frontend format
    return {
      id: newSet.id.toString(),
      name: newSet.title || 'Untitled Set',
      cards: (newSet.cards || []).map((rawCard: unknown) => {
        const card = rawCard as Record<string, unknown>;
        return {
          id: String(card.id),
          front: String(card.front_content || ''),
          back: String(card.back_content || '')
        };
      }),
      user_id: newSet.user_id,
      last_updated: newSet.updated_at || newSet.created_at
    };
  } catch (error: unknown) {
    console.error('Failed to create study set:', error);
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to create study set'
      : 'Failed to create study set';
    throw new Error(errorMessage);
  }
};

// Update a study set
export const updateStudySet = async (setId: string, updates: UpdateStudySetRequest): Promise<StudySet> => {
  try {
    const response = await client.put(STUDY.SET_DETAIL(setId), updates);
    const updatedSet = response.data;
    
    // Invalidate study sets cache to force refresh
    const userId = getCurrentUserId();
    CacheInvalidation.invalidateStudyData(userId);
    
    // Also invalidate specific set cache if it exists
    cacheService.delete(CacheKeys.STUDY_SET_DETAIL(setId));
    
    // Transform backend response to frontend format
    return {
      id: updatedSet.id.toString(),
      name: updatedSet.title || 'Untitled Set',
      cards: (updatedSet.cards || []).map((rawCard: unknown) => {
        const card = rawCard as Record<string, unknown>;
        return {
          id: String(card.id),
          front: String(card.front_content || ''),
          back: String(card.back_content || '')
        };
      }),
      user_id: updatedSet.user_id,
      last_updated: updatedSet.updated_at || updatedSet.created_at
    };
  } catch (error: unknown) {
    console.error('Failed to update study set:', error);
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to update study set'
      : 'Failed to update study set';
    throw new Error(errorMessage);
  }
};

// Delete a study set
export const deleteStudySet = async (setId: string): Promise<void> => {
  try {
    await client.delete(STUDY.SET_DETAIL(setId));
    
    // Invalidate study sets cache to force refresh
    const userId = getCurrentUserId();
    CacheInvalidation.invalidateStudyData(userId);
    
    // Also invalidate specific set cache if it exists
    cacheService.delete(CacheKeys.STUDY_SET_DETAIL(setId));
  } catch (error: unknown) {
    console.error('Failed to delete study set:', error);
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to delete study set'
      : 'Failed to delete study set';
    throw new Error(errorMessage);
  }
};

// Add a card to a study set
export const addCardToSet = async (setId: string, cardData: { front_content: string; back_content: string }): Promise<unknown> => {
  try {
    const response = await client.post(STUDY.CARDS(setId), cardData);
    
    // Invalidate study sets cache to force refresh
    const userId = getCurrentUserId();
    CacheInvalidation.invalidateStudyData(userId);
    
    // Also invalidate specific set cache if it exists
    cacheService.delete(CacheKeys.STUDY_SET_DETAIL(setId));
    
    return response.data;
  } catch (error: unknown) {
    console.error('Failed to add card to study set:', error);
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to add card to study set'
      : 'Failed to add card to study set';
    throw new Error(errorMessage);
  }
};

// Delete a card from a study set
export const deleteCardFromSet = async (setId: string, cardId: string): Promise<void> => {
  try {
    await client.delete(STUDY.CARD_DETAIL(setId, cardId));
    
    // Invalidate study sets cache to force refresh
    const userId = getCurrentUserId();
    CacheInvalidation.invalidateStudyData(userId);
    
    // Also invalidate specific set cache if it exists
    cacheService.delete(CacheKeys.STUDY_SET_DETAIL(setId));
  } catch (error: unknown) {
    console.error('Failed to delete card from study set:', error);
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to delete card from study set'
      : 'Failed to delete card from study set';
    throw new Error(errorMessage);
  }
};

// Get a specific study set (with caching)
export const getStudySet = async (setId: string): Promise<StudySet | null> => {
  const cacheKey = CacheKeys.STUDY_SET_DETAIL(setId);
  
  // Check cache first
  const cachedSet = cacheService.get<StudySet>(cacheKey);
  if (cachedSet) {
    console.log('✅ Using cached study set:', setId);
    return cachedSet;
  }

  try {
    const response = await client.get(STUDY.SET_DETAIL(setId));
    const set = response.data;
    
    // Transform backend response to frontend format
    const transformedSet: StudySet = {
      id: set.id.toString(),
      name: set.title || 'Untitled Set',
      cards: (set.cards || []).map((rawCard: unknown) => {
        const card = rawCard as Record<string, unknown>;
        return {
          id: String(card.id),
          front: String(card.front_content || ''),
          back: String(card.back_content || '')
        };
      }),
      user_id: set.user_id,
      last_updated: set.updated_at || set.created_at
    };
    
    // Cache the result
    cacheService.set(cacheKey, transformedSet, CacheTTL.MEDIUM);
    
    return transformedSet;
  } catch (error: unknown) {
    console.error('Failed to get study set:', error);
    
    if (error instanceof Error && 'response' in error && (error as {response?: {status?: number}}).response?.status === 404) {
      return null;
    }
    
    if (!isEndpointAvailable(error)) {
      throw new Error('Study sets backend not available yet');
    }
    
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to get study set'
      : 'Failed to get study set';
    throw new Error(errorMessage);
  }
};

// Force refresh study sets from database
export const refreshStudySets = async (): Promise<void> => {
  const userId = getCurrentUserId();
  CacheInvalidation.invalidateStudyData(userId);
}; 