const database = require('../config/database');

class Student {
  static maxConsecutiveAbsencesCache = null;
  static maxConsecutiveAbsencesFetchedAt = null;

  // Función para calcular prioridad basada en grupo étnico y nombre del grupo
  static calculatePriority(grupo_etnico, nombreGrupo, es_desplazado) {
    let prioridad = 5; // Prioridad base (más baja)

    // Prioridad por grupo étnico (indígenas primera prioridad)
    switch (grupo_etnico) {
      case 'indigena':
        prioridad = 1;
        break;
      case 'afrodescendiente':
      case 'rom':
      case 'raizal':
      case 'palenquero':
        prioridad = 2;
        break;
      default:
        prioridad = 3;
    }

    // Bonificación por desplazamiento
    if (es_desplazado) {
      prioridad = Math.max(1, prioridad - 1);
    }

    // Prioridad especial por grado (basado en el nombre del grupo)
    const gruposPrioridadMaxima = [
      'Preescolar 1', 'Preescolar 2', 'Preescolar 3', 'Preescolar 4',
      'Transición 1', 'Transición 2', 'Transición 3', 'Transición 4',
      '1°1', '1°2', '1°3', '2°1', '2°2', '3°1', '10°1', '11°1'
    ];

    if (gruposPrioridadMaxima.some(g => nombreGrupo?.includes(g))) {
      prioridad = 1; // Prioridad máxima independiente del grupo étnico
    }

    return prioridad;
  }

  // Crear estudiante
  static async create(studentData) {
    const {
      usuario_id, nombre, apellidos, fecha_nacimiento,
      telefono, grupo_academico_id, estrato, codigo_qr,
      grupo_etnico = 'ninguno', es_desplazado = false,
      fecha_ingreso = null, observaciones = null
    } = studentData;

    // Obtener nombre del grupo para calcular prioridad
    const [grupo] = await database.query('SELECT nombre FROM grupos_academicos WHERE id = ?', [grupo_academico_id]);
    const nombreGrupo = grupo ? grupo.nombre : '';

    // Calcular prioridad automáticamente
    const prioridad = Student.calculatePriority(grupo_etnico, nombreGrupo, es_desplazado);

    const result = await database.query(
      `INSERT INTO estudiantes 
       (usuario_id, nombre, apellidos, fecha_nacimiento, telefono, grupo_academico_id, estrato, codigo_qr,
        grupo_etnico, es_desplazado, prioridad, fecha_ingreso, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nombre, apellidos, fecha_nacimiento, telefono, grupo_academico_id, estrato, codigo_qr,
        grupo_etnico, es_desplazado, prioridad, fecha_ingreso, observaciones]
    );

    return {
      id: result.insertId,
      prioridad: prioridad,
      ...studentData
    };
  }

  // Buscar estudiante por ID
  static async findById(id) {
    const students = await database.query(
      `SELECT e.*, u.email, u.estado, u.fecha_registro, u.matricula AS usuario_matricula,
        g.nombre as grado, g.jornada,
        a.id as acudiente_id,
        a.nombre as acudiente_nombre, a.apellidos as acudiente_apellidos,
              a.telefono as acudiente_telefono, a.email as acudiente_email, a.cedula as acudiente_cedula
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       LEFT JOIN acudientes a ON e.id = a.estudiante_id
       WHERE e.id = ?`,
      [id]
    );
    const result = students[0] || null;
    if (result && !result.matricula) {
      result.matricula = result.usuario_matricula || null;
    }
    return result;
  }

  // Buscar estudiante por usuario_id
  static async findByUserId(userId) {
    console.log('🔍 [Student.findByUserId] Buscando estudiante con usuario_id:', userId);

    const students = await database.query(
      `SELECT e.*, u.email, u.estado, u.fecha_registro, u.matricula AS usuario_matricula,
        g.nombre as grado, g.jornada,
        a.id as acudiente_id,
        a.nombre as acudiente_nombre, a.apellidos as acudiente_apellidos,
              a.telefono as acudiente_telefono, a.email as acudiente_email, a.cedula as acudiente_cedula
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       LEFT JOIN acudientes a ON e.id = a.estudiante_id
       WHERE e.usuario_id = ?`,
      [userId]
    );

    console.log('🔍 [Student.findByUserId] Resultados de la consulta:', students);
    console.log('🔍 [Student.findByUserId] Número de resultados:', students.length);

    const result = students[0] || null;
    if (result) {
      result.matricula = result.matricula || result.usuario_matricula || null;
    }
    console.log('🔍 [Student.findByUserId] Estudiante encontrado:', result);

    return result;
  }

  // Buscar estudiante por código QR
  static async findByQRCode(qrCode) {
    const students = await database.query(
      `SELECT e.*, u.email, u.estado, g.nombre as grado, g.jornada
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE e.codigo_qr = ? AND u.estado = 'validado'`,
      [qrCode]
    );
    return students[0] || null;
  }

  // Buscar estudiante por matrícula
  static async findByMatricula(matricula) {
    const students = await database.query(
      `SELECT e.*, u.email, u.estado, u.matricula, g.nombre as grado, g.jornada
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE u.matricula = ?`,
      [matricula]
    );
    return students[0] || null;
  }

  // Buscar estudiante por código de barras/QR (alias para findByQRCode)
  static async findByBarcode(barcode) {
    // Primero intentar buscar por código QR exacto
    let student = await Student.findByQRCode(barcode);

    // Si no se encuentra, intentar buscar por matrícula
    if (!student) {
      student = await Student.findByMatricula(barcode);
    }

    // Si aún no se encuentra y el código tiene al menos 8 caracteres, 
    // intentar búsqueda parcial (para códigos QR corruptos/incompletos)
    if (!student && barcode.length >= 8) {
      console.log('🔍 Intentando búsqueda parcial para código:', barcode);

      // Intentar encontrar códigos QR que contengan el fragmento escaneado
      const partialMatches = await database.query(
        `SELECT e.*, u.email, u.estado
         FROM estudiantes e
         JOIN usuarios u ON e.usuario_id = u.id
         WHERE e.codigo_qr LIKE ? AND u.estado = 'validado'
         LIMIT 1`,
        [`%${barcode}%`]
      );

      if (partialMatches && partialMatches.length > 0) {
        console.log('✅ Coincidencia parcial encontrada:', partialMatches[0].codigo_qr);
        student = partialMatches[0];
      }
    }

    return student;
  }

  // Obtener todos los estudiantes validados ordenados por prioridad
  static async findAllValidated() {
    const students = await database.query(
      `SELECT e.id, e.nombre, e.apellidos, g.nombre as grado, g.jornada, e.foto_perfil, e.codigo_qr,
                e.prioridad, e.grupo_etnico, e.es_desplazado,
                u.email, u.matricula, u.estado,
                CASE 
                  WHEN e.prioridad = 1 THEN '🌟 Prioridad Máxima'
                  WHEN e.prioridad = 2 THEN '🥈 Prioridad Alta'
                  WHEN e.prioridad = 3 THEN '🥉 Prioridad Media'
                  WHEN e.prioridad = 4 THEN '📋 Prioridad Baja'
                  ELSE '📝 Prioridad Mínima'
                END as prioridad_texto,
                CASE 
                  WHEN e.grupo_etnico = 'indigena' THEN '🏆 Indígena'
                  WHEN e.grupo_etnico = 'afrodescendiente' THEN 'Afrodescendiente'
                  WHEN e.grupo_etnico = 'rom' THEN 'Rom (Gitano)'
                  WHEN e.grupo_etnico = 'raizal' THEN 'Raizal'
                  WHEN e.grupo_etnico = 'palenquero' THEN 'Palenquero'
                  ELSE e.grupo_etnico
                END as grupo_etnico_texto
         FROM estudiantes e
         JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
         WHERE (u.estado = 'validado' OR e.nombre LIKE 'Prueba %')
         ORDER BY e.prioridad ASC, g.nombre, e.nombre`
    );
    return students;
  }

  // Obtener estudiantes por estado con prioridades ordenadas
  static async findByStatus(status) {
    const students = await database.query(
      `SELECT e.*, u.email, u.matricula, u.estado, u.fecha_registro,
              g.nombre as grado, g.jornada,
              a.nombre as acudiente_nombre, a.apellidos as acudiente_apellidos,
              a.telefono as acudiente_telefono, a.email as acudiente_email,
              CASE 
                WHEN e.prioridad = 1 THEN '🌟 Prioridad Máxima'
                WHEN e.prioridad = 2 THEN '🥈 Prioridad Alta'
                WHEN e.prioridad = 3 THEN '🥉 Prioridad Media'
                WHEN e.prioridad = 4 THEN '📋 Prioridad Baja'
                ELSE '📝 Prioridad Mínima'
              END as prioridad_texto,
              CASE 
                WHEN e.grupo_etnico = 'indigena' THEN '🏆 Indígena'
                WHEN e.grupo_etnico = 'afrodescendiente' THEN 'Afrodescendiente'
                WHEN e.grupo_etnico = 'rom' THEN 'Rom (Gitano)'
                WHEN e.grupo_etnico = 'raizal' THEN 'Raizal'
                WHEN e.grupo_etnico = 'palenquero' THEN 'Palenquero'
                ELSE e.grupo_etnico
              END as grupo_etnico_texto
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       LEFT JOIN acudientes a ON e.id = a.estudiante_id
       WHERE u.estado = ?
       ORDER BY e.prioridad ASC, e.estrato ASC, u.fecha_registro ASC`,
      [status]
    );
    return students;
  }

  // Buscar estudiantes por grado
  static async findByGrade(grado) {
    const students = await database.query(
      `SELECT e.*, u.email, u.matricula, u.estado, g.nombre as grado, g.jornada
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       INNER JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE g.nombre = ? AND u.estado = 'validado'
       ORDER BY e.nombre`,
      [grado]
    );
    return students;
  }

  // Buscar estudiantes por jornada
  static async findBySchedule(jornada) {
    const students = await database.query(
      `SELECT e.*, u.email, u.matricula, u.estado, g.nombre as grado, g.jornada
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       INNER JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE g.jornada = ? AND u.estado = 'validado'
       ORDER BY g.nombre, e.nombre`,
      [jornada]
    );
    return students;
  }

  // Obtener estadísticas de prioridades
  static async getPriorityStats() {
    const stats = await database.query(
      `SELECT 
        e.prioridad,
        COUNT(*) as total_estudiantes,
        COUNT(CASE WHEN u.estado = 'validado' THEN 1 END) as validados,
        COUNT(CASE WHEN u.estado = 'pendiente' THEN 1 END) as pendientes,
        GROUP_CONCAT(DISTINCT e.grupo_etnico) as grupos_etnicos,
        GROUP_CONCAT(DISTINCT g.nombre) as grados,
        CASE 
          WHEN e.prioridad = 1 THEN '🌟 Prioridad Máxima'
          WHEN e.prioridad = 2 THEN '🥈 Prioridad Alta'
          WHEN e.prioridad = 3 THEN '🥉 Prioridad Media'
          WHEN e.prioridad = 4 THEN '📋 Prioridad Baja'
          ELSE '📝 Prioridad Mínima'
        END as prioridad_texto
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       GROUP BY e.prioridad
       ORDER BY e.prioridad ASC`
    );
    return stats;
  }

  // Actualizar información del estudiante
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    // Campos permitidos para actualizar
    const allowedFields = ['nombre', 'apellidos', 'telefono', 'grupo_academico_id', 'foto_perfil', 'estrato', 'fecha_nacimiento'];

    for (const [key, value] of Object.entries(updateData)) {
      // Incluir el campo si está en allowedFields y no es undefined
      // Permitir null y cadenas vacías para campos opcionales
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        // Convertir cadenas vacías a NULL para campos numéricos o de fecha
        if (['estrato', 'fecha_nacimiento'].includes(key) && value === '') {
          values.push(null);
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    values.push(id);

    console.log('[Student.update] SQL:', `UPDATE estudiantes SET ${fields.join(', ')} WHERE id = ?`);
    console.log('[Student.update] Values:', values);

    await database.query(
      `UPDATE estudiantes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await Student.findById(id);
  }

  static async upsertGuardian(studentId, guardianData) {
    if (!guardianData) {
      return null;
    }

    const sanitized = {
      nombre: guardianData.nombre ? guardianData.nombre.trim() : '',
      apellidos: guardianData.apellidos ? guardianData.apellidos.trim() : '',
      cedula: guardianData.cedula ? guardianData.cedula.trim() : '',
      telefono: guardianData.telefono ? guardianData.telefono.trim() : '',
      email: guardianData.email ? guardianData.email.trim() : ''
    };

    const requiredFields = ['nombre', 'apellidos', 'cedula', 'telefono', 'email'];
    for (const field of requiredFields) {
      if (!sanitized[field]) {
        throw new Error(`Campo de acudiente faltante o inválido: ${field}`);
      }
    }

    const existing = await database.query(
      'SELECT id FROM acudientes WHERE estudiante_id = ? LIMIT 1',
      [studentId]
    );

    if (existing.length > 0) {
      await database.query(
        `UPDATE acudientes
            SET nombre = ?, apellidos = ?, cedula = ?, telefono = ?, email = ?
          WHERE estudiante_id = ?`,
        [sanitized.nombre, sanitized.apellidos, sanitized.cedula, sanitized.telefono, sanitized.email, studentId]
      );
      return { id: existing[0].id, ...sanitized };
    }

    const result = await database.query(
      `INSERT INTO acudientes (estudiante_id, nombre, apellidos, cedula, telefono, email)
       VALUES (?, ?, ?, ?, ?, ?)`
      , [studentId, sanitized.nombre, sanitized.apellidos, sanitized.cedula, sanitized.telefono, sanitized.email]
    );

    return { id: result.insertId, ...sanitized };
  }

  // Actualizar foto de perfil
  static async updateProfilePhoto(id, photoPath) {
    await database.query(
      'UPDATE estudiantes SET foto_perfil = ? WHERE id = ?',
      [photoPath, id]
    );
  }

  // Incrementar faltas consecutivas
  static async incrementConsecutiveAbsences(id) {
    await database.query(
      'UPDATE estudiantes SET faltas_consecutivas = faltas_consecutivas + 1 WHERE id = ?',
      [id]
    );
  }

  // Resetear faltas consecutivas
  static async resetConsecutiveAbsences(id) {
    await database.query(
      'UPDATE estudiantes SET faltas_consecutivas = 0 WHERE id = ?',
      [id]
    );
  }

  static async setConsecutiveAbsences(id, value) {
    await database.query(
      'UPDATE estudiantes SET faltas_consecutivas = ? WHERE id = ?',
      [value, id]
    );
  }

  static async getMaxConsecutiveAbsences() {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const now = Date.now();

    if (
      Student.maxConsecutiveAbsencesCache !== null &&
      Student.maxConsecutiveAbsencesFetchedAt &&
      now - Student.maxConsecutiveAbsencesFetchedAt < FIVE_MINUTES
    ) {
      return Student.maxConsecutiveAbsencesCache;
    }

    const result = await database.query(
      "SELECT valor FROM configuraciones WHERE clave = 'max_faltas_consecutivas' LIMIT 1"
    );

    const value = parseInt(result?.[0]?.valor, 10);
    Student.maxConsecutiveAbsencesCache = Number.isNaN(value) ? 4 : value;
    Student.maxConsecutiveAbsencesFetchedAt = now;

    return Student.maxConsecutiveAbsencesCache;
  }

  // Obtener estudiantes con muchas faltas consecutivas
  static async findWithExcessiveAbsences(limit = 4) {
    const students = await database.query(
      `SELECT e.*, u.email, u.matricula,
              a.nombre as acudiente_nombre, a.email as acudiente_email, a.telefono as acudiente_telefono
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN acudientes a ON e.id = a.estudiante_id
       WHERE e.faltas_consecutivas >= ? AND u.estado = 'validado'
       ORDER BY e.faltas_consecutivas DESC`,
      [limit]
    );
    return students;
  }

  // Eliminar estudiante
  static async delete(id) {
    // También eliminará automáticamente de usuarios por CASCADE
    await database.query('DELETE FROM estudiantes WHERE id = ?', [id]);
  }

  // Buscar estudiantes por nombre (para búsqueda manual)
  static async searchByName(searchTerm) {
    const students = await database.query(
      `SELECT e.id, e.nombre, e.apellidos, g.nombre as grado, g.jornada, e.foto_perfil, e.codigo_qr,
              u.matricula
       FROM estudiantes e
       JOIN usuarios u ON e.usuario_id = u.id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE (e.nombre LIKE ? OR e.apellidos LIKE ? OR u.matricula LIKE ?) 
             AND (u.estado = 'validado' OR e.nombre LIKE 'Prueba %')
       ORDER BY e.nombre, e.apellidos
       LIMIT 20`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return students;
  }

  // Obtener estadísticas de estudiantes
  static async getStatistics() {
    const stats = await database.query(`
      SELECT 
        COUNT(*) as total_estudiantes,
        SUM(CASE WHEN u.estado = 'validado' THEN 1 ELSE 0 END) as validados,
        SUM(CASE WHEN u.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN u.estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados,
        SUM(CASE WHEN e.faltas_consecutivas >= 4 THEN 1 ELSE 0 END) as con_exceso_faltas
      FROM estudiantes e
      JOIN usuarios u ON e.usuario_id = u.id
    `);

    return stats[0];
  }
}

module.exports = Student;
