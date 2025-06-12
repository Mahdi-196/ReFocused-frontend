"use client";

import React, { useState } from 'react';
import client from '@/api/client';

interface RegisterProps {
  onRegisterSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Set a timeout to handle network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Fix URL construction to avoid double slashes
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      
      console.log('Registering user with:', { username, email, name });
      
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          name: name.trim() || username // Use name if provided, otherwise username
        }),
        signal: controller.signal,
        credentials: 'include' // Include cookies with request
      });

      clearTimeout(timeoutId);
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Registration failed with status:', response.status, data);
        throw new Error(data.message || `Error: ${response.status} - ${response.statusText}`);
      }
      
      console.log('Registration successful:', data);
      
      // Show success message
      setSuccess('Registration successful! You can now log in.');
      
      // Reset form
      setUsername('');
      setEmail('');
      setPassword('');
      setName('');
      
      // Call onRegisterSuccess if provided
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.name === 'AbortError') {
        setError('Network error: Request timed out. Please try again later.');
      } else if (err.message === 'Network Error' || err.name === 'TypeError') {
        setError('Network error: Unable to connect to the server. Please check your connection or try again later.');
      } else {
        setError(err.message || 'Failed to register. Please try again with different credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your full name"
          />
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your username"
            required
          />
        </div>
        
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
            placeholder="Create a password"
            required
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register; 