"use client";

import React, { useEffect, useRef } from 'react';
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
  const buttonId = `google-signin-${Math.random().toString(36).substr(2, 9)}`;

  const { renderGoogleButton } = useGoogleAuth({
    onSuccess,
    onError,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buttonRef.current) {
        // Clear any existing content
        buttonRef.current.innerHTML = '';
        
        // Create the button element with unique ID
        const buttonElement = document.createElement('div');
        buttonElement.id = buttonId;
        buttonRef.current.appendChild(buttonElement);
        
        // Render the Google button with options
        renderGoogleButton(buttonId, {
          theme,
          size,
          text,
          shape,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [renderGoogleButton, buttonId, theme, size, text, shape]);

  return (
    <div 
      ref={buttonRef} 
      className={`google-signin-wrapper ${className}`}
    />
  );
};

export default GoogleSignInButton; 