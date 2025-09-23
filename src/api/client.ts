import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenValidator } from '@/utils/tokenValidator';
import logger from '@/utils/logger';
import { getCSRFHeaders } from '@/utils/csrf';
import { RateLimitHandler } from '@/utils/rateLimiting';

// Create axios instance with proper TypeScript typing
const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
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
      
      if (token && !token.startsWith('dummy-') && token !== 'test-token' && token.trim() !== '') {
        // Validate token before using it
        const validation = tokenValidator.validateJWT(token);
        
        if (validation.isValid) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          
          // Silent mode: avoid near-expiry UI events
          if (validation.payload?.exp && validation.payload.exp - Math.floor(Date.now() / 1000) < 300) {
            // no-op
          }
        } else {
          if (validation.isExpired) {
            localStorage.removeItem('REF_TOKEN');
            localStorage.removeItem('REF_USER');
            localStorage.removeItem('REF_COLLECTION_TOKENS');
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
          }
        }
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
          const collectionMatch = config.url.match(/\/collections\/([^/]+)/);
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
        // Add app metadata headers for observability
        const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
        const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
        if (appEnv) {
          config.headers['X-App-Env'] = appEnv;
        }
        if (appVersion) {
          config.headers['X-Client-Version'] = appVersion;
        }
      } catch (error) {
        console.warn('Failed to get user timezone:', error);
      }
    }
    
    // Check client-side rate limiting before making request
    const rateLimitCheck = RateLimitHandler.shouldBlockRequest(config.url || '');
    if (rateLimitCheck.block) {
      return Promise.reject(new Error(rateLimitCheck.message));
    }
    
    // Add CSRF protection for state-changing requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      try {
        const csrfHeaders = getCSRFHeaders();
        config.headers = config.headers || {};
        Object.assign(config.headers, csrfHeaders);
      } catch (error) {
        console.warn('Failed to add CSRF token:', error);
      }
    }
    
    // Log API requests in development only
    if (process.env.NODE_ENV === 'development' && config.url?.includes('/journal/gratitude') && config.method === 'post') {
      logger.debug('Gratitude POST request', {
        url: config.url,
        method: config.method,
        hasAuth: !!config.headers?.Authorization
      }, 'API');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    // Mark network success for successful responses
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('networkSuccess'));

      // If backend rotates a fresh access token via header/cookie, capture it
      const newToken = response.headers?.['x-access-token'] || response.data?.access_token;
      if (newToken && newToken !== localStorage.getItem('REF_TOKEN')) {
        try {
          localStorage.setItem('REF_TOKEN', newToken);
          client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } catch (error) {
          console.warn('Failed to update token in localStorage:', error);
        }
      }
    }
    return response;
  },
  async (error) => {
    // Trigger network failure detection for network-related errors
    const isNetworkError = 
      error.code === 'ECONNABORTED' || 
      error.code === 'ERR_NETWORK' || 
      error.message === 'Network Error' ||
      !error.response; // No response usually means network issue

    if (isNetworkError && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('networkFailure'));
    }
    
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

    // Enhanced rate limiting handling
    const status = error.response?.status;
    if (status === 429 && typeof window !== 'undefined') {
      const retryAfterHeader =
        error.response.headers?.['retry-after'] || error.response.headers?.['Retry-After'];
      const retryAfter = parseInt(retryAfterHeader ?? '60', 10);
      
      // Use the enhanced rate limit handler
      RateLimitHandler.handleRateLimit(error.config?.url || '', retryAfter, true);
      
      try {
        window.dispatchEvent(
          new CustomEvent('rateLimit', {
            detail: {
              retryAfter: Number.isFinite(retryAfter) ? retryAfter : 60,
              path: error.config?.url,
            },
          })
        );
      } catch (dispatchError) {
        console.warn('Failed to dispatch rate limit event:', dispatchError);
      }
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
        const customError = new Error(backendMessage) as Error & { status?: number };
        customError.name = 'BackendError';
        customError.status = error.response.status;
        return Promise.reject(customError);
      }
      
      // For 422 validation errors, try to extract more detail
      if (error.response.status === 422) {
        console.error('422 Validation Error Details:', error.response.data);
        const customError = new Error(JSON.stringify(error.response.data)) as Error & { status?: number };
        customError.name = 'ValidationError';
        customError.status = 422;
        return Promise.reject(customError);
      }
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized/forbidden access - token expired, invalid, or insufficient permissions
      const errorType = error.response.status === 401 ? 'unauthorized' : 'forbidden';
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
      
      
      logger.warn(`Authentication failed - ${errorType} access`, { 
        url: error.config?.url,
        status: error.response.status,
        hasToken: !!currentToken
      }, 'API');
      
      if (typeof window !== 'undefined') {
        // Attempt a silent refresh once using refresh cookie
        try {
          const originalRequest = error.config;
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            // Use root-level refresh alias to ensure HttpOnly cookies are sent from the same origin
            const refreshResp = await axios.post('/v1/auth/refresh', {}, { withCredentials: true });
            const newAccess = refreshResp.data?.access_token;
            if (newAccess) {
              localStorage.setItem('REF_TOKEN', newAccess);
              client.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }

        // Clear all authentication data
        localStorage.removeItem('REF_TOKEN');
        localStorage.removeItem('REF_USER');
        localStorage.removeItem('REF_COLLECTION_TOKENS');
        delete client.defaults.headers.common['Authorization'];
        
        // Clear collection access tokens
        collectionTokens.clear();
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        
        // Redirect to landing page for re-authentication
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
          if (token && !token.startsWith('dummy-') && token !== 'test-token') {
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
// Backend running via environment configuration
// Documentation: Check environment config for backend URL

// Collection Access Token Management
export const collectionTokens = {
  // Store access token for a collection
  store: (collectionId: string, token: string) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        const tokens = stored ? JSON.parse(stored) : {};
        tokens[collectionId] = token;
        localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
        console.log('🔐 Stored access token for collection:', collectionId);
      } catch (error) {
        console.error('Failed to store collection token:', error);
      }
    }
  },
  
  // Get access token for a collection
  get: (collectionId: string): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        const tokens = stored ? JSON.parse(stored) : {};
        return tokens[collectionId] || null;
      } catch (error) {
        console.warn('Failed to get collection token:', error);
        return null;
      }
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
      try {
        const stored = localStorage.getItem('REF_COLLECTION_TOKENS');
        const tokens = stored ? JSON.parse(stored) : {};
        delete tokens[collectionId];
        localStorage.setItem('REF_COLLECTION_TOKENS', JSON.stringify(tokens));
        console.log('🔐 Removed access token for collection:', collectionId);
      } catch (error) {
        console.error('Failed to remove collection token:', error);
      }
    }
  },
  
  // Clear all collection tokens
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('REF_COLLECTION_TOKENS');
      console.log('🔐 Cleared all collection tokens');
    }
  }
};

export default client;  