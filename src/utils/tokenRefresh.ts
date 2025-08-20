/**
 * Token Refresh Utilities
 * Handles token expiry and re-authentication prompts
 */

import { tokenValidator } from './tokenValidator';
import axios from 'axios';
import client from '@/api/client';

interface TokenRefreshOptions {
  warningThreshold?: number; // seconds before expiry to show warning
  autoLogoutThreshold?: number; // seconds before expiry to auto-logout
}

class TokenRefreshManager {
  private warningShown = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private options: Required<TokenRefreshOptions>;
  private refreshAttempted = false;

  constructor(options: TokenRefreshOptions = {}) {
    this.options = {
      warningThreshold: options.warningThreshold || 180, // 3 minutes
      autoLogoutThreshold: options.autoLogoutThreshold || 30, // 30 seconds
    };
  }

  /**
   * Start monitoring token expiry
   */
  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Clear any existing interval
    this.stopMonitoring();
    this.refreshAttempted = false;

    // Check every 15 seconds for more responsive token monitoring
    this.checkInterval = setInterval(() => {
      this.checkTokenExpiry();
    }, 15000);

    // Also check immediately
    this.checkTokenExpiry();

    // Suppress monitoring start message
    // console.log('🔄 Token refresh monitoring started');
  }

  /**
   * Stop monitoring token expiry
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      // Suppress monitoring stop message
      // console.log('🔄 Token refresh monitoring stopped');
    }
  }

  /**
   * Check if token is about to expire and take action
   */
  private checkTokenExpiry(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('REF_TOKEN');
    if (!token) return;

    const validation = tokenValidator.validateJWT(token);
    if (!validation.isValid || !validation.payload?.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = validation.payload.exp - now;

    // Suppress token monitoring logs
    // if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    //   console.log('🔄 [TOKEN MONITOR] Time until expiry:', timeUntilExpiry, 'seconds');
    // }

    // Proactive silent refresh when approaching expiry (once per cycle)
    if (timeUntilExpiry <= this.options.warningThreshold && !this.refreshAttempted) {
      this.refreshAttempted = true;
      this.silentRefresh().finally(() => {
        // Allow another attempt after a successful refresh resets the token times
        // If refresh failed, we keep the flag to avoid spamming; interceptor will handle on next 401
        setTimeout(() => { this.refreshAttempted = false; }, 60_000);
      });
    }

    // Fully silent mode: do not show any UI warnings
    if (timeUntilExpiry <= this.options.warningThreshold && !this.warningShown) {
      this.warningShown = true;
    }

    // Reset warning flag if token has more time
    if (timeUntilExpiry > this.options.warningThreshold) {
      this.warningShown = false;
    }
  }

  /**
   * Show a warning to the user about token expiry
   */
  private showExpiryWarning(_timeLeft: number): void {}

  /**
   * Handle token expiry by logging out and redirecting
   */
  private handleTokenExpiry(): void {
    console.error('🚨 [TOKEN EXPIRED] Logging out due to token expiry');
    
    // Clear all auth data
    localStorage.removeItem('REF_TOKEN');
    localStorage.removeItem('REF_USER');
    localStorage.removeItem('REF_COLLECTION_TOKENS');
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Show user-friendly message
    // Prefer non-blocking UI; allow app-level UI to react to logout
    // window.dispatchEvent(new CustomEvent('tokenExpired'));
    
    // Redirect to landing page
    window.location.href = '/';
  }

  /**
   * Attempt a silent refresh using refresh cookie without interrupting the user
   */
  private async silentRefresh(): Promise<void> {
    try {
      // Use root-level refresh alias so credentials flow correctly regardless of API base
      const refreshResp = await axios.post('/auth/refresh', {}, { withCredentials: true });
      const newAccess: string | undefined = refreshResp.data?.access_token;
      if (newAccess) {
        localStorage.setItem('REF_TOKEN', newAccess);
        client.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        // Reset warning flag after successful refresh
        this.warningShown = false;
        // Immediately re-check timings with the fresh token
        this.checkTokenExpiry();
      }
    } catch {
      // Swallow errors; the axios response interceptor will handle 401/403 on demand
    }
  }

  /**
   * Request user to refresh their session
   */
  static requestSessionRefresh(): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('tokenNearExpiry', { detail: { timeLeft: null } }));
      } catch {
        // no-op
      }
    }
  }

  /**
   * Force immediate token refresh (reload page)
   */
  static forceRefresh(): void {
    console.log('🔄 Forcing session refresh...');
    window.location.reload();
  }
}

// Create singleton instance
export const tokenRefreshManager = new TokenRefreshManager();

// Auto-start monitoring when authenticated
if (typeof window !== 'undefined') {
  // Start monitoring if token exists
  const token = localStorage.getItem('REF_TOKEN');
  if (token && token !== 'dummy-auth-token') {
    tokenRefreshManager.startMonitoring();
  }

  // Listen for auth events
  window.addEventListener('userLoggedOut', () => {
    tokenRefreshManager.stopMonitoring();
  });

  // Listen for token near expiry events
  // Silent mode: do not attach UI listeners
}

export { TokenRefreshManager };