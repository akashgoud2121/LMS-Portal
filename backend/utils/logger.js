// Logger utility for production-ready logging
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but format differently in production
    if (isProduction) {
      // In production, log to error tracking service
      console.error('[ERROR]', ...args);
    } else {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment || isProduction) {
      console.warn('[WARN]', ...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment || isProduction) {
      console.info('[INFO]', ...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

module.exports = logger;

