const database = require('../config/database');

/**
 * Registra una acción en la tabla de auditoría
 * @param {number} usuarioId - ID del usuario que realiza la acción (puede ser NULL si es sistema)
 * @param {string} accion - Descripción corta de la acción (ej: "LOGIN", "CREATE_USER")
 * @param {string} tablaAfectada - Nombre de la tabla afectada (opcional)
 * @param {string} detalles - Detalles adicionales en formato texto o JSON (opcional)
 * @param {string} ip - Dirección IP desde donde se realiza la acción (opcional)
 */
async function logAction(usuarioId, accion, tablaAfectada = null, detalles = null, ip = null) {
    try {
        const query = `
      INSERT INTO auditoria (usuario_id, accion, tabla_afectada, detalles, ip_direccion, fecha_accion)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

        // Asegurar que detalles sea string si es objeto
        const detallesStr = typeof detalles === 'object' ? JSON.stringify(detalles) : detalles;

        if (!database) {
            logger.error('Base de datos no inicializada en auditLogger');
            return;
        }

        await database.query(query, [usuarioId, accion, tablaAfectada, detallesStr, ip]);
        // Log opcional para consola en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`📡 [AUDIT]: Auditoría registrada: ${accion} - Usuario: ${usuarioId}`);
        }
    } catch (error) {
        console.error('❌ [AUDIT_ERROR]: Error al registrar auditoría:', error.message);
    }
}

module.exports = { logAction };
