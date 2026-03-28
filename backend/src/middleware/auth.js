const jwt = require('jsonwebtoken');
const database = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const users = await database.query(
      'SELECT id, email, matricula, rol, estado, expires_at, access_config FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    // Verificar expiración para invitados y alfabetizadores
    if ((user.rol === 'invitado' || user.rol === 'alfabetizador') && user.expires_at) {
      const expirationDate = new Date(user.expires_at);
      const now = new Date();
      if (now > expirationDate) {
        return res.status(401).json({
          status: 'ERROR',
          message: `Su cuenta de ${user.rol} ha expirado.`
        });
      }
    }

    // Verificar que el usuario esté validado o activo
    if (user.estado !== 'validado' && user.estado !== 'activo') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Usuario no validado o inactivo. Contacte con secretaría.'
      });
    }

    // Agregar información del usuario al request
    req.user = user;
    next();

  } catch (error) {
    console.error('Error en autenticación:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      status: 'ERROR',
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Usuario no autenticado'
      });
    }

    if (allowedRoles.includes(req.user.rol)) {
      return next();
    }

    // Lógica especial para invitados con permisos dinámicos
    if (req.user.rol === 'invitado') {
      try {
        let permissions = req.user.access_config || [];
        if (typeof permissions === 'string') {
          permissions = JSON.parse(permissions);
        }
        if (!Array.isArray(permissions)) permissions = [];

        // Seguridad: Si la ruta es EXCLUSIVAMENTE para Admin, no permitir invitados
        const isStrictAdmin = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
        if (isStrictAdmin) {
          return res.status(403).json({
            status: 'ERROR',
            message: 'Acceso denegado. Se requiere rol de Administrador.'
          });
        }

        // Determinar si la ruta actual es una de las permitidas para gestión
        const isManagementRoute = allowedRoles.some(r =>
          ['secretaria', 'admin', 'coordinador_convivencia'].includes(r)
        );

        if (isManagementRoute) {
          // Permiso de Gestión de Estudiantes
          if (permissions.includes('estudiantes_gestion')) return next();

          // Permiso de Reportes
          if (permissions.includes('reportes')) return next();

          // Permiso de Dashboard
          if (permissions.includes('dashboard')) return next();

          // NUEVOS PERMISOS EXPANDIDOS
          // Permiso de Justificaciones
          if (permissions.includes('justificaciones')) return next();

          // Permiso de Asistencia
          if (permissions.includes('asistencia')) return next();

          // Permiso de QR Suplente
          if (permissions.includes('qr_suplente')) return next();
        }
      } catch (e) {
        console.error('Error validando permisos de invitado:', e);
      }
    }

    return res.status(403).json({
      status: 'ERROR',
      message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
    });
  };
};

// Middleware para verificar que sea estudiante
const requireStudent = requireRole(['estudiante']);

// Middleware para verificar que sea docente
const requireTeacher = requireRole(['escaner', 'docente']);

// Middleware para verificar que sea escáner, docente o admin (para asistencia)
const requireTeacherOrAdmin = requireRole(['escaner', 'docente', 'admin', 'alfabetizador']);

// Middleware para verificar que sea escáner o roles con acceso a asistencia
const requireScannerAccess = requireRole(['escaner', 'docente', 'admin', 'secretaria', 'coordinador_convivencia', 'alfabetizador']);

// Middleware para verificar que sea secretaria
const requireSecretary = requireRole(['secretaria']);

// Middleware para verificar que sea coordinador de convivencia
const requireCoordinador = requireRole(['coordinador_convivencia']);

// Middleware para verificar que sea admin
const requireAdmin = requireRole(['admin']);

// Middleware para verificar que sea secretaria o admin
const requireSecretaryOrAdmin = requireRole(['secretaria', 'admin']);

// Middleware para verificar que sea coordinador, secretaria o admin
const requireCoordinadorOrAdmin = requireRole(['coordinador_convivencia', 'secretaria', 'admin']);

// Middleware para verificar que tenga permisos de gestión (coordinador, secretaria o admin)
const requireManagementRole = requireRole(['coordinador_convivencia', 'secretaria', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireStudent,
  requireTeacher,
  requireTeacherOrAdmin,
  requireScannerAccess,
  requireSecretary,
  requireCoordinador,
  requireAdmin,
  requireSecretaryOrAdmin,
  requireCoordinadorOrAdmin,
  requireManagementRole
};
