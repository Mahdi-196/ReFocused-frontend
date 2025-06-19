type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  component?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, data?: unknown, component?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component
    };

    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      console[level](this.formatMessage(entry), data);
      return;
    }

    // Only log info/debug in development
    if (this.isDevelopment) {
      console.log(this.formatMessage(entry), data);
    }
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
}

export const logger = new Logger();
export default logger; 