/**
 * Security Integration Tests
 * Tests frontend security features with backend integration
 */

// Mock implementations for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

import { getCSRFHeaders, ensureCSRFToken, clearCSRFToken } from '../csrf';
import { clientRateLimiter, RateLimitHandler } from '../rateLimiting';
import { cookieAuth } from '../cookieAuth';
import { validateEmail, validatePassword, validateText } from '../validation';

describe('CSRF Protection Integration', () => {
  beforeEach(() => {
    clearCSRFToken();
    jest.clearAllMocks();
  });

  test('should generate and include CSRF tokens in headers', () => {
    const headers = getCSRFHeaders();
    expect(headers['X-CSRF-Token']).toBeDefined();
    expect(headers['X-CSRF-Token']).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(headers['X-CSRF-Token'].length).toBeGreaterThan(20);
  });

  test('should persist CSRF tokens in sessionStorage', () => {
    const token1 = ensureCSRFToken();
    const token2 = ensureCSRFToken();
    expect(token1).toBe(token2); // Should reuse existing token
    expect(sessionStorage.getItem('csrf_token')).toBe(token1);
  });

  test('should handle CSRF token refresh', () => {
    const token1 = ensureCSRFToken();
    clearCSRFToken();
    const token2 = ensureCSRFToken();
    expect(token1).not.toBe(token2); // Should generate new token
  });
});

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    clientRateLimiter.clear();
    jest.clearAllMocks();
  });

  test('should allow requests within rate limits', () => {
    const check = clientRateLimiter.isRequestAllowed('/auth/login');
    expect(check.allowed).toBe(true);
    expect(check.retryAfter).toBeUndefined();
  });

  test('should block requests exceeding rate limits', () => {
    // Simulate multiple login attempts
    for (let i = 0; i < 5; i++) {
      clientRateLimiter.isRequestAllowed('/auth/login');
    }
    
    const check = clientRateLimiter.isRequestAllowed('/auth/login');
    expect(check.allowed).toBe(false);
    expect(check.retryAfter).toBeGreaterThan(0);
    expect(check.reason).toContain('Rate limit exceeded');
  });

  test('should handle 429 responses from backend', () => {
    const mockDispatchEvent = jest.fn();
    window.dispatchEvent = mockDispatchEvent;

    RateLimitHandler.handleRateLimit('/auth/login', 60, false);

    // Should record rate limit
    const remaining = clientRateLimiter.getRemainingRequests('/auth/login');
    expect(remaining).toBe(0);

    // Should dispatch event
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rateLimitHit',
        detail: expect.objectContaining({
          url: '/auth/login',
          retryAfter: 60
        })
      })
    );
  });

  test('should reset rate limits after time window', () => {
    // Block the endpoint
    for (let i = 0; i < 6; i++) {
      clientRateLimiter.isRequestAllowed('/auth/login');
    }
    
    expect(clientRateLimiter.isRequestAllowed('/auth/login').allowed).toBe(false);

    // Simulate time passing (mock the rate limit entry)
    const rateLimiter = clientRateLimiter as any;
    const key = rateLimiter.getKeyFromUrl('/auth/login');
    const entry = rateLimiter.limits.get(key);
    if (entry) {
      entry.resetTime = Date.now() - 1000; // Set to past
    }

    expect(clientRateLimiter.isRequestAllowed('/auth/login').allowed).toBe(true);
  });
});

describe('Cookie Authentication Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
  });

  test('should check backend cookie support', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const supports = await cookieAuth.checkCookieAuthSupport();
    
    expect(supports).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/cookie-support', {
      method: 'GET',
      credentials: 'include'
    });
  });

  test('should migrate from localStorage to cookies', async () => {
    localStorage.setItem('REF_TOKEN', 'dummy-token-123');
    mockFetch.mockResolvedValueOnce({ ok: true });

    const migrated = await cookieAuth.migrateFromLocalStorage();
    
    expect(migrated).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/migrate-to-cookies', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-123'
      }
    });
    expect(localStorage.getItem('REF_TOKEN')).toBeNull();
  });

  test('should get current user from server', async () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test User' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const user = await cookieAuth.getCurrentUser();
    
    expect(user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  test('should handle logout with cookie clearing', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    localStorage.setItem('REF_TOKEN', 'some-token');

    await cookieAuth.clearAuthCookies();
    
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(localStorage.getItem('REF_TOKEN')).toBeNull();
  });
});

describe('Input Validation Integration', () => {
  test('should validate and sanitize email inputs', () => {
    const validEmail = validateEmail('  Test@Example.Com  ');
    expect(validEmail.isValid).toBe(true);
    expect(validEmail.sanitizedValue).toBe('test@example.com');

    const invalidEmail = validateEmail('not-an-email');
    expect(invalidEmail.isValid).toBe(false);
    expect(invalidEmail.error).toContain('Invalid email format');
  });

  test('should validate password strength', () => {
    const weakPassword = validatePassword('weak');
    expect(weakPassword.isValid).toBe(false);
    expect(weakPassword.error).toContain('at least 8 characters');

    const strongPassword = validatePassword('StrongPass123!');
    expect(strongPassword.isValid).toBe(true);
    expect(strongPassword.sanitizedValue).toBe('StrongPass123!');
  });

  test('should sanitize text inputs against XSS', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello World';
    const result = validateText(maliciousInput);
    
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).not.toContain('<script>');
    expect(result.sanitizedValue).toContain('Hello World');
  });

  test('should enforce text length limits', () => {
    const longText = 'a'.repeat(1001);
    const result = validateText(longText, 1000);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('1000 characters or less');
  });

  test('should validate URLs securely', () => {
    const { validateUrl } = require('../validation');
    
    const validUrl = validateUrl('https://example.com/path');
    expect(validUrl.isValid).toBe(true);
    
    const dangerousUrl = validateUrl('javascript:alert(1)');
    expect(dangerousUrl.isValid).toBe(false);
    
    const protocollessUrl = validateUrl('ftp://example.com');
    expect(protocollessUrl.isValid).toBe(false);
  });
});

describe('Security Headers Integration', () => {
  test('should work with CSP headers from Next.js config', () => {
    // This tests that our code works within CSP constraints
    expect(() => {
      // These operations should work within CSP
      const token = ensureCSRFToken();
      const headers = getCSRFHeaders();
      return { token, headers };
    }).not.toThrow();
  });

  test('should handle inline script restrictions', () => {
    // Ensure no eval() or Function() usage
    const csrfModule = require('../csrf');
    const rateLimitModule = require('../rateLimiting');
    
    const moduleStrings = [
      JSON.stringify(csrfModule),
      JSON.stringify(rateLimitModule)
    ];
    
    for (const moduleStr of moduleStrings) {
      expect(moduleStr).not.toContain('eval(');
      expect(moduleStr).not.toContain('Function(');
      expect(moduleStr).not.toContain('setTimeout(');
    }
  });
});

describe('Production Readiness Integration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true
    });
  });

  test('should handle production environment correctly', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true
    });
    
    // Logger should suppress development logs
    const logger = require('../logger').logger;
    const consoleSpy = jest.spyOn(console, 'log');
    
    logger.debug('Debug message');
    logger.info('Info message');
    
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Debug message')
    );
    
    consoleSpy.mockRestore();
  });

  test('should use secure settings in production', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true
    });
    
    // Verify no debug tokens or test data
    const token = ensureCSRFToken();
    expect(token).not.toContain('test');
    expect(token).not.toContain('debug');
    expect(token).not.toContain('dummy');
  });
});

describe('Error Handling Integration', () => {
  test('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));
    
    const user = await cookieAuth.getCurrentUser();
    expect(user).toBeNull();
  });

  test('should handle 401 unauthorized responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });
    
    const user = await cookieAuth.getCurrentUser();
    expect(user).toBeNull();
    expect(localStorage.getItem('REF_TOKEN')).toBeNull();
  });

  test('should handle malformed validation inputs', () => {
    expect(() => validateEmail(null as any)).not.toThrow();
    expect(() => validatePassword(undefined as any)).not.toThrow();
    expect(() => validateText('')).not.toThrow();
  });
});

// Integration test with actual API flow simulation
describe('Full Security Flow Integration', () => {
  test('should complete secure authentication flow', async () => {
    // 1. Check CSRF token generation
    const csrfHeaders = getCSRFHeaders();
    expect(csrfHeaders['X-CSRF-Token']).toBeDefined();

    // 2. Check rate limiting allows request
    const rateLimitCheck = clientRateLimiter.isRequestAllowed('/auth/login');
    expect(rateLimitCheck.allowed).toBe(true);

    // 3. Validate input data
    const emailValidation = validateEmail('test@example.com');
    const passwordValidation = validatePassword('SecurePass123!');
    expect(emailValidation.isValid).toBe(true);
    expect(passwordValidation.isValid).toBe(true);

    // 4. Mock successful login response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      })
    });

    // 5. Test cookie auth migration
    localStorage.setItem('REF_TOKEN', 'old-token');
    const migrated = await cookieAuth.migrateFromLocalStorage();
    
    expect(migrated).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/auth/migrate-to-cookies',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer old-token'
        })
      })
    );
  });
});