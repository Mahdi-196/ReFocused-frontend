/**
 * Input validation and sanitization utilities
 * Provides secure validation for user inputs to prevent XSS and injection attacks
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * HTML sanitization to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Email validation with sanitization
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
};

/**
 * Password validation with security requirements
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password too long' };
  }
  
  // Check for at least one uppercase, lowercase, number, and special character
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character' 
    };
  }
  
  return { isValid: true, sanitizedValue: password };
};

/**
 * Text input validation and sanitization
 */
export const validateText = (text: string, maxLength: number = 1000): ValidationResult => {
  if (!text) {
    return { isValid: false, error: 'Text is required' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Text cannot be empty' };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Text must be ${maxLength} characters or less` };
  }
  
  // Sanitize HTML but preserve line breaks
  const sanitized = sanitizeHtml(trimmed);
  
  return { isValid: true, sanitizedValue: sanitized };
};

/**
 * URL validation and sanitization
 */
export const validateUrl = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }
  
  const trimmed = url.trim();
  
  try {
    const urlObj = new URL(trimmed);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    return { isValid: true, sanitizedValue: urlObj.href };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Numeric validation
 */
export const validateNumber = (
  value: string | number, 
  min?: number, 
  max?: number
): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Must be no more than ${max}` };
  }
  
  return { isValid: true, sanitizedValue: num.toString() };
};

/**
 * Rating validation (1-5 scale)
 */
export const validateRating = (rating: string | number): ValidationResult => {
  return validateNumber(rating, 1, 5);
};

/**
 * Form validation helper
 */
export const validateForm = (
  fields: Record<string, { value: string; validator: (value: string) => ValidationResult }>
): { isValid: boolean; errors: Record<string, string>; sanitizedData: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, string> = {};
  
  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    const result = validator(value);
    
    if (!result.isValid) {
      errors[fieldName] = result.error || 'Invalid input';
    } else {
      sanitizedData[fieldName] = result.sanitizedValue || value;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
};