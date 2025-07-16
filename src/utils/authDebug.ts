/**
 * Auth Debug Utilities
 * Helper functions to diagnose authentication issues
 */

interface TokenInfo {
  isPresent: boolean;
  isValid: boolean;
  length: number;
  prefix: string;
  hasBearer: boolean;
  isDummy: boolean;
  isEmpty: boolean;
}

interface AuthDebugInfo {
  token: TokenInfo;
  user: {
    isPresent: boolean;
    isValid: boolean;
    data?: any;
  };
  collectionTokens: {
    isPresent: boolean;
    count: number;
    keys: string[];
  };
  headers: {
    authorization?: string;
    hasAuthHeader: boolean;
  };
  timestamp: string;
}

export const authDebugUtils = {
  /**
   * Get comprehensive auth debug information
   */
  getAuthDebugInfo(): AuthDebugInfo {
    if (typeof window === 'undefined') {
      return {
        token: { isPresent: false, isValid: false, length: 0, prefix: '', hasBearer: false, isDummy: false, isEmpty: true },
        user: { isPresent: false, isValid: false },
        collectionTokens: { isPresent: false, count: 0, keys: [] },
        headers: { hasAuthHeader: false },
        timestamp: new Date().toISOString()
      };
    }

    const token = localStorage.getItem('REF_TOKEN');
    const user = localStorage.getItem('REF_USER');
    const collectionTokens = localStorage.getItem('REF_COLLECTION_TOKENS');

    // Token analysis
    const tokenInfo: TokenInfo = {
      isPresent: !!token,
      isValid: !!(token && token !== 'dummy-auth-token' && token.trim() !== ''),
      length: token?.length || 0,
      prefix: token ? token.substring(0, 20) + '...' : '',
      hasBearer: token?.startsWith('Bearer ') || false,
      isDummy: token === 'dummy-auth-token',
      isEmpty: !token || token.trim() === ''
    };

    // User data analysis
    let userData = null;
    let userIsValid = false;
    if (user) {
      try {
        userData = JSON.parse(user);
        userIsValid = !!(userData?.id && userData?.email);
      } catch (error) {
        console.warn('Failed to parse user data:', error);
      }
    }

    // Collection tokens analysis
    let collectionTokensData = {};
    if (collectionTokens) {
      try {
        collectionTokensData = JSON.parse(collectionTokens);
      } catch (error) {
        console.warn('Failed to parse collection tokens:', error);
      }
    }

    return {
      token: tokenInfo,
      user: {
        isPresent: !!user,
        isValid: userIsValid,
        data: userData
      },
      collectionTokens: {
        isPresent: !!collectionTokens,
        count: Object.keys(collectionTokensData).length,
        keys: Object.keys(collectionTokensData)
      },
      headers: {
        hasAuthHeader: false // Will be updated by client interceptor
      },
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Log detailed auth debug information
   */
  logAuthState(context: string = 'General'): void {
    const debugInfo = this.getAuthDebugInfo();
    
    console.group(`🔍 [AUTH DEBUG] ${context} - Auth State Analysis`);
    console.log('📊 Complete Auth State:', debugInfo);
    
    // Token analysis
    console.group('🎫 Token Analysis');
    if (debugInfo.token.isPresent) {
      if (debugInfo.token.isValid) {
        console.log('✅ Token is present and valid');
      } else {
        console.warn('⚠️ Token is present but invalid:', {
          isDummy: debugInfo.token.isDummy,
          isEmpty: debugInfo.token.isEmpty,
          length: debugInfo.token.length
        });
      }
    } else {
      console.error('❌ No token found');
    }
    console.log('Token Info:', debugInfo.token);
    console.groupEnd();

    // User analysis
    console.group('👤 User Data Analysis');
    if (debugInfo.user.isPresent) {
      if (debugInfo.user.isValid) {
        console.log('✅ User data is present and valid:', {
          id: debugInfo.user.data?.id,
          email: debugInfo.user.data?.email,
          name: debugInfo.user.data?.name
        });
      } else {
        console.warn('⚠️ User data is present but invalid or corrupted');
      }
    } else {
      console.error('❌ No user data found');
    }
    console.groupEnd();

    // Collection tokens analysis
    console.group('🗂️ Collection Tokens Analysis');
    if (debugInfo.collectionTokens.isPresent) {
      console.log(`✅ Collection tokens present: ${debugInfo.collectionTokens.count} collections`);
      if (debugInfo.collectionTokens.count > 0) {
        console.log('Collection IDs:', debugInfo.collectionTokens.keys);
      }
    } else {
      console.log('ℹ️ No collection tokens found (this is normal if no journals are accessed)');
    }
    console.groupEnd();

    console.groupEnd();
  },

  /**
   * Validate authentication state and provide recommendations
   */
  validateAuthState(): { isValid: boolean; issues: string[]; recommendations: string[] } {
    const debugInfo = this.getAuthDebugInfo();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check token
    if (!debugInfo.token.isPresent) {
      issues.push('No authentication token found');
      recommendations.push('User needs to log in');
    } else if (!debugInfo.token.isValid) {
      if (debugInfo.token.isDummy) {
        issues.push('Dummy token detected');
        recommendations.push('Replace dummy token with real authentication');
      }
      if (debugInfo.token.isEmpty) {
        issues.push('Empty token detected');
        recommendations.push('Clear localStorage and re-authenticate');
      }
      if (debugInfo.token.length < 10) {
        issues.push('Token appears too short to be valid');
        recommendations.push('Check token generation and storage');
      }
    }

    // Check user data
    if (!debugInfo.user.isPresent) {
      issues.push('No user data found');
      recommendations.push('Fetch user profile after authentication');
    } else if (!debugInfo.user.isValid) {
      issues.push('User data is corrupted or incomplete');
      recommendations.push('Clear user data and refetch from API');
    }

    // Check for mismatched state
    if (debugInfo.token.isValid && !debugInfo.user.isValid) {
      issues.push('Token is valid but user data is missing/invalid');
      recommendations.push('Fetch user profile to sync authentication state');
    }

    if (!debugInfo.token.isValid && debugInfo.user.isPresent) {
      issues.push('User data present but token is invalid');
      recommendations.push('Clear all auth data and re-authenticate');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  },

  /**
   * Run comprehensive auth diagnostics
   */
  runDiagnostics(context: string = 'Manual Check'): void {
    console.group(`🔬 [AUTH DIAGNOSTICS] ${context}`);
    
    this.logAuthState(context);
    
    const validation = this.validateAuthState();
    
    console.group('🎯 Validation Results');
    if (validation.isValid) {
      console.log('✅ Authentication state is valid');
    } else {
      console.warn('⚠️ Authentication issues detected:');
      validation.issues.forEach(issue => console.warn(`  • ${issue}`));
      
      console.log('💡 Recommendations:');
      validation.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    console.groupEnd();
    
    console.groupEnd();
  }
};

// Auto-run diagnostics on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Small delay to allow other modules to load
  setTimeout(() => {
    authDebugUtils.runDiagnostics('Initial Load');
  }, 1000);
}