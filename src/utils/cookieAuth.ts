/**
 * Cookie-based Authentication Utilities
 * Secure JWT token management using HTTP-only cookies
 */

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  domain?: string;
  path?: string;
}

/**
 * Cookie-based authentication manager
 * This will be used when backend implements HTTP-only cookie authentication
 */
export class CookieAuthManager {
  private static instance: CookieAuthManager;
  private isServerSide: boolean;

  constructor() {
    this.isServerSide = typeof window === 'undefined';
  }

  static getInstance(): CookieAuthManager {
    if (!CookieAuthManager.instance) {
      CookieAuthManager.instance = new CookieAuthManager();
    }
    return CookieAuthManager.instance;
  }

  /**
   * Check if authentication cookie exists
   * Note: Cannot read HTTP-only cookies from client-side JavaScript
   */
  isAuthenticated(): boolean {
    if (this.isServerSide) {
      return false; // Server-side check would need to be done in middleware
    }

    // For HTTP-only cookies, we can't directly check from client side
    // Instead, we rely on API responses and server-side cookie validation
    // This method exists for fallback compatibility with localStorage approach
    const fallbackToken = localStorage.getItem('REF_TOKEN');
    return !!fallbackToken;
  }

  /**
   * Clear authentication cookies (logout)
   * This sends a request to backend to clear the HTTP-only cookie
   */
  async clearAuthCookies(): Promise<void> {
    try {
      // Call logout endpoint to clear HTTP-only cookies
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to clear auth cookies on server');
      }

      // Clear any fallback localStorage tokens
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      localStorage.removeItem('REF_COLLECTION_TOKENS');
      
    } catch (error) {
      console.error('Error clearing auth cookies:', error);
      
      // Fallback: clear localStorage even if server request fails
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      localStorage.removeItem('REF_COLLECTION_TOKENS');
    }
  }

  /**
   * Get user info from server (since we can't access HTTP-only cookies directly)
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - clear any stale localStorage data
          this.clearLocalFallbackData();
          return null;
        }
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh authentication status by checking with server
   */
  async refreshAuthStatus(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Clear localStorage fallback data
   */
  private clearLocalFallbackData(): void {
    try {
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      localStorage.removeItem('REF_COLLECTION_TOKENS');
    } catch (error) {
      console.warn('Failed to clear localStorage fallback data:', error);
    }
  }

  /**
   * Migrate from localStorage to cookie-based auth
   * This method helps transition existing users
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    const existingToken = localStorage.getItem('REF_TOKEN');
    
    if (!existingToken) {
      return false; // Nothing to migrate
    }

    try {
      // Send existing token to backend for validation and cookie setup
      const response = await fetch('/api/v1/auth/migrate-to-cookies', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${existingToken}`,
        },
      });

      if (response.ok) {
        // Migration successful, clear localStorage
        this.clearLocalFallbackData();
        console.log('Successfully migrated to cookie-based authentication');
        return true;
      } else {
        console.warn('Failed to migrate to cookie-based auth:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error during migration to cookie auth:', error);
      return false;
    }
  }

  /**
   * Check if backend supports cookie-based auth
   */
  async checkCookieAuthSupport(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/auth/cookie-support', {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Global cookie auth manager instance
 */
export const cookieAuth = CookieAuthManager.getInstance();

/**
 * Hook for cookie-based authentication
 * Note: This hook should be moved to a separate hooks file when used
 */
// export const useCookieAuth = () => {
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   const checkAuth = async () => {
//     setLoading(true);
//     try {
//       const currentUser = await cookieAuth.getCurrentUser();
//       setUser(currentUser);
//       setIsAuthenticated(!!currentUser);
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       setIsAuthenticated(false);
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     await cookieAuth.clearAuthCookies();
//     setIsAuthenticated(false);
//     setUser(null);
//   };

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   return {
//     isAuthenticated,
//     user,
//     loading,
//     checkAuth,
//     logout,
//     refresh: checkAuth,
//   };
// };

// Note: To use the hook, create a separate file like hooks/useCookieAuth.ts
// and import React/useState/useEffect there