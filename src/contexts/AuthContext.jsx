import { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import ApiService from '../services/ApiService';
import { NotificationContext } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Acceder al contexto de notificaciones para limpiar historial al logout
  const notificationContext = useContext(NotificationContext);

  // Verificar si hay un token y validarlo al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('[AuthContext] Iniciando verificación de autenticación...');

        // Inicializar ApiService primero
        await ApiService.initialize();

        let storedToken = Cookies.get('token');

        // Fallback a localStorage si no hay cookie (útil en móvil)
        if (!storedToken) {
          storedToken = localStorage.getItem('auth_token');
          if (storedToken) {
            console.log('[AuthContext] Token recuperado de localStorage (fallback móvil)');
            // Restaurar cookie
            Cookies.set('token', storedToken, {
              expires: 7,
              secure: window.location.protocol === 'https:',
              sameSite: 'lax',
              path: '/'
            });
          }
        }

        if (storedToken) {
          try {
            // Verificar que el token tenga un formato válido antes de usarlo
            if (storedToken.split('.').length !== 3) {
              console.warn('Token con formato inválido encontrado, limpiando...');
              Cookies.remove('token');
              setIsAuthenticated(false);
              setUser(null);
              setToken(null);
              setLoading(false);
              return;
            }

            // Verificar si el token está expirado antes de hacer la llamada
            try {
              const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
              if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
                console.warn('[AuthContext] Token expirado encontrado, limpiando...');
                Cookies.remove('token');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
                setLoading(false);
                return;
              }
            } catch {
              console.warn('[AuthContext] Token no válido, limpiando...');
              Cookies.remove('token');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setIsAuthenticated(false);
              setUser(null);
              setToken(null);
              setLoading(false);
              return;
            }

            setToken(storedToken);

            // Solo verificar con el servidor si el token parece válido
            const response = await ApiService.get('/auth/me');

            setUser(response.data);
            setIsAuthenticated(true);

          } catch (error) {
            console.error('[AuthContext] Error verificando autenticación:', error);

            // Si el error es 401, el token expiró o es inválido
            if (error.response?.status === 401) {
              console.warn('[AuthContext] Token rechazado por servidor, limpiando...');
            }

            // Limpiar token inválido (cookies + localStorage)
            Cookies.remove('token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
            setIsAuthenticated(false);
            setToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Error inicializando ApiService:', error);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
      setLoading(false);
      setInitialized(true);
    };

    checkAuth();
  }, []);

  // Listener para detectar cambios en las cookies - Optimizado para móvil
  useEffect(() => {
    // Reducir frecuencia de verificación a cada 5 segundos para mejor rendimiento en móvil
    const interval = setInterval(() => {
      const currentToken = Cookies.get('token');
      // Solo actualizar si realmente cambió el estado
      if (token && !currentToken && isAuthenticated) {
        console.warn('[AuthContext] Token eliminado detectado, cerrando sesión...');
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      }
    }, 5000); // Cambiado de 1000ms a 5000ms

    return () => clearInterval(interval);
  }, [token, isAuthenticated]);

  const login = async (formData) => {
    try {
      // Asegurar que ApiService esté inicializado
      await ApiService.initialize();

      const response = await ApiService.post('/auth/login', {
        email_or_matricula: formData.email_or_matricula,
        password: formData.password
      });

      console.log('🔍 [AuthContext] Respuesta completa del login:', response);
      console.log('🔍 [AuthContext] response.data:', response.data);
      console.log('🔍 [AuthContext] response.status:', response.status);

      // Verificar la estructura de la respuesta
      if (!response.data) {
        throw new Error('No se recibieron datos en la respuesta del login');
      }

      const { token: newToken, user } = response.data;

      // Guardar token en cookie (7 días de expiración) con configuración compatible móvil
      Cookies.set('token', newToken, {
        expires: 7,
        secure: window.location.protocol === 'https:', // Auto-detectar HTTPS
        sameSite: 'lax',
        path: '/'
      });

      // Guardar también en localStorage como backup para móvil
      try {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
      } catch (e) {
        console.warn('[AuthContext] No se pudo guardar en localStorage:', e);
      }

      setToken(newToken);
      setUser(user);
      setIsAuthenticated(true);

      // Determinar URL de redirección según el rol
      const roleRedirects = {
        admin: '/app/dashboard/admin',
        secretaria: '/app/dashboard/secretaria',
        alfabetizador: '/app/asistencia/scanner',
        docente: '/app/dashboard/docente',
        estudiante: '/app/dashboard/estudiante'
      };

      const redirectUrl = roleRedirects[user.rol] || '/app/dashboard';

      return {
        success: true,
        user: user,
        redirectUrl
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el login'
      };
    }
  };

  const logout = async () => {
    try {
      // Si hay un token válido, hacer logout en el servidor
      const currentToken = Cookies.get('token');
      if (currentToken) {
        try {
          console.log('📤 Enviando solicitud de logout al servidor...');
          await ApiService.post('/auth/logout');
          console.log('✅ Logout exitoso en el servidor');
        } catch (error) {
          console.error('⚠️ Error en logout del servidor (continuando con logout local):', error);
          // Continuamos con el logout local aunque falle el servidor
        }
      }
    } catch (error) {
      console.error('Error en proceso de logout:', error);
    } finally {
      // Limpiar estado local siempre (cookies + localStorage)
      Cookies.remove('token', { path: '/' });
      Cookies.remove('token'); // Fallback

      // Limpiar localStorage
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } catch (e) {
        console.warn('[AuthContext] Error limpiando localStorage:', e);
      }

      // ✅ NUEVO: Limpiar historial de notificaciones al cerrar sesión
      if (notificationContext?.clearHistory) {
        console.log('🧹 Limpiando historial de notificaciones...');
        notificationContext.clearHistory();
        notificationContext.clearAllNotifications();
      }

      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      console.log('✅ Sesión local cerrada (cookies + localStorage + notificaciones)');
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const storedToken = Cookies.get('token');
      if (storedToken && storedToken.split('.').length === 3) {
        setToken(storedToken);
        const response = await ApiService.get('/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      }
    } catch (error) {
      console.error('Error refrescando autenticación:', error);
      Cookies.remove('token');
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    }
    setLoading(false);
  };

  const register = async (userData) => {
    try {
      console.log('📝 Enviando datos de registro:', userData);

      // Asegurar que ApiService esté inicializado
      await ApiService.initialize();

      const response = await ApiService.post('/auth/register', userData);
      console.log('✅ Registro exitoso:', response.data);
      return {
        success: true,
        message: response.data?.message || 'Registro exitoso'
      };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      console.error('❌ Detalles del error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el registro'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      // Asegurar que ApiService esté inicializado
      await ApiService.initialize();

      const response = await ApiService.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: response.data?.message || 'Si el email existe, enviaremos un código de seguridad'
      };
    } catch (error) {
      console.error('Error en forgot password:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al enviar enlace de recuperación'
      };
    }
  };

  const resetPassword = async ({ email, code, newPassword }) => {
    try {
      await ApiService.initialize();

      const response = await ApiService.post('/auth/reset-password', {
        email,
        code,
        newPassword
      });

      return {
        success: true,
        message: response.data?.message || 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error en reset password:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'No fue posible actualizar la contraseña'
      };
    }
  };

  // Funciones de utilidad para verificar roles
  const hasRole = (role) => {
    return user?.rol === role;
  };

  const isAdmin = () => hasRole('admin');
  const isSecretaria = () => hasRole('secretaria');
  const isEscaner = () => hasRole('escaner');
  const isAlfabetizador = () => hasRole('alfabetizador') || hasRole('docente') || hasRole('escaner');
  const isEstudiante = () => hasRole('estudiante');

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    initialized,
    isLoading: loading,
    login,
    logout,
    refreshAuth,
    register,
    forgotPassword,
    resetPassword,
    hasRole,
    isAdmin,
    isSecretaria,
    isAlfabetizador,
    isEscaner,
    isEstudiante
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;
