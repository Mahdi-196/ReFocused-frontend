"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface GoogleSignInButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'rectangular',
  className = '',
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const hasRendered = useRef(false);

  // Generate stable ID that doesn't change on re-renders
  const buttonId = useMemo(() => `google-signin-${Math.random().toString(36).substr(2, 9)}`, []);

  const { renderGoogleButton } = useGoogleAuth({
    onSuccess,
    onError,
  });

  useEffect(() => {
    const renderButton = () => {
      if (buttonRef.current && !hasRendered.current && window.google?.accounts?.id) {
        try {
          setIsRendering(true);
          
          // Create the button element with stable ID
          const buttonElement = document.createElement('div');
          buttonElement.id = buttonId;
          buttonRef.current.appendChild(buttonElement);
          
          // Render the Google button with options
          renderGoogleButton(buttonId, {
            theme,
            size,
            text,
            shape,
            width: 400, // Max allowed by Google
          });
          
          hasRendered.current = true;
          setIsLoaded(true);
        } catch (error) {
          console.error('Error rendering Google button:', error);
          if (onError) {
            onError('Failed to render Google Sign-In button');
          }
        } finally {
          setIsRendering(false);
        }
      }
    };

    // Check if Google SDK is already loaded
    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      // Wait for Google SDK to load with proper polling
      const checkGoogleLoaded = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogleLoaded);
          renderButton();
        }
      }, 50); // Check more frequently

      // Cleanup interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkGoogleLoaded);
        if (onError) {
          onError('Google SDK failed to load within 10 seconds');
        }
      }, 10000);

      return () => {
        clearInterval(checkGoogleLoaded);
        clearTimeout(timeout);
      };
    }
  }, [renderGoogleButton, buttonId, theme, size, text, shape, onError]);

  return (
    <div className="w-full flex justify-center items-center py-2">
      <div className="w-full max-w-[420px] px-2 sm:px-0 flex justify-center">
        <div
          ref={buttonRef}
          className={`google-signin-wrapper bg-white/90 dark:bg-neutral-900/80 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center transition-all duration-300 min-h-[48px] ${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
            width: '100%',
            minHeight: size === 'large' ? '48px' : size === 'medium' ? '40px' : '32px',
            maxWidth: 400,
          }}
        >
          {!isLoaded && (
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSignInButton; 