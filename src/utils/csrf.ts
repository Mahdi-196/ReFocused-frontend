/**
 * CSRF Protection Utilities
 * Provides client-side CSRF token generation and validation
 */

/**
 * Generate a cryptographically secure random token
 */
export const generateCSRFToken = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  
  // Generate 32 bytes of random data
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64 string
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Store CSRF token in session storage (more secure than localStorage for tokens)
 */
export const storeCSRFToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.warn('Failed to store CSRF token:', error);
  }
};

/**
 * Get CSRF token from session storage
 */
export const getCSRFToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.warn('Failed to retrieve CSRF token:', error);
    return null;
  }
};

/**
 * Generate and store a new CSRF token
 */
export const refreshCSRFToken = (): string => {
  const token = generateCSRFToken();
  storeCSRFToken(token);
  return token;
};

/**
 * Get or create CSRF token
 */
export const ensureCSRFToken = (): string => {
  let token = getCSRFToken();
  if (!token) {
    token = refreshCSRFToken();
  }
  return token;
};

/**
 * Add CSRF token to form data
 */
export const addCSRFTokenToFormData = (formData: FormData): FormData => {
  const token = ensureCSRFToken();
  const newFormData = new FormData();
  
  // Copy existing form data
  for (const [key, value] of formData.entries()) {
    newFormData.append(key, value);
  }
  
  // Add CSRF token
  newFormData.append('csrf_token', token);
  
  return newFormData;
};

/**
 * Add CSRF token to request headers
 */
export const getCSRFHeaders = (): Record<string, string> => {
  const token = ensureCSRFToken();
  return {
    'X-CSRF-Token': token
  };
};

/**
 * Add CSRF token to JSON payload
 */
export const addCSRFTokenToPayload = <T extends Record<string, unknown>>(payload: T): T & { csrf_token: string } => {
  const token = ensureCSRFToken();
  return {
    ...payload,
    csrf_token: token
  };
};

/**
 * Clear CSRF token (e.g., on logout)
 */
export const clearCSRFToken = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.warn('Failed to clear CSRF token:', error);
  }
};

/**
 * Initialize CSRF token on app start
 */
export const initializeCSRF = (): void => {
  if (typeof window === 'undefined') return;
  
  // Generate initial token if none exists
  ensureCSRFToken();
  
  // Refresh token periodically (every 30 minutes)
  setInterval(() => {
    refreshCSRFToken();
  }, 30 * 60 * 1000);
};