import { useEffect, useCallback } from 'react';
import client from '@/api/client';

interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

interface UseGoogleAuthProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
}

export const useGoogleAuth = ({ onSuccess, onError }: UseGoogleAuthProps) => {
  const handleGoogleResponse = async (response: GoogleAuthResponse) => {
    try {
      // Use the API client which has mock interceptors
      const res = await client.post('/auth/google', {
        token: response.credential
      });

      const data = res.data;

      const accessToken = data.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }

      // Store token and user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('REF_TOKEN', accessToken);
        if (data.user) {
          localStorage.setItem('REF_USER', JSON.stringify(data.user));
        }
      }
      
      // Set authorization header for API client
      client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      console.log('Google OAuth successful, token stored');
      if (onSuccess) {
        onSuccess(accessToken);
      }
    } catch (error: unknown) {
      console.error('Google Auth Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const initializeGoogleAuth = useCallback(() => {
    if (typeof window === 'undefined' || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }, [handleGoogleResponse]);

  const signInWithGoogle = useCallback(() => {
    if (typeof window === 'undefined' || !window.google) {
      console.error('Google Identity Services not loaded');
      return;
    }

    window.google.accounts.id.prompt();
  }, []);

  const renderGoogleButton = useCallback((elementId: string, options?: {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  }) => {
    if (typeof window === 'undefined' || !window.google) return;

    const defaultOptions = {
      theme: 'outline' as const,
      size: 'large' as const,
      text: 'signin_with' as const,
      shape: 'rectangular' as const,
    };

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      { ...defaultOptions, ...options }
    );
  }, []);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleAuth;
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [initializeGoogleAuth]);

  return {
    signInWithGoogle,
    renderGoogleButton,
    initializeGoogleAuth,
  };
}; 