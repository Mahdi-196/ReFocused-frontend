import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import logger from '@/utils/logger';

// Create axios instance with proper TypeScript typing
const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for better reliability
  withCredentials: true, // Include credentials for CORS requests
});

// Request interceptor for auth tokens
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      if (token && token !== 'dummy-auth-token') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add collection access token if available for journal endpoints
    if (typeof window !== 'undefined' && config.url?.includes('/journal/')) {
      const collectionTokens = localStorage.getItem('REF_COLLECTION_TOKENS');
      if (collectionTokens) {
        try {
          const tokens = JSON.parse(collectionTokens);
          let collectionId = null;
          
          // Extract collection ID from URL patterns
          const collectionMatch = config.url.match(/\/collections\/([^\/]+)/);
          const entryWithCollectionMatch = config.url.match(/\/entries.*[?&]collection=([^&]+)/);
          
          if (collectionMatch) {
            collectionId = collectionMatch[1];
          } else if (entryWithCollectionMatch) {
            collectionId = entryWithCollectionMatch[1];
          } else if (config.data && typeof config.data === 'object') {
            // For POST requests with collection_id in body
            const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            if (data.collection_id) {
              collectionId = data.collection_id.toString();
            }
          }
          
          if (collectionId) {
            const accessToken = tokens[collectionId];
            if (accessToken) {
              config.headers = config.headers || {};
              config.headers['X-Collection-Access-Token'] = accessToken;
            }
          }
        } catch (error) {
          console.warn('Failed to parse collection tokens:', error);
        }
      }
    }
    
    // Always add timezone header for better backend integration
    if (typeof window !== 'undefined') {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        config.headers = config.headers || {};
        config.headers['X-User-Timezone'] = userTimezone;
      } catch (error) {
        console.warn('Failed to get user timezone:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      logger.warn('API request timed out after 30 seconds', { url: error.config?.url }, 'API');
      error.isTimeout = true;
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' && error.message === 'Network Error') {
      logger.warn('Network/CORS error - backend may be unavailable', { url: error.config?.url }, 'API');
      error.isNetworkError = true;
    }
    
    // Extract backend error messages for proper frontend display
    if (error.response?.data) {
      let backendMessage = null;
      
      // Try different common backend error message formats
      if (error.response.data.detail) {
        backendMessage = error.response.data.detail;
      } else if (error.response.data.message) {
        backendMessage = error.response.data.message;
      } else if (error.response.data.error) {
        backendMessage = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        backendMessage = error.response.data;
      }
      
      // If we found a backend message, use it
      if (backendMessage) {
        const customError = new Error(backendMessage);
        customError.name = 'BackendError';
        customError.status = error.response.status;
        return Promise.reject(customError);
      }
      
      // For 422 validation errors, try to extract more detail
      if (error.response.status === 422) {
        console.error('422 Validation Error Details:', error.response.data);
        const customError = new Error(JSON.stringify(error.response.data));
        customError.name = 'ValidationError';
        customError.status = 422;
        return Promise.reject(customError);
      }
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access - token expired or invalid
      logger.warn('Authentication failed - token may be expired', { url: error.config?.url }, 'API');
      
      if (typeof window !== 'undefined') {
        // Clear expired/invalid token
        localStorage.removeItem('REF_TOKEN');
        localStorage.removeItem('REF_USER');
        delete client.defaults.headers.common['Authorization'];
        
        // Clear collection access tokens as well
        collectionTokens.clear();
        
        // Redirect to home page for re-authentication
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Initialize auth - will be called from client components only
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("REF_TOKEN");
    if (token && token !== 'dummy-auth-token') {
      client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      logger.debug('Auth initialized with token', token.substring(0, 10) + '...', 'AUTH');
    } else {
      // Clear any existing auth header
      delete client.defaults.headers.common["Authorization"];
      logger.debug('No valid token found for auth initialization', undefined, 'AUTH');
    }
  }
};

// ✅ Real backend API integration
// Backend running on http://localhost:8000 via Next.js rewrites
// Documentation: http://localhost:8000/docs

// Collection Access Token Management
export const collectionTokens = {
  // Store access token for a collection
  store: (collectionId: string, token: string) => {
    if (typeof window !== 'undefined') {
      const tokens = collectionTokens.getAll();
      tokens[collectionId] = token;
      localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
    }
  },
  
  // Get access token for a collection
  get: (collectionId: string): string | null => {
    if (typeof window !== 'undefined') {
      const tokens = collectionTokens.getAll();
      return tokens[collectionId] || null;
    }
    return null;
  },
  
  // Get all collection tokens
  getAll: (): Record<string, string> => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        return stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.warn('Failed to parse collection tokens:', error);
        return {};
      }
    }
    return {};
  },
  
  // Remove access token for a collection
  remove: (collectionId: string) => {
    if (typeof window !== 'undefined') {
      const tokens = collectionTokens.getAll();
      delete tokens[collectionId];
      localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
    }
  },
  
  // Clear all collection tokens
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('REF_COLLECTION_TOKENS');
    }
  }
};

export default client;  