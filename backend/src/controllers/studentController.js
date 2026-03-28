const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Justification = require('../models/Justification');
const database = require('../config/database');
const emailService = require('../utils/emailService');
const AbsenceService = require('../services/AbsenceService');
const { mapArrayToFrontend } = require('../utils/jornadaMapper');
const { getStudentStatistics } = require('../services/reporting/StudentStatsService');
const CustomReportService = require('../services/reporting/CustomReportService');
const {
  isHoliday,
  getHolidaysForYear
} = require('../utils/holidayUtils');
const logger = require('../utils/logger');

// Cache simple en memoria para limitar la generación de QR
const qrGenerationRateLimit = new Map();

class StudentController {
  // Obtener perfil completo del estudiante actual
  static async getMyProfile(req, res) {
    try {
      console.log('🔍 [getMyProfile] Usuario autenticado:', req.user);
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Perfil de estudiante no encontrado'
        });
      }

      // Obtener estadísticas reales del estudiante
      try {
        const stats = await getStudentStatistics({ studentIds: [student.id] });
        if (stats && stats.length > 0) {
          student.stats = stats[0];
        }
      } catch (statsError) {
        console.warn('⚠️ Error al obtener estadísticas del estudiante:', statsError.message);
        student.stats = null;
      }

      res.success(student);
    } catch (error) {
      console.error('🚨 [getMyProfile] Error obteniendo perfil de estudiante:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Actualizar perfil del estudiante actual
  static async updateMyProfile(req, res) {
    try {
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return res.error('Perfil de estudiante no encontrado', 404);
      }

      const {
        nombre,
        apellidos,
        telefono,
        // grupo_academico_id y estrato son de sólo lectura — no se leen del body para evitar escalada de privilegios
        fecha_nacimiento,
        email,
        acudiente: acudientePayload
      } = req.body;

      console.log('[updateMyProfile] Datos recibidos:', {
        nombre,
        apellidos,
        telefono,
        grupo_academico_id,
        estrato,
        fecha_nacimiento,
        email,
        acudiente: acudientePayload
      });

      // Validación de estrato omitida porque el campo es de solo lectura ahora

      // Actualizar estudiante
      await Student.update(student.id, {
        nombre,
        apellidos,
        telefono,
        fecha_nacimiento
        // grupo_academico_id y estrato solo se modifican via admin
      });

      // Si se proporcionó email, actualizar también en la tabla usuarios
      if (email && email !== student.email) {
        await database.query(
          'UPDATE usuarios SET email = ? WHERE id = ?',
          [email, req.user.id]
        );
      }

      const guardianData = acudientePayload || null;

      if (guardianData) {
        try {
          await Student.upsertGuardian(student.id, guardianData);
        } catch (guardianError) {
          console.error('❌ [updateMyProfile] Error actualizando acudiente:', guardianError);
          return res.error(guardianError.message || 'Datos del acudiente inválidos', 400);
        }
      }

      // Obtener el perfil actualizado completo
      const refreshedStudent = await Student.findByUserId(req.user.id);

      res.success(refreshedStudent, 'Perfil actualizado exitosamente');
    } catch (error) {
      console.error('❌ [updateMyProfile] Error completo:', error);
      console.error('❌ [updateMyProfile] Error message:', error.message);
      console.error('❌ [updateMyProfile] Error code:', error.code);
      console.error('❌ [updateMyProfile] Error sqlMessage:', error.sqlMessage);

      let errorMessage = 'Error interno del servidor';

      // Si es un error de MySQL
      if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.sqlMessage) {
        errorMessage = `Error de validación: ${error.sqlMessage || error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.error(errorMessage, 500);
    }
  }

  // Obtener asistencias del estudiante actual
  static async getMyAttendance(req, res) {
    try {
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return res.error('Perfil de estudiante no encontrado', 404);
      }

      const { year, month } = req.query;
      const fechaIngresoISO = student.fecha_ingreso
        ? new Date(student.fecha_ingreso).toISOString().split('T')[0]
        : null;

      // Obtener asistencias
      let attendance;
      if (year && month) {
        attendance = await Attendance.getMonthlyReportByStudent(student.id, year, month);
      } else {
        attendance = await Attendance.findByStudentId(student.id, 365); // Último año completo
      }

      // ✅ REFUERZO DE SEGURIDAD: Filtrar solo registros válidos y no rechazados
      attendance = attendance.filter(a => a.validado === 1 && a.rechazado === 0);

      // ✅ FILTRAR SÁBADOS Y DOMINGOS de las asistencias
      attendance = attendance.filter(a => {
        if (isHoliday(a.fecha)) {
          return false;
        }
        const date = new Date(a.fecha);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Excluir domingo (0) y sábado (6)
      });

      if (fechaIngresoISO) {
        const ingresoDate = new Date(`${fechaIngresoISO}T00:00:00Z`);
        attendance = attendance.filter(a => {
          const recordDate = new Date(a.fecha);
          return recordDate > ingresoDate;
        });
      }

      // Obtener justificaciones aprobadas del estudiante
      const justifications = await Justification.findByStudentId(student.id);
      const approvedJustifications = justifications.filter(j => j.estado === 'aprobada');

      // ✅ FILTRAR SÁBADOS Y DOMINGOS de las justificaciones
      let filteredJustifications = approvedJustifications.filter(j => {
        if (isHoliday(j.fecha_falta)) {
          return false;
        }
        const date = new Date(j.fecha_falta);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Excluir domingo (0) y sábado (6)
      });

      if (fechaIngresoISO) {
        const ingresoDate = new Date(`${fechaIngresoISO}T00:00:00Z`);
        filteredJustifications = filteredJustifications.filter(j => {
          const justificationDate = new Date(j.fecha_falta);
          return justificationDate > ingresoDate;
        });
      }

      // Si se solicita un mes específico, limitar las justificaciones aprobadas a ese período
      if (year && month) {
        const numericYear = parseInt(year, 10);
        const numericMonth = parseInt(month, 10);

        if (!Number.isNaN(numericYear) && !Number.isNaN(numericMonth)) {
          filteredJustifications = filteredJustifications.filter(j => {
            const justificationDate = new Date(j.fecha_falta);
            return (
              justificationDate.getFullYear() === numericYear &&
              justificationDate.getMonth() + 1 === numericMonth
            );
          });
        }
      }

      // Crear un mapa de fechas con justificaciones aprobadas
      const justificationMap = {};
      filteredJustifications.forEach(j => {
        justificationMap[j.fecha_falta] = j;
      });

      // Crear un mapa de fechas con asistencias
      const attendanceMap = {};
      attendance.forEach(a => {
        attendanceMap[a.fecha] = a;
      });

      // Combinar ambos conjuntos de datos
      const combinedData = [];

      // Agregar todas las asistencias (marcadas como presente)
      attendance.forEach(a => {
        combinedData.push({
          fecha: a.fecha,
          presente: true,
          justificada: false,
          hora_registro: a.hora_entrada,
          metodo_registro: a.metodo_registro,
          observaciones: a.observaciones,
          tipo: 'asistencia'
        });
      });

      // Agregar todas las justificaciones aprobadas (marcadas como justificada)
      filteredJustifications.forEach(j => {
        // Solo agregar si NO hay asistencia para esa fecha
        if (!attendanceMap[j.fecha_falta]) {
          combinedData.push({
            fecha: j.fecha_falta,
            presente: false,
            justificada: true,
            hora_registro: null,
            metodo_registro: null,
            observaciones: j.motivo,
            tipo: 'justificacion',
            justificacion_id: j.id,
            estado_justificacion: j.estado,
            fecha_revision: j.fecha_revision
          });
        }
      });

      // Ordenar por fecha descendente
      combinedData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      const maxConsecutive = await Student.getMaxConsecutiveAbsences();

      const yearCandidates = new Set();

      if (year) {
        const numericYear = parseInt(year, 10);
        if (!Number.isNaN(numericYear)) {
          yearCandidates.add(numericYear);
        }
      }

      combinedData.forEach((entry) => {
        if (!entry?.fecha) return;
        const entryDate = new Date(entry.fecha);
        const entryYear = entryDate.getFullYear();
        if (!Number.isNaN(entryYear)) {
          yearCandidates.add(entryYear);
        }
      });

      if (yearCandidates.size === 0) {
        const currentYear = new Date().getFullYear();
        yearCandidates.add(currentYear);
        yearCandidates.add(currentYear - 1);
      }

      const festivos = Array.from(yearCandidates)
        .flatMap((candidateYear) => getHolidaysForYear(candidateYear))
        .filter(Boolean);

      const uniqueFestivos = [...new Set(festivos)].sort();

      res.success({
        asistencias: combinedData,
        metadata: {
          fecha_ingreso: fechaIngresoISO,
          faltas_consecutivas: student.faltas_consecutivas || 0,
          limite_faltas_consecutivas: maxConsecutive,
          festivos: uniqueFestivos
        }
      }, 'Asistencias obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Obtener justificaciones del estudiante actual
  static async getMyJustifications(req, res) {
    try {
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return res.error('Perfil de estudiante no encontrado', 404);
      }

      const justifications = await Justification.findByStudentId(student.id);

      const normalizedJustifications = justifications.map((justification) => ({
        ...justification,
        archivo_adjunto: justification.archivo_adjunto
          ? justification.archivo_adjunto.replace(/\\/g, '/')
          : null
      }));

      res.success(normalizedJustifications);
    } catch (error) {
      console.error('Error obteniendo justificaciones:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Crear justificación de falta
  static async createJustification(req, res) {
    try {
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Perfil de estudiante no encontrado'
        });
      }

      const { fecha_falta, motivo, descripcion } = req.body;
      const normalizedFilePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

      if (!fecha_falta || !motivo) {
        return res.error('La fecha de falta y el motivo son obligatorios', 400);
      }

      const justification = await Justification.create({
        estudiante_id: student.id,
        fecha_falta,
        motivo,
        descripcion: descripcion?.trim() || null,
        archivo_adjunto: normalizedFilePath
      });

      res.success({
        ...justification,
        archivo_adjunto: justification.archivo_adjunto
          ? justification.archivo_adjunto.replace(/\\/g, '/')
          : null
      }, 'Justificación enviada exitosamente', 201);
    } catch (error) {
      console.error('Error creando justificación:', error);
      res.error(error.message || 'Error interno del servidor', 500);
    }
  }

  // ========== RUTAS PARA DOCENTES/ALFABETIZADORES ==========

  // Obtener todos los estudiantes validados (para docentes)
  static async getAllStudents(req, res) {
    try {
      const students = await Student.findAllValidated();

      res.success(students);
    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Buscar estudiantes por nombre o matrícula (para registro manual)
  static async searchStudents(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.error('El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const students = await Student.searchByName(q);

      res.success(students);
    } catch (error) {
      console.error('Error buscando estudiantes:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Registrar asistencia (para docentes/alfabetizadores)
  static async registerAttendance(req, res) {
    try {
      const { estudiante_id, metodo_registro, observaciones } = req.body;
      const fecha = new Date().toISOString().split('T')[0];
      const hora_entrada = new Date().toTimeString().split(' ')[0];

      // Verificar que el estudiante existe
      const student = await Student.findById(estudiante_id);
      if (!student) {
        return res.error('Estudiante no encontrado', 404);
      }

      // Registrar asistencia
      const attendance = await Attendance.create({
        estudiante_id,
        fecha,
        hora_entrada,
        metodo_registro,
        registrado_por: req.user.id,
        observaciones: observaciones || null // Convertir undefined a null
      });

      // Resetear faltas consecutivas
      await Student.resetConsecutiveAbsences(estudiante_id);

      res.success({
        ...attendance,
        estudiante: {
          nombre: student.nombre,
          apellidos: student.apellidos,
          grupo_academico_id: student.grupo_academico_id,
          foto_perfil: student.foto_perfil
        }
      }, 'Asistencia registrada exitosamente', 201);
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      res.error(error.message || 'Error interno del servidor', 500);
    }
  }

  // ✅ NUEVO: Rechazar asistencia (para docentes/alfabetizadores)
  static async rejectAttendance(req, res) {
    try {
      const { estudiante_id, motivo_rechazo } = req.body;
      const fecha = new Date().toISOString().split('T')[0];
      const hora_entrada = new Date().toTimeString().split(' ')[0];

      console.log('🚫 Procesando rechazo de asistencia:', { estudiante_id, motivo_rechazo, fecha });

      // Verificar que el estudiante existe
      const student = await Student.findById(estudiante_id);
      if (!student) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      // Verificar si ya existe un registro (aceptado o rechazado) para hoy
      const existingAttendance = await database.query(
        `SELECT * FROM asistencias 
         WHERE estudiante_id = ? AND fecha = ?`,
        [estudiante_id, fecha]
      );

      if (existingAttendance && existingAttendance.length > 0) {
        const registro = existingAttendance[0];
        if (registro.rechazado === 1) {
          return res.error('El estudiante ya tiene un intento rechazado el día de hoy. No puede volver a intentar.', 400);
        } else {
          return res.error('El estudiante ya tiene asistencia registrada el día de hoy', 400);
        }
      }

      // Registrar asistencia rechazada
      const result = await database.query(
        `INSERT INTO asistencias 
         (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, validado, rechazado, motivo_rechazo)
         VALUES (?, ?, ?, 'manual', ?, 0, 1, ?)`,
        [estudiante_id, fecha, hora_entrada, req.user.id, motivo_rechazo || 'Entrada rechazada']
      );

      console.log('✅ Asistencia rechazada registrada con ID:', result.insertId);

      // Obtener información del acudiente para enviar email
      try {
        const acudientes = await database.query(
          'SELECT * FROM acudientes WHERE estudiante_id = ? LIMIT 1',
          [estudiante_id]
        );
        const acudiente = acudientes && acudientes.length > 0 ? acudientes[0] : null;

        // Obtener email del estudiante desde usuarios
        const usuarios = await database.query(
          'SELECT email, matricula FROM usuarios WHERE id = ?',
          [student.usuario_id]
        );

        if (usuarios && usuarios.length > 0) {
          student.email = usuarios[0].email;
          student.matricula = usuarios[0].matricula;
        }

        // Enviar email de notificación
        console.log('📧 Enviando email de asistencia rechazada...');
        await emailService.sendAsistenciaRechazadaEmail(
          student,
          acudiente,
          fecha,
          hora_entrada,
          motivo_rechazo || 'Entrada rechazada'
        );
      } catch (emailError) {
        console.warn('⚠️ Error enviando email de asistencia rechazada:', emailError);
      }

      res.success({
        asistencia_id: result.insertId,
        estudiante: {
          nombre: student.nombre,
          apellidos: student.apellidos,
          grupo_academico_id: student.grupo_academico_id
        },
        fecha,
        hora_entrada,
        motivo_rechazo: motivo_rechazo || 'Entrada rechazada',
        bloqueado_hasta: fecha
      }, 'Entrada rechazada y registrada. El estudiante no podrá volver a intentar hoy.', 201);
    } catch (error) {
      console.error('❌ Error rechazando asistencia:', error);
      res.error(error.message || 'Error interno del servidor', 500);
    }
  }

  // Buscar estudiante por código de barras (incluye estudiantes de prueba)
  static async findByBarcode(req, res) {
    try {
      const { barcode } = req.params;

      console.log('🔍 Buscando estudiante por código:', barcode);

      // Primero buscar en estudiantes regulares
      let student = await Student.findByBarcode(barcode);

      if (student) {
        console.log('✅ Estudiante regular encontrado:', student.nombre);
        return res.success(student);
      }

      // Si no se encontró, buscar en estudiantes de prueba
      console.log('🔍 Buscando en estudiantes de prueba...');

      const testStudents = await database.query(`
        SELECT 
          e.id,
          e.nombre,
          e.apellidos,
          g.nombre as grado,
          e.codigo_qr,
          e.prioridad,
          e.grupo_etnico,
          e.es_desplazado,
          e.qr_usado,
          u.email
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE e.nombre LIKE 'Prueba %' AND e.codigo_qr = ?
        LIMIT 1
      `, [barcode]);

      if (testStudents.length > 0) {
        const testStudent = testStudents[0];
        console.log('✅ Estudiante de prueba encontrado:', testStudent.nombre);

        return res.success({
          ...testStudent,
          es_estudiante_prueba: true
        });
      }

      // No encontrado en ninguna parte
      console.log('❌ Estudiante no encontrado para código:', barcode);
      return res.error('Estudiante no encontrado o no validado', 404);
    } catch (error) {
      console.error('Error buscando por código de barras:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Obtener asistencias del día actual
  static async getTodayAttendance(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await Attendance.findByDate(today);

      res.success(attendance);
    } catch (error) {
      console.error('Error obteniendo asistencias del día:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Obtener estadísticas del día actual
  static async getTodayStats(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];

      try {
        const absenceSummary = await AbsenceService.processDailyAbsences();
        if (absenceSummary?.status === 'PROCESSED' && absenceSummary.suspended.length > 0) {
          console.log('🚨 [getTodayStats] Estudiantes suspendidos por faltas consecutivas:', absenceSummary.suspended);
        }
      } catch (processingError) {
        console.error('⚠️ [getTodayStats] Error procesando faltas consecutivas:', processingError.message);
      }

      const stats = await Attendance.getDailyStats(today);
      const totalStudents = await Student.findAllValidated();
      const absentStudents = await Attendance.findAbsentStudents(today);

      res.success({
        fecha: today,
        total_estudiantes: totalStudents.length,
        total_asistencias: stats.total_asistencias || 0,
        estudiantes_ausentes: absentStudents.length,
        por_escaner: stats.por_escaner || 0,
        por_camara: stats.por_camara || 0,
        por_manual: stats.por_manual || 0
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del día:', error);
      res.error('Error interno del servidor', 500);
    }
  }




  // Obtener historial completo de asistencias con estadísticas por estudiante
  static async getHistorialCompleto(req, res) {
    try {
      const usuarioId = req.user?.id;
      const usuarioRol = req.user?.rol;

      console.log(`📊 [HISTORIAL] Usuario: ${usuarioId}, Rol: ${usuarioRol}`);

      // Si es escaner/docente, solo mostrar estudiantes que haya atendido
      const esEscaner = usuarioRol === 'escaner' || usuarioRol === 'docente';
      const allStats = await getStudentStatistics();

      let filteredStats = allStats;

      if (esEscaner) {
        const attendedRows = await database.query(
          'SELECT DISTINCT estudiante_id FROM asistencias WHERE registrado_por = ?',
          [usuarioId]
        );
        const attendedSet = new Set(attendedRows.map((row) => row.estudiante_id));
        filteredStats = allStats.filter((student) => attendedSet.has(student.id));
        console.log(`📚 [HISTORIAL] Estudiantes asociados al escáner ${usuarioId}: ${filteredStats.length}`);
      } else {
        console.log(`👑 [HISTORIAL] Mostrando todos los estudiantes (Admin/Secretaria). Total: ${filteredStats.length}`);
      }

      const mapped = mapArrayToFrontend(filteredStats);

      res.success(mapped);
    } catch (error) {
      console.error('❌ [HISTORIAL] Error obteniendo historial completo:', error);
      console.error('❌ [HISTORIAL] Stack:', error.stack);
      res.error('Error interno del servidor', 500);
    }
  }

  static async getStudentReportDetail(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const studentId = Number.parseInt(id, 10);

      if (Number.isNaN(studentId)) {
        return res.error('Identificador de estudiante inválido', 400);
      }

      const timeline = await CustomReportService.buildStudentTimeline(studentId, {
        startDate,
        endDate
      });

      if (!timeline) {
        return res.error('Estudiante no encontrado', 404);
      }

      res.success(timeline);
    } catch (error) {
      console.error('❌ Error al obtener detalle de reporte por estudiante:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  }

  // Buscar estudiante por código QR o matrícula
  static async findStudentByCode(req, res) {
    try {
      const { codigo } = req.params;
      console.log('🔍 Buscando estudiante con código:', codigo);

      if (!codigo || codigo.trim() === '') {
        return res.error('Código es requerido', 400);
      }

      const query = `
        SELECT 
          e.id,
          e.nombre,
          e.apellidos,
          g.nombre as grado,
          g.jornada,
          e.foto_perfil,
          u.matricula,
          e.codigo_qr,
          u.estado,
          (SELECT COUNT(*) FROM asistencias a 
           WHERE a.estudiante_id = e.id 
           AND a.fecha = CURDATE()) as asistencia_hoy
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE (e.codigo_qr = ? OR u.matricula = ?) 
        AND u.estado = 'validado'
        LIMIT 1
      `;

      const estudiantes = await database.query(query, [codigo, codigo]);

      if (!estudiantes || estudiantes.length === 0) {
        return res.error('Código QR no válido o estudiante no encontrado', 404);
      }

      const estudiante = estudiantes[0];
      const yaRegistroAsistencia = estudiante.asistencia_hoy > 0;

      if (yaRegistroAsistencia) {
        return res.json({
          success: false,
          status: 'ALREADY_REGISTERED',
          message: 'El estudiante ya registró asistencia hoy',
          data: {
            ...estudiante,
            ya_registro_asistencia: true
          }
        });
      }

      res.success({
        ...estudiante,
        ya_registro_asistencia: false
      });
    } catch (error) {
      console.error('💥 Error buscando estudiante por código:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  }

  static async generateMyQR(req, res) {
    try {
      const userId = req.user.id;
      const now = Date.now();
      const COOLDOWN_MINUTES = 30; // 30 minutos de cooldown
      const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

      // Verificar Rate Limiting
      if (qrGenerationRateLimit.has(userId)) {
        const lastGeneration = qrGenerationRateLimit.get(userId);
        if (now - lastGeneration < COOLDOWN_MS) {
          const remainingTime = Math.ceil((COOLDOWN_MS - (now - lastGeneration)) / 60000);
          return res.status(429).json({
            status: 'ERROR',
            message: `Límite alcanzado. Debes esperar ${remainingTime} minuto(s) antes de generar otro código QR.`
          });
        }
      }

      const student = await Student.findByUserId(userId);

      if (!student) {
        return res.error('Perfil de estudiante no encontrado', 404);
      }

      // Generar un código QR único basado en la matrícula y timestamp
      const timestamp = Date.now();
      const qrCode = `${student.matricula || student.id}-${timestamp}`;

      console.log(`🔄 Generando nuevo QR para estudiante: ${student.nombre} ${student.apellidos}`);
      console.log(`🔄 Nuevo código QR: ${qrCode}`);

      // Actualizar código QR en la base de datos
      await database.query(
        'UPDATE estudiantes SET codigo_qr = ? WHERE id = ?',
        [qrCode, student.id]
      );

      // Registrar en auditoría
      await logger.audit(
        req.user.id,
        'UPDATE',
        'estudiantes',
        `Generación de nuevo código QR: ${student.nombre} ${student.apellidos}`,
        req.ip
      );

      // Registrar tiempo para el Rate Limit
      qrGenerationRateLimit.set(userId, now);

      res.success({
        id: student.id,
        codigo_qr: qrCode
      }, 'Código QR generado exitosamente');
    } catch (error) {
      console.error('Error generando QR:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // ✅ NUEVO: Obtener lista de suplentes (alfabetizadores)
  static async getSuplentes(req, res) {
    try {
      const query = `
        SELECT e.id, e.nombre, e.apellidos, u.matricula, u.email, g.nombre as grado, e.foto_perfil
        FROM estudiantes e
        JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE u.rol = 'alfabetizador' AND u.estado = 'validado'
        ORDER BY e.nombre, e.apellidos
      `;
      const suplentes = await database.query(query);
      res.success(suplentes);
    } catch (error) {
      console.error('Error obteniendo suplentes:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // ✅ NUEVO: Obtener suplentes con estadísticas
  static async getSuplentesConEstadisticas(req, res) {
    try {
      const query = `
        SELECT e.id, e.nombre, e.apellidos, u.matricula, g.nombre as grado,
               (SELECT COUNT(*) FROM asistencias a WHERE a.estudiante_id = e.id) as total_asistencias
        FROM estudiantes e
        JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE u.rol = 'alfabetizador' AND u.estado = 'validado'
        ORDER BY total_asistencias DESC
      `;
      const suplentes = await database.query(query);
      res.success(suplentes);
    } catch (error) {
      console.error('Error obteniendo suplentes con estadísticas:', error);
      res.error('Error interno del servidor', 500);
    }
  }

  // Subir foto de perfil del estudiante
  static async uploadProfilePhoto(req, res) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.error('No se proporcionó ninguna imagen', 400);
      }

      const filename = req.file.filename;
      console.log(`[uploadProfilePhoto] Subiendo foto de perfil: ${filename} para usuario: ${userId}`);

      // Obtener el estudiante
      const student = await Student.findByUserId(userId);

      if (!student) {
        return res.error('Perfil de estudiante no encontrado', 404);
      }

      // Actualizar foto en la base de datos
      await database.query(
        'UPDATE estudiantes SET foto_perfil = ? WHERE usuario_id = ?',
        [filename, userId]
      );

      // Registrar en auditoría
      await logger.audit(
        req.user.id,
        'UPDATE',
        'estudiantes',
        `Cambio de foto de perfil: ${student.nombre} ${student.apellidos}`,
        req.ip
      );

      console.log(`[uploadProfilePhoto] Foto de perfil actualizada correctamente: ${filename}`);

      res.success({
        filename,
        url: `/uploads/profiles/${filename}`
      }, 'Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('[uploadProfilePhoto] Error uploading profile photo:', error);
      res.error('Error al subir la foto de perfil', 500);
    }
  }
}

module.exports = StudentController;
