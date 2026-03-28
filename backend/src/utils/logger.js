const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Crear directorio de logs si no existe
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Códigos de colores ANSI (para evitar dependencias extra si no son necesarias)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Mapeo de iconos por nivel
const levelIcons = {
  info: '📡',
  error: '❌',
  warn: '⚠️',
  debug: '🔍',
  success: '✅',
  startup: '🚀'
};

// Configuración de formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
    const icon = levelIcons[level] || '🔹';
    const rid = requestId ? ` [ID: ${requestId}]` : '';

    let log = `${timestamp} ${icon} [${level.toUpperCase()}]${rid}: ${message}`;

    // Añadir stack trace si existe
    if (stack) {
      log += `\n${colors.red}${stack}${colors.reset}`;
    }

    // Añadir metadata si existe (excluyendo service y version)
    const extraMeta = { ...meta };
    delete extraMeta.service;
    delete extraMeta.version;

    if (Object.keys(extraMeta).length > 0) {
      log += `\n${colors.dim}Meta: ${JSON.stringify(extraMeta, null, 2)}${colors.reset}`;
    }

    return log;
  })
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'restaurante-escolar-backend',
    version: '1.0.0'
  },
  transports: [
    // Archivo para errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Archivo para todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Archivo rotativo diario
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],

  // Manejo de excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  // Manejo de rechazos de promesas no capturadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// En desarrollo, también logear a consola con formato interactivo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, requestId }) => {
        const icon = levelIcons[level.replace(/\x1B\[[0-9;]*m/g, '')] || '🔹';
        const rid = requestId ? `${colors.magenta}[${requestId.substring(0, 8)}]${colors.reset} ` : '';
        return `${icon} ${rid}${level}: ${message}`;
      })
    )
  }));
}

// Funciones de utilidad para logging específico (Lazy required inside functions to break circular dependency)
// const { logAction } = require('./auditLogger');

const loggers = {
  // Logger general
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Método explícito para auditoría desde cualquier parte del código
  audit: async (userId, action, table = null, details = null, ip = null) => {
    try {
      const { logAction } = require('./auditLogger');
      await logAction(userId, action, table, details, ip);
    } catch (e) {
      logger.error('Error registrando auditoría explícita', e);
    }
  },

  // Logger específico para autenticación
  auth: {
    login: (user, ip) => {
      logger.info('Login exitoso', {
        userId: user.id,
        email: user.email,
        rol: user.rol,
        ip
      });
      // Registrar en BD
      const { logAction } = require('./auditLogger');
      logAction(user.id, 'LOGIN', 'usuarios', `Login exitoso: ${user.email} (${user.rol})`, ip).catch(console.error);
    },
    logout: (userId, ip) => {
      logger.info('Logout', { userId, ip });
      const { logAction } = require('./auditLogger');
      logAction(userId, 'LOGOUT', 'usuarios', 'Cierre de sesión', ip).catch(console.error);
    },
    failed: (email, ip, reason) => {
      logger.warn('Login fallido', {
        email,
        ip,
        reason
      });
      // Registrar intento fallido en BD (sin usuario_id)
      const { logAction } = require('./auditLogger');
      logAction(null, 'LOGIN_FAILED', 'usuarios', `Fallo: ${email} - ${reason}`, ip).catch(console.error);
    },
    register: (user) => {
      logger.info('Registro de usuario', {
        userId: user.id,
        email: user.email,
        rol: user.rol
      });
      const { logAction } = require('./auditLogger');
      logAction(user.id, 'REGISTER', 'usuarios', `Nuevo usuario registrado: ${user.email}`, 'SYSTEM').catch(console.error);
    }
  },

  // Logger para base de datos
  db: {
    query: (sql, duration) => logger.debug('Query ejecutada', {
      sql: sql.substring(0, 100),
      duration: `${duration}ms`
    }),
    error: (error, sql) => logger.error('Error de base de datos', {
      error: error.message,
      sql: sql?.substring(0, 100),
      stack: error.stack
    }),
    connection: () => logger.info('Conexión a base de datos establecida'),
    disconnection: () => logger.info('Conexión a base de datos cerrada')
  },

  // Logger para API
  api: {
    request: (req) => logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    }),
    response: (req, res, duration) => logger.info('API Response', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    }),
    error: (req, error) => logger.error('API Error', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    })
  },

  // Logger para asistencia
  attendance: {
    register: (estudiante, registrador, metodo) => logger.info('Asistencia registrada', {
      estudianteId: estudiante.id,
      estudianteNombre: `${estudiante.nombre} ${estudiante.apellidos}`,
      registradoPor: registrador.id,
      metodo
    }),
    qr: (codigoQR, estudiante) => logger.info('QR validado', {
      codigoQR,
      estudianteId: estudiante?.id,
      estudianteNombre: estudiante ? `${estudiante.nombre} ${estudiante.apellidos}` : 'No encontrado'
    })
  },

  // Logger para seguridad
  security: {
    rateLimit: (ip, endpoint) => {
      logger.warn('Rate limit excedido', { ip, endpoint });
      const { logAction } = require('./auditLogger');
      logAction(null, 'RATE_LIMIT', 'system', `Excedido en: ${endpoint}`, ip).catch(console.error);
    },
    invalidToken: (token, ip) => logger.warn('Token inválido', {
      token: token?.substring(0, 10) + '...',
      ip
    }),
    suspiciousActivity: (activity, userId, ip) => {
      logger.error('Actividad sospechosa', {
        activity,
        userId,
        ip
      });
      const { logAction } = require('./auditLogger');
      logAction(userId, 'SECURITY_ALERT', 'system', activity, ip).catch(console.error);
    }
  }
};

module.exports = loggers;
