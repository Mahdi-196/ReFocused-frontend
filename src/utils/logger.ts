type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  component?: string;
}

import { isDevelopment, isProduction } from '../config/environment';

class Logger {
  private isDevelopment = isDevelopment;
  private isProduction = isProduction;
  
  private log(level: LogLevel, message: string, data?: unknown, component?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component
    };

    // Always log errors and warnings regardless of environment
    if (level === 'error' || level === 'warn') {
      console[level](this.formatMessage(entry), data);
      return;
    }

    // Only log info/debug in development
    if (this.isDevelopment) {
      console.log(this.formatMessage(entry), data);
    }
    
    // In production, we could optionally send logs to external services
    // this.sendToExternalService(entry);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const component = entry.component ? `[${entry.component}]` : '';
    return `${timestamp} ${entry.level.toUpperCase()} ${component} ${entry.message}`;
  }

  info(message: string, data?: unknown, component?: string): void {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: unknown, component?: string): void {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: unknown, component?: string): void {
    this.log('error', message, data, component);
  }

  debug(message: string, data?: unknown, component?: string): void {
    this.log('debug', message, data, component);
  }

  // Production-safe logging methods
  productionInfo(message: string, data?: unknown, component?: string): void {
    // Always log in production for critical info
    if (this.isProduction) {
      console.log(this.formatMessage({ ...this.createLogEntry('info', message, data, component), timestamp: new Date() }), data);
    } else {
      this.log('info', message, data, component);
    }
  }

  productionWarn(message: string, data?: unknown, component?: string): void {
    // Always log warnings in production
    this.log('warn', message, data, component);
  }

  productionError(message: string, data?: unknown, component?: string): void {
    // Always log errors in production
    this.log('error', message, data, component);
  }

  // Convenience methods for common patterns
  apiCall(endpoint: string, method: string, data?: unknown): void {
    this.info(`API ${method} ${endpoint}`, data, 'API');
  }

  cacheHit(key: string): void {
    this.debug(`Cache hit: ${key}`, undefined, 'CACHE');
  }

  cacheMiss(key: string): void {
    this.debug(`Cache miss: ${key}`, undefined, 'CACHE');
  }

  performance(component: string, duration: number): void {
    if (duration > 100) {
      this.warn(`Slow render: ${component} took ${duration}ms`, undefined, 'PERF');
    }
  }

  // Helper method to create log entries
  private createLogEntry(level: LogLevel, message: string, data?: unknown, component?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date(),
      component
    };
  }

  // Get current logging status
  getStatus(): { isDevelopment: boolean; isProduction: boolean; env: string | undefined } {
    return {
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      env: process.env.NEXT_PUBLIC_APP_ENV
    };
  }
}

export const logger = new Logger();
export default logger; 