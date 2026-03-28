import axios from 'axios';
import Cookies from 'js-cookie';
import backendDetector from './BackendDetector';

// Configuración inicial (será actualizada dinámicamente)
let API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.api;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  async _performInitialization() {
    try {
      // Detectar automáticamente la URL del backend según la red
      API_BASE_URL = await backendDetector.detectBackendPort();

      // Solo mostrar en modo debug
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('🔗 URL del backend detectada:', API_BASE_URL);
      }

      this.api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // 30 segundos timeout (aumentado)
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      this._setupInterceptors();
      this.isInitialized = true;

      return this.api;
    } catch (error) {
      console.error('❌ Error inicializando ApiService:', error);
      // Fallback a localhost si falla la detección
      API_BASE_URL = 'http://localhost:5000/api';

      this.api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // 30 segundos timeout (aumentado)
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      this._setupInterceptors();
      this.isInitialized = true;

      return this.api;
    }
  }

  _setupInterceptors() {
    // Configurar interceptor para incluir el token automáticamente
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de autenticación y respuestas
    this.api.interceptors.response.use(
      (response) => {
        // Verificar que la respuesta sea JSON válido
        if (response.data && typeof response.data === 'string' && response.data.includes('<!doctype')) {
          console.error('⚠️ Respuesta HTML recibida en lugar de JSON');
          const error = new Error('Respuesta HTML inválida');
          error.response = { status: 500, data: { message: 'Respuesta de servidor inválida' } };
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        // Verificar si la respuesta de error es HTML
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
          console.warn('⚠️ Error con respuesta HTML detectado, posible problema de autenticación');
          error.response.data = { message: 'Error de autenticación - respuesta HTML' };
        }

        // Silenciar errores 404 esperados (endpoints opcionales o no implementados)
        const silentEndpoints = [
          '/barcode/',                    // Escáner QR - códigos que no existen
          '/users/pending-validation',    // Usuarios pendientes - endpoint opcional
          '/public/pending-users',        // Usuarios pendientes - endpoint alternativo
          '/public/attendance-today',     // Asistencias - endpoint opcional
          '/public/suplentes-stats',      // Suplentes - endpoint opcional
          '/students/attendance/today'    // Asistencia de hoy - puede ser restringido
        ];

        if (error.response?.status === 404 && silentEndpoints.some(endpoint => error.config?.url?.includes(endpoint))) {
          // No loguear - estos 404 son esperados y no indican errores
          return Promise.reject(error);
        }

        // Si el error es 401, solo limpiar token pero NO redirigir automáticamente
        // Dejar que el AuthContext maneje la redirección
        if (error.response?.status === 401) {
          console.warn('🔑 Token inválido detectado por interceptor');
          Cookies.remove('token');
          // NO redirigir automáticamente - dejar que AuthContext lo maneje
        }

        // Si hay error de conexión, intentar re-detectar el backend
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          this._handleNetworkError();
        }

        return Promise.reject(error);
      }
    );
  }

  async _handleNetworkError() {
    try {
      backendDetector.reset();
      await this.reinitialize();
    } catch {
      // Error silencioso
    }
  }

  async reinitialize() {
    this.isInitialized = false;
    this.initPromise = null;
    return this.initialize();
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.api;
  }

  // ===== MÉTODOS DE API =====
  async get(url, config = {}) {
    // Endpoints opcionales que no necesitan logging
    const silentEndpoints = [
      '/users/pending-validation',
      '/public/pending-users',
      '/public/attendance-today',
      '/public/suplentes-stats',
      '/students/attendance/today'
    ];

    const isSilent = silentEndpoints.some(endpoint => url.includes(endpoint));

    if (!isSilent) {
      console.log(`[ApiService.get] Llamando a: ${url}`);
    }

    const api = await this.ensureInitialized();
    const response = await api.get(url, config);

    if (!isSilent) {
      console.log(`[ApiService.get] Respuesta de ${url}:`, response.data);
    }

    // Normalizar la respuesta para mantener compatibilidad
    if (response.data && response.data.status === 'SUCCESS') {
      // Si ya tiene la estructura correcta, devolverla tal como está
      return response.data;
    }

    return response.data;
  }

  async post(url, data = {}, config = {}) {
    console.log(`[ApiService.post] Llamando a: ${url}`);
    const api = await this.ensureInitialized();
    const response = await api.post(url, data, config);
    console.log(`[ApiService.post] Respuesta de ${url}:`, response.data);

    // Normalizar la respuesta para mantener compatibilidad
    if (response.data && response.data.status === 'SUCCESS') {
      return response.data;
    }

    return response.data;
  }

  async put(url, data = {}, config = {}) {
    console.log(`[ApiService.put] Llamando a: ${url}`);
    const api = await this.ensureInitialized();
    const response = await api.put(url, data, config);
    console.log(`[ApiService.put] Respuesta de ${url}:`, response.data);
    return response.data;
  }

  async delete(url, config = {}) {
    console.log(`[ApiService.delete] Llamando a: ${url}`);
    const api = await this.ensureInitialized();
    const response = await api.delete(url, config);
    console.log(`[ApiService.delete] Respuesta de ${url}:`, response.data);
    return response.data;
  }

  // Método genérico request
  async request(method, url, data = null, config = {}) {
    const api = await this.ensureInitialized();

    const method_upper = method.toUpperCase();

    if (method_upper === 'GET') {
      const response = await api.get(url, config);
      return response.data;
    } else if (method_upper === 'POST') {
      const postResponse = await api.post(url, data, config);
      return postResponse.data;
    } else if (method_upper === 'PUT') {
      const putResponse = await api.put(url, data, config);
      return putResponse.data;
    } else if (method_upper === 'DELETE') {
      const deleteResponse = await api.delete(url, config);
      return deleteResponse.data;
    } else {
      throw new Error(`Método HTTP no soportado: ${method}`);
    }
  }

  // ===== MÉTODOS ESPECÍFICOS =====
  async getEstudiantes() {
    const response = await this.api.get('/estudiantes');
    // El backend devuelve { status: 'SUCCESS', data: [...] }
    return response.data;
  }

  async getEstudiante(id) {
    const response = await this.api.get(`/estudiantes/${id}`);
    return response.data;
  }

  async createEstudiante(data) {
    const response = await this.api.post('/estudiantes', data);
    return response.data;
  }

  async updateEstudiante(id, data) {
    const response = await this.api.put(`/estudiantes/${id}`, data);
    return response.data;
  }

  async deleteEstudiante(id) {
    const response = await this.api.delete(`/estudiantes/${id}`);
    return response.data;
  }

  async getEstudianteByCodigoBarras(codigo) {
    const response = await this.api.get(`/estudiantes/codigo/${codigo}`);
    return response.data;
  }

  // ===== USUARIOS =====
  async getUsuarios() {
    const response = await this.api.get('/usuarios');
    return response.data;
  }

  async getUsuario(id) {
    const response = await this.api.get(`/usuarios/${id}`);
    return response.data;
  }

  async createUsuario(data) {
    const response = await this.api.post('/usuarios', data);
    return response.data;
  }

  async updateUsuario(id, data) {
    const response = await this.api.put(`/usuarios/${id}`, data);
    return response.data;
  }

  async deleteUsuario(id) {
    const response = await this.api.delete(`/usuarios/${id}`);
    return response.data;
  }

  // ===== ASISTENCIA =====
  async getAsistencias(fecha = null) {
    const url = fecha ? `/asistencia?fecha=${fecha}` : '/asistencia';
    const response = await this.api.get(url);
    return response.data;
  }

  async createAsistencia(data) {
    const response = await this.api.post('/asistencia', data);
    return response.data;
  }

  async updateAsistencia(id, data) {
    const response = await this.api.put(`/asistencia/${id}`, data);
    return response.data;
  }

  async deleteAsistencia(id) {
    const response = await this.api.delete(`/asistencia/${id}`);
    return response.data;
  }

  async getAsistenciaEstudiante(estudianteId, fechaInicio = null, fechaFin = null) {
    let url = `/asistencia/estudiante/${estudianteId}`;
    const params = new URLSearchParams();

    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.api.get(url);
    return response.data;
  }

  // ===== SISTEMA DE ASISTENCIA MEJORADO =====


  // Obtener historial completo con estadísticas
  async getHistorialCompleto() {
    await this.ensureInitialized();
    const response = await this.api.get('/students/historial-completo');
    return response.data;
  }

  // Buscar estudiante por código QR o matrícula (incluye estudiantes de prueba)
  async findStudentByCode(codigo) {
    await this.ensureInitialized();
    const response = await this.api.get(`/students/barcode/${codigo}`);
    return response.data;
  }

  // Registrar asistencia de estudiante (mejorado)
  async registrarAsistenciaEstudiante(data) {
    await this.ensureInitialized();
    const response = await this.api.post('/students/attendance', data);
    return response.data;
  }

  // ✅ NUEVO: Rechazar asistencia de estudiante
  async rechazarAsistenciaEstudiante(data) {
    await this.ensureInitialized();
    const response = await this.api.post('/students/attendance/reject', data);
    return response.data;
  }

  // Obtener asistencias del día actual
  async getTodayAttendance() {
    await this.ensureInitialized();
    const response = await this.api.get('/students/attendance/today');
    return response.data;
  }

  // ===== JUSTIFICACIONES =====
  async getJustificaciones(estado = null) {
    const url = estado ? `/justificaciones?estado=${estado}` : '/justificaciones';
    const response = await this.api.get(url);
    return response.data;
  }

  async getJustificacion(id) {
    const response = await this.api.get(`/justificaciones/${id}`);
    return response.data;
  }

  async createJustificacion(data) {
    const response = await this.api.post('/justificaciones', data);
    return response.data;
  }

  async updateJustificacion(id, data) {
    const response = await this.api.put(`/justificaciones/${id}`, data);
    return response.data;
  }

  async deleteJustificacion(id) {
    const response = await this.api.delete(`/justificaciones/${id}`);
    return response.data;
  }

  async aprobarJustificacion(id) {
    const response = await this.api.put(`/justificaciones/${id}/aprobar`);
    return response.data;
  }

  async rechazarJustificacion(id, motivo = '') {
    const response = await this.api.put(`/justificaciones/${id}/rechazar`, { motivo });
    return response.data;
  }

  // ===== REPORTES =====
  async getReporteDiario(fecha) {
    const response = await this.api.get(`/reportes/diario?fecha=${fecha}`);
    return response.data;
  }

  async getReporteMensual(año, mes) {
    const response = await this.api.get(`/reportes/mensual?año=${año}&mes=${mes}`);
    return response.data;
  }

  async getEstadisticas(fechaInicio = null, fechaFin = null) {
    let url = '/reportes/estadisticas';
    const params = new URLSearchParams();

    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.api.get(url);
    return response.data;
  }

  async getReporteEstudiante(estudianteId, fechaInicio = null, fechaFin = null) {
    let url = `/reportes/estudiante/${estudianteId}`;
    const params = new URLSearchParams();

    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.api.get(url);
    return response.data;
  }

  // ===== CÓDIGOS QR =====
  async generateQR(estudianteId) {
    const response = await this.api.post(`/qr/generate/${estudianteId}`);
    return response.data;
  }

  async validateQRAndRegisterAttendance(codigo_qr, registrado_por) {
    const response = await this.api.post('/qr/validate-attendance', {
      codigo_qr,
      registrado_por
    });
    return response.data;
  }

  async getStudentByQR(codigo_qr) {
    const response = await this.api.get(`/qr/student/${codigo_qr}`);
    return response.data;
  }

  async scanQRCode(qrData) {
    const response = await this.api.post('/qr/validate-attendance', {
      codigo_qr: qrData
    });
    return response.data;
  }

  async getStudentsQRStatus() {
    const response = await this.api.get('/estudiantes');
    return response.data;
  }

  async generateMassiveQR() {
    const response = await this.api.post('/qr/generate-massive');
    return response.data;
  }

  async getQRImage(codigo) {
    const response = await this.api.get(`/qr/${codigo}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // ===== DASHBOARD =====
  async getDashboardData() {
    const response = await this.api.get('/dashboard');
    return response.data;
  }

  // ===== MÉTODOS PARA FORM DATA =====
  async postFormData(url, formData, config = {}) {
    await this.initialize();

    // Configurar headers para FormData
    const formDataConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await this.api.post(url, formData, formDataConfig);
    return response;
  }

  // ===== MÉTODOS DE CONFIGURACIÓN =====
  getBaseURL() {
    return API_BASE_URL;
  }
}

export default new ApiService();
