const database = require('../config/database');
const { mapToDatabase, mapArrayToFrontend } = require('../utils/jornadaMapper');
const { getStudentStatistics } = require('../services/reporting/StudentStatsService');

const estudiantesController = {
  // Obtener estadísticas
  getStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN u.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN u.estado = 'validado' THEN 1 ELSE 0 END) as validados,
          SUM(CASE WHEN u.estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados,
          SUM(CASE WHEN e.codigo_qr IS NOT NULL AND e.codigo_qr != '' THEN 1 ELSE 0 END) as con_qr,
          SUM(CASE WHEN (e.codigo_qr IS NULL OR e.codigo_qr = '') THEN 1 ELSE 0 END) as sin_qr
        FROM estudiantes e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
      `;
      const stats = await database.query(query);
      res.json({
        status: 'SUCCESS',
        message: 'Estadísticas obtenidas exitosamente',
        data: stats[0]
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Crear nuevo estudiante
  create: async (req, res) => {
    try {
      const {
        usuario_id,
        nombre,
        apellidos,
        grupo_academico_id,
        codigo_qr,
        estrato,
        grupo_etnico,
        es_desplazado,
        fecha_nacimiento,
        telefono,
        acudiente_nombre,
        acudiente_apellidos,
        acudiente_cedula,
        acudiente_telefono,
        acudiente_email
      } = req.body;

      // Insertar estudiante
      const estudianteQuery = `
        INSERT INTO estudiantes (
          usuario_id, nombre, apellidos, grupo_academico_id, codigo_qr, estrato, 
          grupo_etnico, es_desplazado, fecha_nacimiento, telefono
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const estudianteValues = [
        usuario_id || null,
        nombre || '',
        apellidos || '',
        grupo_academico_id || null,
        codigo_qr || '',
        estrato ? parseInt(estrato) : 1,
        grupo_etnico || 'ninguno',
        es_desplazado || false,
        fecha_nacimiento || null,
        telefono || null
      ];

      const estudianteResult = await database.query(estudianteQuery, estudianteValues);
      const estudianteId = estudianteResult.insertId;

      // Insertar acudiente si se proporciona
      if (acudiente_nombre && acudiente_apellidos) {
        const acudienteQuery = `
          INSERT INTO acudientes (
            estudiante_id, nombre, apellidos, cedula, telefono, email
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const acudienteValues = [
          estudianteId,
          acudiente_nombre,
          acudiente_apellidos,
          acudiente_cedula || '',
          acudiente_telefono || '',
          acudiente_email || ''
        ];
        await database.query(acudienteQuery, acudienteValues);
      }

      res.status(201).json({
        status: 'SUCCESS',
        message: 'Estudiante creado exitosamente',
        data: { id: estudianteId }
      });
    } catch (error) {
      console.error('Error al crear estudiante:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener todos los estudiantes
  getAll: async (req, res) => {
    try {
      // Extraer parámetros de filtro de la query
      const {
        jornada,
        grado,
        grupo_academico_id,
        estrato,
        grupo_etnico,
        es_desplazado,
        ordenar_por_prioridad = 'false'
      } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Construir condiciones WHERE dinámicamente
      if (jornada) {
        whereConditions.push('g.jornada = ?');
        queryParams.push(jornada);
      }
      if (grado) {
        whereConditions.push('g.nombre = ?');
        queryParams.push(grado);
      }
      if (grupo_academico_id) {
        whereConditions.push('e.grupo_academico_id = ?');
        queryParams.push(grupo_academico_id);
      }
      if (estrato) {
        whereConditions.push('e.estrato = ?');
        queryParams.push(parseInt(estrato));
      }
      if (grupo_etnico) {
        whereConditions.push('e.grupo_etnico = ?');
        queryParams.push(grupo_etnico);
      }
      if (es_desplazado !== undefined) {
        whereConditions.push('e.es_desplazado = ?');
        queryParams.push(es_desplazado === 'true' ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 ?
        'WHERE ' + whereConditions.join(' AND ') : '';

      // Configurar ordenamiento por prioridad
      let orderClause = 'ORDER BY e.apellidos, e.nombre';
      if (ordenar_por_prioridad === 'true') {
        orderClause = `ORDER BY 
          e.es_desplazado DESC,
          CASE e.grupo_etnico
            WHEN 'indigena' THEN 1
            WHEN 'afrodescendiente' THEN 2
            WHEN 'rom' THEN 3
            WHEN 'raizal' THEN 4
            WHEN 'palenquero' THEN 5
            ELSE 6
          END,
          e.estrato ASC,
          DATE(NOW()) - e.fecha_nacimiento DESC,
          e.apellidos, e.nombre`;
      }

      const query = `
        SELECT e.*, 
               g.nombre AS grado,
               g.jornada,
               IFNULL(u.email, '') AS email, 
               IFNULL(u.estado, '') AS estado,
               IFNULL(a.nombre, '') AS acudiente_nombre,
               IFNULL(a.apellidos, '') AS acudiente_apellidos,
               IFNULL(a.cedula, '') AS acudiente_cedula,
               IFNULL(a.telefono, '') AS acudiente_telefono,
               IFNULL(a.email, '') AS acudiente_email
        FROM estudiantes e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN acudientes a ON e.id = a.estudiante_id
        ${whereClause}
        ${orderClause}
      `;

      const students = await database.query(query, queryParams);

      // Mapear la jornada de la base de datos (mal codificada) al frontend (correcta)
      const mappedStudents = mapArrayToFrontend(students);

      res.json({
        status: 'SUCCESS',
        message: 'Estudiantes obtenidos exitosamente',
        data: mappedStudents,
        filters_applied: {
          jornada,
          grado,
          estrato,
          grupo_etnico,
          es_desplazado,
          ordenar_por_prioridad
        }
      });
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estudiante por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT e.*, 
               g.nombre AS grado,
               g.jornada,
               IFNULL(u.email, '') AS email, 
               IFNULL(u.estado, '') AS estado,
               IFNULL(a.nombre, '') AS acudiente_nombre,
               IFNULL(a.apellidos, '') AS acudiente_apellidos,
               IFNULL(a.cedula, '') AS acudiente_cedula,
               IFNULL(a.telefono, '') AS acudiente_telefono,
               IFNULL(a.email, '') AS acudiente_email
        FROM estudiantes e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN acudientes a ON e.id = a.estudiante_id
        WHERE e.id = ?
      `;
      const students = await database.query(query, [id]);

      if (students.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      res.json({
        status: 'SUCCESS',
        message: 'Estudiante obtenido exitosamente',
        data: students[0]
      });
    } catch (error) {
      console.error('Error al obtener estudiante:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Actualizar estudiante
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        apellidos,
        grupo_academico_id,
        codigo_qr,
        estrato,
        grupo_etnico,
        es_desplazado,
        fecha_nacimiento,
        telefono,
        acudiente_nombre,
        acudiente_apellidos,
        acudiente_cedula,
        acudiente_telefono,
        acudiente_email
      } = req.body;

      // Convertir undefined a null para evitar errores de MySQL
      const sanitizeValue = (value) => value === undefined ? null : value;

      // Actualizar datos del estudiante
      const estudianteQuery = `
        UPDATE estudiantes 
        SET nombre = ?, apellidos = ?, grupo_academico_id = ?, codigo_qr = ?, 
            estrato = ?, grupo_etnico = ?, es_desplazado = ?,
            fecha_nacimiento = ?, telefono = ?
        WHERE id = ?
      `;
      const estudianteValues = [
        sanitizeValue(nombre),
        sanitizeValue(apellidos),
        sanitizeValue(grupo_academico_id),
        sanitizeValue(codigo_qr),
        estrato ? parseInt(estrato) : null,
        sanitizeValue(grupo_etnico),
        es_desplazado !== undefined ? Boolean(es_desplazado) : null,
        sanitizeValue(fecha_nacimiento),
        sanitizeValue(telefono),
        id
      ];

      await database.query(estudianteQuery, estudianteValues);

      // Actualizar o insertar acudiente
      if (acudiente_nombre && acudiente_apellidos) {
        // Verificar si ya existe un acudiente
        const checkAcudiente = await database.query(
          'SELECT id FROM acudientes WHERE estudiante_id = ?',
          [id]
        );

        if (checkAcudiente.length > 0) {
          // Actualizar acudiente existente
          const updateAcudienteQuery = `
            UPDATE acudientes 
            SET nombre = ?, apellidos = ?, cedula = ?, telefono = ?, email = ?
            WHERE estudiante_id = ?
          `;
          await database.query(updateAcudienteQuery, [
            sanitizeValue(acudiente_nombre),
            sanitizeValue(acudiente_apellidos),
            sanitizeValue(acudiente_cedula) || '',
            sanitizeValue(acudiente_telefono) || '',
            sanitizeValue(acudiente_email) || '',
            id
          ]);
        } else {
          // Insertar nuevo acudiente
          const insertAcudienteQuery = `
            INSERT INTO acudientes (estudiante_id, nombre, apellidos, cedula, telefono, email)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          await database.query(insertAcudienteQuery, [
            id,
            sanitizeValue(acudiente_nombre),
            sanitizeValue(acudiente_apellidos),
            sanitizeValue(acudiente_cedula) || '',
            sanitizeValue(acudiente_telefono) || '',
            sanitizeValue(acudiente_email) || ''
          ]);
        }
      }

      res.json({
        status: 'SUCCESS',
        message: 'Estudiante actualizado exitosamente',
        data: { id }
      });
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Cambiar estado del estudiante (validar/rechazar)
  changeStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      // Verificar que el estudiante existe
      const estudiante = await database.query(
        'SELECT usuario_id FROM estudiantes WHERE id = ?',
        [id]
      );

      if (estudiante.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      // Actualizar estado en la tabla usuarios
      await database.query(
        'UPDATE usuarios SET estado = ? WHERE id = ?',
        [estado, estudiante[0].usuario_id]
      );

      // Si se valida al estudiante, generar código QR automáticamente
      if (estado === 'validado') {
        const codigoQR = `QR_EST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await database.query(
          'UPDATE estudiantes SET codigo_qr = ? WHERE id = ?',
          [codigoQR, id]
        );
      }

      res.json({
        status: 'SUCCESS',
        message: `Estudiante ${estado} exitosamente`,
        data: { id, estado }
      });
    } catch (error) {
      console.error('Error al cambiar estado del estudiante:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Eliminar estudiante
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Eliminar acudiente primero (si existe)
      await database.query('DELETE FROM acudientes WHERE estudiante_id = ?', [id]);

      // Eliminar estudiante
      await database.query('DELETE FROM estudiantes WHERE id = ?', [id]);

      res.json({
        status: 'SUCCESS',
        message: 'Estudiante eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Buscar estudiante por código QR
  getByCodigoQR: async (req, res) => {
    try {
      const { codigo } = req.params;
      const query = `
        SELECT e.*, 
               IFNULL(u.email, '') AS email, 
               IFNULL(u.estado, '') AS estado
        FROM estudiantes e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
        WHERE e.codigo_qr = ?
      `;
      const students = await database.query(query, [codigo]);

      if (students.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado con ese código QR'
        });
      }

      res.json({
        status: 'SUCCESS',
        message: 'Estudiante encontrado',
        data: students[0]
      });
    } catch (error) {
      console.error('Error al buscar estudiante por código QR:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Generar código QR para estudiante
  generateQRCode: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el estudiante existe
      const estudiante = await database.query(
        'SELECT id FROM estudiantes WHERE id = ?',
        [id]
      );

      if (estudiante.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Estudiante no encontrado'
        });
      }

      // Generar código QR único
      const codigoQR = `QR_EST_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Actualizar estudiante con el nuevo código QR
      await database.query(
        'UPDATE estudiantes SET codigo_qr = ? WHERE id = ?',
        [codigoQR, id]
      );

      res.json({
        status: 'SUCCESS',
        message: 'Código QR generado exitosamente',
        data: { id, codigo_qr: codigoQR }
      });
    } catch (error) {
      console.error('Error al generar código QR:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estudiantes con estadísticas de asistencia
  getEstudiantesConEstadisticas: async (req, res) => {
    try {
      const stats = await getStudentStatistics();
      const mappedEstudiantes = mapArrayToFrontend(stats);

      res.json({
        status: 'SUCCESS',
        message: 'Estudiantes con estadísticas obtenidos exitosamente',
        data: mappedEstudiantes
      });
    } catch (error) {
      console.error('Error al obtener estudiantes con estadísticas:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener todos los estudiantes para el historial completo
  getAllEstudiantesParaHistorial: async (req, res) => {
    try {
      const estudiantes = await database.query(`
        SELECT 
          e.id,
          e.nombre,
          e.apellidos,
          g.nombre AS grado,
          g.jornada,
          e.foto_perfil,
          u.matricula,
          u.email,
          COUNT(a.id) as total_asistencias
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN asistencias a ON e.id = a.estudiante_id AND a.validado = 1
        WHERE u.estado = 'validado'
        GROUP BY e.id, e.nombre, e.apellidos, g.nombre, g.jornada, e.foto_perfil, u.matricula, u.email
        ORDER BY e.apellidos, e.nombre
      `);

      res.json({
        status: 'SUCCESS',
        data: estudiantes
      });
    } catch (error) {
      console.error('Error al obtener estudiantes para historial:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Método para filtros específicos de prioridad
  getPrioritarios: async (req, res) => {
    try {
      const query = `
      SELECT e.*, 
             IFNULL(u.email, '') AS email, 
             IFNULL(u.estado, '') AS estado,
             IFNULL(a.nombre, '') AS acudiente_nombre,
             IFNULL(a.apellidos, '') AS acudiente_apellidos,
             IFNULL(a.cedula, '') AS acudiente_cedula,
             IFNULL(a.telefono, '') AS acudiente_telefono,
             IFNULL(a.email, '') AS acudiente_email,
             CASE 
               WHEN e.es_desplazado = 1 THEN 'Desplazado'
               WHEN e.grupo_etnico != 'ninguno' THEN CONCAT('Étnico: ', e.grupo_etnico)
               WHEN e.estrato <= 2 THEN CONCAT('Estrato ', e.estrato)
               ELSE 'Regular'
             END as tipo_prioridad
      FROM estudiantes e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
      LEFT JOIN acudientes a ON e.id = a.estudiante_id
      WHERE e.es_desplazado = 1 
         OR e.grupo_etnico != 'ninguno' 
         OR e.estrato <= 2
      ORDER BY 
        e.prioridad ASC,
        e.apellidos, e.nombre
    `;

      const students = await database.query(query);
      res.json({
        status: 'SUCCESS',
        message: 'Estudiantes prioritarios obtenidos exitosamente',
        data: students
      });
    } catch (error) {
      console.error('Error al obtener estudiantes prioritarios:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estudiantes con filtros de prioridad
  getStudentsWithPriority: async (req, res) => {
    try {
      const { jornada, limit = 50 } = req.query;

      let whereConditions = [];
      let params = [];

      // Filtro por jornada si se especifica
      if (jornada) {
        whereConditions.push('g.jornada = ?');
        params.push(jornada);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query con orden de prioridad según especificaciones
      const query = `
        SELECT 
          e.*,
          g.nombre AS grado,
          g.jornada,
          u.email,
          u.matricula
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        ${whereClause}
        ORDER BY 
          e.prioridad ASC,
          e.nombre ASC
        LIMIT ?
      `;

      params.push(parseInt(limit));

      const estudiantes = await database.query(query, params);

      res.json({
        status: 'SUCCESS',
        message: 'Estudiantes obtenidos con filtros de prioridad',
        data: estudiantes,
        metadata: {
          total: estudiantes.length,
          limit: parseInt(limit),
          filters: { jornada }
        }
      });

    } catch (error) {
      console.error('Error obteniendo estudiantes con prioridad:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estadísticas de prioridad
  getPriorityStats: async (req, res) => {
    try {
      const stats = await database.query(`
        SELECT 
          COUNT(*) as total_estudiantes,
          
          -- Estadísticas por jornada
          COUNT(CASE WHEN g.jornada = 'mañana' THEN 1 END) as jornada_manana,
          COUNT(CASE WHEN g.jornada = 'tarde' THEN 1 END) as jornada_tarde,
          COUNT(CASE WHEN g.jornada = 'completa' THEN 1 END) as jornada_completa,
          
          -- Estadísticas por grupo étnico
          COUNT(CASE WHEN e.grupo_etnico = 'indigena' THEN 1 END) as indigenas,
          COUNT(CASE WHEN e.grupo_etnico = 'afrodescendiente' THEN 1 END) as afrodescendientes,
          
          -- Estadísticas por desplazamiento
          COUNT(CASE WHEN e.es_desplazado = 1 THEN 1 END) as desplazados,
          COUNT(CASE WHEN e.es_desplazado = 0 THEN 1 END) as no_desplazados,
          
          -- Estadísticas por estrato
          COUNT(CASE WHEN e.estrato = 1 THEN 1 END) as estrato_1,
          COUNT(CASE WHEN e.estrato = 2 THEN 1 END) as estrato_2,
          COUNT(CASE WHEN e.estrato = 3 THEN 1 END) as estrato_3
          
        FROM estudiantes e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE u.estado = 'validado'
      `);

      res.json({
        status: 'SUCCESS',
        message: 'Estadísticas de prioridad obtenidas',
        data: stats[0]
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de prioridad:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};

module.exports = estudiantesController;
