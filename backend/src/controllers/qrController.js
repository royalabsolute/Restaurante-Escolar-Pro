const database = require('../config/database');
const InstitucionConfig = require('../models/InstitucionConfig');

const qrController = {
  // Validar código QR y registrar asistencia (Soporta Estudiantes y Suplentes Universales)
  validateQRAndRegisterAttendance: async (req, res) => {
    try {
      const { codigo_qr, registrado_por } = req.body;

      if (!codigo_qr) {
        return res.error('Código QR es requerido', 400);
      }

      const fechaHoy = new Date().toISOString().split('T')[0];
      const horaActual = new Date().toTimeString().split(' ')[0];

      // 1. VERIFICAR SI ES EL QR UNIVERSAL DE SUPLENTES
      const [activeQR] = await database.query(
        'SELECT id, codigo_qr FROM qr_suplente WHERE activo = TRUE LIMIT 1'
      );
      
      const globalSuplenteId = activeQR?.codigo_qr || process.env.GLOBAL_SUPLENTE_ID || 'SUPLENTE_UNIVERSAL_QR_2026';
      
      if (codigo_qr === globalSuplenteId) {
        // SEGURIDAD: COOLDOWN DE 2 SEGUNDOS PARA EL QR UNIVERSAL
        // Evita que se sumen múltiples suplentes por error en un mismo escaneo
        const ultimoRegistro = await database.query(
          'SELECT hora_registro FROM conteo_suplentes_diario WHERE fecha = ? ORDER BY id DESC LIMIT 1',
          [fechaHoy]
        );

        if (ultimoRegistro && ultimoRegistro.length > 0) {
          const ahora = new Date();
          const hoy = ahora.toISOString().split('T')[0];
          const fullUltimo = new Date(`${hoy}T${ultimoRegistro[0].hora_registro}`);
          const diferencia = (ahora - fullUltimo) / 1000;

          if (diferencia < 2) {
            return res.success(null, 'Escaneo procesado (cooldown activo)', 'SUCCESS_COOLDOWN');
          }
        }

        // Registrar en conteo diario de suplentes
        // Intentar obtener ID de la tabla qr_suplente para FK si existe, si no usar NULL
        const [qrS] = await database.query('SELECT id FROM qr_suplente WHERE codigo_qr = ? LIMIT 1', [globalSuplenteId]);
        
        await database.query(
          'INSERT INTO conteo_suplentes_diario (fecha, hora_registro, registrado_por, qr_suplente_id) VALUES (?, ?, ?, ?)',
          [fechaHoy, horaActual, registrado_por || req.user.id || null, qrS?.id || null]
        );

        // Obtener el conteo total de hoy
        const [conteo] = await database.query(
          'SELECT COUNT(*) as total FROM conteo_suplentes_diario WHERE fecha = ?',
          [fechaHoy]
        );

        const responseData = {
          es_suplente: true,
          numero_suplente: conteo?.total || 1,
          fecha: fechaHoy,
          hora: horaActual,
          registrado_por: req.user.email || 'Sistema'
        };

        // Emitir actualización en tiempo real
        const socketService = require('../services/socketService');
        socketService.emitAttendanceUpdate(responseData);

        return res.success(responseData, `✅ Suplente #${conteo?.total || 1} registrado correctamente`);
      }

      // 2. LOGICA PARA ESTUDIANTES REGULARES
      const estudiantes = await database.query(
        `SELECT e.*, g.nombre AS grado, g.jornada, u.email, u.estado as usuario_estado
         FROM estudiantes e
         LEFT JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE e.codigo_qr = ?`,
        [codigo_qr]
      );

      if (!estudiantes || estudiantes.length === 0) {
        return res.error('Código QR inválido o estudiante no encontrado', 404);
      }

      const estudiante = estudiantes[0];

      // Verificar si ya tiene asistencia hoy
      const asistenciaHoy = await database.query(
        'SELECT id FROM asistencias WHERE estudiante_id = ? AND fecha = ?',
        [estudiante.id, fechaHoy]
      );

      if (asistenciaHoy && asistenciaHoy.length > 0) {
        return res.success({ estudiante: estudiante }, 'El estudiante ya tiene asistencia registrada hoy', 'ALREADY_REGISTERED');
      }

      // Registrar asistencia de estudiante regular
      const result = await database.query(
        `INSERT INTO asistencias (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, validado)
         VALUES (?, ?, ?, 'escaner', ?, 1)`,
        [estudiante.id, fechaHoy, horaActual, registrado_por || req.user.id || 1]
      );

      const responseData = {
        es_suplente: false,
        estudiante: {
          id: estudiante.id,
          nombre: estudiante.nombre,
          apellidos: estudiante.apellidos,
          grado: estudiante.grado,
          jornada: estudiante.jornada
        },
        asistencia: {
          id: result.insertId,
          fecha: fechaHoy,
          hora_entrada: horaActual
        }
      };

      // Emitir actualización en tiempo real
      const socketService = require('../services/socketService');
      socketService.emitAttendanceUpdate(responseData);

      return res.success(responseData, 'Asistencia registrada exitosamente');

    } catch (error) {
      console.error('Error al validar QR y registrar asistencia:', error);
      return res.error(error.message);
    }
  },

  // Generar código QR para estudiante específico
  generateStudentQR: async (req, res) => {
    try {
      const { id } = req.params;

      const estudiantes = await database.query(
        'SELECT id, nombre, apellidos FROM estudiantes WHERE id = ?',
        [id]
      );

      if (!estudiantes || estudiantes.length === 0) {
        return res.error('Estudiante no encontrado', 404);
      }

      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      const qrCode = `QR_EST_${id}_${timestamp}_${randomNum}`;

      await database.query(
        'UPDATE estudiantes SET codigo_qr = ? WHERE id = ?',
        [qrCode, id]
      );

      return res.success({
        estudiante_id: id,
        codigo_qr: qrCode,
        nombre: estudiantes[0].nombre,
        apellidos: estudiantes[0].apellidos
      }, 'Código QR generado exitosamente');

    } catch (error) {
      return res.error(error.message);
    }
  },

  // Obtener información del estudiante por código QR
  getStudentByQR: async (req, res) => {
    try {
      const { codigo_qr } = req.params;

      const estudiantes = await database.query(
        `SELECT e.*, g.nombre AS grado, g.jornada, u.email, u.estado as usuario_estado
         FROM estudiantes e
         LEFT JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE e.codigo_qr = ?`,
        [codigo_qr]
      );

      if (!estudiantes || estudiantes.length === 0) {
        return res.error('Código QR no encontrado', 404);
      }

      return res.success(estudiantes[0], 'Estudiante encontrado');

    } catch (error) {
      return res.error(error.message);
    }
  }
};

module.exports = qrController;
