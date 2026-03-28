// Configuración para suprimir errores conocidos en desarrollo
// Este archivo evita que aparezcan errores específicos en la consola del navegador

// Guardar referencias originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Suprimir errores de consola
console.error = (...args) => {
  const message = args.join(' ');
  
  // Suprimir errores específicos de desarrollo
  const suppressedErrors = [
    'WebSocket connection to',
    'WebSocket is closed',
    'Failed to connect to websocket',
    'WebSocket closed without opening',
    'Connection failed',
    'ws://192.168',
    'Failed to connect to ws://',
    'WebSocket connection failed'
  ];
  
  // Permitir errores importantes (500, 401, 403, etc.)
  // Solo suprimir errores 404 de barcode que son esperados
  if (message.includes('404') && message.includes('barcode')) {
    return;
  }
  
  // Si es un error suprimido, no mostrarlo
  if (suppressedErrors.some(errorPattern => message.includes(errorPattern))) {
    return;
  }
  
  originalConsoleError(...args);
};

// Suprimir warnings
console.warn = (...args) => {
  const message = args.join(' ');
  
  // Suprimir advertencias específicas de desarrollo
  const suppressedWarnings = [
    'React Router Future Flag Warning',
    'startTransition',
    'React.startTransition',
    'deprecated',
    'deprecation',
    'Fast refresh',
    'scrolled',
    'DynamicNavbar'
  ];
  
  // Si es una advertencia suprimida, no mostrarla
  if (suppressedWarnings.some(warningPattern => message.includes(warningPattern))) {
    return;
  }
  
  originalConsoleWarn(...args);
};

// Suprimir algunos logs específicos del escáner
console.log = (...args) => {
  const message = args.join(' ');
  
  // Lista de logs a suprimir
  const suppressedLogs = [
    'GET',
    'http://192.168',
    '/barcode/',
    '404',
    'Not Found'
  ];
  
  // Si contiene TODOS estos patrones, es probablemente un log de request 404
  const isNetworkLog = suppressedLogs.filter(pattern => message.includes(pattern)).length >= 2;
  
  if (isNetworkLog) {
    return; // No mostrar
  }
  
  originalConsoleLog(...args);
};

// Suprimir errores no críticos de red durante desarrollo
window.addEventListener('error', (event) => {
  const message = event.message || '';
  
  // Errores de red no críticos durante desarrollo
  if (message.includes('WebSocket') || 
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('404') ||
      message.includes('barcode')) {
    event.preventDefault();
    return false;
  }
});

// Suprimir promesas rechazadas de red
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  
  if (message.includes('WebSocket') || 
      message.includes('Failed to connect') ||
      message.includes('404') ||
      message.includes('barcode') ||
      message.includes('Not Found')) {
    event.preventDefault();
    return false;
  }
});

export default {
  restore: () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  }
};