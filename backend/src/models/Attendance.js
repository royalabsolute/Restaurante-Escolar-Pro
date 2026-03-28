const database = require('../config/database');

class Attendance {
  // Registrar asistencia
  static async create(attendanceData) {
    try {
      const {
        estudiante_id,
        fecha,
        hora_entrada,
        metodo_registro,
        registrado_por,
        observaciones
      } = attendanceData;

      // Verificar si ya existe asistencia para ese día
      const existingAttendance = await database.query(
        'SELECT id FROM asistencias WHERE estudiante_id = ? AND fecha = ?',
        [estudiante_id, fecha]
      );

      if (existingAttendance.length > 0) {
        throw new Error('Ya existe un registro de asistencia para este día');
      }

      const result = await database.query(
        `INSERT INTO asistencias 
         (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, observaciones) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, observaciones]
      );

      return {
        id: result.insertId,
        ...attendanceData
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar asistencia por ID
  static async findById(id) {
    try {
      const attendance = await database.query(
        `SELECT a.*, 
                e.nombre, e.apellidos, g.nombre AS grado, g.jornada,
                u.email as registrado_por_email
         FROM asistencias a
         JOIN estudiantes e ON a.estudiante_id = e.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         LEFT JOIN usuarios u ON a.registrado_por = u.id
         WHERE a.id = ?`,
        [id]
      );
      return attendance[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener asistencias de un estudiante
  static async findByStudentId(studentId, limit = 30) {
    try {
      const attendance = await database.query(
        `SELECT a.*, u.email as registrado_por_email
         FROM asistencias a
         LEFT JOIN usuarios u ON a.registrado_por = u.id
         WHERE a.estudiante_id = ?
         ORDER BY a.fecha DESC, a.hora_entrada DESC
         LIMIT ?`,
        [studentId, limit]
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Obtener asistencias por fecha
  static async findByDate(fecha) {
    try {
      const attendance = await database.query(
        `SELECT a.*, 
                e.nombre, e.apellidos, g.nombre AS grado, g.jornada, e.foto_perfil,
                u.matricula,
                reg.email as registrado_por_email
         FROM asistencias a
         JOIN estudiantes e ON a.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         LEFT JOIN usuarios reg ON a.registrado_por = reg.id
         WHERE a.fecha = ?
         ORDER BY a.hora_entrada ASC`,
        [fecha]
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Obtener asistencias por rango de fechas
  static async findByDateRange(fechaInicio, fechaFin) {
    try {
      const attendance = await database.query(
        `SELECT a.*, 
                e.nombre, e.apellidos, g.nombre AS grado, g.jornada,
                u.matricula
         FROM asistencias a
         JOIN estudiantes e ON a.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE a.fecha BETWEEN ? AND ?
         ORDER BY a.fecha DESC, a.hora_entrada ASC`,
        [fechaInicio, fechaFin]
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si un estudiante asistió en una fecha específica
  static async checkAttendance(studentId, fecha) {
    try {
      const attendance = await database.query(
        'SELECT id, hora_entrada, metodo_registro FROM asistencias WHERE estudiante_id = ? AND fecha = ? AND validado = 1 AND rechazado = 0',
        [studentId, fecha]
      );
      return attendance[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de asistencia diaria
  static async getDailyStats(fecha) {
    try {
      const stats = await database.query(`
        SELECT 
          COUNT(*) as total_asistencias,
          COUNT(CASE WHEN metodo_registro = 'escaner' THEN 1 END) as por_escaner,
          COUNT(CASE WHEN metodo_registro = 'camara' THEN 1 END) as por_camara,
          COUNT(CASE WHEN metodo_registro = 'manual' THEN 1 END) as por_manual,
          AVG(TIME_TO_SEC(hora_entrada)) as promedio_hora_entrada
        FROM asistencias 
        WHERE fecha = ? AND validado = 1 AND rechazado = 0
      `, [fecha]);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas semanales
  static async getWeeklyStats(fechaInicio, fechaFin) {
    try {
      const stats = await database.query(`
        SELECT 
          fecha,
          COUNT(*) as total_asistencias,
          DAYNAME(fecha) as dia_semana
        FROM asistencias 
        WHERE fecha BETWEEN ? AND ?
        GROUP BY fecha
        ORDER BY fecha
      `, [fechaInicio, fechaFin]);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estudiantes que no asistieron en una fecha
  static async findAbsentStudents(fecha) {
    try {
      if (!fecha) {
        return [];
      }

      const dateObject = new Date(`${fecha}T00:00:00Z`);
      if (!Number.isFinite(dateObject.getTime())) {
        return [];
      }

      const dayOfWeek = dateObject.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return [];
      }

      const absentStudents = await database.query(`
        SELECT e.id, e.nombre, e.apellidos, g.nombre AS grado, g.jornada,
               u.matricula, u.email,
               a.nombre as acudiente_nombre, a.telefono as acudiente_telefono
        FROM estudiantes e
        JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN acudientes a ON e.id = a.estudiante_id
        LEFT JOIN asistencias att ON e.id = att.estudiante_id AND att.fecha = ? AND att.validado = 1 AND att.rechazado = 0
        WHERE u.estado = 'validado'
          AND att.id IS NULL
          AND (e.fecha_ingreso IS NULL OR e.fecha_ingreso <= ?)
        ORDER BY g.nombre, e.nombre
      `, [fecha, fecha]);

      return absentStudents;
    } catch (error) {
      throw error;
    }
  }

  // Obtener asistencias por grado
  static async findByGrade(grado, fecha) {
    try {
      const attendance = await database.query(
        `SELECT a.*, 
                e.nombre, e.apellidos, e.foto_perfil,
                u.matricula
         FROM asistencias a
         JOIN estudiantes e ON a.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE g.nombre = ? AND a.fecha = ?
         ORDER BY a.hora_entrada ASC`,
        [grado, fecha]
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Obtener asistencias por jornada
  static async findBySchedule(jornada, fecha) {
    try {
      const attendance = await database.query(
        `SELECT a.*, 
                e.nombre, e.apellidos, e.grado, e.foto_perfil,
                u.matricula
         FROM asistencias a
         JOIN estudiantes e ON a.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE g.jornada = ? AND a.fecha = ?
         ORDER BY a.hora_entrada ASC`,
        [jornada, fecha]
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar observaciones de asistencia
  static async updateObservations(id, observaciones) {
    try {
      await database.query(
        'UPDATE asistencias SET observaciones = ? WHERE id = ?',
        [observaciones, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Eliminar asistencia (solo admin)
  static async delete(id) {
    try {
      await database.query('DELETE FROM asistencias WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener reporte de asistencia mensual por estudiante
  static async getMonthlyReportByStudent(studentId, year, month) {
    try {
      const report = await database.query(`
        SELECT 
          fecha,
          hora_entrada,
          metodo_registro,
          observaciones
        FROM asistencias 
        WHERE estudiante_id = ? 
          AND YEAR(fecha) = ? 
          AND MONTH(fecha) = ?
          AND validado = 1
          AND rechazado = 0
        ORDER BY fecha ASC
      `, [studentId, year, month]);

      return report;
    } catch (error) {
      throw error;
    }
  }

  // Obtener top estudiantes con más asistencias
  static async getTopAttendees(limit = 10, fechaInicio, fechaFin) {
    try {
      const topStudents = await database.query(`
        SELECT 
          e.nombre, e.apellidos, g.nombre AS grado,
          u.matricula,
          COUNT(*) as total_asistencias
        FROM asistencias a
        JOIN estudiantes e ON a.estudiante_id = e.id
        JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE a.fecha BETWEEN ? AND ?
        GROUP BY e.id, g.nombre
        ORDER BY total_asistencias DESC
        LIMIT ?
      `, [fechaInicio, fechaFin, limit]);

      return topStudents;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas generales
  static async getGeneralStats() {
    try {
      const stats = await database.query(`
        SELECT 
          COUNT(*) as total_registros,
          COUNT(DISTINCT estudiante_id) as estudiantes_diferentes,
          COUNT(DISTINCT fecha) as dias_diferentes,
          AVG(TIME_TO_SEC(hora_entrada)) as promedio_hora_global
        FROM asistencias
      `);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Attendance;
