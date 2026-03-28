/**
 * Servicio mejorado para detectar automáticamente el puerto del backend
 * Optimizado para funcionar en LAN y múltiples entornos
 */
class BackendDetector {
  constructor() {
    this.baseURL = null;
    this.isDetecting = false;
    this.detectionPromise = null;
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'silent';
  }

  _log(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
    const currentLevel = levels[this.logLevel] || 4;
    const messageLevel = levels[level] || 4;
    
    if (messageLevel >= currentLevel) {
      console[level === 'debug' ? 'log' : level](message, ...args);
    }
  }

  /**
   * Detecta automáticamente el puerto del backend
   */
  async detectBackendPort() {
    if (this.baseURL) {
      return this.baseURL;
    }

    if (this.isDetecting) {
      return this.detectionPromise;
    }

    this.isDetecting = true;
    this.detectionPromise = this._performDetection();
    
    try {
      const result = await this.detectionPromise;
      this.isDetecting = false;
      return result;
    } catch (error) {
      this.isDetecting = false;
      throw error;
    }
  }

  async _performDetection() {
    // Solo mostrar logs si está habilitado el modo debug
    const debugMode = this.logLevel === 'debug';
    
    if (debugMode) this._log('debug', '🔍 Detectando puerto del backend...');
    
    // Obtener la IP actual del cliente
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    // PRIORIDAD 1: Intentar localhost primero
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      const localUrl = 'http://localhost:5000/api';
      try {
        const response = await this._testConnection(`http://localhost:5000/api/health`, 3000);
        if (response.ok) {
          this.baseURL = localUrl;
          return localUrl;
        }
      } catch (error) {
        // Silencioso
      }
    }
    
    // PRIORIDAD 2: Leer archivo de configuración
    try {
      const response = await fetch('/backend-port.json', { 
        cache: 'no-cache'
      });
      if (response.ok) {
        const config = await response.json();
        
        // Determinar la URL apropiada basada en la IP del cliente
        let apiUrl;
        
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
          apiUrl = config.api_local;
        } else if (currentHost.startsWith('192.168.')) {
          // Para redes LAN, intentar primero la IP configurada del servidor
          if (config.api_lan && currentHost !== config.server_ip) {
            apiUrl = config.api_lan;
          } else {
            // Usar la misma IP que el frontend pero con puerto del backend
            apiUrl = `http://${currentHost}:${config.backend_port}/api`;
          }
        } else if (currentHost.startsWith('10.')) {
          // Red ZeroTier o similar
          apiUrl = config.api_zerotier || `http://${currentHost}:${config.backend_port}/api`;
        } else {
          // Fallback: usar la misma IP que el cliente pero con el puerto del backend
          apiUrl = `http://${currentHost}:${config.backend_port}/api`;
        }
        
        // Verificar que el backend responda
        const testUrl = apiUrl.replace('/api', '/api/health');
        
        try {
          const healthResponse = await this._testConnection(testUrl, 5000);
          
          if (healthResponse.ok) {
            this.baseURL = apiUrl;
            if (debugMode) console.log(`✅ Backend detectado en: ${apiUrl}`);
            return apiUrl;
          }
        } catch (error) {
          // Silencioso
        }
      }
    } catch (error) {
      // Silencioso
    }
    
    // PRIORIDAD 3: Detección manual inteligente
    
    const possibleHosts = [];
    
    // Si el cliente está en una red LAN, priorizar esa red
    if (currentHost.startsWith('192.168.')) {
      possibleHosts.push(currentHost); // Misma IP que el frontend
      const networkBase = currentHost.substring(0, currentHost.lastIndexOf('.'));
      possibleHosts.push(`${networkBase}.1`, `${networkBase}.100`);
    } else if (currentHost.startsWith('10.')) {
      possibleHosts.push(currentHost); // Misma IP que el frontend
    } else {
      // Localhost como fallback
      possibleHosts.push('localhost', '127.0.0.1');
    }
    
    const possiblePorts = [5000, 5001, 3000];
    
    for (const host of possibleHosts) {
      for (const port of possiblePorts) {
        try {
          const testUrl = `http://${host}:${port}/api/health`;
          
          const response = await this._testConnection(testUrl, 2000);
          
          if (response.ok) {
            const apiUrl = `http://${host}:${port}/api`;
            this.baseURL = apiUrl;
            if (debugMode) console.log(`✅ Backend detectado: ${apiUrl}`);
            return apiUrl;
          }
        } catch (error) {
          // Silencioso
        }
      }
    }
    
    // Si todo falla, usar localhost como último recurso
    const fallbackUrl = 'http://localhost:5000/api';
    this.baseURL = fallbackUrl;
    return fallbackUrl;
  }

  /**
   * Método auxiliar para probar conexiones con timeout
   */
  async _testConnection(url, timeoutMs = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fuerza una nueva detección
   */
  forceRedetection() {
    this.baseURL = null;
    this.isDetecting = false;
    this.detectionPromise = null;
    return this.detectBackendPort();
  }

  /**
   * Obtiene la URL base actual sin nueva detección
   */
  getCurrentBaseURL() {
    return this.baseURL;
  }
}

// Crear instancia singleton
const backendDetector = new BackendDetector();

export default backendDetector;
