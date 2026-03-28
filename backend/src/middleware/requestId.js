const { v4: uuidv4 } = require('uuid');

/**
 * Middleware que asigna un ID único a cada petición.
 * Útil para trazabilidad en sistemas de logs.
 */
const requestId = (req, res, next) => {
    // Si ya viene un ID de petición (ej: desde un balanceador), lo usamos, sino generamos uno
    req.id = req.headers['x-request-id'] || uuidv4();

    // Lo añadimos también a la respuesta para que el cliente pueda reportarlo si hay error
    res.setHeader('X-Request-Id', req.id);

    next();
};

module.exports = requestId;
