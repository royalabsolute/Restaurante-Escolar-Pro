const User = require('../models/User');
const Student = require('../models/Student');
const Justification = require('../models/Justification');
const database = require('../config/database');
const emailService = require('../utils/emailService');
const AbsenceService = require('../services/AbsenceService');
const { sendSuccess, sendError } = require('../middleware/standardResponse');
const logger = require('../utils/logger'); // Importar logger

class SecretaryController {
  // ... (methods)

  // ========== GESTIÓN DE ESTUDIANTES ==========

  // Obtener estudiantes pendientes de validación (ordenados por prioridad)
  static async getPendingStudents(req, res) {
    try {
      const pendingStudents = await User.findByStatusAndRoles('pendiente', ['estudiante', 'docente', 'alfabetizador']);
      return sendSuccess(res, pendingStudents);
    } catch (error) {
      console.error('Error obteniendo estudiantes pendientes:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener estudiantes validados
  static async getValidatedStudents(req, res) {
    try {
      const validatedStudents = await User.findByStatusAndRoles('validado', ['estudiante', 'docente', 'alfabetizador']);
      return sendSuccess(res, validatedStudents);
    } catch (error) {
      console.error('Error obteniendo estudiantes validados:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener estudiantes rechazados
  static async getRejectedStudents(req, res) {
    try {
      const rejectedStudents = await User.findByStatusAndRoles('rechazado', ['estudiante', 'docente', 'alfabetizador']);
      return sendSuccess(res, rejectedStudents);
    } catch (error) {
      console.error('Error obteniendo estudiantes rechazados:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener estudiantes suspendidos
  static async getSuspendedStudents(req, res) {
    try {
      const suspendedStudents = await User.findByStatusAndRoles('suspendido', ['estudiante', 'docente', 'alfabetizador']);
      return sendSuccess(res, suspendedStudents);
    } catch (error) {
      console.error('Error obteniendo estudiantes suspendidos:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener TODOS los usuarios (excepto admin y usuarios de prueba QR)
  static async getAllUsers(req, res) {
    try {
      const users = await database.query(
        `SELECT 
                u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
                e.id as estudiante_id, 
                COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre, 
                COALESCE(e.apellidos, '') as apellidos, 
                g.nombre AS grado, g.jornada, e.estrato, e.telefono,
                u.motivo_rechazo, u.motivo_suspension
         FROM usuarios u
         LEFT JOIN estudiantes e ON u.id = e.usuario_id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE u.rol != 'admin' AND u.email NOT LIKE '%@qr-prueba.test'
         ORDER BY 
           CASE u.estado WHEN 'pendiente' THEN 1 WHEN 'validado' THEN 2 WHEN 'suspendido' THEN 3 WHEN 'rechazado' THEN 4 END,
           e.estrato ASC, u.fecha_registro ASC`
      );
      return sendSuccess(res, users);
    } catch (error) {
      console.error('Error obteniendo todos los usuarios:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Búsqueda optimizada con paginación para secretaría (excluye admins)
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

      // Filtros base: ocultar admins y usuarios de prueba
      let cond = [`u.email NOT LIKE '%@qr-prueba.test'`, `u.rol != 'admin'`];
      let params = [];

      if (searchTerm.trim()) {
        cond.push(`(LOWER(e.nombre) LIKE LOWER(?) OR LOWER(e.apellidos) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.matricula) LIKE LOWER(?) OR LOWER(g.nombre) LIKE LOWER(?))`);
        const p = `%${searchTerm}%`;
        params.push(p, p, p, p, p);
      }

      if (estado && estado !== 'todos') { cond.push('u.estado = ?'); params.push(estado); }
      if (rol && rol !== 'todos') { cond.push('u.rol = ?'); params.push(rol); }
      if (grado && grado !== 'todos') { cond.push('g.nombre = ?'); params.push(grado); }
      if (jornada && jornada !== 'todos') { cond.push('g.jornada = ?'); params.push(jornada); }
      if (estrato && estrato !== 'todos') { cond.push('e.estrato = ?'); params.push(parseInt(estrato)); }

      const where = cond.join(' AND ');
      const [count] = await database.query(`SELECT COUNT(*) as total FROM usuarios u LEFT JOIN estudiantes e ON u.id = e.usuario_id LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id WHERE ${where}`, params);
      const total = count?.total || 0;
      const totalPages = Math.ceil(total / limit);

      const users = await database.query(
        `SELECT u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
                e.id as estudiante_id, COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre, 
                COALESCE(e.apellidos, '') as apellidos, g.nombre AS grado, g.jornada, e.estrato, e.telefono, e.foto_perfil
         FROM usuarios u 
         LEFT JOIN estudiantes e ON u.id = e.usuario_id 
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE ${where} 
         ORDER BY 
           CASE u.estado
             WHEN 'pendiente' THEN 1
             WHEN 'validado' THEN 2
             WHEN 'suspendido' THEN 3
             WHEN 'rechazado' THEN 4
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
      console.error('Error searchUsers secretary:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener estudiante por ID con toda su información
  static async getStudentById(req, res) {
    try {
      const { studentId } = req.params;

      const users = await database.query('SELECT * FROM usuarios WHERE id = ?', [studentId]);
      if (!users || users.length === 0) return sendError(res, 'Usuario no encontrado', 404);

      const user = users[0];
      if (!['estudiante', 'docente', 'alfabetizador'].includes(user.rol)) {
        return sendError(res, 'No tienes permisos para ver este tipo de usuario', 403);
      }

      if (user.rol === 'estudiante') {
        const estudiantes = await database.query(
          `SELECT e.*, g.nombre AS grado, g.jornada 
           FROM estudiantes e 
           LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id 
           WHERE e.usuario_id = ?`,
          [studentId]
        );
        if (estudiantes && estudiantes.length > 0) {
          const estudiante = estudiantes[0];
          let acudiente = null;
          if (estudiante.acudiente_id) {
            const acudientes = await database.query('SELECT * FROM acudientes WHERE id = ?', [estudiante.acudiente_id]);
            acudiente = acudientes?.[0] || null;
          }
          return sendSuccess(res, {
            id: user.id, usuario_id: user.id, email: user.email, matricula: user.matricula,
            rol: user.rol, estado: user.estado, fecha_registro: user.fecha_registro,
            nombre: estudiante.nombre, apellidos: estudiante.apellidos, telefono: estudiante.telefono,
            fecha_nacimiento: estudiante.fecha_nacimiento, grado: estudiante.grado,
            jornada: estudiante.jornada, estrato: estudiante.estrato, codigo_qr: estudiante.codigo_qr,
            estudiante_id: estudiante.id, acudiente_id: estudiante.acudiente_id,
            acudiente,
            acudiente_nombre: acudiente?.nombre || '', acudiente_apellidos: acudiente?.apellidos || '',
            acudiente_cedula: acudiente?.cedula || '', acudiente_telefono: acudiente?.telefono || '',
            acudiente_email: acudiente?.email || ''
          });
        }
      }

      return sendSuccess(res, user);
    } catch (error) {
      console.error('Error obteniendo estudiante por ID:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Actualizar información de estudiante
  static async updateStudent(req, res) {
    try {
      const { studentId } = req.params;
      const updateData = req.body;

      const user = await User.findById(studentId);
      if (!user) return sendError(res, 'Usuario no encontrado', 404);
      if (!['estudiante', 'docente', 'alfabetizador'].includes(user.rol)) {
        return sendError(res, 'No tienes permisos para editar este tipo de usuario', 403);
      }

      // Separar campos de usuarios y estudiantes
      const userFields = {};
      const studentFields = {};

      // Campos que van en la tabla usuarios
      const userAllowedFields = ['email', 'matricula', 'rol'];
      // Campos que van en la tabla estudiantes
      const studentAllowedFields = ['nombre', 'apellidos', 'telefono', 'grupo_academico_id', 'estrato'];

      for (const [key, value] of Object.entries(updateData)) {
        if (userAllowedFields.includes(key) && value !== undefined) {
          userFields[key] = value;
        } else if (studentAllowedFields.includes(key) && value !== undefined) {
          studentFields[key] = value;
        }
      }

      // Actualizar tabla usuarios si hay campos
      if (Object.keys(userFields).length > 0) {
        const userUpdateFields = [];
        const userUpdateValues = [];

        for (const [key, value] of Object.entries(userFields)) {
          userUpdateFields.push(`${key} = ?`);
          userUpdateValues.push(value);
        }

        if (userUpdateFields.length > 0) {
          userUpdateValues.push(studentId);
          await database.query(
            `UPDATE usuarios SET ${userUpdateFields.join(', ')} WHERE id = ?`,
            userUpdateValues
          );
        }
      }

      // Actualizar tabla estudiantes si hay campos y si el usuario es estudiante
      if (Object.keys(studentFields).length > 0) {
        if (user.rol === 'estudiante') {
          // Buscar el estudiante
          const student = await Student.findByUserId(studentId);
          if (student) {
            const studentUpdateFields = [];
            const studentUpdateValues = [];

            for (const [key, value] of Object.entries(studentFields)) {
              studentUpdateFields.push(`${key} = ?`);
              studentUpdateValues.push(value);
            }

            if (studentUpdateFields.length > 0) {
              studentUpdateValues.push(student.id);
              await database.query(
                `UPDATE estudiantes SET ${studentUpdateFields.join(', ')} WHERE id = ?`,
                studentUpdateValues
              );
            }
          }
        } else {
          // Para docentes y alfabetizadores, solo actualizamos nombre y apellidos en una tabla específica si existe
          // Por ahora, solo guardamos estos campos si son enviados, pero no necesariamente los almacenamos
          console.log(`Intentando actualizar ${user.rol} con campos de estudiante:`, studentFields);
        }
      }

      // Obtener datos actualizados
      const updatedUser = await User.findById(studentId);
      let updatedData = { ...updatedUser };

      if (user.rol === 'estudiante') {
        const student = await Student.findByUserId(studentId);
        if (student) {
          updatedData = { ...updatedData, ...student };
        }
      }

      // Obtener nombre para auditoría
      let userName = updatedUser.email;
      if (user.rol === 'estudiante') {
        const student = await Student.findByUserId(studentId);
        if (student) {
          userName = `${student.nombre} ${student.apellidos}`;
        }
      }

      // Registrar en auditoría
      await logger.audit(
        req.user.id,
        'UPDATE',
        'usuarios',
        `Actualización de datos: ${userName}`,
        req.ip
      );

      return sendSuccess(res, updatedData, 'Información del usuario actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Suspender usuario (estudiante, docente o alfabetizador)
  static async suspendStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { motivo } = req.body;

      const user = await User.findById(studentId);
      if (!user) return sendError(res, 'Usuario no encontrado', 404);

      await database.query(
        'UPDATE usuarios SET estado = ?, motivo_suspension = ? WHERE id = ?',
        ['suspendido', motivo || 'Suspendido por secretaría', studentId]
      );

      let userName = user.email;
      if (user.rol === 'estudiante') {
        const student = await Student.findByUserId(studentId);
        if (student) userName = `${student.nombre} ${student.apellidos}`;
      }

      // Auditoría
      await logger.audit(
        req.user.id,
        'SUSPEND',
        'usuarios',
        `SUSPENSIÓN: ${userName}. Motivo: ${motivo}`,
        req.ip
      );

      return sendSuccess(res, null, 'Estudiante suspendido exitosamente');
    } catch (error) {
      console.error('Error suspendiendo estudiante:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Reiniciar contraseña del estudiante al número de matrícula
  static async resetStudentPassword(req, res) {
    try {
      const { studentId } = req.params;

      const student = await Student.findById(studentId);
      if (!student) return sendError(res, 'Estudiante no encontrado', 404);

      const user = await User.findById(student.usuario_id);
      if (!user || !user.matricula) return sendError(res, 'No se puede reiniciar la contraseña: matrícula no encontrada', 400);

      await User.updatePassword(student.usuario_id, user.matricula);

      // Auditoría
      await logger.audit(
        req.user.id,
        'UPDATE',
        'usuarios',
        `Reinicio de contraseña: ${student.nombre} ${student.apellidos}`,
        req.ip
      );

      return sendSuccess(res, null, 'Contraseña reiniciada al número de matrícula');
    } catch (error) {
      console.error('Error reiniciando contraseña:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // ========== GESTIÓN DE JUSTIFICACIONES ==========

  // Obtener justificaciones pendientes
  static async getPendingJustifications(req, res) {
    try {
      return sendSuccess(res, await Justification.findPending());
    } catch (error) {
      console.error('Error obteniendo justificaciones pendientes:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Obtener justificaciones aprobadas
  static async getApprovedJustifications(req, res) {
    try {
      return sendSuccess(res, await Justification.findByStatus('aprobada'));
    } catch (error) {
      console.error('Error obteniendo justificaciones aprobadas:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }


  static async getRejectedJustifications(req, res) {
    try {
      return sendSuccess(res, await Justification.findByStatus('rechazada'));
    } catch (error) {
      console.error('Error obteniendo justificaciones rechazadas:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // ========== CONTROL DE HORAS ALFABETIZADORES ==========



  // ========== MENSAJERÍA ==========

  // Enviar mensaje a estudiante
  static async sendMessageToStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { asunto, mensaje } = req.body;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      const result = await database.query(
        `INSERT INTO mensajes (emisor_id, receptor_id, asunto, mensaje)
         VALUES (?, ?, ?, ?)`,
        [req.user.id, student.usuario_id, asunto, mensaje]
      );

      return sendSuccess(res, { id: result.insertId, destinatario: `${student.nombre} ${student.apellidos}`, asunto, mensaje }, 'Mensaje enviado exitosamente', 201);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // ========== ESTUDIANTES CON EXCESO DE FALTAS ==========

  static async processDailyAbsences(req, res) {
    try {
      const { fecha, dryRun } = req.body || {};
      const summary = await AbsenceService.processDailyAbsences({
        targetDate: fecha || null,
        dryRun: Boolean(dryRun)
      });

      return sendSuccess(res, summary);
    } catch (error) {
      console.error('Error procesando ausencias:', error);
      return sendError(res, error.message || 'Error procesando ausencias', 500);
    }
  }

  // Obtener estudiantes con más de 4 faltas consecutivas
  static async getStudentsWithExcessiveAbsences(req, res) {
    try {
      try {
        await AbsenceService.processDailyAbsences();
      } catch (processingError) {
        console.warn('⚠️ Error procesando faltas antes de listar excedentes:', processingError.message);
      }

      const limit = await Student.getMaxConsecutiveAbsences();
      const students = await Student.findWithExcessiveAbsences(limit);

      return sendSuccess(res, students, `${students.length} estudiantes con ${limit} o más faltas consecutivas`, 200, { limite_faltas_consecutivas: limit });
    } catch (error) {
      console.error('Error obteniendo estudiantes con exceso de faltas:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Validar usuario
  static async validateStudent(req, res) {
    try {
      // ... (validation logic)
      const { studentId } = req.params;
      const { accion, observaciones } = req.body;
      // ... (fetching user)
      const user = await User.findById(studentId);
      // ... (checks)
      const estadoOriginal = user.estado;
      const newStatus = accion === 'validar' ? 'validado' : 'rechazado';
      // ... (update status)

      if (accion === 'rechazar') {
        await User.updateStatusWithReason(studentId, newStatus, observaciones || 'Rechazado por secretaría');
      } else {
        await User.updateStatus(studentId, newStatus);
      }

      // ... (QR logic)
      if (accion === 'validar' && user.rol === 'estudiante') {
        // ...
        try {
          const studentData = await Student.findByUserId(studentId);
          if (studentData && !studentData.codigo_qr) {
            const crypto = require('crypto');
            const codigoQR = `QR_EST_${studentData.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            await database.query('UPDATE estudiantes SET codigo_qr = ? WHERE id = ?', [codigoQR, studentData.id]);
          }
        } catch (qrError) {
          console.error('Error generando QR automático:', qrError);
        }
      }

      // Auditoría
      try {
        let userName = user.email;
        if (user.rol === 'estudiante') {
          const studentInfo = await Student.findByUserId(studentId);
          if (studentInfo) userName = `${studentInfo.nombre} ${studentInfo.apellidos}`;
        }
        const auditAction = accion === 'validar' ? (estadoOriginal === 'rechazado' ? 'RE-VALIDAR' : 'VALIDAR') : 'RECHAZAR';

        await logger.audit(
          req.user.id,
          auditAction,
          'usuarios',
          `${auditAction} usuario: ${userName}`,
          req.ip
        );
      } catch (auditError) {
        console.error('Error registrando auditoría:', auditError);
      }

      // ... (email logic)
      if (user.rol === 'estudiante') {
        // ... 
        (async () => {
          // ...
          try {
            const studentData = await Student.findByUserId(studentId);
            if (studentData) {
              const acudientes = await database.query('SELECT * FROM acudientes WHERE estudiante_id = ? LIMIT 1', [studentData.id]);
              const acudiente = acudientes?.[0] || null;
              studentData.email = user.email;
              // ...
              if (accion === 'validar') await emailService.sendEstudianteValidadoEmail(studentData, acudiente);
              else await emailService.sendEstudianteRechazadoEmail(studentData, acudiente, observaciones || 'No se especificó un motivo');
            }
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
          }
        })();
      }

      const msg = accion === 'validar'
        ? (estadoOriginal === 'rechazado' ? 'Usuario re-validado exitosamente' : 'Usuario validado exitosamente')
        : 'Usuario rechazado exitosamente';

      return sendSuccess(res, { qr_generado: accion === 'validar' }, msg);
    } catch (error) {
      console.error('Error validando estudiante:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // ... (other methods)

  // Revisar justificación
  static async reviewJustification(req, res) {
    try {
      const { justificationId } = req.params;
      const { accion, comentario } = req.body;

      // ... (logic)
      const justification = await Justification.findById(justificationId);
      if (!justification) return res.status(404).json({ status: 'ERROR', message: 'No encontrada' });
      if (justification.estado !== 'pendiente') return res.status(400).json({ status: 'ERROR', message: 'No pendiente' });

      const newStatus = accion === 'aprobar' ? 'aprobada' : 'rechazada';
      const updatedJustification = await Justification.review(justificationId, newStatus, req.user.id, comentario);

      // Registrar en auditoría
      await logger.audit(
        req.user.id,
        'UPDATE',
        'justificaciones',
        `${accion.toUpperCase()} justificación de ${justification.nombre} ${justification.apellidos}`,
        req.ip
      );

      return sendSuccess(res, updatedJustification, `Justificación ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`);
    } catch (error) {
      console.error('Error revisando justificación:', error);
      return sendError(res, 'Error interno', 500);
    }
  }

  // ... (other methods)

  // Enviar notificación al acudiente
  static async notifyParent(req, res) {
    try {
      // ...
      const { studentId } = req.params;
      const { mensaje } = req.body;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ status: 'ERROR', message: 'Estudiante no encontrado' });

      // Registrar auditoría
      await logger.audit(
        req.user.id,
        'NOTIFY',
        'acudientes',
        `Notificación enviada al acudiente: ${student.acudiente_nombre}. Mensaje: ${mensaje}`,
        req.ip
      );

      return sendSuccess(res, { estudiante: `${student.nombre} ${student.apellidos}`, acudiente: student.acudiente_nombre, telefono: student.acudiente_telefono, mensaje }, 'Notificación enviada al acudiente');
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return sendError(res, 'Error interno', 500);
    }
  }

  // ... (other methods)

  // Eliminar estudiante del restaurante por exceso de faltas
  static async removeStudentForAbsences(req, res) {
    try {
      const { studentId } = req.params;
      const { motivo } = req.body;

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ status: 'ERROR', message: 'Estudiante no encontrado' });

      // Cambiar estado a suspendido
      await User.updateStatus(student.usuario_id, 'suspendido');

      // Registrar en auditoría
      await logger.audit(
        req.user.id,
        'SUSPEND',
        'usuarios',
        `ELIMINACIÓN POR FALTAS: ${student.nombre} ${student.apellidos}. ${motivo}`,
        req.ip
      );

      // Enviar notificación por email
      try {
        const acudientes = await database.query('SELECT * FROM acudientes WHERE estudiante_id = ? LIMIT 1', [studentId]);
        const acudiente = acudientes?.[0] || null;

        const [userData] = await database.query('SELECT email FROM usuarios WHERE id = ?', [student.usuario_id]);
        student.email = userData?.email;

        await emailService.sendEstudianteEliminadoEmail(
          student,
          acudiente,
          motivo || 'Exceso de faltas consecutivas'
        );
      } catch (emailError) {
        console.error('Error enviando email de eliminación:', emailError);
      }

      return sendSuccess(res, null, 'Estudiante eliminado del restaurante por exceso de faltas');
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // ========== MÉTODOS ADICIONALES PARA ALFABETIZADORES ==========



  // Obtener sesiones detalladas de trabajo de alfabetizadores
  // ========== GESTIÓN UNIFICADA DE ALFABETIZADORES ==========



  // ========== GESTIÓN DE CÓDIGOS QR ==========

  // Obtener estudiantes para gestión de códigos QR
  static async getStudentsForQR(req, res) {
    try {
      console.log('🔍 Iniciando consulta de estudiantes para QR...');

      const query = `
        SELECT 
          e.id,
          e.usuario_id,
          e.nombre,
          e.apellidos,
          u.matricula,
          g.nombre AS grado,
          g.jornada,
          e.codigo_qr,
          u.estado,
          u.email
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE u.rol = 'estudiante'
        ORDER BY 
          CASE WHEN e.codigo_qr IS NULL THEN 0 ELSE 1 END,
          e.nombre ASC, e.apellidos ASC
      `;

      console.log('📝 Ejecutando query:', query);
      const estudiantes = await database.query(query);
      console.log('✅ Estudiantes obtenidos:', estudiantes ? estudiantes.length : 0);

      // Validar que la respuesta sea un array
      const estudiantesArray = Array.isArray(estudiantes) ? estudiantes : [];

      // Separar estudiantes con y sin código QR
      const conQR = estudiantesArray.filter(e => e.codigo_qr && e.codigo_qr.trim() !== '');
      const sinQR = estudiantesArray.filter(e => !e.codigo_qr || e.codigo_qr.trim() === '');

      return sendSuccess(res, { total: estudiantesArray.length, conQR: conQR.length, sinQR: sinQR.length, estudiantes: estudiantesArray });
    } catch (error) {
      console.error('Error obteniendo estudiantes para QR:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

  // Generar código QR para un estudiante
  static async generateStudentQR(req, res) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'ID del estudiante es requerido'
        });
      }

      // Verificar que el estudiante existe
      const estudiantes = await database.query(
        `SELECT e.*, u.nombre, u.apellidos, u.email
         FROM estudiantes e
         INNER JOIN usuarios u ON e.usuario_id = u.id
         WHERE e.usuario_id = ? AND u.rol = 'estudiante'`,
        [studentId]
      );

      if (!estudiantes || estudiantes.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      const estudiante = estudiantes[0];

      // Generar código QR único (usando timestamp + ID + random)
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const codigoQR = `QR_${studentId}_${timestamp}_${randomSuffix}`;

      // Actualizar el código QR en la base de datos
      await database.query(
        'UPDATE estudiantes SET codigo_qr = ? WHERE usuario_id = ?',
        [codigoQR, studentId]
      );

      return sendSuccess(res, { estudiante: { ...estudiante, codigo_qr: codigoQR } }, 'Código QR generado exitosamente');
    } catch (error) {
      console.error('Error al generar código QR:', error);
      return sendError(res, 'Error interno del servidor', 500);
    }
  }

}

module.exports = SecretaryController;
