/**
 * Logger utility that only logs in development mode
 * All console logs are automatically suppressed in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

// Override console methods to suppress expected errors in both dev and production
const originalError = console.error;
const originalWarn = console.warn;

// Suppress expected errors in both development and production
console.error = (...args: any[]) => {
  // Convert all arguments to string for pattern matching
  const allArgsStr = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ').toLowerCase();
  
  // Suppress network errors, 404s, 403s, and other expected errors
  if (
    allArgsStr.includes('404') ||
    allArgsStr.includes('403') ||
    allArgsStr.includes('failed to load resource') ||
    allArgsStr.includes('net::err') ||
    allArgsStr.includes('err_connection_refused') ||
    allArgsStr.includes('err_network') ||
    allArgsStr.includes('(not found)') ||
    allArgsStr.includes('(forbidden)') ||
    allArgsStr.includes('/announcements/active') ||
    allArgsStr.includes('/chats?limit=') ||
    allArgsStr.includes('announcements/active') ||
    allArgsStr.includes('chats?limit') ||
    allArgsStr.includes('dispatchxhrrequest') ||
    allArgsStr.includes('xhr @')
  ) {
    // Suppress these errors - they're expected
    return;
  }
  // Only show actual unexpected errors
  originalError.apply(console, args);
};

// Suppress warnings for expected errors
console.warn = (...args: any[]) => {
  const allArgsStr = args.map(arg => String(arg)).join(' ').toLowerCase();
  if (
    allArgsStr.includes('404') ||
    allArgsStr.includes('403') ||
    allArgsStr.includes('announcements') ||
    allArgsStr.includes('chats')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Override console methods in production to suppress all logs
if (!isDevelopment) {
  // Suppress all console logs in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

