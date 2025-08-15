/**
 * Environment Configuration
 * Centralized management of environment variables and app configuration
 */

export const ENV = {
  // App Environment
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'production',
  
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Feature Flags
  ENABLE_DEBUG_LOGS: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  ENABLE_DEV_TOOLS: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.refocused.app',
  
  // Analytics
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  
  // Development Settings
  DEV_PORT: process.env.PORT || 3000,
  DEV_HOST: process.env.HOST || 'localhost',
} as const;

// Type-safe environment checks
export const isDevelopment = ENV.APP_ENV === 'development';
export const isProduction = ENV.APP_ENV === 'production';
export const isStaging = ENV.APP_ENV === 'staging';
export const isTest = ENV.NODE_ENV === 'test';

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  switch (ENV.APP_ENV) {
    case 'development':
      return {
        logLevel: 'debug',
        enableDevTools: true,
        enablePerformanceMonitoring: true,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
      };
      
    case 'staging':
      return {
        logLevel: 'info',
        enableDevTools: false,
        enablePerformanceMonitoring: true,
        cacheExpiry: 15 * 60 * 1000, // 15 minutes
      };
      
    case 'production':
    default:
      return {
        logLevel: 'warn',
        enableDevTools: false,
        enablePerformanceMonitoring: false,
        cacheExpiry: 60 * 60 * 1000, // 1 hour
      };
  }
};

// Export environment config
export const envConfig = getEnvironmentConfig();

export default ENV;
