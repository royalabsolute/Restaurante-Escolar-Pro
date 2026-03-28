const database = require('../config/database');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../middleware/standardResponse');

class GruposController {
    /**
     * GET /public/grupos — Lista todos los grupos activos (público, para registro y visualización universal)
     */
    static async getPublicGrupos(req, res) {
        try {
            const grupos = await database.query(`
        SELECT g.id, g.nombre, g.jornada, g.activo,
               u.id as director_id,
               CONCAT(COALESCE(u.cedula, ''), '') as director_cedula,
               COALESCE(CONCAT(est.nombre, ' ', est.apellidos), NULL) as director_nombre
        FROM grupos_academicos g
        LEFT JOIN usuarios u ON g.director_grupo_id = u.id
        LEFT JOIN estudiantes est ON u.id = est.usuario_id
        WHERE g.activo = 1
        ORDER BY g.nombre ASC
      `);
            return sendSuccess(res, grupos);
        } catch (error) {
            logger.error('Error getPublicGrupos:', error);
            return sendError(res, 'Error al obtener grupos', 500);
        }
    }

    /**
     * GET /admin/grupos — Lista todos los grupos (con director si tiene)
     */
    static async getAllGrupos(req, res) {
        try {
            const grupos = await database.query(`
        SELECT g.id, g.nombre, g.jornada, g.activo, g.created_at,
               g.director_grupo_id,
               u.email as director_email,
               u.cedula as director_cedula,
               u.telefono as director_telefono,
               COALESCE(est.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as director_nombre,
               COALESCE(est.apellidos, '') as director_apellidos,
               (SELECT COUNT(*) FROM estudiantes WHERE grupo_academico_id = g.id) as total_estudiantes
        FROM grupos_academicos g
        LEFT JOIN usuarios u ON g.director_grupo_id = u.id
        LEFT JOIN estudiantes est ON u.id = est.usuario_id
        ORDER BY g.nombre ASC
      `);
            return sendSuccess(res, grupos);
        } catch (error) {
            logger.error('Error getAllGrupos:', error);
            return sendError(res, 'Error al obtener grupos', 500);
        }
    }

    /**
     * POST /admin/grupos — Crear grupo
     */
    static async createGrupo(req, res) {
        try {
            const { nombre, jornada, director_grupo_id } = req.body;
            if (!nombre || !jornada) return sendError(res, 'Nombre y jornada son requeridos', 400);

            const [result] = await database.pool.execute(
                `INSERT INTO grupos_academicos (nombre, jornada, director_grupo_id) VALUES (?, ?, ?)`,
                [nombre.trim(), jornada, director_grupo_id || null]
            );

            await logger.audit(req.user.id, 'CREATE', 'grupos_academicos', `Grupo creado: ${nombre}`, req.ip);
            return sendSuccess(res, { id: result.insertId, nombre, jornada }, 'Grupo creado exitosamente', 201);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return sendError(res, `Ya existe un grupo con el nombre "${req.body.nombre}"`, 409);
            logger.error('Error createGrupo:', error);
            return sendError(res, 'Error al crear grupo', 500);
        }
    }

    /**
     * PUT /admin/grupos/:id — Editar grupo
     */
    static async updateGrupo(req, res) {
        try {
            const { id } = req.params;
            const { nombre, jornada, activo, director_grupo_id } = req.body;

            const existingRows = await database.query('SELECT id FROM grupos_academicos WHERE id = ?', [id]);
            if (!existingRows || existingRows.length === 0) return sendError(res, 'Grupo no encontrado', 404);

            await database.pool.execute(
                `UPDATE grupos_academicos SET nombre = ?, jornada = ?, activo = ?, director_grupo_id = ? WHERE id = ?`,
                [nombre, jornada, activo !== undefined ? activo : 1, director_grupo_id !== undefined ? director_grupo_id : null, id]
            );

            await logger.audit(req.user.id, 'UPDATE', 'grupos_academicos', `Grupo actualizado ID ${id}: ${nombre}`, req.ip);
            return sendSuccess(res, null, 'Grupo actualizado correctamente');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return sendError(res, `Ya existe un grupo con ese nombre`, 409);
            logger.error('Error updateGrupo:', error);
            return sendError(res, 'Error al actualizar grupo', 500);
        }
    }

    /**
     * DELETE /admin/grupos/:id — Eliminar grupo (solo si no tiene estudiantes)
     */
    static async deleteGrupo(req, res) {
        try {
            const { id } = req.params;

            // Verificar si hay estudiantes en este grupo
            const students = await database.query(
                'SELECT COUNT(*) as total FROM estudiantes WHERE grupo_academico_id = ?', [id]
            );
            const total = students[0]?.total || 0;
            if (total > 0) {
                return sendError(res, `No se puede eliminar: el grupo tiene ${total} estudiante(s). Usa el endpoint de reasignación primero.`, 409);
            }

            await database.pool.execute('DELETE FROM grupos_academicos WHERE id = ?', [id]);
            await logger.audit(req.user.id, 'DELETE', 'grupos_academicos', `Grupo eliminado ID ${id}`, req.ip);
            return sendSuccess(res, null, 'Grupo eliminado correctamente');
        } catch (error) {
            logger.error('Error deleteGrupo:', error);
            return sendError(res, 'Error al eliminar grupo', 500);
        }
    }

    /**
     * PUT /admin/grupos/:id/reassign — Reasignar todos los estudiantes de un grupo a otro
     */
    static async reassignStudents(req, res) {
        try {
            const { id } = req.params;
            const { nuevo_grupo_id } = req.body;

            if (!nuevo_grupo_id) return sendError(res, 'El ID del nuevo grupo es requerido', 400);
            if (String(id) === String(nuevo_grupo_id)) return sendError(res, 'El grupo destino no puede ser el mismo grupo', 400);

            // Verificar que el grupo destino existe
            const dest = await database.query('SELECT id, nombre FROM grupos_academicos WHERE id = ?', [nuevo_grupo_id]);
            if (!dest || dest.length === 0) return sendError(res, 'Grupo destino no encontrado', 404);

            const [result] = await database.pool.execute(
                'UPDATE estudiantes SET grupo_academico_id = ? WHERE grupo_academico_id = ?',
                [nuevo_grupo_id, id]
            );

            await logger.audit(req.user.id, 'UPDATE', 'estudiantes', `Reasignación: ${result.affectedRows} estudiantes del grupo ${id} al grupo ${nuevo_grupo_id} (${dest[0].nombre})`, req.ip);
            return sendSuccess(res, { reasignados: result.affectedRows }, `${result.affectedRows} estudiante(s) reasignados al grupo "${dest[0].nombre}"`);
        } catch (error) {
            logger.error('Error reassignStudents:', error);
            return sendError(res, 'Error al reasignar estudiantes', 500);
        }
    }

    /**
     * GET /admin/docentes — Lista usuarios con rol docente (para seleccionar director)
     */
    static async getDocentes(req, res) {
        try {
            const docentes = await database.query(`
        SELECT u.id, u.email, u.cedula, u.telefono,
               COALESCE(est.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre,
               COALESCE(est.apellidos, '') as apellidos,
               g.id as grupo_id, g.nombre as grupo_nombre
        FROM usuarios u
        LEFT JOIN estudiantes est ON u.id = est.usuario_id
        LEFT JOIN grupos_academicos g ON g.director_grupo_id = u.id
        WHERE u.rol = 'docente' AND u.estado = 'validado'
        ORDER BY nombre ASC
      `);
            return sendSuccess(res, docentes);
        } catch (error) {
            logger.error('Error getDocentes:', error);
            return sendError(res, 'Error al obtener docentes', 500);
        }
    }
}

module.exports = GruposController;
