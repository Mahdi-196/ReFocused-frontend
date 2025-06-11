"use client";

import React, { useState } from 'react';
import client from '@/api/client';
import GoogleSignInButton from './GoogleSignInButton';

interface LoginProps {
  onLogin?: () => void;
  darkMode?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, darkMode = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = (_token: string) => {
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

      // Fix URL construction to avoid double slashes
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
      
      console.log('Attempting login for:', email);
      
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password 
        }),
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Login failed with status:', response.status, data);
        throw new Error(data.message || `Error: ${response.status} - ${response.statusText}`);
      }
      
      console.log('Login successful');
      
      const token = data.access_token;
      
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

  // Conditional styling based on dark mode
  const containerClass = darkMode 
    ? "w-full max-w-md mx-auto" 
    : "w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-md";
  
  const titleClass = darkMode 
    ? "text-2xl font-bold mb-6 text-center text-white" 
    : "text-2xl font-bold mb-6 text-center";
  
  const errorClass = darkMode 
    ? "mb-4 p-3 bg-red-500/20 text-red-300 rounded-md text-sm border border-red-500/30" 
    : "mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm";
  
  const labelClass = darkMode 
    ? "block text-sm font-medium text-slate-300 mb-1" 
    : "block text-sm font-medium text-gray-700 mb-1";
  
  const inputClass = darkMode 
    ? "w-full p-3 bg-gray-800/50 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent placeholder-gray-400"
    : "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  const buttonClass = darkMode 
    ? "w-full py-3 px-4 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] hover:from-[#42b9e5]/90 hover:to-[#4f83ed]/90 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all disabled:opacity-50"
    : "w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400";
  
  const separatorClass = darkMode 
    ? "w-full border-t border-gray-600" 
    : "w-full border-t border-gray-300";
  
  const separatorTextClass = darkMode 
    ? "px-2 bg-[#1a2332] text-slate-400" 
    : "px-2 bg-white text-gray-500";

  return (
    <div className={containerClass}>
      {!darkMode && <h2 className={titleClass}>Login</h2>}
      
      {error && (
        <div className={errorClass}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label 
            htmlFor="email" 
            className={labelClass}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className={labelClass}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Your password"
            required
          />
        </div>
        
        <button
          type="submit"
          className={buttonClass}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={separatorClass} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={separatorTextClass}>Or continue with</span>
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