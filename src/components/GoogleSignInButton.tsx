"use client";

import React, { useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface GoogleSignInButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithGoogle } = useGoogleAuth({
    onSuccess,
    onError,
  });

  const handleGoogleSignIn = () => {
    if (disabled) return;
    setIsLoading(true);
    try {
      signInWithGoogle();
      // Loading state will be reset by success/error callbacks
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
      
      // Provide specific error message based on the error type
      let errorMessage = 'Failed to sign in with Google';
      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          errorMessage = 'Google authentication is not available. Please refresh the page.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.message.includes('not configured')) {
          errorMessage = 'Google Sign-In is not configured. Please contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading || disabled}
      className={`w-full h-12 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 rounded-lg flex items-center justify-center gap-3 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      ) : (
        <>
          {/* Google Icon */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton; 