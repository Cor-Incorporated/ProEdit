/**
 * Logger utility for conditional logging
 * P0-FIX: Centralized logging to reduce console.log in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableDebug = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

  private shouldLog(level: LogLevel): boolean {
    if (level === 'error' || level === 'warn') {
      return true; // Always log errors and warnings
    }
    return this.isDevelopment || this.enableDebug;
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...args);
    }
  }

  // Convenience method for performance logging
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

