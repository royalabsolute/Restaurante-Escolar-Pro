/**
 * Middleware para estandarizar respuestas API
 * Proporciona métodos consistentes para respuestas exitosas y de error
 * Mantiene compatibilidad con formatos antiguos (status: 'SUCCESS'/'ERROR')
 */
const logger = require('../utils/logger');

const standardResponse = (req, res, next) => {
  // Método para respuestas exitosas
  res.success = (data = null, message = 'Operación exitosa', statusCode = 200, pagination = null) => {
    const response = {
      success: true,
      status: 'SUCCESS', // Compatibilidad
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  };

  // Método para respuestas de error
  res.error = (message = 'Error interno del servidor', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      status: 'ERROR', // Compatibilidad
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    // En desarrollo, incluir más detalles del error
    if (process.env.NODE_ENV === 'development' && errors) {
      response.debug = errors;
    }

    return res.status(statusCode).json(response);
  };

  // Método para respuestas con paginación
  res.paginated = (data, pagination, message = 'Datos obtenidos exitosamente') => {
    const response = {
      success: true,
      status: 'SUCCESS', // Compatibilidad
      message,
      data,
      pagination: {
        currentPage: pagination.page || pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || 0,
        itemsPerPage: pagination.limit || pagination.itemsPerPage || 10,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    return res.status(200).json(response);
  };

  // Método para respuestas de validación
  res.validation = (errors, message = 'Errores de validación') => {
    const response = {
      success: false,
      status: 'ERROR', // Compatibilidad
      message,
      data: null,
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    return res.status(400).json(response);
  };

  next();
};

// Middleware global para manejo de errores no capturados
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Registrar el error con el sistema centralizado
  logger.error(err.message, {
    requestId: req.id,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip
  });

  // Error de validación de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.error('Token de autenticación inválido', 401);
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.error('Token de autenticación expirado', 401);
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.validation(err.errors, 'Errores de validación');
  }

  // Error de base de datos
  if (err.code && err.code.startsWith('ER_')) {
    let message = 'Error de base de datos';

    switch (err.code) {
      case 'ER_DUP_ENTRY':
        message = 'Ya existe un registro con esos datos';
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        message = 'Referencia inválida en los datos';
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        message = 'No se puede eliminar, el registro está en uso';
        break;
      case 'ER_BAD_FIELD_ERROR':
        message = 'Error en la estructura de los datos (columna no encontrada)';
        break;
    }

    return res.error(message, 400, process.env.NODE_ENV === 'development' ? err.code : null);
  }

  // Error genérico
  return res.error(
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack, code: err.code } : null
  );
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res) => {
  // Si es una solicitud de API
  if (req.originalUrl.startsWith('/api/')) {
    return res.error('Endpoint no encontrado', 404);
  }

  // Si es una solicitud de archivo estático, silenciar el error
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/i)) {
    return res.status(404).end();
  }

  // Para otras rutas, devolver error
  return res.error('Ruta no encontrada', 404);
};

// Funciones auxiliares para uso directo en controladores sin depender exclusivamente del middleware
const sendSuccess = (res, data = null, message = 'Operación exitosa', statusCode = 200, pagination = null) => {
  if (res.success) return res.success(data, message, statusCode, pagination);
  return res.status(statusCode).json({
    success: true,
    status: 'SUCCESS', // Compatibilidad
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message = 'Error interno del servidor', statusCode = 500, errors = null) => {
  if (res.error) return res.error(message, statusCode, errors);
  return res.status(statusCode).json({
    success: false,
    status: 'ERROR', // Compatibilidad
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  standardResponse,
  globalErrorHandler,
  notFoundHandler,
  sendSuccess,
  sendError
};