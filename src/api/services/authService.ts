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
    } catch (error: any) {
      console.error(`API Error [${AUTH.LOGIN}]:`, error);
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  },

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(AUTH.REGISTER, userData);
      return response.data;
    } catch (error: any) {
      console.error(`API Error [${AUTH.REGISTER}]:`, error);
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again with different credentials.');
    }
  },

  /**
   * Login with Google OAuth token
   */
  async googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(AUTH.GOOGLE, data);
      return response.data;
    } catch (error: any) {
      console.error(`API Error [${AUTH.GOOGLE}]:`, error);
      throw new Error(error.response?.data?.message || 'Google authentication failed. Please try again.');
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
    } catch (error: any) {
      console.error(`API Error [${AUTH.ME}]:`, error);
      
      // Try to return cached data even if API fails
      const cachedUser = cacheService.get(CacheKeys.USER_PROFILE());
      if (cachedUser) {
        console.log('👤 Using cached user profile after API failure');
        return cachedUser;
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile.');
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