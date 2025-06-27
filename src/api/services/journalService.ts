import client, { collectionTokens } from '../client';
import { JOURNAL } from '../endpoints';
import type {
  Collection,
  Entry,
  GratitudeEntry,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  CollectionResponse,
  EntryResponse,
  JournalApiError,
} from '../../app/journal/types';

/**
 * Journal Service
 * Handles all journal-related API operations including collections, entries, and gratitude
 */
class JournalService {
  // Collection Operations
  async getCollections(): Promise<Collection[]> {
    
    try {
      console.log('📡 Making request to:', JOURNAL.COLLECTIONS);
      const response = await client.get(JOURNAL.COLLECTIONS);
      
      console.log('✅ Received response, status:', response.status);
      console.log('📦 Raw response.data:', response.data);
      console.log('📦 Response.data type:', typeof response.data);
      console.log('📦 Response.data is array?', Array.isArray(response.data));
      
      // Handle different response formats from backend
      let collectionsData = response.data;
      
      // If response is wrapped (e.g., {data: [...]} or {collections: [...]})
      if (collectionsData && !Array.isArray(collectionsData)) {
        console.log('🔍 Response is not an array, checking for wrapper formats...');
        console.log('🔍 Available keys:', Object.keys(collectionsData));
        
        if (collectionsData.data && Array.isArray(collectionsData.data)) {
          console.log('✅ Found data wrapper');
          collectionsData = collectionsData.data;
        } else if (collectionsData.collections && Array.isArray(collectionsData.collections)) {
          console.log('✅ Found collections wrapper');
          collectionsData = collectionsData.collections;
        } else if (collectionsData.results && Array.isArray(collectionsData.results)) {
          console.log('✅ Found results wrapper');
          collectionsData = collectionsData.results;
        } else {
          // If it's still not an array, return empty array
          console.warn('❌ Unexpected collections response format:', collectionsData);
          console.warn('❌ Response keys:', Object.keys(collectionsData || {}));
          return [];
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(collectionsData)) {
        console.warn('❌ Collections data is not an array after processing:', collectionsData);
        return [];
      }
      
      console.log('✅ Processing collections array with length:', collectionsData.length);
      console.log('🏃‍♂️ About to call mapCollectionsResponse...');
      
      const result = this.mapCollectionsResponse(collectionsData);
      console.log('✅ mapCollectionsResponse completed, result length:', result.length);
      return result;
      
    } catch (error: any) {
      console.error('💥 Collections API error (full):', error);
      console.error('💥 Error message:', error?.message);
      console.error('💥 Error stack:', error?.stack);
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
      const entriesResponse = await client.get<EntryResponse[]>(JOURNAL.COLLECTION_ENTRIES(id));
      
      return {
        ...this.mapCollectionResponse(response.data),
        entries: this.mapEntriesResponse(entriesResponse.data),
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
      const response = await client.post<{ valid: boolean; access_token?: string }>(
        JOURNAL.COLLECTION_VERIFY_PASSWORD(id),
        { password }
      );
      
      // If verification successful and we get an access token, store it
      if (response.data.valid && response.data.access_token) {
        collectionTokens.store(id, response.data.access_token);
      }
      
      return response.data.valid;
    } catch (error) {
      // Return false for authentication errors instead of throwing
      const apiError = error as any;
      if (apiError.status === 401 || apiError.status === 403) {
        return false;
      }
      throw this.handleError(error, 'Failed to verify password');
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
        const accessToken = collectionTokens.get(collectionId);
        if (accessToken) {
          headers['X-Collection-Access-Token'] = accessToken;
          console.log('🔐 Adding access token for collection:', collectionId);
        }
      }
      
      const response = await client.get(url, { headers });
      
      // Handle different response formats from backend
      let entriesData = response.data;
      
      // If response is wrapped (e.g., {data: [...]} or {entries: [...]})
      if (entriesData && !Array.isArray(entriesData)) {
        console.log('🔍 ENTRIES: Response is wrapped, keys:', Object.keys(entriesData));
        
        if (entriesData.data && Array.isArray(entriesData.data)) {
          console.log('✅ ENTRIES: Found data wrapper');
          entriesData = entriesData.data;
        } else if (entriesData.entries && Array.isArray(entriesData.entries)) {
          console.log('✅ ENTRIES: Found entries wrapper');
          entriesData = entriesData.entries;
        } else if (entriesData.results && Array.isArray(entriesData.results)) {
          console.log('✅ ENTRIES: Found results wrapper');
          entriesData = entriesData.results;
        } else {
          // If it's still not an array, return empty array
          console.warn('❌ ENTRIES: Unexpected response format:', entriesData);
          console.warn('❌ ENTRIES: Available keys:', Object.keys(entriesData || {}));
          return [];
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(entriesData)) {
        console.warn('Entries data is not an array:', entriesData);
        return [];
      }
      
      return this.mapEntriesResponse(entriesData);
    } catch (error) {
      // If it's a 401/403 for private collection, the token might be expired
      const apiError = error as any;
      if (collectionId && (apiError.status === 401 || apiError.status === 403)) {
        console.warn('🔐 Access denied for collection, removing token:', collectionId);
        collectionTokens.remove(collectionId);
      }
      throw this.handleError(error, 'Failed to fetch entries');
    }
  }

  async getEntry(id: string): Promise<Entry> {
    try {
      const response = await client.get<EntryResponse>(JOURNAL.ENTRY_DETAIL(id));
      return this.mapEntryResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch entry');
    }
  }

  async createEntry(data: CreateEntryRequest): Promise<Entry> {
    try {
      console.log('📝 CREATE ENTRY: Request payload:', data);
      
      // Add access token header if entry is for a private collection
      const headers: Record<string, string> = {};
      const collectionId = String(data.collection_id);
      const accessToken = collectionTokens.get(collectionId);
      if (accessToken) {
        headers['X-Collection-Access-Token'] = accessToken;
        console.log('🔐 Using access token for private collection:', collectionId);
      }
      
      const response = await client.post<EntryResponse>(JOURNAL.ENTRIES, data, { headers });
      
      console.log('✅ CREATE ENTRY: Success, response:', response.data);
      return this.mapEntryResponse(response.data);
    } catch (error: any) {
      console.error('💥 CREATE ENTRY ERROR:', error);
      console.error('💥 Response status:', error?.response?.status);
      console.error('💥 Response data:', error?.response?.data);
      
      throw this.handleError(error, 'Failed to create entry');
    }
  }

  async updateEntry(id: string, data: UpdateEntryRequest): Promise<Entry> {
    try {
      // Try to get access token for any collection that might contain this entry
      const headers: Record<string, string> = {};
      
      // We need to check which collection this entry belongs to
      // For now, we'll try without token first, then handle 401 if needed
      
      const response = await client.put<EntryResponse>(JOURNAL.ENTRY_DETAIL(id), data, { headers });
      return this.mapEntryResponse(response.data);
    } catch (error: any) {
      // If we get 401/403, the entry might be in a private collection
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('🔐 Entry update failed - might need collection access token');
      }
      throw this.handleError(error, 'Failed to update entry');
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await client.delete(JOURNAL.ENTRY_DETAIL(id));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete entry');
    }
  }

  // Gratitude Operations
  async getGratitudes(): Promise<GratitudeEntry[]> {
    try {
      const response = await client.get(JOURNAL.GRATITUDE);
      
      // Handle different response formats from backend
      let gratitudeData = response.data;
      
      // If response is wrapped (e.g., {data: [...]} or {gratitudes: [...]})
      if (gratitudeData && !Array.isArray(gratitudeData)) {
        console.log('🔍 GRATITUDE: Response is wrapped, keys:', Object.keys(gratitudeData));
        
        if (gratitudeData.data && Array.isArray(gratitudeData.data)) {
          console.log('✅ GRATITUDE: Found data wrapper');
          gratitudeData = gratitudeData.data;
        } else if (gratitudeData.gratitudes && Array.isArray(gratitudeData.gratitudes)) {
          console.log('✅ GRATITUDE: Found gratitudes wrapper');
          gratitudeData = gratitudeData.gratitudes;
        } else if (gratitudeData.gratitude && Array.isArray(gratitudeData.gratitude)) {
          console.log('✅ GRATITUDE: Found gratitude wrapper');
          gratitudeData = gratitudeData.gratitude;
        } else if (gratitudeData.results && Array.isArray(gratitudeData.results)) {
          console.log('✅ GRATITUDE: Found results wrapper');
          gratitudeData = gratitudeData.results;
        } else {
          // If it's still not an array, return empty array
          console.warn('❌ GRATITUDE: Unexpected response format:', gratitudeData);
          console.warn('❌ GRATITUDE: Available keys:', Object.keys(gratitudeData || {}));
          return [];
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(gratitudeData)) {
        console.warn('Gratitude data is not an array:', gratitudeData);
        return [];
      }
      
      return gratitudeData;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch gratitudes');
    }
  }

  async createGratitude(text: string): Promise<GratitudeEntry> {
    try {
      const response = await client.post<GratitudeEntry>(JOURNAL.GRATITUDE, {
        text,
        date: new Date().toISOString().split('T')[0],
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create gratitude entry');
    }
  }

  async updateGratitude(id: string, text: string): Promise<GratitudeEntry> {
    try {
      const response = await client.put<GratitudeEntry>(JOURNAL.GRATITUDE_DETAIL(id), {
        text,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update gratitude entry');
    }
  }

  async deleteGratitude(id: string): Promise<void> {
    try {
      await client.delete(JOURNAL.GRATITUDE_DETAIL(id));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete gratitude entry');
    }
  }

  // Response Mappers
  private mapCollectionsResponse(data: CollectionResponse[]): Collection[] {
    console.log('🔄 Mapping collections response. Raw data:', data);
    
    if (!Array.isArray(data)) {
      console.warn('❌ mapCollectionsResponse: Data is not an array:', data);
      return [];
    }
    
    const mapped = data.map(item => this.mapCollectionResponse(item));
    console.log('✅ Mapped collections:', mapped);
    return mapped;
  }

  private mapCollectionResponse(data: any): Collection {
    console.log('🔄 Mapping single collection:', data);
    
    const mapped = {
      id: String(data.id),
      name: data.name || '',
      isPrivate: Boolean(data.is_private || data.isPrivate), // ✅ Handle both snake_case and camelCase
      entries: [], // Will be populated separately
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      entryCount: data.entry_count || data.entryCount || 0,
    };
    
    console.log('✅ Mapped collection result:', mapped);
    return mapped;
  }

  private mapEntriesResponse(data: EntryResponse[]): Entry[] {
    // Safety check - ensure data is an array
    if (!Array.isArray(data)) {
      console.error('mapEntriesResponse received non-array data:', data);
      return [];
    }
    
    return data.map(this.mapEntryResponse);
  }

  private mapEntryResponse(data: any): Entry {
    return {
      id: String(data.id),
      title: data.title || '',
      content: data.content || '',
      isEncrypted: Boolean(data.is_encrypted || data.isEncrypted), // ✅ Handle both formats
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  }

  // Error Handling
  private handleError(error: any, defaultMessage: string): JournalApiError {
    const journalError: JournalApiError = {
      message: error.message || defaultMessage,
      code: error.status?.toString() || 'UNKNOWN',
      details: error.response?.data || error,
    };

    // Handle specific error cases
    if (error.status === 401) {
      journalError.message = 'Authentication required';
      journalError.code = 'UNAUTHORIZED';
    } else if (error.status === 403) {
      journalError.message = 'Access denied';
      journalError.code = 'FORBIDDEN';
    } else if (error.status === 404) {
      journalError.message = 'Resource not found';
      journalError.code = 'NOT_FOUND';
    } else if (error.status === 409) {
      journalError.message = 'Resource already exists';
      journalError.code = 'CONFLICT';
    } else if (error.status === 422) {
      journalError.message = 'Validation failed - check your input data';
      journalError.code = 'VALIDATION_ERROR';
      
      // Try to extract more specific validation errors
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // FastAPI validation errors format
          const validationErrors = error.response.data.detail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
          journalError.message = `Validation errors: ${validationErrors}`;
        } else if (typeof error.response.data.detail === 'string') {
          journalError.message = error.response.data.detail;
        }
      }
    } else if (error.isTimeout) {
      journalError.message = 'Request timed out';
      journalError.code = 'TIMEOUT';
    } else if (error.isNetworkError) {
      journalError.message = 'Network connection failed';
      journalError.code = 'NETWORK_ERROR';
    }

    return journalError;
  }
}

export const journalService = new JournalService();
export default journalService; 