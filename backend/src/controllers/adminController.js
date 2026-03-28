const database = require('../config/database');
const { sendSuccess, sendError } = require('../middleware/standardResponse');

class AdminController {
  // ========== DASHBOARD STATS ==========

  // Obtener estadísticas principales para el dashboard
  static async getDashboardStats(req, res) {
    try {
      console.log('📊 Obteniendo estadísticas del dashboard para admin...');

      // Consultas individuales con manejo de errores para evitar que un fallo en una bloquee todo
      let totalUsuarios = { total: 0 };
      let estudiantesActivos = { total: 0 };
      let justificacionesPendientes = { total: 0 };
      let reportesGenerados = { total: 0 };

      try {
        const [resUsers] = await database.query('SELECT COUNT(*) as total FROM usuarios');
        totalUsuarios = resUsers || totalUsuarios;
      } catch (e) { console.warn('⚠️ Error al contar usuarios:', e.message); }

      try {
        // Estudiantes validados solamente
        const [resActivos] = await database.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "estudiante" AND estado = "validado"');
        estudiantesActivos = resActivos || estudiantesActivos;
      } catch (e) { console.warn('⚠️ Error al contar estudiantes activos:', e.message); }

      try {
        const [resJust] = await database.query('SELECT COUNT(*) as total FROM justificaciones WHERE estado = "pendiente"');
        justificacionesPendientes = resJust || justificacionesPendientes;
      } catch (e) { console.warn('⚠️ Error al contar justificaciones:', e.message); }

      try {
        // Esta tabla podría no existir o tener nombre diferente
        const [resAud] = await database.query('SELECT COUNT(*) as total FROM auditoria WHERE descripcion LIKE "%reporte%" AND DATE(fecha_accion) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
        reportesGenerados = resAud || reportesGenerados;
      } catch (e) {
        console.warn('⚠️ Error al consultar auditoría (posible tabla inexistente):', e.message);
        // Fallback: usar una métrica alternativa si auditoría falla
        reportesGenerados = { total: 0 };
      }

      console.log('✅ Estadísticas obtenidas correctamente');
      return sendSuccess(res, {
        totalUsuarios: totalUsuarios?.total || 0,
        estudiantesActivos: estudiantesActivos?.total || 0,
        justificacionesPendientes: justificacionesPendientes?.total || 0,
        reportesGenerados: reportesGenerados?.total || 0
      });
    } catch (error) {
      console.error('❌ Error crítico en dashboard stats:', error);
      // Devolver valores por defecto en lugar de error 500 para mantener la UI funcional
      return sendSuccess(res, {
        totalUsuarios: 0,
        estudiantesActivos: 0,
        justificacionesPendientes: 0,
        reportesGenerados: 0
      }, 'Estadísticas obtenidas con errores parciales');
    }
  }

  // NUEVO: Obtener estadísticas de asistencia de hoy para gráficas
  static async getAttendanceToday(req, res) {
    try {
      const stats = await database.query(`
        SELECT 
          g.jornada,
          COUNT(a.id) as total
        FROM asistencias a
        JOIN estudiantes e ON a.estudiante_id = e.id
        LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
        WHERE DATE(a.fecha) = CURDATE()
          AND a.validado = 1
          AND a.rechazado = 0
        GROUP BY g.jornada
      `);

      return sendSuccess(res, stats);
    } catch (error) {
      console.error('⚠️ Error attendance today (intentando sin jornada/tipo):', error.message);
      // Fallback simplificado si el join falla por alguna razón
      try {
        const fallStats = await database.query('SELECT COUNT(*) as total FROM asistencias WHERE DATE(fecha) = CURDATE()');
        return sendSuccess(res, [{ jornada: 'General', total: fallStats[0]?.total || 0, regulares: fallStats[0]?.total || 0, suplentes: 0 }]);
      } catch (e) {
        return sendSuccess(res, [], 'No se pudieron obtener estadísticas de asistencia');
      }
    }
  }



  // ========== SISTEMA Y MANTENIMIENTO ==========

  // Exportar configuración de la base de datos (seguro)
  static async exportDatabaseConfig(req, res) {
    try {
      const config = {
        dbName: process.env.DB_NAME || 'restaurante_escolar',
        host: process.env.DB_HOST || 'localhost',
        tables: [
          'usuarios', 'estudiantes', 'asistencias', 'justificaciones',
          'sesiones_trabajo', 'configuracion_institucion', 'acudientes', 'auditoria'
        ]
      };
      return sendSuccess(res, config);
    } catch (error) {
      return sendError(res, 'Error exportando config', 500);
    }
  }

  // Limpiar logs de auditoría antiguos (> 90 días)
  static async cleanupAuditoria(req, res) {
    try {
      await database.query('DELETE FROM auditoria WHERE fecha_accion < DATE_SUB(CURDATE(), INTERVAL 90 DAY)');
      return sendSuccess(res, null, 'Auditoría purgada correctamente');
    } catch (error) {
      return sendError(res, 'Error al limpiar auditoría', 500);
    }
  }
}

module.exports = AdminController;
