const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const database = require('../config/database');
const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('../middleware/standardResponse');
const logger = require('../utils/logger');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de docente
router.use(authenticateToken);
router.use(requireRole(['docente']));

/**
 * GET /docente/mi-grupo
 * Lista los estudiantes del grupo que dirige este docente
 */
router.get('/mi-grupo', async (req, res) => {
    try {
        const docenteId = req.user.id;

        // Encontrar el grupo del cual este docente es director
        const grupos = await database.query(
            `SELECT id, nombre, jornada FROM grupos_academicos WHERE director_grupo_id = ? AND activo = 1`,
            [docenteId]
        );

        if (!grupos || grupos.length === 0) {
            return sendSuccess(res, { grupo: null, estudiantes: [] }, 'Este docente no tiene grupo asignado');
        }

        const grupo = grupos[0];

        // Obtener estudiantes del grupo con su estado de asistencia hoy
        const hoy = new Date().toISOString().split('T')[0];
        const inicioHoy = `${hoy} 00:00:00`;
        const finHoy = `${hoy} 23:59:59`;

        const estudiantes = await database.query(
            `SELECT
                e.id, e.nombre, e.apellidos, e.matricula, g.nombre as grado, g.jornada, e.telefono, e.foto_perfil,
                u.email, u.estado,
                (SELECT COUNT(*) FROM asistencias a WHERE a.estudiante_id = e.id AND a.fecha BETWEEN ? AND ?) as asistencias_count,
                e.faltas_consecutivas as faltas_count,
                (SELECT COUNT(*) FROM justificaciones j WHERE j.estudiante_id = e.id AND j.estado = 'pendiente') as justificaciones_pendientes,
                EXISTS(SELECT 1 FROM asistencias a WHERE a.estudiante_id = e.id AND a.fecha BETWEEN ? AND ?) as presente_hoy
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
            WHERE e.grupo_academico_id = ?
            ORDER BY e.apellidos ASC, e.nombre ASC`,
            [inicioHoy, finHoy, inicioHoy, finHoy, grupo.id]
        );

        return sendSuccess(res, { grupo, estudiantes });
    } catch (error) {
        logger.error('Error /docente/mi-grupo:', error);
        return sendError(res, process.env.NODE_ENV === 'production' ? 'Error al obtener grupo' : `Error: ${error.message}`, 500);
    }
});

/**
 * GET /docente/mi-grupo/estudiante/:estudianteId/detalle
 * Detalle de asistencias, faltas y justificaciones de un estudiante del grupo
 */
router.get('/mi-grupo/estudiante/:estudianteId/detalle', async (req, res) => {
    try {
        const docenteId = req.user.id;
        const { estudianteId } = req.params;

        // Verificar que el estudiante pertenece al grupo del docente
        const [estRow] = await database.query(
            `SELECT e.id, e.nombre, e.apellidos, e.matricula, g.nombre as grado, e.foto_perfil, g.director_grupo_id
       FROM estudiantes e
       JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE e.id = ? AND g.director_grupo_id = ?`,
            [estudianteId, docenteId]
        );

        if (!estRow) return sendError(res, 'Estudiante no encontrado en tu grupo', 404);

        // Asistencias (últimas 60 días)
        const asistencias = await database.query(
            `SELECT id, fecha, 'presente' as estado, hora_entrada, metodo_registro as tipo_registro, observaciones as notas
       FROM asistencias WHERE estudiante_id = ?
       ORDER BY fecha DESC LIMIT 60`,
            [estudianteId]
        );

        // Justificaciones
        const justificaciones = await database.query(
            `SELECT id, motivo, descripcion, estado, fecha_inicio, fecha_fin, created_at
       FROM justificaciones WHERE estudiante_id = ?
       ORDER BY created_at DESC LIMIT 30`,
            [estudianteId]
        );

        return sendSuccess(res, { estudiante: estRow, asistencias, justificaciones });
    } catch (error) {
        logger.error('Error /docente/estudiante/detalle:', error);
        return sendError(res, 'Error al obtener detalle del estudiante', 500);
    }
});

/**
 * GET /docente/perfil
 * Obtiene el perfil del docente autenticado
 */
router.get('/perfil', async (req, res) => {
    try {
        const rows = await database.query(
            `SELECT id, email, cedula, telefono, rol, estado, fecha_registro FROM usuarios WHERE id = ?`,
            [req.user.id]
        );
        if (!rows || rows.length === 0) return sendError(res, 'Usuario no encontrado', 404);

        const grupo = await database.query(
            `SELECT id, nombre, jornada FROM grupos_academicos WHERE director_grupo_id = ? AND activo = 1`,
            [req.user.id]
        );

        return sendSuccess(res, { ...rows[0], grupo: grupo[0] || null });
    } catch (error) {
        logger.error('Error /docente/perfil:', error);
        return sendError(res, 'Error al obtener perfil', 500);
    }
});

/**
 * PUT /docente/perfil
 * Edita el perfil del docente: email, contraseña, cédula, teléfono
 */
router.put('/perfil', async (req, res) => {
    const connection = await database.getConnection();
    try {
        const { email, cedula, telefono, password, confirmPassword } = req.body;
        const docenteId = req.user.id;

        await connection.beginTransaction();

        // Construir query dinámicamente
        const fields = [];
        const values = [];

        if (email) { fields.push('email = ?'); values.push(email); }
        if (cedula !== undefined) { fields.push('cedula = ?'); values.push(cedula); }
        if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }

        if (password) {
            if (password !== confirmPassword) {
                await connection.rollback();
                return sendError(res, 'Las contraseñas no coinciden', 400);
            }
            if (password.length < 8) {
                await connection.rollback();
                return sendError(res, 'La contraseña debe tener al menos 8 caracteres', 400);
            }
            const hashed = await bcrypt.hash(password, 12);
            fields.push('password = ?');
            values.push(hashed);
        }

        if (fields.length === 0) return sendError(res, 'No hay campos para actualizar', 400);

        values.push(docenteId);
        await connection.execute(
            `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        await logger.audit(docenteId, 'UPDATE', 'usuarios', `Docente actualizó su perfil`, req.ip);
        await connection.commit();

        return sendSuccess(res, null, 'Perfil actualizado correctamente');
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return sendError(res, 'El email ya está registrado', 409);
        logger.error('Error PUT /docente/perfil:', error);
        return sendError(res, 'Error al actualizar perfil', 500);
    } finally {
        connection.release();
    }
});

module.exports = router;
