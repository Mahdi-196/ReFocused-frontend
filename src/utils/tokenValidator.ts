/**
 * Token Validation Utilities
 * Helpers for validating JWT tokens and detecting common issues
 */

interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  error?: string;
  payload?: any;
  expiresAt?: Date;
  issuedAt?: Date;
}

export const tokenValidator = {
  /**
   * Validate a JWT token without requiring a secret
   * This only checks format and expiration, not signature
   */
  validateJWT(token: string): TokenValidationResult {
    try {
      if (!token || token.trim() === '') {
        return { isValid: false, isExpired: false, error: 'Token is empty' };
      }

      if (token === 'dummy-auth-token') {
        return { isValid: false, isExpired: false, error: 'Dummy token detected' };
      }

      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, isExpired: false, error: 'Invalid JWT format - should have 3 parts' };
      }

      try {
        // Decode the payload (second part)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
        const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;
        
        // Check if token is expired
        const isExpired = payload.exp && payload.exp < now;
        
        console.log('🔍 [TOKEN DEBUG] JWT validation:', {
          isExpired,
          expiresAt,
          issuedAt,
          timeUntilExpiry: payload.exp ? (payload.exp - now) : 'unknown',
          payload: {
            sub: payload.sub,
            exp: payload.exp,
            iat: payload.iat
          }
        });

        return {
          isValid: !isExpired,
          isExpired: !!isExpired,
          payload,
          expiresAt,
          issuedAt,
          error: isExpired ? 'Token has expired' : undefined
        };
      } catch (decodeError) {
        return { isValid: false, isExpired: false, error: 'Failed to decode JWT payload' };
      }
    } catch (error) {
      return { isValid: false, isExpired: false, error: 'Token validation failed' };
    }
  },

  /**
   * Check if a token needs to be refreshed soon (within 5 minutes)
   */
  needsRefresh(token: string): boolean {
    const validation = this.validateJWT(token);
    if (!validation.payload?.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = validation.payload.exp - now;
    
    // Refresh if expiring within 3 minutes (180 seconds)
    return timeUntilExpiry < 180;
  },

  /**
   * Get detailed token information for debugging
   */
  getTokenInfo(token: string): any {
    if (!token) return { error: 'No token provided' };
    
    const validation = this.validateJWT(token);
    
    return {
      ...validation,
      length: token.length,
      prefix: token.substring(0, 20) + '...',
      suffix: '...' + token.substring(token.length - 10),
      parts: token.split('.').length,
      isDummy: token === 'dummy-auth-token'
    };
  },

  /**
   * Validate current stored token
   */
  validateStoredToken(): TokenValidationResult {
    if (typeof window === 'undefined') {
      return { isValid: false, isExpired: false, error: 'Not in browser environment' };
    }

    const token = localStorage.getItem('REF_TOKEN');
    if (!token) {
      return { isValid: false, isExpired: false, error: 'No token found in localStorage' };
    }

    return this.validateJWT(token);
  },

  /**
   * Clean up invalid tokens from localStorage
   */
  cleanupInvalidTokens(): void {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('REF_TOKEN');
    if (!token) return;
    
    const validation = this.validateJWT(token);
    if (!validation.isValid) {
      console.warn('🔧 Cleaning up invalid token:', validation.error);
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      localStorage.removeItem('REF_REFRESH_TOKEN');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('userLoggedOut'));
    }
  },

  /**
   * Run comprehensive token diagnostics
   */
  runTokenDiagnostics(): void {
    console.group('🔬 [TOKEN DIAGNOSTICS] Full Token Analysis');
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    
    if (!token) {
      console.error('❌ No token found in localStorage');
      console.groupEnd();
      return;
    }

    const info = this.getTokenInfo(token);
    console.log('📊 Token Information:', info);

    const validation = this.validateJWT(token);
    console.group('🎯 Validation Results');
    
    if (validation.isValid) {
      console.log('✅ Token is valid');
      if (validation.expiresAt) {
        const timeLeft = validation.expiresAt.getTime() - Date.now();
        console.log(`⏰ Expires in: ${Math.floor(timeLeft / 1000 / 60)} minutes`);
      }
    } else {
      console.error('❌ Token is invalid:', validation.error);
      if (validation.isExpired) {
        console.error('🕐 Token has expired');
        if (validation.expiresAt) {
          console.error('📅 Expired at:', validation.expiresAt.toISOString());
        }
      }
    }
    
    if (this.needsRefresh(token)) {
      console.warn('🔄 Token needs refresh soon');
    }
    
    console.groupEnd();
    console.groupEnd();
  }
};

// Auto-run token cleanup and diagnostics on import
if (typeof window !== 'undefined') {
  setTimeout(() => {
    // Always clean up invalid tokens
    tokenValidator.cleanupInvalidTokens();
    
    // Run diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      tokenValidator.runTokenDiagnostics();
    }
  }, 1000);
}