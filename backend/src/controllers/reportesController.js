const database = require('../config/database');
const AttendanceSummaryService = require('../services/reporting/AttendanceSummaryService');
const CustomReportService = require('../services/reporting/CustomReportService');
const DashboardInsightsService = require('../services/reporting/DashboardInsightsService');
const ReportExportService = require('../services/reporting/ReportExportService');
const emailService = require('../utils/emailService');

const reportesController = {
  // Reporte diario de asistencia
  getReporteDiario: async (req, res) => {
    try {
      const { fecha } = req.query;
      const snapshot = await AttendanceSummaryService.getDailySnapshot(fecha);

      res.success(snapshot, 'Reporte diario generado exitosamente');
    } catch (error) {
      console.error('Error al generar reporte diario:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Reporte mensual de asistencia
  getReporteMensual: async (req, res) => {
    try {
      const { mes, año } = req.query;
      const mesConsulta = mes || (new Date().getMonth() + 1);
      const añoConsulta = año || new Date().getFullYear();

      const snapshot = await AttendanceSummaryService.getMonthlySnapshot({
        month: mesConsulta,
        year: añoConsulta
      });

      res.success(snapshot, 'Reporte mensual generado exitosamente');
    } catch (error) {
      console.error('Error al generar reporte mensual:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Estadísticas generales
  getEstadisticas: async (req, res) => {
    try {
      const hoy = await AttendanceSummaryService.getDailySnapshot(new Date());
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 13);
      const tendencias = await AttendanceSummaryService.getTrendSeries({
        startDate: sieteDiasAtras,
        endDate: new Date()
      });

      const docentesRow = await database.query(
        "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'docente'"
      );
      const totalDocentes = docentesRow?.[0]?.total || 0;

      const resumen = {
        total_estudiantes: hoy.estudiantes.total_convocados,
        total_docentes: totalDocentes,
        justificaciones_pendientes: hoy.estudiantes.faltas_pendientes_revision,
        asistencias_hoy: hoy.estudiantes.asistencias
      };

      res.success({
        resumen,
        distribucion_grado: hoy.distribucion_por_grado,
        distribucion_jornada: hoy.distribucion_por_jornada,
        asistencia_ultimos_dias: tendencias.series,
        justificaciones_estado: hoy.justificaciones_detalle
      }, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  // Obtener estadísticas generales para el historial completo
  async getEstadisticasGenerales(req, res) {
    try {
      const hoySnapshot = await AttendanceSummaryService.getDailySnapshot(new Date());

      const now = new Date();
      const mesActual = now.getMonth() + 1;
      const anioActual = now.getFullYear();
      const mensualSnapshot = await AttendanceSummaryService.getMonthlySnapshot({
        month: mesActual,
        year: anioActual
      });

      const estadisticas = {
        totalEstudiantes: hoySnapshot.estudiantes.total_convocados,
        totalSuplentes: hoySnapshot.suplentes.total_convocados,
        totalAsistenciasEstudiantes: mensualSnapshot.resumen.estudiantes.asistencias,
        totalAsistenciasSuplentes: mensualSnapshot.resumen.suplentes.asistencias,
        totalJustificaciones: mensualSnapshot.resumen.justificaciones.aprobadas,
        porcentajeAsistenciaHoy: hoySnapshot.estudiantes.porcentaje_asistencia,
        faltasEstudiantesHoy: hoySnapshot.estudiantes.faltas_confirmadas,
        faltasSuplentesHoy: hoySnapshot.suplentes.faltas_confirmadas,
        justificacionesPendientesHoy: hoySnapshot.estudiantes.faltas_pendientes_revision,
        metadata: {
          corte_diario: hoySnapshot.metadata,
          periodo_mensual: mensualSnapshot.metadata
        }
      };

      res.json({
        status: 'SUCCESS',
        data: estadisticas
      });
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Tendencias para gráficos
  async getTendencias(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const tendencias = await AttendanceSummaryService.getTrendSeries({
        startDate: fechaInicio,
        endDate: fechaFin
      });

      res.success(tendencias.series, 'Tendencias calculadas exitosamente');
    } catch (error) {
      console.error('❌ Error en getTendencias:', error);
      res.error('Error interno del servidor', 500, error.message);
    }
  },

  async getDashboardOverview(req, res) {
    try {
      const payload = req.body || {};
      const overview = await DashboardInsightsService.getOverview(payload);

      res.success(overview, 'Resumen de estadísticas generado correctamente');
    } catch (error) {
      console.error('❌ Error al obtener el resumen del dashboard:', error);
      res.error('No fue posible generar el resumen de estadísticas', 500, error.message);
    }
  },

  async getDashboardGroupBreakdown(req, res) {
    try {
      const payload = req.body || {};
      const groups = await DashboardInsightsService.getGroupBreakdown(payload);

      res.success(groups, 'Detalle por grupos generado correctamente');
    } catch (error) {
      console.error('❌ Error al obtener el detalle por grupos:', error);
      res.error('No fue posible generar el detalle por grupos', 500, error.message);
    }
  },

  async exportDashboardReport(req, res) {
    try {
      const payload = req.body || {};
      const format = (payload.format || 'xlsx').toLowerCase();
      const columns = DashboardInsightsService.buildExportColumns(payload.columns);

      const dataset = await DashboardInsightsService.getGroupBreakdown({
        startDate: payload.startDate,
        endDate: payload.endDate,
        filters: payload.filters
      });

      const rows = dataset.grupos.flatMap((group) => (
        group.estudiantes.map((student) => ({
          grupo_grado: group.grado,
          grupo_jornada: group.jornada,
          ...student
        }))
      ));

      let buffer;
      let mimeType;
      let extension;

      if (format === 'csv') {
        buffer = await ReportExportService.generateCsvBuffer(rows, columns);
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        buffer = await ReportExportService.generateXlsxBuffer(rows, dataset.resumen, dataset.period, columns);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      }

      const filename = payload.filename
        || `informe-estadisticas-${dataset.period.inicio || 'sin-fecha'}-a-${dataset.period.fin || 'sin-fecha'}.${extension}`;

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      return res.send(buffer);
    } catch (error) {
      console.error('❌ Error al exportar el informe del dashboard:', error);
      res.error('No fue posible exportar el informe solicitado', 500, error.message);
    }
  },

  async sendDashboardReport(req, res) {
    try {
      const {
        destinatarios = [],
        asunto,
        mensaje,
        format = 'xlsx',
        columns,
        filtros = {},
        startDate,
        endDate,
        adjuntos = []
      } = req.body || {};

      const correosExtra = Array.isArray(destinatarios)
        ? destinatarios.filter((correo) => typeof correo === 'string' && correo.includes('@'))
        : [];

      const destinatariosFinales = new Set([
        'restaurante@iesanantoniodeprado.edu.co',
        ...correosExtra
      ]);

      if (destinatariosFinales.size === 0) {
        return res.error('Debe proporcionar al menos un destinatario válido', 400);
      }

      const dataset = await DashboardInsightsService.getGroupBreakdown({
        startDate,
        endDate,
        filters: filtros
      });

      const rows = dataset.grupos.flatMap((group) => (
        group.estudiantes.map((student) => ({
          grupo_grado: group.grado,
          grupo_jornada: group.jornada,
          ...student
        }))
      ));

      const exportColumns = DashboardInsightsService.buildExportColumns(columns);

      const lowerFormat = String(format || 'xlsx').toLowerCase();
      const buffer = lowerFormat === 'csv'
        ? await ReportExportService.generateCsvBuffer(rows, exportColumns)
        : await ReportExportService.generateXlsxBuffer(rows, dataset.resumen, dataset.period, exportColumns);

      const extension = lowerFormat === 'csv' ? 'csv' : 'xlsx';
      const mimeType = lowerFormat === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const filenameBase = `informe-estadisticas-${dataset.period.inicio || 'sin-fecha'}-a-${dataset.period.fin || 'sin-fecha'}`;

      const attachments = [
        {
          filename: `${filenameBase}.${extension}`,
          content: buffer,
          contentType: mimeType
        }
      ];

      if (Array.isArray(adjuntos)) {
        adjuntos.forEach((item) => {
          if (!item || !item.filename || !item.contentBase64) {
            return;
          }
          try {
            const content = Buffer.from(item.contentBase64, 'base64');
            attachments.push({
              filename: item.filename,
              content,
              contentType: item.contentType || 'application/octet-stream'
            });
          } catch (parseError) {
            console.warn('⚠️ No se pudo procesar un adjunto base64:', parseError.message);
          }
        });
      }

      const html = await emailService.loadTemplate('informe-estadisticas', {
        nombre_usuario: dataset.metadata.usuario,
        periodo_inicio: dataset.period.inicio || 'N/D',
        periodo_fin: dataset.period.fin || 'N/D',
        total_estudiantes: dataset.resumen.totalEstudiantes,
        total_asistencias: dataset.resumen.totalAsistencias,
        total_faltas: dataset.resumen.totalFaltas,
        promedio_asistencia: dataset.resumen.promedioAsistencia,
        mensaje: mensaje ? `<p>${mensaje}</p>` : '',
        fecha_generacion: new Date().toLocaleString('es-CO')
      });

      const resultado = await emailService.sendEmail({
        to: Array.from(destinatariosFinales).join(','),
        subject: asunto || 'Informe de Estadísticas del Restaurante Escolar',
        html,
        attachments
      });

      if (!resultado.success) {
        return res.error('No fue posible enviar el informe por correo', 500, resultado.error);
      }

      res.success({ previewUrl: resultado.previewUrl || null }, 'Informe enviado correctamente por correo');
    } catch (error) {
      console.error('❌ Error al enviar el informe del dashboard:', error);
      res.error('Ocurrió un inconveniente enviando el informe por correo', 500, error.message);
    }
  },

  async getCustomReportPreview(req, res) {
    try {
      const payload = req.body || {};
      const dataset = await CustomReportService.buildDataset(payload);

      res.success(dataset, 'Reporte personalizado generado correctamente');
    } catch (error) {
      console.error('❌ Error al generar vista previa de reporte personalizado:', error);
      res.error('No fue posible construir el reporte personalizado', 500, error.message);
    }
  },

  async exportCustomReport(req, res) {
    try {
      const payload = req.body || {};
      const format = (payload.format || 'xlsx').toLowerCase();

      const dataset = await CustomReportService.buildDataset(payload);
      const { rows, summary, metadata } = dataset;

      let buffer;
      let mimeType;
      let extension;

      if (format === 'csv') {
        buffer = await ReportExportService.generateCsvBuffer(rows);
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        buffer = await ReportExportService.generateXlsxBuffer(rows, summary, metadata);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      }

      const filename = `reporte-personalizado-${metadata?.periodo?.inicio || 'sin-fecha'}-a-${metadata?.periodo?.fin || 'sin-fecha'}.${extension}`;

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      return res.send(buffer);
    } catch (error) {
      console.error('❌ Error al exportar reporte personalizado:', error);
      res.error('No fue posible exportar el reporte personalizado', 500, error.message);
    }
  },

  async sendCustomReportByEmail(req, res) {
    try {
      const {
        destinatarios = [],
        asunto,
        mensaje,
        format = 'xlsx',
        filtros = {}
      } = req.body || {};

      const correos = Array.isArray(destinatarios)
        ? destinatarios.filter((correo) => typeof correo === 'string' && correo.includes('@'))
        : [];

      if (correos.length === 0) {
        return res.error('Debe especificar al menos un destinatario válido', 400);
      }

      const dataset = await CustomReportService.buildDataset(filtros);
      const { rows, summary, metadata } = dataset;

      const lowerFormat = String(format || 'xlsx').toLowerCase();
      const isCsv = lowerFormat === 'csv';
      const buffer = isCsv
        ? await ReportExportService.generateCsvBuffer(rows)
        : await ReportExportService.generateXlsxBuffer(rows, summary, metadata);

      const extension = isCsv ? 'csv' : 'xlsx';
      const mimeType = isCsv
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const filename = `reporte-personalizado-${metadata?.periodo?.inicio || 'sin-fecha'}-a-${metadata?.periodo?.fin || 'sin-fecha'}.${extension}`;

      const htmlResumen = `
        <p>Hola ${metadata?.usuario},</p>
        <p>Adjunto encontrarás el reporte solicitado.</p>
        <ul>
          <li><strong>Período:</strong> ${metadata?.periodo?.inicio || 'N/D'} al ${metadata?.periodo?.fin || 'N/D'}</li>
          <li><strong>Estudiantes analizados:</strong> ${summary.totalEstudiantes}</li>
          <li><strong>Total asistencias:</strong> ${summary.totalAsistencias}</li>
          <li><strong>Total faltas:</strong> ${summary.totalFaltas}</li>
          <li><strong>Promedio general de asistencia:</strong> ${summary.promedioAsistencia}%</li>
        </ul>
        ${mensaje ? `<p>${mensaje}</p>` : ''}
        <p>Enviado automáticamente por el sistema de reportes del Restaurante Escolar.</p>
      `;

      const emailResponse = await emailService.sendEmail({
        to: correos.join(','),
        subject: asunto || 'Reporte de asistencia',
        html: htmlResumen,
        attachments: [
          {
            filename,
            content: buffer,
            contentType: mimeType
          }
        ]
      });

      if (!emailResponse.success) {
        return res.error('No fue posible enviar el correo con el reporte', 500, emailResponse.error);
      }

      res.success({ previewUrl: emailResponse.previewUrl || null }, 'Reporte personalizado enviado exitosamente por correo');
    } catch (error) {
      console.error('❌ Error al enviar reporte personalizado por correo:', error);
      res.error('Ocurrió un problema al enviar el reporte por correo', 500, error.message);
    }
  },

  async getReportDefaultRecipients(req, res) {
    try {
      const rows = await database.query(
        `SELECT id, nombre, apellidos, email, rol
         FROM usuarios
         WHERE estado = 'validado'
           AND rol IN ('admin', 'secretaria', 'coordinador_convivencia')
           AND email IS NOT NULL
         ORDER BY rol, apellidos, nombre`
      );

      const destinatarios = rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        apellidos: row.apellidos,
        email: row.email,
        rol: row.rol
      }));

      res.success(destinatarios);
    } catch (error) {
      console.error('❌ Error al obtener destinatarios por defecto de reportes:', error);
      res.error('No fue posible recuperar los destinatarios sugeridos', 500, error.message);
    }
  }
};

module.exports = reportesController;
