const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const emailService = require('../utils/emailService');
const PasswordResetCode = require('../models/PasswordResetCode');
const { validarHorarioActual } = require('../utils/scheduleUtils');
const InstitucionConfig = require('../models/InstitucionConfig');
const Student = require('../models/Student');

class AuthService {
    static async validateLogin(email_or_matricula, password) {
        let user = null;
        if (email_or_matricula.includes('@')) {
            const [result] = await database.pool.execute('SELECT * FROM usuarios WHERE email = ?', [email_or_matricula]);
            user = result && result.length > 0 ? result[0] : null;
        } else {
            const [result] = await database.pool.execute('SELECT * FROM usuarios WHERE matricula = ?', [email_or_matricula]);
            user = result && result.length > 0 ? result[0] : null;
        }

        if (!user) {
            throw { status: 401, message: 'Credenciales inválidas', type: 'USER_NOT_FOUND' };
        }

        if (user.estado !== 'activo' && user.estado !== 'validado') {
            throw { status: 401, message: 'Tu cuenta está pendiente de activación por secretaría' };
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw { status: 401, message: 'Credenciales inválidas', type: 'INVALID_PASSWORD', user };
        }

        // Nota: el rol 'escaner' no tiene restricción de horario

        return user;
    }

    static generateToken(user) {
        return jwt.sign(
            { userId: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET || 'tu-clave-secreta-muy-segura',
            { expiresIn: '24h' }
        );
    }

    static async getAdditionalInfo(user) {
        let additionalInfo = {};
        if (user.rol === 'estudiante') {
            const [students] = await database.pool.execute('SELECT nombre, apellidos FROM estudiantes WHERE usuario_id = ?', [user.id]);
            if (students && students.length > 0) {
                additionalInfo = { nombre: students[0].nombre, apellidos: students[0].apellidos };
            }
        }
        return additionalInfo;
    }



    static async registerStudent(data, origin) {
        const connection = await database.getConnection();
        try {
            const {
                email, matricula, password, nombre, apellidos, fecha_nacimiento,
                telefono, grado, jornada, estrato, acudiente_nombre, acudiente_apellidos,
                acudiente_cedula, acudiente_telefono, acudiente_email, grupo_etnico, es_desplazado,
                grupo_academico_id // Extraído correctamente
            } = data;

            const config = await InstitucionConfig.obtenerConfiguracion();
            const count = await InstitucionConfig.obtenerConteoEstudiantes();

            if (count >= (config.limite_cupos_restaurante || 270)) {
                throw { status: 400, message: 'Cupos agotados.' };
            }

            const [existing] = await connection.execute('SELECT id FROM usuarios WHERE email = ? OR matricula = ?', [email, matricula]);
            if (existing && existing.length > 0) {
                throw { status: 400, message: 'Ya registrado' };
            }

            await connection.beginTransaction();

            const hashedPassword = await bcrypt.hash(password, 12);
            const [uRes] = await connection.execute(
                'INSERT INTO usuarios (email, matricula, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
                [email, matricula, hashedPassword, 'estudiante', 'validado'] // Usamos 'validado' que es el enum correcto
            );
            const userId = uRes.insertId;

            const qr = `QR_EST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const prio = Student.calculatePriority(grupo_etnico || 'ninguno', grado || 'Sin asignar', es_desplazado === 'si');

            const [eRes] = await connection.execute(
                `INSERT INTO estudiantes 
         (usuario_id, nombre, apellidos, fecha_nacimiento, telefono, grupo_academico_id, estrato, codigo_qr, grupo_etnico, es_desplazado, prioridad, fecha_ingreso) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
                [userId, nombre, apellidos, fecha_nacimiento || null, telefono || null, grupo_academico_id || null, estrato || 1, qr, grupo_etnico || 'ninguno', es_desplazado === 'si' ? 1 : 0, prio]
            );
            const estudianteId = eRes.insertId;

            if (acudiente_nombre && acudiente_apellidos && acudiente_cedula) {
                await connection.execute(
                    `INSERT INTO acudientes (estudiante_id, nombre, apellidos, cedula, telefono, email) VALUES (?, ?, ?, ?, ?, ?)`,
                    [estudianteId, acudiente_nombre, acudiente_apellidos, acudiente_cedula, acudiente_telefono || null, acudiente_email || null]
                );
            }

            await connection.commit();

            emailService.sendWelcomeEmail({
                email,
                nombre,
                apellidos,
                fechaRegistro: new Date().toLocaleDateString('es-ES'),
                enlacePortal: origin || process.env.FRONTEND_BASE_URL
            }).catch(e => console.error('Email Error', e));

            return { userId, estudianteId, email, qr };

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async getProfileData(userId) {
        const [users] = await database.pool.execute('SELECT id, email, rol, estado, matricula, access_config, expires_at FROM usuarios WHERE id = ?', [userId]);
        if (!users || users.length === 0) {
            throw { status: 404, message: 'No encontrado' };
        }

        const user = users[0];
        let data = { ...user };
        if (user.rol === 'estudiante') {
            const [students] = await database.pool.execute(
                `SELECT e.nombre, e.apellidos, e.telefono, g.nombre AS grado, g.jornada 
                 FROM estudiantes e
                 LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
                 WHERE e.usuario_id = ?`,
                [user.id]
            );
            if (students && students.length > 0) data.student = { ...students[0], matricula: user.matricula };
        }
        return data;
    }



    static async requestPasswordReset(email) {
        const [users] = await database.pool.execute('SELECT id, email, rol FROM usuarios WHERE email = ?', [email]);
        if (users && users.length > 0) {
            const user = users[0];
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const ttl = parseInt(process.env.PASSWORD_RESET_TTL_MINUTES || '15', 10);
            await PasswordResetCode.createForUser(user.id, code, ttl);
            await emailService.sendPasswordResetCodeEmail({
                email: user.email,
                nombreDestinatario: user.email,
                codigo: code,
                vigenciaMinutos: ttl,
                fechaGeneracion: new Date().toLocaleString()
            });
            return true;
        }
        return false;
    }

    static async resetPassword(email, code, newPassword) {
        const [users] = await database.pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (!users || users.length === 0) {
            throw { status: 400, message: 'Inválido' };
        }

        const user = users[0];
        const record = await PasswordResetCode.verifyCode(user.id, code);
        if (!record) {
            throw { status: 400, message: 'Expirado' };
        }

        const hash = await bcrypt.hash(newPassword, 12);
        await database.pool.execute('UPDATE usuarios SET password = ? WHERE id = ?', [hash, user.id]);
        await PasswordResetCode.consumeCode(record.id);
    }
}

module.exports = AuthService;
