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

      // If this is the user's first Google login, ensure a default Open Peeps avatar exists
      try {
        const storedUser = authService.getCachedUser();
        const scope = String(storedUser?.id || storedUser?.email || 'user');
        const googleSeenKey = `REF_TUTORIAL_GOOGLE_SEEN:${scope}`;
        if (!storedUser?.avatar && !storedUser?.profile_picture && localStorage.getItem(googleSeenKey) !== 'true') {
          const { avatarService } = await import('@/api/services/avatarService');
          const seed = String(storedUser?.name || storedUser?.email || 'User');
          await avatarService.updateAvatar({
            style: 'open-peeps',
            seed,
            options: { backgroundColor: 'transparent' }
          });
        }
      } catch {}
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

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file');
      if (onError) {
        onError('Google OAuth is not configured. Please contact support.');
      }
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
        itp_support: true,
      });
      
      console.log('✅ Google OAuth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google OAuth:', error);
      if (onError) {
        onError('Google authentication setup failed. Please try refreshing the page.');
      }
    }
  }, [handleGoogleResponse, onError]);

  const signInWithGoogle = useCallback(() => {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.error('Google Identity Services not loaded');
      if (onError) {
        onError('Google authentication is not available. Please refresh the page.');
      }
      return;
    }

    try {
      // Create a temporary container for the Google button
      const buttonContainer = document.createElement('div');
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '-1000px'; // Hide it off-screen
      buttonContainer.style.left = '-1000px';
      document.body.appendChild(buttonContainer);

      // Render the Google button which handles popup blocking better
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: 250,
        text: 'signin_with',
        logo_alignment: 'left',
      });

      // Trigger a click on the button programmatically
      setTimeout(() => {
        const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
          googleButton.click();
          console.log('🔘 Google Sign-In button clicked programmatically');
        } else {
          console.warn('Google button not found, falling back to prompt');
          // Fallback to prompt method
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              console.warn('Google Sign-In prompt was not displayed');
              if (onError) {
                onError('Google Sign-In is blocked. Please:\n1. Enable popups for this site\n2. Allow third-party sign-in\n3. Try refreshing the page');
              }
            } else if (notification.isSkippedMoment()) {
              console.warn('Google Sign-In was skipped');
              if (onError) {
                onError('Google Sign-In was cancelled. Please enable third-party sign-in for this site in your browser settings.');
              }
            }
          });
        }
        
        // Clean up the temporary container
        setTimeout(() => {
          if (document.body.contains(buttonContainer)) {
            document.body.removeChild(buttonContainer);
          }
        }, 1000);
      }, 100);

    } catch (error) {
      console.error('Error triggering Google Sign-In:', error);
      if (onError) {
        onError('Google Sign-In failed to initialize. Please enable third-party sign-in in your browser settings.');
      }
    }
  }, [onError]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleAuth;
    
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [initializeGoogleAuth]);

  return {
    signInWithGoogle,
  };
};
