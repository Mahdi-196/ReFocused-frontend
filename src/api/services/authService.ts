import client from '../client';
import { AUTH } from '../endpoints';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cacheService';

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
    avatar?: string;
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
        console.log('👤 User profile loaded from cache');
        return cachedUser;
      }

      // If not in cache, fetch from API
      console.log('👤 Fetching user profile from API');
      const response = await client.get(AUTH.ME);
      
      // Cache the response
      cacheService.set(CacheKeys.USER_PROFILE(), response.data, CacheTTL.LONG);
      
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${AUTH.ME}]:`, error);
      
      // Try to return cached data even if API fails
      const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
      if (cachedUser) {
        console.log('👤 Using cached user profile after API failure');
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
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
    
    console.log('👤 User logged out and cache cleared');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('REF_TOKEN');
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
  }
}; 