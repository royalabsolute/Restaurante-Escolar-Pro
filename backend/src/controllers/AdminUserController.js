const User = require('../models/User');
const database = require('../config/database');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../middleware/standardResponse');

class AdminUserController {
    static async crearUsuarioCompleto(req, res) {
        logger.api.request(req);
        const connection = await database.getConnection();
        try {
            const { email, matricula, password, rol, estado, nombre, apellidos, cedula, telefono, grupo_academico_id } = req.body;
            const { acudiente_nombre, acudiente_apellidos, acudiente_cedula, acudiente_telefono, acudiente_email } = req.body;
            const { fecha_nacimiento, estrato, grupo_etnico, es_desplazado } = req.body;

            // Validaciones básicas de cuenta
            if (!email || !password || !rol) return sendError(res, 'Faltan campos obligatorios (email, password, rol)', 400);

            // Validaciones estrictas para estudiantes (según requerimiento de registro manual)
            if (rol === 'estudiante') {
                const missingFields = [];
                if (!nombre) missingFields.push('nombre');
                if (!apellidos) missingFields.push('apellidos');
                if (!fecha_nacimiento) missingFields.push('fecha_nacimiento');
                if (!telefono) missingFields.push('telefono');
                if (!grupo_academico_id) missingFields.push('grupo_academico_id');
                if (!estrato) missingFields.push('estrato');
                if (!grupo_etnico) missingFields.push('grupo_etnico');
                if (!es_desplazado) missingFields.push('es_desplazado');
                if (!acudiente_nombre) missingFields.push('acudiente_nombre');
                if (!acudiente_apellidos) missingFields.push('acudiente_apellidos');
                if (!acudiente_cedula) missingFields.push('acudiente_cedula');
                if (!acudiente_telefono) missingFields.push('acudiente_telefono');

                if (missingFields.length > 0) {
                    return sendError(res, `Faltan campos obligatorios para el registro del estudiante: ${missingFields.join(', ')}`, 400);
                }
            }

            if (rol === 'docente' && !grupo_academico_id) return sendError(res, 'El docente debe tener un grupo asignado', 400);

            const [existing] = await connection.execute(
                'SELECT id FROM usuarios WHERE email = ? OR (matricula IS NOT NULL AND matricula = ?)',
                [email, matricula || null]
            );
            if (existing && existing.length > 0) return sendError(res, 'Email o matrícula ya registrados', 400);

            await connection.beginTransaction();

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 12);
            const estadoFinal = estado || (rol === 'estudiante' ? 'pendiente' : 'validado');
            const isDeletable = rol !== 'alfabetizador'; // Alfabetizadores base no son borrables por accidente

            const [userRes] = await connection.execute(
                'INSERT INTO usuarios (email, matricula, password, rol, estado, cedula, telefono, is_deletable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [email, matricula || null, hashedPassword, rol, estadoFinal, cedula || null, telefono || null, isDeletable]
            );

            const userId = userRes.insertId;
            let estudianteId = null;

            if (rol === 'invitado' || rol === 'alfabetizador') {
                const expirationHours = parseInt(process.env.ALFABETIZADOR_EXPIRATION_HOURS) || 24;
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + expirationHours);
                
                const accessConfig = req.body.access_config || (rol === 'alfabetizador' ? ['asistencia', 'qr_suplente'] : []);

                await connection.execute(
                    'UPDATE usuarios SET expires_at = ?, access_config = ? WHERE id = ?',
                    [expiresAt, JSON.stringify(accessConfig), userId]
                );
            } else if (rol === 'estudiante') {
                const { fecha_nacimiento, telefono: tel, estrato, grupo_etnico, es_desplazado, prioridad } = req.body;
                const codigoQR = `REST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const [estRes] = await connection.execute(
                    `INSERT INTO estudiantes (usuario_id, nombre, apellidos, fecha_nacimiento, telefono, estrato, codigo_qr, grupo_etnico, es_desplazado, prioridad, grupo_academico_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, nombre, apellidos, fecha_nacimiento || null, tel || null, estrato || 1, codigoQR, grupo_etnico || 'ninguno', es_desplazado === 'si' || es_desplazado === true ? 1 : 0, prioridad || 0, grupo_academico_id]
                );
                estudianteId = estRes.insertId;

                if (acudiente_nombre && acudiente_apellidos && acudiente_cedula) {
                    await connection.execute(
                        `INSERT INTO acudientes (estudiante_id, nombre, apellidos, cedula, telefono, email) VALUES (?, ?, ?, ?, ?, ?)`,
                        [estudianteId, acudiente_nombre, acudiente_apellidos, acudiente_cedula, req.body.acudiente_telefono || null, req.body.acudiente_email || null]
                    );
                }
            } else if (rol === 'docente') {
                // Asignar el docente como director del grupo seleccionado
                // Verificar que el grupo existe
                const [grupoRows] = await connection.execute(
                    'SELECT id, director_grupo_id FROM grupos_academicos WHERE id = ?', [grupo_academico_id]
                );
                if (!grupoRows || grupoRows.length === 0) {
                    await connection.rollback();
                    return sendError(res, 'El grupo seleccionado no existe', 404);
                }
                // Actualizar el director del grupo
                await connection.execute(
                    'UPDATE grupos_academicos SET director_grupo_id = ? WHERE id = ?',
                    [userId, grupo_academico_id]
                );
            }

            // Auditoría estandarizada
            await logger.audit(
                req.user.id,
                'CREATE',
                'usuarios',
                `Admin: Creación completa ${rol}: ${email}`,
                req.ip
            );

            await connection.commit();

            return sendSuccess(res, { usuario_id: userId, estudiante_id: estudianteId, email, rol, estado: estadoFinal }, 'Usuario creado exitosamente', 201);
        } catch (error) {
            if (connection) await connection.rollback();
            logger.error('Error en crearUsuarioCompleto:', error);
            return sendError(res, 'Error interno', 500);
        } finally {
            if (connection) connection.release();
        }
    }

    // ========== GESTIÓN DE USUARIOS ==========


    // Obtener todos los usuarios
    static async getAllUsers(req, res) {
        try {
            const users = await database.query(
                `SELECT u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
                e.id as estudiante_id, COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre, 
                COALESCE(e.apellidos, '') as apellidos, COALESCE(g_est.nombre, g_dir.nombre) as grado, 
                COALESCE(g_est.jornada, g_dir.jornada) as jornada, e.estrato, e.telefono
         FROM usuarios u 
         LEFT JOIN estudiantes e ON u.id = e.usuario_id
         LEFT JOIN grupos_academicos g_est ON e.grupo_academico_id = g_est.id
         LEFT JOIN grupos_academicos g_dir ON u.id = g_dir.director_grupo_id
         ORDER BY u.fecha_registro DESC`
            );
            return sendSuccess(res, users);
        } catch (error) {
            console.error('Error getAllUsers admin:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Obtener usuario por ID
    static async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const userRows = await database.query('SELECT * FROM usuarios WHERE id = ?', [userId]);

            if (!userRows || userRows.length === 0) return sendError(res, 'Usuario no encontrado', 404);

            let data = { ...userRows[0] };
            if (userRows[0].rol === 'estudiante') {
                const estudianteRows = await database.query(
                    `SELECT e.*, g.nombre AS grado, g.jornada 
                     FROM estudiantes e 
                     LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id 
                     WHERE e.usuario_id = ?`,
                    [userId]
                );
                if (estudianteRows && estudianteRows.length > 0) {
                    const acudienteRows = await database.query('SELECT * FROM acudientes WHERE estudiante_id = ?', [estudianteRows[0].id]);
                    data = { ...data, ...estudianteRows[0], acudiente: acudienteRows[0] || null };
                }
            }

            return sendSuccess(res, data);
        } catch (error) {
            console.error('Error getUserById admin:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Actualizar usuario
    static async updateUser(req, res) {
        const connection = await database.getConnection();
        try {
            const { userId } = req.params;
            const { email, matricula, rol, estado, nombre, apellidos, grupo_academico_id, estrato, access_config } = req.body;

            await connection.beginTransaction();

            // Actualizar tabla usuarios
            await connection.execute(
                'UPDATE usuarios SET email = ?, matricula = ?, rol = ?, estado = ?, access_config = ? WHERE id = ?',
                [email, matricula || null, rol, estado, access_config ? JSON.stringify(access_config) : null, userId]
            );

            // Actualizar tabla estudiantes si aplica
            const [est] = await connection.execute('SELECT id FROM estudiantes WHERE usuario_id = ?', [userId]);
            if (est && est.length > 0) {
                await connection.execute(
                    'UPDATE estudiantes SET nombre = ?, apellidos = ?, grupo_academico_id = ?, estrato = ? WHERE usuario_id = ?',
                    [nombre, apellidos, grupo_academico_id || null, estrato || null, userId]
                );
            }

            // Si es docente, actualizar el grupo que dirige (director_grupo_id)
            if (rol === 'docente') {
                // Quitar cualquier grupo anterior de este docente
                await connection.execute(
                    'UPDATE grupos_academicos SET director_grupo_id = NULL WHERE director_grupo_id = ?',
                    [userId]
                );
                // Asignar el nuevo grupo si se proporcionó
                if (grupo_academico_id) {
                    await connection.execute(
                        'UPDATE grupos_academicos SET director_grupo_id = ? WHERE id = ?',
                        [userId, grupo_academico_id]
                    );
                }
            }

            // Auditoría
            await logger.audit(
                req.user.id,
                'UPDATE',
                'usuarios',
                `Admin actualizó usuario ID ${userId}: ${email} (${rol})`,
                req.ip
            );

            await connection.commit();
            return sendSuccess(res, null, 'Usuario actualizado correctamente');
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error updateUser admin:', error);
            return sendError(res, 'Error interno', 500);
        } finally {
            if (connection) connection.release();
        }
    }

    // Eliminar usuario
    static async deleteUser(req, res) {
        const connection = await database.getConnection();
        try {
            const { userId } = req.params;
            const [user] = await connection.execute('SELECT rol, email, is_deletable FROM usuarios WHERE id = ?', [userId]);

            if (!user || user.length === 0) return sendError(res, 'Usuario no encontrado', 404);
            if (user[0].rol === 'admin') return sendError(res, 'No se puede eliminar un administrador', 403);
            if (!user[0].is_deletable) return sendError(res, 'Este usuario está protegido y no puede ser eliminado (isDeletable: false)', 403);

            await connection.beginTransaction();

            // Eliminar dependencias
            const [est] = await connection.execute('SELECT id FROM estudiantes WHERE usuario_id = ?', [userId]);
            if (est && est.length > 0) {
                const estId = est[0].id;
                await connection.execute('DELETE FROM asistencias WHERE estudiante_id = ?', [estId]);
                await connection.execute('DELETE FROM acudientes WHERE estudiante_id = ?', [estId]);
                await connection.execute('DELETE FROM estudiantes WHERE id = ?', [estId]);
            }
            await connection.execute('DELETE FROM usuarios WHERE id = ?', [userId]);

            // Auditoría
            await logger.audit(
                req.user.id,
                'DELETE',
                'usuarios',
                `Admin eliminó usuario: ${user[0].email} (${user[0].rol})`,
                req.ip
            );

            await connection.commit();
            return sendSuccess(res, null, 'Usuario eliminado correctamente');
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error deleteUser admin:', error);
            return sendError(res, 'Error interno', 500);
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Búsqueda optimizada de usuarios para administración
     * Utilizado principalmente en la vista de Gestión de Estudiantes
     */
    static async searchUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const searchTerm = req.query.search || '';
            const estado = req.query.estado || '';
            const rol = req.query.rol || '';
            const grado = req.query.grado || '';
            const jornada = req.query.jornada || '';
            const estrato = req.query.estrato || '';

            // Filtros base: ocultar usuarios de prueba por defecto si no se pide explícitamente
            let cond = [`u.email NOT LIKE '%@qr-prueba.test'`];
            let params = [];

            // Nota: El administrador PUEDE ver a otros administradores si se requiere, 
            // pero para la "Gestión de Estudiantes" usualmente se filtran.
            // Para mantener compatibilidad con la vista frontal que espera Estudiantes/Personal, 
            // dejamos que el filtro de rol maneje esto si se envía.
            if (rol && rol !== 'todos') {
                cond.push('u.rol = ?');
                params.push(rol);
            } else {
                // Si no se especifica rol, en Gestión de Estudiantes usualmente no queremos ver admins
                // pero como esta es la ruta de ADMIN, permitiremos ver todo si no se filtra.
                // Sin embargo, para evitar ruidos en la tabla de estudiantes:
                // cond.push("u.rol != 'admin'"); // Opcional
            }

            if (searchTerm.trim()) {
                cond.push(`(LOWER(e.nombre) LIKE LOWER(?) OR LOWER(e.apellidos) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.matricula) LIKE LOWER(?) OR LOWER(g_est.nombre) LIKE LOWER(?) OR LOWER(g_dir.nombre) LIKE LOWER(?))`);
                const p = `%${searchTerm}%`;
                params.push(p, p, p, p, p, p);
            }

            if (estado && estado !== 'todos') { cond.push('u.estado = ?'); params.push(estado); }
            if (grado && grado !== 'todos') { cond.push('(g_est.nombre = ? OR g_dir.nombre = ?)'); params.push(grado, grado); }
            if (jornada && jornada !== 'todos') { cond.push('(g_est.jornada = ? OR g_dir.jornada = ?)'); params.push(jornada, jornada); }
            if (estrato && estrato !== 'todos') { cond.push('e.estrato = ?'); params.push(parseInt(estrato)); }

            const where = cond.length > 0 ? `WHERE ${cond.join(' AND ')}` : '';

            const [count] = await database.query(
                `SELECT COUNT(*) as total FROM usuarios u 
                 LEFT JOIN estudiantes e ON u.id = e.usuario_id 
                 LEFT JOIN grupos_academicos g_est ON e.grupo_academico_id = g_est.id
                 LEFT JOIN grupos_academicos g_dir ON u.id = g_dir.director_grupo_id
                 ${where}`,
                params
            );

            const total = count?.total || 0;
            const totalPages = Math.ceil(total / limit);

            const users = await database.query(
                `SELECT u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
                        e.id as estudiante_id, COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre, 
                        e.apellidos, COALESCE(g_est.nombre, g_dir.nombre) AS grado, 
                        COALESCE(g_est.jornada, g_dir.jornada) AS jornada, e.estrato, e.telefono, e.foto_perfil
                 FROM usuarios u 
                 LEFT JOIN estudiantes e ON u.id = e.usuario_id 
                 LEFT JOIN grupos_academicos g_est ON e.grupo_academico_id = g_est.id
                 LEFT JOIN grupos_academicos g_dir ON u.id = g_dir.director_grupo_id
                 ${where} 
                 ORDER BY 
                   CASE u.estado
                     WHEN 'pendiente' THEN 1
                     WHEN 'validado' THEN 2
                     WHEN 'suspendido' THEN 3
                     WHEN 'rechazado' THEN 4
                     ELSE 5
                   END, 
                   e.estrato ASC, 
                   u.fecha_registro DESC
                 LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            return sendSuccess(res, users, 'Búsqueda exitosa', 200, {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            });
        } catch (error) {
            logger.error('Error searchUsers admin:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    static async uploadUserPhoto(req, res) {
        logger.api.request(req);
        try {
            const { userId } = req.params; // ID de usuario (corregido: era 'id', la ruta usa ':userId')
            if (!req.file) return sendError(res, 'No se proporcionó ninguna imagen', 400);

            const filename = req.file.filename;

            // Actualizar foto_perfil en la tabla estudiantes basándose en usuario_id
            const [updateRes] = await database.execute(
                'UPDATE estudiantes SET foto_perfil = ? WHERE usuario_id = ?',
                [filename, userId]
            );

            if (updateRes.affectedRows === 0) {
                return sendError(res, 'No se encontró el perfil de estudiante para este usuario', 404);
            }

            logger.info(`Foto de perfil actualizada por admin para usuario ID: ${userId}`, { adminId: req.user.id });

            // Auditoría
            await logger.audit(
                req.user.id,
                'UPDATE',
                'estudiantes',
                `Foto de perfil actualizada para usuario ID ${userId}: ${filename}`,
                req.ip
            );

            return sendSuccess(res, { filename, url: `/uploads/profiles/${filename}` }, 'Foto de perfil actualizada correctamente');
        } catch (error) {
            logger.error('Error en uploadUserPhoto (Admin):', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = AdminUserController;
