// Utility logger para desarrollo
// Solo muestra logs en modo desarrollo
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (component, message, data = null) => {
    if (isDevelopment) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] [${component}] ${message}`, data || '');
    }
  },
  
  info: (component, message) => {
    if (isDevelopment) {
      console.info(`ℹ️ [${component}] ${message}`);
    }
  }
};

export default logger;
