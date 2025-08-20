/**
 * Token Refresh Utilities
 * Handles token expiry and re-authentication prompts
 */

import { tokenValidator } from './tokenValidator';

interface TokenRefreshOptions {
  warningThreshold?: number; // seconds before expiry to show warning
  autoLogoutThreshold?: number; // seconds before expiry to auto-logout
}

class TokenRefreshManager {
  private warningShown = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private options: Required<TokenRefreshOptions>;

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

    // Auto-logout if very close to expiry
    if (timeUntilExpiry <= this.options.autoLogoutThreshold) {
      console.warn('🚨 [TOKEN MONITOR] Token expiring very soon, logging out');
      this.handleTokenExpiry();
      return;
    }

    // Show warning if approaching expiry
    if (timeUntilExpiry <= this.options.warningThreshold && !this.warningShown) {
      console.warn('⚠️ [TOKEN MONITOR] Token expiring soon, showing warning');
      this.showExpiryWarning(timeUntilExpiry);
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
  private showExpiryWarning(_timeLeft: number): void {
    // Disable all user-facing warnings; rely on silent auto-refresh in axios client
    return;
  }

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
    alert('Your session has expired. Please log in again to continue.');
    
    // Redirect to landing page
    window.location.href = '/';
  }

  /**
   * Request user to refresh their session
   */
  static requestSessionRefresh(): void {
    const shouldRefresh = confirm(
      'Your session is about to expire. Would you like to refresh the page to continue your session?'
    );
    
    if (shouldRefresh) {
      window.location.reload();
    } else {
      console.log('User declined session refresh');
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
  window.addEventListener('tokenNearExpiry', ((event: CustomEvent) => {
    console.log('📢 Token near expiry event received:', event.detail);
  }) as EventListener);
}

export { TokenRefreshManager };