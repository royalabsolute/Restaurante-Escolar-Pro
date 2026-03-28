/**
 * Controlador para gestión del QR único de suplente
 * - Generar/regenerar QR
 * - Validar escaneo de QR suplente
 * - Obtener conteo diario
 */
const crypto = require('crypto');
const database = require('../config/database');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../middleware/standardResponse');

class SuplenteQRController {
    /**
     * Generar un nuevo QR de suplente (solo admin/secretaria/coordinador)
     * POST /api/suplente-qr/generar
     */
    static async generarQR(req, res) {
        try {
            // Invalidar todos los QR activos anteriores
            await database.query(
                'UPDATE qr_suplente SET activo = FALSE, fecha_invalidacion = NOW() WHERE activo = TRUE'
            );

            // Generar código único seguro
            const hash = crypto.randomBytes(16).toString('hex');
            const codigoQR = `QR_SUPLENTE_${hash}`;

            await database.query(
                'INSERT INTO qr_suplente (codigo_qr, activo, generado_por) VALUES (?, TRUE, ?)',
                [codigoQR, req.user.id]
            );

            logger.info(`QR de suplente generado por usuario ${req.user.id}`);

            return sendSuccess(res, { codigo_qr: codigoQR }, 'QR de suplente generado exitosamente');
        } catch (error) {
            logger.error('Error generando QR de suplente:', { error: error.message });
            return sendError(res, 'Error al generar QR de suplente', 500);
        }
    }

    /**
     * Regenerar QR de suplente (invalida el anterior)
     * POST /api/suplente-qr/regenerar
     */
    static async regenerarQR(req, res) {
        try {
            // Invalidar el actual
            const updated = await database.query(
                'UPDATE qr_suplente SET activo = FALSE, fecha_invalidacion = NOW() WHERE activo = TRUE'
            );

            if (!updated || updated.affectedRows === 0) {
                logger.warn('No había QR activo para invalidar, generando uno nuevo');
            }

            // Generar nuevo
            const hash = crypto.randomBytes(16).toString('hex');
            const codigoQR = `QR_SUPLENTE_${hash}`;

            await database.query(
                'INSERT INTO qr_suplente (codigo_qr, activo, generado_por) VALUES (?, TRUE, ?)',
                [codigoQR, req.user.id]
            );

            logger.info(`QR de suplente regenerado por usuario ${req.user.id}`);

            return sendSuccess(res, { codigo_qr: codigoQR }, 'QR de suplente regenerado (el anterior fue invalidado)');
        } catch (error) {
            logger.error('Error regenerando QR de suplente:', { error: error.message });
            return sendError(res, 'Error al regenerar QR de suplente', 500);
        }
    }

    /**
     * Obtener el QR activo actual
     * GET /api/suplente-qr/activo
     */
    static async obtenerQRActivo(req, res) {
        try {
            const result = await database.query(
                'SELECT id, codigo_qr, fecha_generacion FROM qr_suplente WHERE activo = TRUE LIMIT 1'
            );

            if (!result || result.length === 0) {
                return sendError(res, 'No hay QR de suplente activo. Genera uno desde el panel.', 404);
            }

            return sendSuccess(res, result[0]);
        } catch (error) {
            logger.error('Error obteniendo QR activo:', { error: error.message });
            return sendError(res, 'Error al obtener QR de suplente', 500);
        }
    }

    /**
     * Escanear QR de suplente (registra +1 en el conteo diario)
     * POST /api/suplente-qr/escanear
     * Body: { codigo_qr: string }
     */
    static async escanearQR(req, res) {
        try {
            const { codigo_qr } = req.body;

            if (!codigo_qr) {
                return sendError(res, 'Código QR es requerido', 400);
            }

            // Verificar que el QR es válido y está activo
            const qr = await database.query(
                'SELECT id FROM qr_suplente WHERE codigo_qr = ? AND activo = TRUE',
                [codigo_qr]
            );

            if (!qr || qr.length === 0) {
                return sendError(res, 'QR de suplente inválido o desactivado', 404);
            }

            const fechaHoy = new Date().toISOString().split('T')[0];
            const horaActual = new Date().toTimeString().split(' ')[0];

            // Registrar en conteo diario
            await database.query(
                'INSERT INTO conteo_suplentes_diario (fecha, hora_registro, registrado_por, qr_suplente_id) VALUES (?, ?, ?, ?)',
                [fechaHoy, horaActual, req.user?.id || null, qr[0].id]
            );

            // Obtener el conteo actualizado del día
            const conteo = await database.query(
                'SELECT COUNT(*) as total FROM conteo_suplentes_diario WHERE fecha = ?',
                [fechaHoy]
            );

            const totalHoy = conteo[0]?.total || 1;

            logger.info(`Suplente #${totalHoy} registrado hoy`);

            return sendSuccess(res, {
                numero_suplente: totalHoy,
                fecha: fechaHoy,
                hora: horaActual
            }, `✅ Suplente #${totalHoy} registrado correctamente`);
        } catch (error) {
            logger.error('Error escaneando QR de suplente:', { error: error.message });
            return sendError(res, 'Error al registrar suplente', 500);
        }
    }

    /**
     * Obtener conteo de suplentes del día actual
     * GET /api/suplente-qr/conteo-hoy
     */
    static async conteoHoy(req, res) {
        try {
            const fechaHoy = new Date().toISOString().split('T')[0];

            const result = await database.query(
                'SELECT COUNT(*) as total FROM conteo_suplentes_diario WHERE fecha = ?',
                [fechaHoy]
            );

            const detalle = await database.query(
                'SELECT hora_registro FROM conteo_suplentes_diario WHERE fecha = ? ORDER BY hora_registro ASC',
                [fechaHoy]
            );

            return sendSuccess(res, {
                fecha: fechaHoy,
                total: result[0]?.total || 0,
                registros: detalle
            });
        } catch (error) {
            logger.error('Error obteniendo conteo de suplentes:', { error: error.message });
            return sendError(res, 'Error al obtener conteo', 500);
        }
    }

    /**
     * Obtener historial de conteos de suplentes
     * GET /api/suplente-qr/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
     */
    static async historial(req, res) {
        try {
            const { desde, hasta } = req.query;
            let query = `
        SELECT fecha, COUNT(*) as total 
        FROM conteo_suplentes_diario 
      `;
            const params = [];

            if (desde && hasta) {
                query += ' WHERE fecha BETWEEN ? AND ? ';
                params.push(desde, hasta);
            } else if (desde) {
                query += ' WHERE fecha >= ? ';
                params.push(desde);
            }

            query += ' GROUP BY fecha ORDER BY fecha DESC LIMIT 90';

            const result = await database.query(query, params);
            return sendSuccess(res, result);
        } catch (error) {
            logger.error('Error obteniendo historial de suplentes:', { error: error.message });
            return sendError(res, 'Error al obtener historial', 500);
        }
    }
}

module.exports = SuplenteQRController;
