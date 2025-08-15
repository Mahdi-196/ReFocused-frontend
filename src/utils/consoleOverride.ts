/**
 * Console Override Utility
 * Automatically hides console logs when NEXT_PUBLIC_APP_ENV is not 'development'
 * Integrates with the existing logger utility for consistent logging behavior
 */

import { logger } from './logger';
import { isDevelopment } from '../config/environment';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'group' | 'groupEnd' | 'table';

class ConsoleOverride {
  private original: Console;
  private isDevelopment: boolean;
  private isInitialized: boolean = false;
  private hasLoggedInit: boolean = false;

  constructor() {
    this.original = console;
    this.isDevelopment = isDevelopment;
  }

  /**
   * Initialize console override - should be called early in app lifecycle
   */
  init(): void {
    if (this.isInitialized) return;
    
    if (!this.isDevelopment) {
      this.overrideConsole();
    }
    
    this.isInitialized = true;
    
    // Log initialization status (only in development and only once)
    if (this.isDevelopment && !this.hasLoggedInit) {
      this.hasLoggedInit = true;
      // Uncomment the line below if you want to see this message
      // this.original.log('🔧 Console override initialized in development mode');
    } else if (!this.isDevelopment) {
      this.original.log('🚫 Console override initialized - logs hidden in production');
    }
  }

  /**
   * Override console methods to suppress logs in non-development environments
   */
  private overrideConsole(): void {
    const methods: ConsoleMethod[] = ['log', 'info', 'debug', 'trace', 'group', 'groupEnd', 'table'];
    
    methods.forEach(method => {
      // Store original method
      const originalMethod = this.original[method as keyof Console] as Function;
      
      // Override with no-op function
      (this.original as any)[method] = (...args: any[]) => {
        // Still allow critical logs to go through to logger
        if (method === 'warn' || method === 'error') {
          // Use logger for warnings and errors
          if (method === 'warn') {
            logger.warn(args[0], args.slice(1));
          } else {
            logger.error(args[0], args.slice(1));
          }
        }
        // Suppress all other console output
      };
    });

    // Do NOT override warn/error to avoid recursion with the logger.
    // Warnings and errors remain as original console methods in all envs.
  }

  /**
   * Restore original console methods (useful for debugging)
   */
  restore(): void {
    if (!this.isInitialized) return;
    
    // Restore original methods
    Object.keys(this.original).forEach(key => {
      if (key in this.original) {
        (this.original as any)[key] = (this.original as any)[`_original_${key}`] || (this.original as any)[key];
      }
    });
    
    this.isInitialized = false;
    this.original.log('🔧 Console methods restored');
  }

  /**
   * Get current override status
   */
  getStatus(): { isDevelopment: boolean; isInitialized: boolean; logsHidden: boolean } {
    return {
      isDevelopment: this.isDevelopment,
      isInitialized: this.isInitialized,
      logsHidden: !this.isDevelopment && this.isInitialized
    };
  }

  /**
   * Force enable console logs (useful for debugging in production)
   */
  forceEnable(): void {
    if (this.isInitialized) {
      this.restore();
    }
    this.original.log('🔧 Console logs force-enabled');
  }
}

// Create singleton instance
export const consoleOverride = new ConsoleOverride();

// Auto-initialize when module is imported
// This ensures console override happens as early as possible
// We'll also try to initialize immediately in the browser
if (typeof window !== 'undefined') {
  // Browser environment - initialize immediately
  consoleOverride.init();
  
  // Also try to initialize on DOMContentLoaded as a backup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      consoleOverride.init();
    });
  }
  
  // And on window load as another backup
  window.addEventListener('load', () => {
    consoleOverride.init();
  });
} else {
  // Node environment - initialize immediately
  consoleOverride.init();
}

export default consoleOverride;
