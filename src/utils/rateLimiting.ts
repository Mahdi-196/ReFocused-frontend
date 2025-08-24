/**
 * Client-Side Rate Limiting Utilities
 * Prevents excessive API requests and handles rate limit responses
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

/**
 * Client-side rate limiter to prevent excessive requests
 */
export class ClientRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configurations for different endpoint types
    this.setLimitConfig('auth/login', { maxRequests: 5, windowMs: 15 * 60 * 1000 }); // 5 attempts per 15 minutes
    this.setLimitConfig('auth/register', { maxRequests: 3, windowMs: 60 * 60 * 1000 }); // 3 attempts per hour
    this.setLimitConfig('feedback', { maxRequests: 3, windowMs: 60 * 1000 }); // 3 per minute
    this.setLimitConfig('journal', { maxRequests: 100, windowMs: 60 * 1000 }); // 100 per minute
    this.setLimitConfig('default', { maxRequests: 60, windowMs: 60 * 1000 }); // 60 per minute default
  }

  /**
   * Set rate limit configuration for an endpoint pattern
   */
  setLimitConfig(pattern: string, config: RateLimitConfig): void {
    this.configs.set(pattern, config);
  }

  /**
   * Get rate limit configuration for a URL
   */
  private getConfigForUrl(url: string): RateLimitConfig {
    // Check for specific patterns first
    for (const [pattern, config] of this.configs.entries()) {
      if (url.includes(pattern)) {
        return config;
      }
    }
    
    // Return default configuration
    return this.configs.get('default') || { maxRequests: 60, windowMs: 60 * 1000 };
  }

  /**
   * Check if request is allowed (client-side prevention)
   */
  isRequestAllowed(url: string): { allowed: boolean; retryAfter?: number; reason?: string } {
    const config = this.getConfigForUrl(url);
    const now = Date.now();
    const key = this.getKeyFromUrl(url);
    
    let entry = this.limits.get(key);
    
    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      entry = undefined;
      this.limits.delete(key);
    }
    
    // Initialize or increment counter
    if (!entry) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        lastRequest: now
      };
      this.limits.set(key, entry);
      return { allowed: true };
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      };
    }
    
    // Update entry
    entry.count++;
    entry.lastRequest = now;
    
    return { allowed: true };
  }

  /**
   * Record a rate limit response from server
   */
  recordRateLimit(url: string, retryAfter: number): void {
    const key = this.getKeyFromUrl(url);
    const now = Date.now();
    
    this.limits.set(key, {
      count: 999, // High number to prevent further requests
      resetTime: now + (retryAfter * 1000),
      lastRequest: now
    });
  }

  /**
   * Get remaining requests for a URL
   */
  getRemainingRequests(url: string): number {
    const config = this.getConfigForUrl(url);
    const key = this.getKeyFromUrl(url);
    const entry = this.limits.get(key);
    
    if (!entry) {
      return config.maxRequests;
    }
    
    const now = Date.now();
    if (now > entry.resetTime) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(url: string): number {
    const key = this.getKeyFromUrl(url);
    const entry = this.limits.get(key);
    
    if (!entry) {
      return 0;
    }
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Extract key from URL for rate limiting
   */
  private getKeyFromUrl(url: string): string {
    // Remove query parameters and base URL for consistent keying
    try {
      const urlObj = new URL(url, 'http://localhost');
      const path = urlObj.pathname.replace(/^\/api\/v1\//, '');
      
      // Group similar endpoints
      if (path.startsWith('auth/')) return 'auth';
      if (path.startsWith('journal/')) return 'journal';
      if (path.startsWith('feedback')) return 'feedback';
      if (path.startsWith('study/')) return 'study';
      
      return path.split('/')[0] || 'default';
    } catch {
      return 'default';
    }
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get rate limit status for debugging
   */
  getStatus(): Array<{ key: string; count: number; remaining: number; resetIn: number }> {
    const now = Date.now();
    const status: Array<{ key: string; count: number; remaining: number; resetIn: number }> = [];
    
    for (const [key, entry] of this.limits.entries()) {
      const config = this.configs.get(key) || this.configs.get('default')!;
      status.push({
        key,
        count: entry.count,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetIn: Math.max(0, entry.resetTime - now)
      });
    }
    
    return status;
  }
}

/**
 * Global rate limiter instance
 */
export const clientRateLimiter = new ClientRateLimiter();

/**
 * Rate limit response handler
 */
export class RateLimitHandler {
  private static notifications: Map<string, number> = new Map();

  /**
   * Handle 429 rate limit response
   */
  static handleRateLimit(url: string, retryAfter: number, showNotification: boolean = true): void {
    // Record in client rate limiter
    clientRateLimiter.recordRateLimit(url, retryAfter);

    // Prevent duplicate notifications
    const notificationKey = clientRateLimiter['getKeyFromUrl'](url);
    const now = Date.now();
    const lastNotification = this.notifications.get(notificationKey) || 0;
    
    if (showNotification && (now - lastNotification) > 5000) { // 5 second cooldown
      this.showRateLimitNotification(retryAfter);
      this.notifications.set(notificationKey, now);
    }

    // Dispatch custom event for components to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rateLimitHit', {
        detail: { url, retryAfter, timestamp: now }
      }));
    }
  }

  /**
   * Show user-friendly rate limit notification
   */
  private static showRateLimitNotification(retryAfter: number): void {
    const minutes = Math.ceil(retryAfter / 60);
    const message = retryAfter < 60 
      ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
      : `Rate limit exceeded. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;

    // Dispatch toast notification event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          type: 'warning',
          message,
          duration: 5000
        }
      }));
    }
  }

  /**
   * Check if request should be blocked by client-side rate limiting
   */
  static shouldBlockRequest(url: string): { block: boolean; message?: string } {
    const check = clientRateLimiter.isRequestAllowed(url);
    
    if (!check.allowed) {
      return {
        block: true,
        message: check.reason
      };
    }
    
    return { block: false };
  }
}

/**
 * Decorator for API functions to add automatic rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  url: string
): T {
  return (async (...args: Parameters<T>) => {
    const check = RateLimitHandler.shouldBlockRequest(url);
    
    if (check.block) {
      throw new Error(check.message || 'Rate limit exceeded');
    }
    
    try {
      return await fn(...args);
    } catch (error: any) {
      // Handle 429 responses
      if (error.status === 429 || error.response?.status === 429) {
        const retryAfter = parseInt(
          error.retryAfter || 
          error.response?.headers?.['retry-after'] || 
          error.response?.headers?.['Retry-After'] || 
          '60'
        );
        
        RateLimitHandler.handleRateLimit(url, retryAfter);
      }
      
      throw error;
    }
  }) as T;
}

/**
 * React hook for rate limit status
 * Note: This hook should be moved to a separate hooks file when used
 */
// export function useRateLimit(url?: string) {
//   const [isLimited, setIsLimited] = useState(false);
//   const [retryAfter, setRetryAfter] = useState(0);
  
//   useEffect(() => {
//     const handleRateLimit = (event: CustomEvent) => {
//       if (url && !event.detail.url.includes(url)) return;
      
//       setIsLimited(true);
//       setRetryAfter(event.detail.retryAfter);
      
//       // Auto-reset when retry period expires
//       setTimeout(() => {
//         setIsLimited(false);
//         setRetryAfter(0);
//       }, event.detail.retryAfter * 1000);
//     };
    
//     window.addEventListener('rateLimitHit', handleRateLimit as EventListener);
    
//     return () => {
//       window.removeEventListener('rateLimitHit', handleRateLimit as EventListener);
//     };
//   }, [url]);
  
//   const getRemainingRequests = () => {
//     return url ? clientRateLimiter.getRemainingRequests(url) : null;
//   };
  
//   const getResetTime = () => {
//     return url ? clientRateLimiter.getResetTime(url) : 0;
//   };
  
//   return {
//     isLimited,
//     retryAfter,
//     getRemainingRequests,
//     getResetTime
//   };
// }

// Note: To use the hook, create a separate file like hooks/useRateLimit.ts
// and import React/useState/useEffect there