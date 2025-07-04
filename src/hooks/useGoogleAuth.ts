import { useEffect, useCallback } from 'react';
import { authService } from '@/api/services';

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
      console.log('🔐 Google OAuth response received, processing...');
      
      // Use the auth service to handle Google authentication
      const authData = await authService.googleAuth({
        id_token: response.credential
      });
      
      // Save authentication data
      authService.saveAuthData(authData);
      
      console.log('✅ Google OAuth successful, token stored');
      if (onSuccess) {
        onSuccess(authData.access_token);
      }
    } catch (error: unknown) {
      console.error('❌ Google Auth Error:', error);
      let errorMessage = 'Google authentication failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid Google token')) {
          errorMessage = 'Unable to verify Google account. Please ensure your backend has the correct GOOGLE_CLIENT_ID configured.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed. Please check your backend configuration.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Unable to connect to authentication server. Please check if your backend is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const initializeGoogleAuth = useCallback(() => {
    if (typeof window === 'undefined' || !window.google) return;

    // ⚠️ GOOGLE OAUTH CONFIGURATION REQUIRED ⚠️
    // If you're seeing "[GSI_LOGGER]: The given origin is not allowed for the given client ID" error:
    // 1. This error occurs because your current domain/origin is not authorized for this Google OAuth Client ID
    // 2. ACTION REQUIRED: Log in to Google Cloud Console (https://console.cloud.google.com)
    // 3. Navigate to: APIs & Services > Credentials
    // 4. Find your OAuth 2.0 Client ID and click "Edit"
    // 5. Add "http://localhost:3000" to the "Authorized JavaScript origins" list
    // 6. Save the changes and wait a few minutes for propagation
    // 7. Refresh your application to test the fix
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file');
      if (onError) {
        onError('Google OAuth is not configured. Please contact support.');
      }
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }, [handleGoogleResponse, onError]);

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
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.warn('Google Identity Services not available for button rendering');
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID ${elementId} not found for Google button rendering`);
      return;
    }

    const defaultOptions = {
      theme: 'outline' as const,
      size: 'large' as const,
      text: 'signin_with' as const,
      shape: 'rectangular' as const,
      width: '100%', // Ensure full width
    };

    try {
      window.google.accounts.id.renderButton(
        element,
        { ...defaultOptions, ...options }
      );
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
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