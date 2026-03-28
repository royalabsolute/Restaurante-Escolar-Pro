const database = require('../config/database');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Justification = require('../models/Justification');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../middleware/standardResponse');
const logger = require('../utils/logger'); // Importar logger

class AdminStudentController {
    // Obtener estudiante completo con toda su información
    static async getStudentComplete(req, res) {
        try {
            const { studentId } = req.params;
            const student = await Student.findById(studentId);
            if (!student) return sendError(res, 'Estudiante no encontrado', 404);

            const recentAttendance = await Attendance.findByStudentId(studentId, 10);
            const justifications = await Justification.findByStudentId(studentId);

            return sendSuccess(res, {
                estudiante: student,
                asistencias_recientes: recentAttendance,
                justificaciones: justifications
            });
        } catch (error) {
            console.error('Error completo estudiante:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener estudiantes por estado con filtros (usa SQL directo, no carga todos en memoria)
    static async getStudentsByStatus(req, res) {
        try {
            const { estado } = req.query;
            const allowedRoles = ['estudiante', 'docente', 'alfabetizador', 'admin', 'invitado'];

            let users;
            if (estado) {
                // Con filtro de estado: usa el método optimizado del modelo
                users = await User.findByStatusAndRoles(estado, allowedRoles);
            } else {
                // Sin filtro: consulta directa
                const placeholders = allowedRoles.map(() => '?').join(',');
                users = await database.query(
                    `SELECT u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
                            e.id as student_id,
                            COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre,
                            COALESCE(e.apellidos, '') as apellidos,
                            g.nombre AS grado, g.jornada, e.estrato, u.motivo_rechazo, u.motivo_suspension
                     FROM usuarios u
                     LEFT JOIN estudiantes e ON u.id = e.usuario_id
                     LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
                     WHERE u.rol IN (${placeholders})
                     ORDER BY u.fecha_registro DESC`,
                    allowedRoles
                );
            }

            return sendSuccess(res, users);
        } catch (error) {
            console.error('Error estudiantes por estado:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    // Validar estudiante
    static async validateStudent(req, res) {
        try {
            const { studentId } = req.params;
            const { accion, comentario } = req.body;

            const student = await database.query('SELECT * FROM usuarios WHERE id = ?', [studentId]);
            if (!student || student.length === 0) return sendError(res, 'Estudiante no encontrado', 404);

            const finalAction = accion || 'validar';
            const newState = finalAction === 'validar' ? 'validado' : 'rechazado';

            await User.updateStatus(studentId, newState);
            if (finalAction === 'rechazar') {
                await database.query('UPDATE usuarios SET motivo_rechazo = ? WHERE id = ?', [comentario || '', studentId]);
            }

            // Auditoría estandarizada
            await logger.audit(
                req.user.id,
                'UPDATE',
                'usuarios',
                `Validación de estudiante: ${student[0].email} -> ${newState}`,
                req.ip
            );

            return sendSuccess(res, { id: studentId, estado: newState }, `Estudiante ${newState} correctamente`);
        } catch (error) {
            console.error('Error validación:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Rechazar estudiante
    static async rejectStudent(req, res) {
        try {
            const { studentId } = req.params;
            const { motivo } = req.body;

            await User.updateStatus(studentId, 'rechazado');
            await database.query('UPDATE usuarios SET motivo_rechazo = ? WHERE id = ?', [motivo || '', studentId]);

            // Auditoría estandarizada
            await logger.audit(
                req.user.id,
                'UPDATE',
                'usuarios',
                `Estudiante rechazado: ${motivo}`,
                req.ip
            );

            return sendSuccess(res, { id: studentId }, 'Estudiante rechazado');
        } catch (error) {
            console.error('Error rechazo:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Reiniciar todas las contraseñas a matrícula (procesamiento en lotes paralelos)
    static async resetAllPasswords(req, res) {
        try {
            const bcrypt = require('bcrypt');
            const students = await database.query('SELECT id, matricula FROM usuarios WHERE rol = "estudiante" AND matricula IS NOT NULL');

            // Procesar en lotes de 10 para evitar bloquear el event loop ~67s → ~7s
            const CHUNK_SIZE = 10;
            let count = 0;

            for (let i = 0; i < students.length; i += CHUNK_SIZE) {
                const chunk = students.slice(i, i + CHUNK_SIZE);
                // Hashear en paralelo dentro de cada lote
                const updates = await Promise.all(
                    chunk.map(async (s) => {
                        const hashed = await bcrypt.hash(s.matricula, 12);
                        return { id: s.id, hashed };
                    })
                );
                // Aplicar updates en paralelo
                await Promise.all(
                    updates.map(({ id, hashed }) =>
                        database.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, id])
                    )
                );
                count += chunk.length;
            }

            // Auditoría estandarizada
            await logger.audit(
                req.user.id,
                'UPDATE_ALL',
                'usuarios',
                `Reinicio masivo de contraseñas (${count} usuarios)`,
                req.ip
            );

            return sendSuccess(res, { total: count }, 'Contraseñas reiniciadas exitosamente');
        } catch (error) {
            console.error('Error reset masivo:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Regenerar todos los códigos QR (códigos únicos garantizados por ID + timestamp + random)
    static async regenerateAllBarcodes(req, res) {
        try {
            const { randomBytes } = require('crypto');
            const students = await database.query('SELECT id FROM estudiantes');
            let count = 0;

            // Procesar en lotes paralelos para mayor velocidad
            const CHUNK_SIZE = 20;
            for (let i = 0; i < students.length; i += CHUNK_SIZE) {
                const chunk = students.slice(i, i + CHUNK_SIZE);
                await Promise.all(
                    chunk.map(async (s) => {
                        // ID del estudiante + timestamp + 8 bytes random = colisión prácticamente imposible
                        const randomHex = randomBytes(4).toString('hex').toUpperCase();
                        const newCode = `REST-${s.id}-${Date.now()}-${randomHex}`;
                        await database.query('UPDATE estudiantes SET codigo_qr = ? WHERE id = ?', [newCode, s.id]);
                    })
                );
                count += chunk.length;
            }

            // Auditoría estandarizada
            await logger.audit(
                req.user.id,
                'UPDATE_ALL',
                'estudiantes',
                `Regeneración masiva de QRs (${count} estudiantes)`,
                req.ip
            );

            return sendSuccess(res, { total: count }, 'Códigos regenerados');
        } catch (error) {
            console.error('Error QR masivo:', error);
            return sendError(res, 'Error interno', 500);
        }
    }

    // Exportar datos de estudiantes
    static async exportStudentsData(req, res) {
        try {
            const data = await database.query(`
        SELECT u.email, u.matricula, e.nombre, e.apellidos, g.nombre AS grado, g.jornada, e.estrato, u.estado
        FROM usuarios u 
        JOIN estudiantes e ON u.id = e.usuario_id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
      `);
            return sendSuccess(res, data);
        } catch (error) {
            console.error('Error export:', error);
            return sendError(res, 'Error exportando datos', 500);
        }
    }
}

module.exports = AdminStudentController;
