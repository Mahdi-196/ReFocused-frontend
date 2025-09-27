import client from '../client';
import { AUTH, USER } from '../endpoints';
import { tokenValidator } from '@/utils/tokenValidator';
import { cacheService, CacheKeys, CacheTTL, CacheInvalidation } from '../../services/cacheService';
import { clearMoodCache } from '../../services/moodService';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name?: string;
}

interface GoogleAuthData {
  id_token: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    username?: string;
    createdAt: string;
    member_since?: string;
    avatar?: string;
    profile_picture?: string;
  };
}

/**
 * Auth Service
 * Handles all authentication-related API calls with consistent error handling
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(AUTH.LOGIN, credentials);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.LOGIN}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Login failed. Please check your credentials.'
        : 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(AUTH.REGISTER, userData);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.REGISTER}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Registration failed. Please try again with different credentials.'
        : 'Registration failed. Please try again with different credentials.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Login with Google OAuth token
   */
  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(AUTH.GOOGLE, data);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.GOOGLE}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Google authentication failed. Please try again.'
        : 'Google authentication failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get current user profile with caching
   */
  async getCurrentUser() {
    try {
      // First check cache
      const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
      if (cachedUser) {
        return cachedUser;
      }

      // If not in cache, fetch from API
      const response = await client.get(AUTH.ME);
      
      // Cache the response
      cacheService.set(CacheKeys.USER_PROFILE(), response.data, CacheTTL.LONG);
      
      return response.data;
    } catch (error: unknown) {
      // Try to return cached data even if API fails
      const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
      if (cachedUser) {
        return cachedUser;
      }
      
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to fetch user profile.'
        : 'Failed to fetch user profile.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Save authentication data to localStorage
   */
  saveAuthData(data: AuthResponse): void {
    if (!data.access_token) {
      throw new Error('No access token received');
    }

    localStorage.setItem('REF_TOKEN', data.access_token);
    
    if (data.user) {
      localStorage.setItem('REF_USER', JSON.stringify(data.user));
      // Also cache the user data
      cacheService.set(CacheKeys.USER_PROFILE(), data.user, CacheTTL.LONG);
    }
    
    // Set authorization header for API client
    client.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
  },

  /**
   * Clear authentication data from localStorage and cache
   */
  logout(): void {
    localStorage.removeItem('REF_TOKEN');
    localStorage.removeItem('REF_USER');
    delete client.defaults.headers.common['Authorization'];
    
    // Clear user profile from cache
    cacheService.delete(CacheKeys.USER_PROFILE());
    
    // Clear all user-specific cache data
    CacheInvalidation.clearUserCache();
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
    
    console.log('👤 User logged out and all cache cleared');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('REF_TOKEN');
          if (!token || token.startsWith('dummy-') || token === 'test-token' || token.trim() === '') {
      return false;
    }

    // Validate the token
    const validation = tokenValidator.validateJWT(token);

    // If token is invalid (malformed or expired), clear it automatically
    if (!validation.isValid) {
      console.warn('🔑 Invalid token detected, clearing auth data:', validation.error);
      this.logout();
      return false;
    }
    
    return true;
  },

  /**
   * Get cached user data (local only, no API call)
   */
  getCachedUser() {
    // First try cache
    const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
    if (cachedUser) {
      return cachedUser;
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('REF_USER');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Cache it for future use
          cacheService.set(CacheKeys.USER_PROFILE(), userData, CacheTTL.LONG);
          return userData;
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
        }
      }
    }

    return null;
  },

  /**
   * Clear user activity data (keeping account active)
   */
  async clearActivityData(): Promise<{
    message: string;
    status: string;
    user_account_preserved: boolean;
    deleted_at: string;
    deletion_summary: Record<string, number>;
  }> {
    try {
      console.log('🗑️ [AUTH SERVICE] Calling clear activity endpoint...');
      const response = await client.delete(USER.CLEAR_ACTIVITY);
      console.log('✅ [AUTH SERVICE] Clear activity API response:', response.data);
      
      // Clear all user-related cache after successful deletion
      console.log('🧹 [AUTH SERVICE] Clearing all user cache...');
      CacheInvalidation.clearUserCache();
      
      // Clear mood-specific cache
      console.log('🧹 [AUTH SERVICE] Clearing mood cache...');
      clearMoodCache();
      
      // Dispatch custom event to notify mood components to refresh
      if (typeof window !== 'undefined') {
        console.log('📢 [AUTH SERVICE] Dispatching moodDataCleared event...');
        window.dispatchEvent(new CustomEvent('moodDataCleared'));
      }
      
      // Also clear localStorage cache if any
      if (typeof window !== 'undefined') {
        // Clear any cached data that might be in localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('habit') || key.includes('goal') || key.includes('mood') || key.includes('journal') || key.includes('cache'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 [AUTH SERVICE] Cleared localStorage keys:', keysToRemove);
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${USER.CLEAR_ACTIVITY}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to clear activity data.'
        : 'Failed to clear activity data.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await client.put<{ success: boolean; message: string }>(AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.CHANGE_PASSWORD}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {detail?: string}}}).response?.data?.detail || 'Failed to change password.'
        : 'Failed to change password.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Change account name
   */
  async changeAccountName(newName: string): Promise<{ success: boolean; message: string; name: string }> {
    try {
      const response = await client.put<{ success: boolean; message: string; name: string }>(AUTH.CHANGE_USERNAME, {
        new_name: newName
      });
      
      // Update cached user data with new name
      const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
      if (cachedUser) {
        const updatedUser = { ...cachedUser, name: response.data.name };
        cacheService.set(CacheKeys.USER_PROFILE(), updatedUser, CacheTTL.LONG);
        
        // Update localStorage as well
        if (typeof window !== 'undefined') {
          localStorage.setItem('REF_USER', JSON.stringify(updatedUser));
        }
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.CHANGE_USERNAME}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {detail?: string}}}).response?.data?.detail || 'Failed to change account name.'
        : 'Failed to change account name.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Clear user profile cache
   */
  clearUserCache() {
    cacheService.delete(CacheKeys.USER_PROFILE());
  },

  /**
   * Development-only simplified registration (no validation needed)
   */
  async registerSimple(): Promise<AuthResponse> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This endpoint is only available in development mode');
    }

    try {
      const response = await client.post<AuthResponse>('/api/v1/auth/register', {});
      return response.data;
    } catch (error: unknown) {
      console.error('API Error [/api/v1/auth/register]:', error);
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Development registration failed. Please try again.'
        : 'Development registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Development-only simplified login (no validation needed)
   */
  async loginSimple(): Promise<AuthResponse> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This endpoint is only available in development mode');
    }

    try {
      const response = await client.post<AuthResponse>('/api/v1/auth/login-simple', {});
      return response.data;
    } catch (error: unknown) {
      console.error('API Error [/api/v1/auth/login-simple]:', error);
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Development login failed. Please try again.'
        : 'Development login failed. Please try again.';
      throw new Error(errorMessage);
    }
  }
}; 