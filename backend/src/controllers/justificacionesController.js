const database = require('../config/database');

const justificacionesController = {
  // Obtener todas las justificaciones
  getAll: async (req, res) => {
    try {
      const { estado } = req.query;

      let query = `
        SELECT 
          j.*,
          e.nombre as estudiante_nombre,
          e.apellidos as estudiante_apellidos,
          e.matricula as estudiante_matricula,
          g.nombre as grado,
          g.jornada,
          e.foto_perfil as estudiante_foto_perfil,
          u.email as revisor_email,
          u.rol as revisor_rol
        FROM justificaciones j
        LEFT JOIN estudiantes e ON j.estudiante_id = e.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN usuarios u ON j.revisado_por = u.id
      `;

      if (estado) {
        query += ` WHERE j.estado = '${estado}'`;
      }

      query += ` ORDER BY j.fecha_solicitud DESC`;

      const results = await database.query(query);

      res.success(results, 'Justificaciones obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener justificaciones:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Obtener justificaciones pendientes
  getPendientes: async (req, res) => {
    try {
      const query = `
        SELECT 
          j.*,
          e.nombre as estudiante_nombre,
          e.apellidos as estudiante_apellidos,
          e.matricula as estudiante_matricula,
          g.nombre as grado,
          g.jornada,
          e.foto_perfil as estudiante_foto_perfil
        FROM justificaciones j
        LEFT JOIN estudiantes e ON j.estudiante_id = e.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE j.estado = 'pendiente'
        ORDER BY j.fecha_solicitud ASC
      `;

      const results = await database.query(query);

      res.success(results, 'Justificaciones pendientes obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener justificaciones pendientes:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Obtener justificaciones aprobadas
  getAprobadas: async (req, res) => {
    try {
      const query = `
        SELECT 
          j.*,
          e.nombre as estudiante_nombre,
          e.apellidos as estudiante_apellidos,
          e.matricula as estudiante_matricula,
          g.nombre as grado,
          g.jornada,
          e.foto_perfil as estudiante_foto_perfil,
          u.email as revisor_email,
          u.rol as revisor_rol
        FROM justificaciones j
        LEFT JOIN estudiantes e ON j.estudiante_id = e.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN usuarios u ON j.revisado_por = u.id
        WHERE j.estado = 'aprobada'
        ORDER BY j.fecha_revision DESC
      `;

      const results = await database.query(query);

      res.success(results, 'Justificaciones aprobadas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener justificaciones aprobadas:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Obtener justificaciones rechazadas
  getRechazadas: async (req, res) => {
    try {
      const query = `
        SELECT 
          j.*,
          e.nombre as estudiante_nombre,
          e.apellidos as estudiante_apellidos,
          e.matricula as estudiante_matricula,
          g.nombre as grado,
          g.jornada,
          e.foto_perfil as estudiante_foto_perfil,
          u.email as revisor_email,
          u.rol as revisor_rol
        FROM justificaciones j
        LEFT JOIN estudiantes e ON j.estudiante_id = e.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        LEFT JOIN usuarios u ON j.revisado_por = u.id
        WHERE j.estado = 'rechazada'
        ORDER BY j.fecha_revision DESC
      `;

      const results = await database.query(query);

      res.success(results, 'Justificaciones rechazadas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener justificaciones rechazadas:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Aprobar justificación
  aprobar: async (req, res) => {
    try {
      console.log('🟢 Iniciando aprobación de justificación:', {
        id: req.params.id,
        user: req.user?.id,
        userRole: req.user?.rol,
        body: req.body
      });

      const { id } = req.params;
      const { comentario_secretaria } = req.body;
      const revisado_por = req.user.id; // ID del usuario autenticado

      if (!revisado_por) {
        console.error('❌ No se encontró el ID del usuario autenticado');
        return res.error('Usuario no autenticado correctamente', 400);
      }

      console.log('📝 Ejecutando query de aprobación:', {
        justificacionId: id,
        revisadoPor: revisado_por,
        comentario: comentario_secretaria
      });

      const query = `
        UPDATE justificaciones 
        SET estado = 'aprobada', 
            revisado_por = ?, 
            fecha_revision = NOW(),
            comentario_secretaria = ?
        WHERE id = ? AND estado = 'pendiente'
      `;

      const result = await database.query(query, [revisado_por, comentario_secretaria, id]);

      console.log('📊 Resultado de la query:', {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      });

      if (result.affectedRows === 0) {
        console.log('⚠️ Justificación no encontrada o ya procesada');
        return res.error('Justificación no encontrada o ya fue procesada', 404);
      }

      console.log('✅ Justificación aprobada exitosamente');
      res.success(null, 'Justificación aprobada exitosamente');
    } catch (error) {
      console.error('❌ Error al aprobar justificación:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Rechazar justificación
  rechazar: async (req, res) => {
    try {
      console.log('🔴 Iniciando rechazo de justificación:', {
        id: req.params.id,
        user: req.user?.id,
        userRole: req.user?.rol,
        body: req.body
      });

      const { id } = req.params;
      const { comentario_secretaria } = req.body;
      const revisado_por = req.user.id; // ID del usuario autenticado

      if (!revisado_por) {
        console.error('❌ No se encontró el ID del usuario autenticado');
        return res.error('Usuario no autenticado correctamente', 400);
      }

      console.log('📝 Ejecutando query de rechazo:', {
        justificacionId: id,
        revisadoPor: revisado_por,
        comentario: comentario_secretaria
      });

      const query = `
        UPDATE justificaciones 
        SET estado = 'rechazada', 
            revisado_por = ?, 
            fecha_revision = NOW(),
            comentario_secretaria = ?
        WHERE id = ? AND estado = 'pendiente'
      `;

      const result = await database.query(query, [revisado_por, comentario_secretaria, id]);

      console.log('📊 Resultado de la query:', {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      });

      if (result.affectedRows === 0) {
        console.log('⚠️ Justificación no encontrada o ya procesada');
        return res.error('Justificación no encontrada o ya fue procesada', 404);
      }

      console.log('✅ Justificación rechazada exitosamente');
      res.success(null, 'Justificación rechazada exitosamente');
    } catch (error) {
      console.error('❌ Error al rechazar justificación:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Crear nueva justificación
  create: async (req, res) => {
    try {
      const { estudiante_id, fecha_falta, motivo, archivo_adjunto } = req.body;

      const query = `
        INSERT INTO justificaciones (estudiante_id, fecha_falta, motivo, archivo_adjunto)
        VALUES (?, ?, ?, ?)
      `;

      const result = await database.query(query, [estudiante_id, fecha_falta, motivo, archivo_adjunto]);

      res.success({ id: result.insertId }, 'Justificación creada exitosamente', 201);
    } catch (error) {
      console.error('Error al crear justificación:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Obtener justificaciones del estudiante actual (MIS justificaciones)
  getMisJustificaciones: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('🔍 [getMisJustificaciones] Usuario ID:', userId);

      // Primero obtener el estudiante_id del usuario
      const estudiante = await database.query(
        'SELECT id FROM estudiantes WHERE usuario_id = ?',
        [userId]
      );

      if (!estudiante || estudiante.length === 0) {
        return res.error('No se encontró perfil de estudiante para este usuario', 404);
      }

      const estudianteId = estudiante[0].id;
      console.log('🔍 [getMisJustificaciones] Estudiante ID:', estudianteId);

      // Obtener todas las justificaciones del estudiante
      const query = `
        SELECT 
          j.*,
          u.email as revisor_email,
          u.rol as revisor_rol
        FROM justificaciones j
        LEFT JOIN usuarios u ON j.revisado_por = u.id
        WHERE j.estudiante_id = ?
        ORDER BY j.fecha_solicitud DESC
      `;

      const justificaciones = await database.query(query, [estudianteId]);

      console.log('✅ [getMisJustificaciones] Justificaciones encontradas:', justificaciones.length);

      res.success(justificaciones, 'Justificaciones obtenidas exitosamente');
    } catch (error) {
      console.error('❌ Error al obtener mis justificaciones:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  }
};

module.exports = justificacionesController;
