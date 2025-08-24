"use client";

import React, { useState } from 'react';
import client from '@/api/client';
import { AUTH } from '@/api/endpoints';
import { validateEmail, validatePassword, validateText } from '@/utils/validation';
import { logger } from '@/utils/logger';

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
      // Validate inputs
      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      const usernameValidation = validateText(username, 50);
      const nameValidation = validateText(name || username, 100);

      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Invalid email');
        setIsLoading(false);
        return;
      }

      if (!passwordValidation.isValid) {
        setError(passwordValidation.error || 'Invalid password');
        setIsLoading(false);
        return;
      }

      if (!usernameValidation.isValid) {
        setError(usernameValidation.error || 'Invalid username');
        setIsLoading(false);
        return;
      }

      if (!nameValidation.isValid) {
        setError(nameValidation.error || 'Invalid name');
        setIsLoading(false);
        return;
      }
      
      const response = await client.post(AUTH.REGISTER, {
        username: usernameValidation.sanitizedValue,
        email: emailValidation.sanitizedValue,
        password: passwordValidation.sanitizedValue,
        name: nameValidation.sanitizedValue
      });
      
      const data = response.data;
      
      logger.info('Registration successful', data, 'Register');
      
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
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      // Handle different error types
      const error = err as { name?: string; message?: string; response?: { data?: { message?: string } } };
      if (error.name === 'AbortError') {
        setError('Network error: Request timed out. Please try again later.');
      } else if (error.message === 'Network Error' || error.name === 'TypeError') {
        setError('Network error: Unable to connect to the server. Please check your connection or try again later.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to register. Please try again with different credentials.');
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