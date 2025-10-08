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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/v1/auth/logout`, {
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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/v1/auth/me`, {
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
   * Note: Backend now sets cookies automatically on login/register,
   * so no explicit migration endpoint is needed.
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    const existingToken = localStorage.getItem('REF_TOKEN');

    if (!existingToken) {
      return false; // Nothing to migrate
    }

    // Backend automatically sets cookies on successful authentication
    // No migration endpoint needed - cookies are set on login/register
    console.log('Cookie-based auth is enabled automatically on login/register');
    return false; // Return false to use normal auth flow
  }

  /**
   * Check if backend supports cookie-based auth
   * Note: Backend now supports cookies by default on all auth endpoints
   */
  async checkCookieAuthSupport(): Promise<boolean> {
    // Backend supports cookies on all authentication endpoints by default
    // No need to check a dedicated endpoint
    return true;
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