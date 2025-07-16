/**
 * Auth Testing Utilities
 * Functions to test and verify auth functionality
 */

import { authService } from '@/api/services/authService';
import { authDebugUtils } from './authDebug';
import { tokenValidator } from './tokenValidator';
import client from '@/api/client';

export const authTestUtils = {
  /**
   * Run comprehensive auth system test
   */
  async runAuthSystemTest(): Promise<void> {
    console.group('🧪 [AUTH TEST] Running comprehensive auth system test');
    
    try {
      // 1. Check current auth state
      console.log('1️⃣ Checking current auth state...');
      authDebugUtils.logAuthState('Auth System Test');
      
      // 2. Test token validation
      console.log('2️⃣ Testing token validation...');
      const validation = tokenValidator.validateStoredToken();
      console.log('Token validation result:', validation);
      
      // 3. Test auth service methods
      console.log('3️⃣ Testing auth service methods...');
      const isAuth = authService.isAuthenticated();
      console.log('isAuthenticated():', isAuth);
      
      if (isAuth) {
        try {
          console.log('4️⃣ Testing getCurrentUser()...');
          const user = await authService.getCurrentUser();
          console.log('✅ getCurrentUser() successful:', {
            id: user.id,
            email: user.email,
            name: user.name
          });
        } catch (error) {
          console.error('❌ getCurrentUser() failed:', error);
        }
      } else {
        console.log('4️⃣ Skipping getCurrentUser() - not authenticated');
      }
      
      // 5. Test API client
      console.log('5️⃣ Testing API client configuration...');
      console.log('Base URL:', client.defaults.baseURL);
      console.log('Default headers:', client.defaults.headers);
      console.log('Request interceptors configured');
      console.log('Response interceptors configured');
      
    } catch (error) {
      console.error('🚨 Auth system test failed:', error);
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Test a specific API endpoint for auth issues
   */
  async testEndpoint(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<void> {
    console.group(`🎯 [AUTH TEST] Testing endpoint: ${method} ${endpoint}`);
    
    try {
      // Log current auth state before request
      authDebugUtils.logAuthState(`Before ${method} ${endpoint}`);
      
      let response;
      if (method === 'GET') {
        response = await client.get(endpoint);
      } else {
        response = await client.post(endpoint, data);
      }
      
      console.log('✅ Request successful:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        hasData: !!response.data
      });
      
    } catch (error: any) {
      console.error('❌ Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        isAuthError: error.response?.status === 401 || error.response?.status === 403
      });
      
      if (error.response?.status === 401) {
        console.warn('🔐 This is a 401 Unauthorized error - check token validity');
        tokenValidator.runTokenDiagnostics();
      }
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Test common journal endpoints that were showing 401 errors
   */
  async testJournalEndpoints(): Promise<void> {
    console.group('📚 [AUTH TEST] Testing journal endpoints');
    
    const endpoints = [
      '/journal/collections',
      '/journal/gratitude'
    ];
    
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.groupEnd();
  },

  /**
   * Quick auth status check
   */
  quickAuthCheck(): void {
    console.group('⚡ [AUTH TEST] Quick auth status check');
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    const user = typeof window !== 'undefined' ? localStorage.getItem('REF_USER') : null;
    
    console.log('Auth Status:', {
      hasToken: !!token,
      hasUser: !!user,
      isAuthenticated: authService.isAuthenticated(),
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (token) {
      const validation = tokenValidator.validateJWT(token);
      console.log('Token validation:', {
        isValid: validation.isValid,
        isExpired: validation.isExpired,
        error: validation.error
      });
    }
    
    console.groupEnd();
  }
};

// Make available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).authTest = authTestUtils;
  console.log('🔧 Auth test utilities available at window.authTest');
}