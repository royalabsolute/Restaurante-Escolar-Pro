const database = require('../config/database');

class Justification {
  // Crear justificación
  static async create(justificationData) {
    try {
      const {
        estudiante_id,
        fecha_falta,
        motivo,
        descripcion,
        archivo_adjunto
      } = justificationData;

      // Verificar si ya existe una justificación para esa fecha
      const existing = await database.query(
        'SELECT id FROM justificaciones WHERE estudiante_id = ? AND fecha_falta = ?',
        [estudiante_id, fecha_falta]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una justificación para esta fecha');
      }

      // Verificar que la fecha de falta sea válida (no futura)
      const today = new Date().toISOString().split('T')[0];
      if (fecha_falta > today) {
        throw new Error('No se puede justificar una falta futura');
      }

      const result = await database.query(
        `INSERT INTO justificaciones 
         (estudiante_id, fecha_falta, motivo, descripcion, archivo_adjunto) 
         VALUES (?, ?, ?, ?, ?)`,
        [estudiante_id, fecha_falta, motivo, descripcion || null, archivo_adjunto]
      );

      return {
        id: result.insertId,
        ...justificationData,
        estado: 'pendiente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar justificación por ID
  static async findById(id) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos, g.nombre AS grado, g.jornada,
                u.matricula, u.email,
                rev.email as revisado_por_email
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         LEFT JOIN usuarios rev ON j.revisado_por = rev.id
         WHERE j.id = ?`,
        [id]
      );
      return justifications[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones de un estudiante
  static async findByStudentId(studentId) {
    try {
      const justifications = await database.query(
        `SELECT j.*, rev.email as revisado_por_email
         FROM justificaciones j
         LEFT JOIN usuarios rev ON j.revisado_por = rev.id
         WHERE j.estudiante_id = ?
         ORDER BY j.fecha_solicitud DESC`,
        [studentId]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones por estado
  static async findByStatus(estado) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos, g.nombre AS grado, g.jornada,
                u.matricula, u.email,
                a.telefono as acudiente_telefono, a.email as acudiente_email
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         LEFT JOIN acudientes a ON e.id = a.estudiante_id
         WHERE j.estado = ?
         ORDER BY j.fecha_solicitud ASC`,
        [estado]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones pendientes (para secretaría)
  static async findPending() {
    try {
      return await this.findByStatus('pendiente');
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones por rango de fechas
  static async findByDateRange(fechaInicio, fechaFin) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos, g.nombre AS grado,
                u.matricula
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE j.fecha_falta BETWEEN ? AND ?
         ORDER BY j.fecha_falta DESC`,
        [fechaInicio, fechaFin]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }

  // Revisar justificación (aprobar/rechazar)
  static async review(id, estado, revisado_por, comentario_secretaria = null) {
    try {
      const validStates = ['aprobada', 'rechazada'];
      if (!validStates.includes(estado)) {
        throw new Error('Estado inválido. Debe ser "aprobada" o "rechazada"');
      }

      await database.query(
        `UPDATE justificaciones 
         SET estado = ?, revisado_por = ?, fecha_revision = NOW(), comentario_secretaria = ?
         WHERE id = ?`,
        [estado, revisado_por, comentario_secretaria, id]
      );

      // Si se aprueba la justificación, resetear faltas consecutivas del estudiante
      if (estado === 'aprobada') {
        const justification = await this.findById(id);
        if (justification) {
          await database.query(
            'UPDATE estudiantes SET faltas_consecutivas = 0 WHERE id = ?',
            [justification.estudiante_id]
          );

          try {
            const studentRows = await database.query(
              'SELECT usuario_id FROM estudiantes WHERE id = ? LIMIT 1',
              [justification.estudiante_id]
            );

            const usuarioId = studentRows?.[0]?.usuario_id;
            if (usuarioId) {
              await database.query(
                "UPDATE usuarios SET estado = CASE WHEN estado = 'suspendido' THEN 'validado' ELSE estado END WHERE id = ?",
                [usuarioId]
              );
            }
          } catch (reactivationError) {
            console.warn('⚠️ Error reactivando estudiante tras justificación aprobada:', reactivationError.message);
          }
        }
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Verificar si una fecha tiene justificación aprobada
  static async checkJustifiedAbsence(studentId, fecha) {
    try {
      const justifications = await database.query(
        'SELECT id, estado FROM justificaciones WHERE estudiante_id = ? AND fecha_falta = ?',
        [studentId, fecha]
      );

      const justified = justifications.find(j => j.estado === 'aprobada');
      return justified || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de justificaciones
  static async getStatistics() {
    try {
      const stats = await database.query(`
        SELECT 
          COUNT(*) as total_justificaciones,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) as aprobadas,
          SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas,
          AVG(DATEDIFF(fecha_revision, fecha_solicitud)) as promedio_dias_revision
        FROM justificaciones
        WHERE fecha_revision IS NOT NULL
      `);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones por grado
  static async findByGrade(grado) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos,
                u.matricula
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE g.nombre = ?
         ORDER BY j.fecha_solicitud DESC`,
        [grado]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar motivo de justificación (solo si está pendiente)
  static async updateReason(id, newReason) {
    try {
      // Verificar que esté pendiente
      const justification = await this.findById(id);
      if (!justification) {
        throw new Error('Justificación no encontrada');
      }

      if (justification.estado !== 'pendiente') {
        throw new Error('Solo se pueden editar justificaciones pendientes');
      }

      await database.query(
        'UPDATE justificaciones SET motivo = ? WHERE id = ?',
        [newReason, id]
      );

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar justificación (solo admin o si está pendiente)
  static async delete(id) {
    try {
      await database.query('DELETE FROM justificaciones WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Obtener justificaciones recientes (últimos 30 días)
  static async findRecent(limit = 50) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos, g.nombre AS grado,
                u.matricula
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE j.fecha_solicitud >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY j.fecha_solicitud DESC
         LIMIT ?`,
        [limit]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estudiantes con más justificaciones
  static async getTopJustifiers(limit = 10) {
    try {
      const topStudents = await database.query(
        `SELECT 
                e.nombre, e.apellidos, e.grado,
                u.matricula,
                COUNT(*) as total_justificaciones,
                SUM(CASE WHEN j.estado = 'aprobada' THEN 1 ELSE 0 END) as justificaciones_aprobadas
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         GROUP BY e.id, g.nombre
         ORDER BY total_justificaciones DESC
         LIMIT ?`,
        [limit]
      );
      return topStudents;
    } catch (error) {
      throw error;
    }
  }

  // Buscar justificaciones por palabra clave en el motivo
  static async searchByKeyword(keyword) {
    try {
      const justifications = await database.query(
        `SELECT j.*, 
                e.nombre, e.apellidos, g.nombre AS grado,
                u.matricula
         FROM justificaciones j
         JOIN estudiantes e ON j.estudiante_id = e.id
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE j.motivo LIKE ?
         ORDER BY j.fecha_solicitud DESC`,
        [`%${keyword}%`]
      );
      return justifications;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Justification;
