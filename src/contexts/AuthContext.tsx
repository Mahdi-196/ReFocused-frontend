'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import client, { initializeAuth } from '@/api/client';

interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Only check if we're on the client side
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('REF_TOKEN');
      
      if (token && token !== 'dummy-auth-token') {
        // Initialize auth headers
        initializeAuth();
        
        // Try to fetch user data to verify token is valid
        try {
          const response = await client.get('/api/v1/user/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('REF_TOKEN');
          localStorage.removeItem('REF_USER');
          delete client.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await client.post('/api/v1/auth/login', {
        email,
        password,
      });

      const token = response.data.access_token;
      
      if (!token) {
        throw new Error('No access token received from server');
      }

      // Store token and set auth header
      localStorage.setItem('REF_TOKEN', token);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user data
      await refreshUser();
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await client.post('/api/v1/auth/register', {
        email,
        password,
        name,
      });

      const token = response.data.access_token;
      
      if (!token) {
        throw new Error('No access token received from server');
      }

      // Store token and set auth header
      localStorage.setItem('REF_TOKEN', token);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user data
      await refreshUser();
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await client.get('/api/v1/user/me');
      setUser(response.data);
      setIsAuthenticated(true);
      
      // Also store user data in localStorage for quick access
      localStorage.setItem('REF_USER', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('REF_TOKEN');
    localStorage.removeItem('REF_USER');
    
    // Clear axios auth header
    delete client.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to home page
    router.push('/');
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