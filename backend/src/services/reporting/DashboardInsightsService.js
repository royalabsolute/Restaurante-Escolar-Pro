const database = require('../../config/database');
const AttendanceSummaryService = require('./AttendanceSummaryService');
const CustomReportService = require('./CustomReportService');

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split('T')[0];
}

function toMonthKey(dateISO) {
  if (!dateISO) {
    return null;
  }
  const [year, month] = dateISO.split('-');
  if (!year || !month) {
    return null;
  }
  return `${year}-${month}`;
}

function buildColumnDictionary(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [];
  }
  return columns.filter((column) => Boolean(column && column.id && column.label))
    .map((column) => ({
      id: column.id,
      label: column.label,
      type: column.type || 'string'
    }));
}

function makeDefaultColumns() {
  return [
    { id: 'nombre', label: 'Nombre', type: 'string' },
    { id: 'apellidos', label: 'Apellidos', type: 'string' },
    { id: 'grado', label: 'Grado', type: 'string' },
    { id: 'jornada', label: 'Jornada', type: 'string' },
    { id: 'matricula', label: 'Matrícula', type: 'string' },
    { id: 'total_asistencias', label: 'Total Asistencias', type: 'number' },
    { id: 'total_faltas', label: 'Total Faltas', type: 'number' },
    { id: 'faltas_justificadas', label: 'Faltas Justificadas', type: 'number' },
    { id: 'faltas_sin_justificar', label: 'Faltas Sin Justificar', type: 'number' },
    { id: 'faltas_pendientes_revision', label: 'Faltas Pendientes', type: 'number' },
    { id: 'porcentaje_asistencia', label: '% Asistencia', type: 'number' }
  ];
}

class DashboardInsightsService {
  static resolvePeriod(startDate, endDate) {
    const { startISO, endISO } = CustomReportService.resolveDateRange(startDate, endDate);
    return { startISO, endISO };
  }

  static buildFilters(filters = {}) {
    const normalized = {
      grades: Array.isArray(filters.grades) ? filters.grades.filter(Boolean) : [],
      jornadas: Array.isArray(filters.jornadas) ? filters.jornadas.filter(Boolean) : [],
      studentIds: Array.isArray(filters.studentIds) ? filters.studentIds.filter(Boolean) : []
    };
    return normalized;
  }

  static async buildAttendanceSeries({ startISO, endISO }) {
    const trend = await AttendanceSummaryService.getTrendSeries({
      startDate: startISO,
      endDate: endISO
    });

    const series = trend.series.map((item) => ({
      fecha: item.fecha,
      asistencias_estudiantes: item.estudiantes_asistencias || 0,
      faltas_estudiantes: item.estudiantes_faltas || 0,
      asistencias_suplentes: item.suplentes_asistencias || 0,
      faltas_suplentes: item.suplentes_faltas || 0,
      porcentaje_asistencia: item.porcentaje_asistencia_global || 0
    }));

    return {
      metadata: trend.metadata,
      series
    };
  }

  static async getOverview(options = {}) {
    const { startISO, endISO } = this.resolvePeriod(options.startDate, options.endDate);
    const filters = this.buildFilters(options.filters);

    const dataset = await CustomReportService.buildDataset({
      startDate: startISO,
      endDate: endISO,
      grades: filters.grades,
      jornadas: filters.jornadas,
      studentIds: filters.studentIds
    });

    const attendanceSeries = await this.buildAttendanceSeries({ startISO, endISO });

    const suplentesQuery = `
      SELECT 
        COUNT(*) AS total_periodo
      FROM conteo_suplentes_diario
      WHERE fecha BETWEEN ? AND ?
    `;
    const suplenteRows = await database.query(
      suplentesQuery,
      [startISO, endISO]
    );
    const suplentesAsistencias = Number(suplenteRows?.[0]?.total_periodo || 0);

    const cuentasRows = await database.query(
      `SELECT 
        DATE(fecha_registro) AS fecha,
        estado,
        COUNT(*) AS total
       FROM usuarios
       WHERE rol = 'estudiante'
         AND fecha_registro BETWEEN ? AND ?
       GROUP BY DATE(fecha_registro), estado
       ORDER BY fecha`,
      [`${startISO} 00:00:00`, `${endISO} 23:59:59`]
    );

    const cuentasResumen = { aprobadas: 0, rechazadas: 0, pendientes: 0 };
    const cuentasSeries = [];
    const cuentasSeriesIndex = new Map();

    cuentasRows.forEach((row) => {
      const fecha = normalizeDate(row.fecha);
      const estado = row.estado;
      const total = Number(row.total) || 0;

      if (estado === 'validado') {
        cuentasResumen.aprobadas += total;
      } else if (estado === 'rechazado') {
        cuentasResumen.rechazadas += total;
      } else if (estado === 'pendiente') {
        cuentasResumen.pendientes += total;
      }

      if (!cuentasSeriesIndex.has(fecha)) {
        cuentasSeriesIndex.set(fecha, {
          fecha,
          aprobadas: 0,
          rechazadas: 0,
          pendientes: 0
        });
      }
      const record = cuentasSeriesIndex.get(fecha);
      if (estado === 'validado') {
        record.aprobadas += total;
      } else if (estado === 'rechazado') {
        record.rechazadas += total;
      } else if (estado === 'pendiente') {
        record.pendientes += total;
      }
    });

    cuentasSeries.push(...Array.from(cuentasSeriesIndex.values()));

    const totalFaltas = dataset.summary.totalFaltas || 0;
    const faltasJustificadas = dataset.summary.totalFaltasJustificadas || 0;
    const tasaJustificacion = totalFaltas > 0
      ? Number(((faltasJustificadas / totalFaltas) * 100).toFixed(2))
      : 0;

    // Identificar día de mayor demanda (asistencias)
    let diaMaxDemanda = { fecha: 'N/D', asistencias: 0 };
    if (attendanceSeries.series.length > 0) {
      const max = [...attendanceSeries.series].sort((a, b) => b.asistencias_estudiantes - a.asistencias_estudiantes)[0];
      if (max) {
        diaMaxDemanda = { fecha: max.fecha, asistencias: max.asistencias_estudiantes };
      }
    }

    const totalServidos = dataset.summary.totalAsistencias + suplentesAsistencias;
    const proporcionSuplentes = totalServidos > 0
      ? Number(((suplentesAsistencias / totalServidos) * 100).toFixed(2))
      : 0;

    const resumo = {
      totalEstudiantes: dataset.summary.totalEstudiantes,
      totalAsistenciasEstudiantes: dataset.summary.totalAsistencias,
      totalFaltasEstudiantes: dataset.summary.totalFaltas,
      totalFaltasSinJustificar: dataset.summary.totalFaltasSinJustificar,
      totalFaltasPendientes: dataset.summary.totalFaltasPendientes,
      promedioAsistencia: dataset.summary.promedioAsistencia,
      totalAsistenciasSuplentes: suplentesAsistencias,
      cuentasAprobadas: cuentasResumen.aprobadas,
      cuentasRechazadas: cuentasResumen.rechazadas,
      cuentasPendientes: cuentasResumen.pendientes,
      // Nuevas variables
      tasaJustificacion,
      diaMaxDemanda,
      proporcionSuplentes,
      totalPlatosServidos: totalServidos
    };

    return {
      period: {
        inicio: startISO,
        fin: endISO,
        monthKey: toMonthKey(startISO)
      },
      resumen: resumo,
      attendance: attendanceSeries,
      cuentas: {
        resumen: cuentasResumen,
        series: cuentasSeries
      },
      dataset,
      appliedFilters: filters
    };
  }

  static async getGroupBreakdown(options = {}) {
    const { startISO, endISO } = this.resolvePeriod(options.startDate, options.endDate);
    const filters = this.buildFilters(options.filters);

    const dataset = await CustomReportService.buildDataset({
      startDate: startISO,
      endDate: endISO,
      grades: filters.grades,
      jornadas: filters.jornadas,
      studentIds: filters.studentIds
    });

    const grupos = new Map();

    dataset.rows.forEach((row) => {
      const key = `${row.grado || 'Sin Grado'}|${row.jornada || 'Sin Jornada'}`;
      const current = grupos.get(key) || {
        grado: row.grado || 'Sin Grado',
        jornada: row.jornada || 'Sin Jornada',
        estudiantes: [],
        totales: {
          asistencias: 0,
          faltas: 0,
          faltasSinJustificar: 0,
          faltasPendientes: 0,
          promedio: 0
        }
      };

      current.estudiantes.push(row);
      current.totales.asistencias += row.total_asistencias;
      current.totales.faltas += row.total_faltas;
      current.totales.faltasSinJustificar += row.faltas_sin_justificar;
      current.totales.faltasPendientes += row.faltas_pendientes_revision;
      current.totales.promedio += row.porcentaje_asistencia;
      grupos.set(key, current);
    });

    const collection = Array.from(grupos.values()).map((group) => ({
      grado: group.grado,
      jornada: group.jornada,
      estudiantes: group.estudiantes.sort((a, b) => {
        const nombreA = `${a.apellidos} ${a.nombre}`.trim().toLowerCase();
        const nombreB = `${b.apellidos} ${b.nombre}`.trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
      }),
      totales: {
        asistencias: group.totales.asistencias,
        faltas: group.totales.faltas,
        faltasSinJustificar: group.totales.faltasSinJustificar,
        faltasPendientes: group.totales.faltasPendientes,
        promedio: group.estudiantes.length > 0
          ? Number((group.totales.promedio / group.estudiantes.length).toFixed(2))
          : 0
      }
    })).sort((a, b) => {
      const gradoComp = (a.grado || '').localeCompare(b.grado || '', 'es');
      if (gradoComp !== 0) {
        return gradoComp;
      }
      return (a.jornada || '').localeCompare(b.jornada || '', 'es');
    });

    return {
      period: {
        inicio: startISO,
        fin: endISO
      },
      appliedFilters: filters,
      grupos: collection,
      resumen: dataset.summary
    };
  }

  static buildExportColumns(columns) {
    const selected = buildColumnDictionary(columns);
    if (selected.length === 0) {
      return makeDefaultColumns();
    }
    return selected;
  }
}

module.exports = DashboardInsightsService;
