// Logger utility for frontend
const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG === 'true';

class Logger {
  constructor() {
    this.isDev = isDevelopment;
    this.isDebug = isDebugEnabled;
  }

  log(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  info(...args) {
    if (this.isDev) {
      console.info(...args);
    }
  }

  warn(...args) {
    if (this.isDev || this.isDebug) {
      console.warn(...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error(...args);
  }

  debug(...args) {
    if (this.isDev && this.isDebug) {
      console.debug(...args);
    }
  }

  // Service Worker specific logging
  sw(...args) {
    if (this.isDev) {
      console.log('[SW]', ...args);
    }
  }

  // PWA specific logging
  pwa(...args) {
    if (this.isDev) {
      console.log('[PWA]', ...args);
    }
  }

  // Socket specific logging
  socket(...args) {
    if (this.isDev) {
      console.log('[Socket]', ...args);
    }
  }

  // Notification specific logging
  notification(...args) {
    if (this.isDev) {
      console.log('[Notification]', ...args);
    }
  }

  // Firebase specific logging
  firebase(...args) {
    if (this.isDev) {
      console.log('[Firebase]', ...args);
    }
  }

  // API specific logging
  api(...args) {
    if (this.isDev) {
      console.log('[API]', ...args);
    }
  }

  // Performance logging
  performance(label, fn) {
    if (this.isDev) {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }

  // Group logging
  group(label, fn) {
    if (this.isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  // Table logging for objects/arrays
  table(data) {
    if (this.isDev) {
      console.table(data);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Named exports for convenience
export const {
  log,
  info,
  warn,
  error,
  debug,
  sw,
  pwa,
  socket,
  notification,
  firebase,
  api,
  performance,
  group,
  table
} = logger;