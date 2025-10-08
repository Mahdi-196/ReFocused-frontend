'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { initializeAuth } from '@/api/client';
import { authService } from '@/api/services/authService';
import { timeService } from '@/services/timeService';
import { tokenRefreshManager } from '@/utils/tokenRefresh';
import { tokenValidator } from '@/utils/tokenValidator';
import { cookieAuth } from '@/utils/cookieAuth';
import logger from '@/utils/logger';

interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeAuthSystem();
    }
  }, []);

  // Initialize authentication system with cookie support
  const initializeAuthSystem = async () => {
    setIsLoading(true);

    try {
      // Backend now sets cookies automatically on login/register
      // First try cookie-based auth by checking with the server
      const currentUser = await cookieAuth.getCurrentUser();

      if (currentUser) {
        // Cookie authentication successful
        logger.info('Cookie-based authentication successful', undefined, 'AuthContext');
        setUser(currentUser);
        setIsAuthenticated(true);
        timeService.setAuthenticationStatus(true);

        // Start token monitoring
        tokenRefreshManager.startMonitoring();
      } else {
        // No cookie session, fall back to localStorage check
        logger.info('No cookie session found, checking localStorage', undefined, 'AuthContext');
        await checkAuthStatus();
      }

    } catch (error) {
      logger.error('Error initializing auth system', error, 'AuthContext');
      // Fallback to localStorage-based auth check
      await checkAuthStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Only check if we're on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }


      const token = localStorage.getItem('REF_TOKEN');
      let isTokenValid = token && !token.startsWith('dummy-') && token !== 'test-token' && token.trim() !== '';
      
      // If we have a token, validate its format before proceeding
      if (isTokenValid && token) {
        const validation = tokenValidator.validateJWT(token);
        if (!validation.isValid) {
          console.warn('🔑 AuthContext: Invalid token detected, clearing:', validation.error);
          authService.logout();
          isTokenValid = false;
        }
      }
      
      if (isTokenValid) {
        // Initialize auth headers
        initializeAuth();
        
        // First try to get cached user data
        const cachedUser = authService.getCachedUser();
        if (cachedUser) {
          logger.debug('Using cached user data in AuthContext', undefined, 'AUTH');
          setUser(cachedUser);
          setIsAuthenticated(true);
          
          // Initialize time service after authentication is confirmed
          await timeService.initialize(true);
          timeService.setAuthenticationStatus(true);
          
          // Start token monitoring
          tokenRefreshManager.startMonitoring();
          
          setIsLoading(false);
          return;
        }
        
        // If no cached data, fetch from API
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          
          // Initialize time service after authentication is confirmed
          await timeService.initialize(true);
          timeService.setAuthenticationStatus(true);
          
          // Start token monitoring
          tokenRefreshManager.startMonitoring();
        } catch (error) {
          console.error('Failed to fetch user data, clearing auth:', error);
          // Token is invalid, clear it
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
          timeService.setAuthenticationStatus(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Initialize time service without authentication
        await timeService.initialize(false);
        timeService.setAuthenticationStatus(false);
      }
    } catch (error) {
      console.error('Error in checkAuthStatus:', error);
      setUser(null);
      setIsAuthenticated(false);
      // Initialize time service without authentication on error
      await timeService.initialize(false);
      timeService.setAuthenticationStatus(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      // Save auth data and cache user
      authService.saveAuthData(response);
      
      // Update time service authentication status
      timeService.setAuthenticationStatus(true);
      
      // Start token monitoring
      tokenRefreshManager.startMonitoring();
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register({ 
        username: email, // Use email as username for now
        email,
        password,
        name 
      });
      
      // Save auth data and cache user
      authService.saveAuthData(response);

      // Update time service authentication status
      timeService.setAuthenticationStatus(true);
      
      // Start token monitoring
      tokenRefreshManager.startMonitoring();

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Stop token monitoring
      tokenRefreshManager.stopMonitoring();
      
      // Clear cookies if backend supports it, otherwise fall back to localStorage
      try {
        await cookieAuth.clearAuthCookies();
        logger.info('Cleared authentication cookies', undefined, 'AuthContext');
      } catch (cookieError) {
        logger.warn('Failed to clear cookies, falling back to localStorage logout', cookieError, 'AuthContext');
        // Fallback to localStorage logout
        authService.logout();
      }
      
      // Update time service authentication status
      timeService.setAuthenticationStatus(false);
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      logger.error('Logout error', error, 'AuthContext');
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 