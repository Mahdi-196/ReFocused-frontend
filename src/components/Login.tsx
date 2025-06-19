"use client";

import React, { useState } from 'react';
import client from '@/api/client';
import { AUTH } from '@/api/endpoints';
import GoogleSignInButton from './GoogleSignInButton';

interface LoginProps {
  onLogin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = () => {
    setError('');
    if (onLogin) {
      onLogin();
    }
  };

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Set a timeout to handle network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log('Attempting login for:', email);
      
      const response = await client.post(AUTH.LOGIN, {
        email, 
        password 
      });

      clearTimeout(timeoutId);
      
      console.log('Login successful');
      
      const token = response.data.access_token;
      
      if (!token) {
        throw new Error('No access token received from server');
      }
      
      // Safely store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('REF_TOKEN', token);
      }
      
      // Set authorization header for future requests
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Reset form
      setEmail('');
      setPassword('');
      
      // Call onLogin if provided
      if (onLogin) {
        onLogin();
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Network error: Request timed out. Please try again later.');
        } else if (err.message === 'Network Error' || err.name === 'TypeError') {
          setError('Network error: Unable to connect to the server. Please check your connection or try again later.');
        } else {
          setError(err.message || 'Failed to login. Please check your credentials and try again.');
        }
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your password"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Login; 