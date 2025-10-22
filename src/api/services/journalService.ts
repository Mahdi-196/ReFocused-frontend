import client, { collectionTokens } from '../client';
import { JOURNAL } from '../endpoints';
import { timeService } from '@/services/timeService';
import { clearCalendarCache } from '@/services/calendarService';
import type {
  Collection,
  Entry,
  GratitudeEntry,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  CreateGratitudeRequest,
  UpdateGratitudeRequest,
  CollectionResponse,
  EntryResponse,
  GratitudeResponse,
  PaginatedCollectionsResponse,
  PaginatedEntriesResponse,
  PaginatedGratitudeResponse,
  PasswordVerificationResponse,
  JournalStatsResponse,
  JournalApiError,
} from '../../app/journal/types';

/**
 * Journal Service
 * Handles all journal-related API operations including collections, entries, and gratitude
 */
class JournalService {
  // Fallback token storage methods
  private storeCollectionToken(collectionId: string, token: string) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        const tokens = stored ? JSON.parse(stored) : {};
        tokens[collectionId] = token;
        localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
        console.log('🔐 Fallback: Stored access token for collection:', collectionId);
      } catch (error) {
        console.error('🔐 Fallback: Failed to store collection token:', error);
      }
    }
  }

  private getCollectionToken(collectionId: string): string | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        const tokens = stored ? JSON.parse(stored) : {};
        return tokens[collectionId] || null;
      } catch (error) {
        console.warn('🔐 Fallback: Failed to get collection token:', error);
        return null;
      }
    }
    return null;
  }

  // Collection Operations
  async getCollections(): Promise<Collection[]> {
    try {
      console.log('📡 Making request to:', JOURNAL.COLLECTIONS);
      const response = await client.get<PaginatedCollectionsResponse>(JOURNAL.COLLECTIONS);
      
      console.log('✅ Received response, status:', response.status);
      console.log('📦 Raw response.data:', response.data);
      
      // Handle paginated response format
      const responseData = response.data;
      let collectionsData: CollectionResponse[] = [];
      
      if (responseData.collections && Array.isArray(responseData.collections)) {
        collectionsData = responseData.collections;
        console.log('✅ Found collections in paginated response, count:', collectionsData.length);
      } else if (Array.isArray(responseData)) {
        // Fallback for direct array response
        collectionsData = responseData as CollectionResponse[];
        console.log('✅ Found direct array response, count:', collectionsData.length);
      } else {
        console.warn('❌ Unexpected collections response format:', responseData);
        return [];
      }
      
      const result = this.mapCollectionsResponse(collectionsData);
      console.log('✅ mapCollectionsResponse completed, result length:', result.length);
      return result;
      
    } catch (error: any) {
      console.error('💥 Collections API error (full):', error);
      console.error('💥 Error message:', error?.message);
      console.error('💥 Error response status:', error?.response?.status);
      console.error('💥 Error response data:', error?.response?.data);
      
      // For network errors, return empty array instead of throwing
      if (error?.isNetworkError || error?.code === 'ECONNABORTED') {
        console.warn('🌐 Network error detected, returning empty collections');
        return [];
      }
      
      throw this.handleError(error, 'Failed to fetch collections');
    }
  }

  async getCollection(id: string): Promise<Collection> {
    try {
      const response = await client.get<CollectionResponse>(JOURNAL.COLLECTION_DETAIL(id));
      const entriesResponse = await client.get<PaginatedEntriesResponse>(JOURNAL.COLLECTION_ENTRIES(id));

      // Handle paginated entries response
      const entriesData = entriesResponse.data.entries || [];

      return {
        ...this.mapCollectionResponse(response.data),
        entries: this.mapEntriesResponse(entriesData),
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch collection');
    }
  }

  async createCollection(data: CreateCollectionRequest): Promise<Collection> {
    try {
      const response = await client.post<CollectionResponse>(JOURNAL.COLLECTIONS, data);
      return this.mapCollectionResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create collection');
    }
  }

  async updateCollection(id: string, data: UpdateCollectionRequest): Promise<Collection> {
    try {
      const response = await client.put<CollectionResponse>(JOURNAL.COLLECTION_DETAIL(id), data);
      return this.mapCollectionResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update collection');
    }
  }

  async deleteCollection(id: string): Promise<void> {
    try {
      await client.delete(JOURNAL.COLLECTION_DETAIL(id));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete collection');
    }
  }

  async verifyCollectionPassword(id: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 Verifying password for collection:', id);
      console.log('🔐 Password length:', password?.length);
      console.log('🔐 Calling endpoint:', JOURNAL.COLLECTION_VERIFY_PASSWORD(id));
      
      const response = await client.post<PasswordVerificationResponse>(
        JOURNAL.COLLECTION_VERIFY_PASSWORD(id),
        { password }
      );
      
      console.log('🔐 Password verification response:', response.data);
      console.log('🔐 Response status:', response.status);
      
      // If verification successful and we get an access token, store it
      if (response.data.valid && response.data.access_token) {
        console.log('🔐 Password valid, about to store access token');
        
        try {
          // Try imported collectionTokens first, then fallback
          if (collectionTokens && typeof collectionTokens.store === 'function') {
            console.log('🔐 Using imported collectionTokens.store');
            collectionTokens.store(id, response.data.access_token);
          } else {
            console.log('🔐 Using fallback token storage');
            this.storeCollectionToken(id, response.data.access_token);
          }
          console.log('🔐 Access token stored successfully');
        } catch (storeError) {
          console.error('🔐 Error storing access token:', storeError);
          console.log('🔐 Trying fallback storage method...');
          try {
            this.storeCollectionToken(id, response.data.access_token);
            console.log('🔐 Fallback storage successful');
          } catch (fallbackError) {
            console.error('🔐 Fallback storage also failed:', fallbackError);
          }
        }
      }
      
      return response.data.valid;
    } catch (error: any) {
      console.error('🔐 Password verification error:', error);
      console.error('🔐 Error status:', error?.response?.status);
      console.error('🔐 Error data:', error?.response?.data);
      
      // Let 401/403 errors bubble up to trigger redirect to landing page
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('🔐 Authentication/authorization failed - will redirect to landing page');
        throw error;
      }
      
      console.error('🔐 Unexpected error during password verification:', error);
      return false;
    }
  }

  // Entry Operations
  async getEntries(collectionId?: string): Promise<Entry[]> {
    try {
      const url = collectionId 
        ? JOURNAL.COLLECTION_ENTRIES(collectionId)
        : JOURNAL.ENTRIES;
        
      // Add access token header for private collections
      const headers: Record<string, string> = {};
      if (collectionId) {
        const accessToken = this.getCollectionToken(collectionId);
        if (accessToken) {
          headers['X-Collection-Access-Token'] = accessToken;
          console.log('🔐 Adding access token for collection:', collectionId);
        }
      }
      
      const response = await client.get<PaginatedEntriesResponse>(url, { headers });
      
      // Handle paginated entries response
      const responseData = response.data;
      let entriesData: EntryResponse[] = [];
      
      if (responseData.entries && Array.isArray(responseData.entries)) {
        entriesData = responseData.entries;
        console.log('✅ ENTRIES: Found entries in paginated response, count:', entriesData.length);
      } else if (Array.isArray(responseData)) {
        // Fallback for direct array response
        entriesData = responseData as EntryResponse[];
        console.log('✅ ENTRIES: Found direct array response, count:', entriesData.length);
      } else {
        console.warn('❌ ENTRIES: Unexpected response format:', responseData);
        return [];
      }
      
      return this.mapEntriesResponse(entriesData);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch entries');
    }
  }

  async getEntry(id: string, collectionId?: string): Promise<Entry> {
    try {
      // Add access token header for private collections if collectionId provided
      const headers: Record<string, string> = {};
      if (collectionId) {
        const accessToken = this.getCollectionToken(collectionId);
        if (accessToken) {
          headers['X-Collection-Access-Token'] = accessToken;
          console.log('🔐 [GET ENTRY] Adding access token for collection:', collectionId);
        }
      }

      const response = await client.get<EntryResponse>(JOURNAL.ENTRY_DETAIL(id), { headers });
      return this.mapEntryResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch entry');
    }
  }

  async createEntry(data: CreateEntryRequest): Promise<Entry> {
    try {
      // Add access token header for private collections
      const headers: Record<string, string> = {};
      const accessToken = this.getCollectionToken(data.collection_id.toString());
      if (accessToken) {
        headers['X-Collection-Access-Token'] = accessToken;
        console.log('🔐 Adding access token for collection:', data.collection_id);
      }

      const response = await client.post<EntryResponse>(JOURNAL.ENTRIES, data, { headers });
      return this.mapEntryResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create entry');
    }
  }

  async updateEntry(id: string, data: UpdateEntryRequest): Promise<Entry> {
    try {
      // Get the entry first to determine its collection for access token
      const entryResponse = await client.get<EntryResponse>(JOURNAL.ENTRY_DETAIL(id));
      const headers: Record<string, string> = {};
      
      // Add access token header for private collections
      const accessToken = this.getCollectionToken(entryResponse.data.collection_id.toString());
      if (accessToken) {
        headers['X-Collection-Access-Token'] = accessToken;
        console.log('🔐 Adding access token for collection:', entryResponse.data.collection_id);
      }

      const response = await client.put<EntryResponse>(JOURNAL.ENTRY_DETAIL(id), data, { headers });
      return this.mapEntryResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update entry');
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      // Get the entry first to determine its collection for access token
      const entryResponse = await client.get<EntryResponse>(JOURNAL.ENTRY_DETAIL(id));
      const headers: Record<string, string> = {};
      
      // Add access token header for private collections
      const accessToken = this.getCollectionToken(entryResponse.data.collection_id.toString());
      if (accessToken) {
        headers['X-Collection-Access-Token'] = accessToken;
        console.log('🔐 Adding access token for collection:', entryResponse.data.collection_id);
      }

      await client.delete(JOURNAL.ENTRY_DETAIL(id), { headers });
    } catch (error) {
      throw this.handleError(error, 'Failed to delete entry');
    }
  }

  // Gratitude Operations
  async getGratitudes(): Promise<GratitudeEntry[]> {
    try {
      // Get current date from time service to filter gratitudes for today only
      const currentDate = timeService.getCurrentDate();
      console.log('📅 [GRATITUDE] Fetching gratitudes for current date:', currentDate);
      
      // Fetch gratitudes filtered by current date
      const response = await client.get<PaginatedGratitudeResponse>(
        `${JOURNAL.GRATITUDE}?start_date=${currentDate}&end_date=${currentDate}&limit=10`
      );
      
      // Handle paginated gratitude response
      const responseData = response.data;
      let gratitudeData: GratitudeResponse[] = [];
      
      if (responseData.gratitude_entries && Array.isArray(responseData.gratitude_entries)) {
        gratitudeData = responseData.gratitude_entries;
        console.log('✅ GRATITUDE: Found gratitude_entries in paginated response, count:', gratitudeData.length);
      } else if (Array.isArray(responseData)) {
        // Fallback for direct array response
        gratitudeData = responseData as GratitudeResponse[];
        console.log('✅ GRATITUDE: Found direct array response, count:', gratitudeData.length);
      } else {
        console.warn('❌ GRATITUDE: Unexpected response format:', responseData);
        return [];
      }
      
      return this.mapGratitudeResponse(gratitudeData);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch gratitudes');
    }
  }

  async createGratitude(text: string, date?: string): Promise<GratitudeEntry> {
    console.log('🚀 [GRATITUDE] createGratitude called with:', { text, date, textLength: text?.length });
    
    // Validate text input (backend requirement)
    if (!text || text.trim().length === 0) {
      console.error('❌ [GRATITUDE] Empty text validation failed');
      throw new Error('Gratitude text cannot be empty');
    }
    
    if (text.trim().length > 500) {
      throw new Error('Gratitude text cannot exceed 500 characters');
    }
    
    // Use provided date or default to current date from time service
    const currentDate = timeService.getCurrentDate();
    
    // Fallback to local date if time service isn't ready
    let finalDate = date || currentDate;
    if (finalDate === 'LOADING_DATE' || finalDate === 'LOADING_DATETIME') {
      finalDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.warn('⚠️ [GRATITUDE] Time service not ready, using local date:', finalDate);
    }

    try {
      // Backend expects only text field, not date
      const data: CreateGratitudeRequest = { text: text.trim() };
      
      // Check auth status before making request
      const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
      const isAuthenticated = !!token && !token.startsWith('dummy-') && token !== 'test-token';
      
      console.log('📅 [GRATITUDE] Creating gratitude:', {
        text: data.text,
        date: data.date,
        timeServiceReady: timeService.isReady(),
        currentDateFromService: currentDate,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        isAuthenticated: isAuthenticated,
        endpoint: JOURNAL.GRATITUDE
      });

      // Quick auth check before making request  
      if (!isAuthenticated) {
        console.error('❌ [GRATITUDE] Authentication failed - no valid token');
        throw new Error('Authentication required: Please log in to create gratitudes');
      }

      console.log('🌐 [GRATITUDE] About to make POST request:', {
        url: JOURNAL.GRATITUDE,
        data: data,
        hasToken: !!token
      });
      
      const response = await client.post<GratitudeResponse>(JOURNAL.GRATITUDE, data);
      
      console.log('✅ [GRATITUDE] Request successful:', response.status);
      
      // Clear calendar cache so gratitudes appear in calendar immediately
      clearCalendarCache();
      console.log('🗑️ [GRATITUDE] Cleared calendar cache after creating gratitude');
      
      // Dispatch event to notify calendar of gratitude change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gratitudeCreated', { 
          detail: { date: finalDate, gratitude: response.data } 
        }));
      }
      
      return this.mapGratitudeEntryResponse(response.data);
    } catch (error: any) {
      console.error('❌ [GRATITUDE] Create gratitude failed:', {
        error: error.message,
        status: error.status,
        response: error.response?.data,
        requestData: { text, date, finalDate: finalDate }
      });
      throw this.handleError(error, 'Failed to create gratitude');
    }
  }

  async updateGratitude(id: string, text: string): Promise<GratitudeEntry> {
    try {
      const data: UpdateGratitudeRequest = { text };
      const response = await client.put<GratitudeResponse>(JOURNAL.GRATITUDE_DETAIL(id), data);
      
      // Clear calendar cache so updated gratitudes appear in calendar immediately
      clearCalendarCache();
      console.log('🗑️ [GRATITUDE] Cleared calendar cache after updating gratitude');
      
      // Dispatch event to notify calendar of gratitude update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gratitudeUpdated', { 
          detail: { id, gratitude: response.data } 
        }));
      }
      
      return this.mapGratitudeEntryResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update gratitude');
    }
  }

  async deleteGratitude(id: string): Promise<void> {
    try {
      await client.delete(JOURNAL.GRATITUDE_DETAIL(id));
      
      // Clear calendar cache so deleted gratitudes are removed from calendar immediately
      clearCalendarCache();
      console.log('🗑️ [GRATITUDE] Cleared calendar cache after deleting gratitude');
      
      // Dispatch event to notify calendar of gratitude deletion
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gratitudeDeleted', { 
          detail: { id } 
        }));
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to delete gratitude');
    }
  }

  // Statistics Operations
  async getStats(): Promise<JournalStatsResponse> {
    try {
      const response = await client.get<JournalStatsResponse>(JOURNAL.STATS);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch journal stats');
    }
  }

  // Response Mapping Methods
  private mapCollectionsResponse(data: CollectionResponse[]): Collection[] {
    return data.map(collection => this.mapCollectionResponse(collection));
  }

  private mapCollectionResponse(data: CollectionResponse): Collection {
    return {
      id: data.id,
      name: data.name,
      is_private: data.is_private,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      entry_count: data.entry_count,
      entries: [], // Will be populated separately
      // Frontend-friendly aliases
      isPrivate: data.is_private,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      entryCount: data.entry_count,
    };
  }

  private mapEntriesResponse(data: EntryResponse[]): Entry[] {
    return data.map(entry => this.mapEntryResponse(entry));
  }

  private mapEntryResponse(data: EntryResponse): Entry {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      collection_id: data.collection_id,
      is_encrypted: data.is_encrypted,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Frontend-friendly aliases
      isEncrypted: data.is_encrypted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastSavedAt: data.updated_at, // Use updated_at for lastSavedAt
    };
  }

  private mapGratitudeResponse(data: GratitudeResponse[]): GratitudeEntry[] {
    return data.map(gratitude => this.mapGratitudeEntryResponse(gratitude));
  }

  private mapGratitudeEntryResponse(data: GratitudeResponse): GratitudeEntry {
    return {
      id: data.id,
      text: data.text,
      date: data.date,
      user_id: data.user_id,
      created_at: data.created_at,
      // Frontend-friendly aliases
      createdAt: data.created_at,
    };
  }

  private handleError(error: any, defaultMessage: string): JournalApiError {
    console.error('Journal API Error:', error);
    
    // Handle different error types
    if (error?.response?.data?.detail) {
      return {
        message: error.response.data.detail,
        code: error.response.status?.toString() || 'unknown',
        details: error.response.data
      };
    }
    
    if (error?.message) {
      return {
        message: error.message,
        code: error.code || 'unknown',
        details: error
      };
    }
    
    return {
      message: defaultMessage,
      code: 'unknown',
      details: error
    };
  }

  private removeCollectionToken(collectionId: string) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        if (stored) {
          const tokens = JSON.parse(stored);
          delete tokens[collectionId];
          localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
        }
      } catch (error) {
        console.warn('Failed to remove collection token:', error);
      }
    }
  }
}

export default new JournalService(); 