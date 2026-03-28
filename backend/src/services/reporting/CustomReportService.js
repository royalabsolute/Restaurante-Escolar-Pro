const database = require('../../config/database');
const AttendanceSummaryService = require('./AttendanceSummaryService');
const { isHoliday } = require('../../utils/holidayUtils');

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

function ensureArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function parseISODate(isoString) {
  if (!isoString) {
    return null;
  }
  const [year, month, day] = isoString.split('-').map((segment) => Number.parseInt(segment, 10));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function getWorkingDatesBetween(startISO, endISO) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);

  if (!start || !end || start > end) {
    return [];
  }

  const cursor = new Date(start);
  const items = [];

  while (cursor <= end) {
    if (!isWeekend(cursor) && !isHoliday(toISODateString(cursor))) {
      items.push(toISODateString(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return items;
}

function buildInClause(values, column) {
  const filtered = ensureArray(values);
  if (filtered.length === 0) {
    return { clause: '', params: [] };
  }
  const placeholders = filtered.map(() => '?').join(',');
  return {
    clause: ` AND ${column} IN (${placeholders})`,
    params: filtered
  };
}

function computeEffectiveStart(startISO, ingresoISO) {
  if (!startISO && !ingresoISO) {
    return null;
  }

  if (!startISO) {
    return ingresoISO;
  }

  if (!ingresoISO) {
    return startISO;
  }

  return startISO > ingresoISO ? startISO : ingresoISO;
}

class CustomReportService {
  static resolveDateRange(startDate, endDate) {
    const todayISO = new Date().toISOString().split('T')[0];
    let startISO = normalizeDate(startDate) || todayISO;
    let endISO = normalizeDate(endDate) || todayISO;

    if (startISO > endISO) {
      [startISO, endISO] = [endISO, startISO];
    }

    return { startISO, endISO };
  }

  static buildFiltersMetadata(options, startISO, endISO) {
    return {
      periodo: {
        inicio: startISO,
        fin: endISO
      },
      grados: ensureArray(options.grades),
      jornadas: ensureArray(options.jornadas),
      incluirInactivos: Boolean(options.includeInactive),
      estudiantesFiltrados: ensureArray(options.studentIds)
    };
  }

  static buildAggregations(rows) {
    const aggregate = {
      totalEstudiantes: rows.length,
      totalAsistencias: 0,
      totalFaltas: 0,
      totalFaltasJustificadas: 0,
      totalFaltasPendientes: 0,
      totalFaltasSinJustificar: 0,
      promedioAsistencia: 0,
      distribucionGrado: [],
      distribucionJornada: [],
      mejoresAsistencias: [],
      alertasAusentismo: []
    };

    if (rows.length === 0) {
      return aggregate;
    }

    const gradoMap = new Map();
    const jornadaMap = new Map();
    let sumPorcentajes = 0;

    rows.forEach((row) => {
      aggregate.totalAsistencias += row.total_asistencias;
      aggregate.totalFaltas += row.total_faltas;
      aggregate.totalFaltasJustificadas += row.faltas_justificadas;
      aggregate.totalFaltasPendientes += row.faltas_pendientes_revision;
      aggregate.totalFaltasSinJustificar += row.faltas_sin_justificar;
      sumPorcentajes += row.porcentaje_asistencia;

      if (row.grado) {
        const current = gradoMap.get(row.grado) || { total: 0, asistencias: 0 };
        current.total += 1;
        current.asistencias += row.porcentaje_asistencia;
        gradoMap.set(row.grado, current);
      }

      if (row.jornada) {
        const current = jornadaMap.get(row.jornada) || { total: 0, asistencias: 0 };
        current.total += 1;
        current.asistencias += row.porcentaje_asistencia;
        jornadaMap.set(row.jornada, current);
      }
    });

    aggregate.promedioAsistencia = Number((sumPorcentajes / rows.length).toFixed(2));

    aggregate.distribucionGrado = Array.from(gradoMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([grado, data]) => ({
        grado,
        estudiantes: data.total,
        promedio_asistencia: Number((data.asistencias / data.total).toFixed(2))
      }));

    aggregate.distribucionJornada = Array.from(jornadaMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([jornada, data]) => ({
        jornada,
        estudiantes: data.total,
        promedio_asistencia: Number((data.asistencias / data.total).toFixed(2))
      }));

    const byAsistencia = [...rows].sort((a, b) => b.porcentaje_asistencia - a.porcentaje_asistencia);
    aggregate.mejoresAsistencias = byAsistencia.slice(0, 5);

    const byAusentismo = [...rows].sort((a, b) => b.faltas_sin_justificar - a.faltas_sin_justificar || b.total_faltas - a.total_faltas);
    aggregate.alertasAusentismo = byAusentismo.slice(0, 5);

    return aggregate;
  }

  static computeMetricsForStudent(student, stats, startISO, endISO) {
    const ingresoISO = normalizeDate(student.fecha_ingreso);
    const effectiveStart = computeEffectiveStart(startISO, ingresoISO);

    if (!effectiveStart || effectiveStart > endISO) {
      return {
        oportunidades: 0,
        totalAsistencias: 0,
        faltasTotales: 0,
        faltasJustificadas: 0,
        faltasPendientes: 0,
        faltasSinJustificar: 0,
        porcentajeAsistencia: 0
      };
    }

    const oportunidades = AttendanceSummaryService.countWorkingDaysInclusive(effectiveStart, endISO);
    const totalAsistencias = stats.asistencias;
    const faltasTotales = Math.max(oportunidades - totalAsistencias, 0);

    let faltasRestantes = faltasTotales;
    const faltasJustificadas = Math.min(faltasRestantes, stats.justificacionesAprobadas);
    faltasRestantes -= faltasJustificadas;

    const faltasPendientes = Math.min(faltasRestantes, stats.justificacionesPendientes);
    faltasRestantes -= faltasPendientes;

    const faltasSinJustificar = Math.max(faltasRestantes, 0);

    const porcentajeAsistencia = oportunidades > 0
      ? Number(((totalAsistencias / oportunidades) * 100).toFixed(2))
      : 0;

    return {
      oportunidades,
      totalAsistencias,
      faltasTotales,
      faltasJustificadas,
      faltasPendientes,
      faltasSinJustificar,
      porcentajeAsistencia
    };
  }

  static buildStatsMaps(attendanceRows, justificationRows) {
    const attendanceMap = new Map();
    attendanceRows.forEach((row) => {
      attendanceMap.set(row.estudiante_id, {
        asistencias: Number(row.total_asistencias) || 0,
        ultimaAsistencia: normalizeDate(row.ultima_fecha) || null
      });
    });

    const justificationMap = new Map();
    justificationRows.forEach((row) => {
      justificationMap.set(row.estudiante_id, {
        justificacionesAprobadas: Number(row.aprobadas) || 0,
        justificacionesPendientes: Number(row.pendientes) || 0,
        justificacionesRechazadas: Number(row.rechazadas) || 0,
        ultimaJustificacion: normalizeDate(row.ultima_revision) || null
      });
    });

    return { attendanceMap, justificationMap };
  }

  static buildRowFromStudent(student, stats, startISO, endISO) {
    const attendanceStats = stats.attendanceMap.get(student.id) || {
      asistencias: 0,
      ultimaAsistencia: null
    };

    const justificationStats = stats.justificationMap.get(student.id) || {
      justificacionesAprobadas: 0,
      justificacionesPendientes: 0,
      justificacionesRechazadas: 0,
      ultimaJustificacion: null
    };

    const metrics = this.computeMetricsForStudent(student, {
      asistencias: attendanceStats.asistencias,
      justificacionesAprobadas: justificationStats.justificacionesAprobadas,
      justificacionesPendientes: justificationStats.justificacionesPendientes
    }, startISO, endISO);

    return {
      id: student.id,
      nombre: student.nombre,
      apellidos: student.apellidos,
      grado: student.grado,
      jornada: student.jornada,
      matricula: student.matricula,
      email: student.email,
      fecha_ingreso: normalizeDate(student.fecha_ingreso),
      oportunidades: metrics.oportunidades,
      total_asistencias: metrics.totalAsistencias,
      total_faltas: metrics.faltasTotales,
      faltas_justificadas: metrics.faltasJustificadas,
      faltas_pendientes_revision: metrics.faltasPendientes,
      faltas_sin_justificar: metrics.faltasSinJustificar,
      porcentaje_asistencia: metrics.porcentajeAsistencia,
      justificaciones_rechazadas: justificationStats.justificacionesRechazadas,
      ultima_asistencia: attendanceStats.ultimaAsistencia,
      ultima_justificacion: justificationStats.ultimaJustificacion
    };
  }

  static async buildDataset(options = {}) {
    const { startISO, endISO } = this.resolveDateRange(options.startDate, options.endDate);

    const gradeFilter = buildInClause(options.grades, 'g.nombre');
    const jornadaFilter = buildInClause(options.jornadas, 'g.jornada');
    const studentFilter = buildInClause(options.studentIds, 'e.id');

    const students = await database.query(
      `SELECT 
        e.id,
        e.nombre,
        e.apellidos,
        g.nombre as grado,
        g.jornada,
        e.fecha_ingreso,
        u.matricula,
        u.email
      FROM estudiantes e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
      WHERE u.estado = 'validado'
        ${gradeFilter.clause}
        ${jornadaFilter.clause}
        ${studentFilter.clause}
      ORDER BY e.apellidos, e.nombre`,
      [...gradeFilter.params, ...jornadaFilter.params, ...studentFilter.params]
    );

    if (students.length === 0) {
      return {
        rows: [],
        summary: this.buildAggregations([]),
        metadata: this.buildFiltersMetadata(options, startISO, endISO)
      };
    }

    const studentIds = students.map((student) => student.id);
    const attendanceFilter = buildInClause(studentIds, 'estudiante_id');

    const attendanceRows = await database.query(
      `SELECT
        estudiante_id,
        COUNT(*) AS total_asistencias,
        MAX(fecha) AS ultima_fecha
      FROM asistencias
      WHERE validado = 1
        AND rechazado = 0
        AND fecha BETWEEN ? AND ?
        ${attendanceFilter.clause}
      GROUP BY estudiante_id`,
      [startISO, endISO, ...attendanceFilter.params]
    );

    const justificationRows = await database.query(
      `SELECT
        estudiante_id,
        SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) AS rechazadas,
        MAX(fecha_revision) AS ultima_revision
      FROM justificaciones
      WHERE fecha_falta BETWEEN ? AND ?
        ${attendanceFilter.clause}
      GROUP BY estudiante_id`,
      [startISO, endISO, ...attendanceFilter.params]
    );

    const statsMaps = this.buildStatsMaps(attendanceRows, justificationRows);

    const rows = students.map((student) => (
      this.buildRowFromStudent(student, statsMaps, startISO, endISO)
    ));

    const summary = this.buildAggregations(rows);

    return {
      rows,
      summary,
      metadata: this.buildFiltersMetadata(options, startISO, endISO)
    };
  }

  static async buildStudentTimeline(studentId, options = {}) {
    const { startISO, endISO } = this.resolveDateRange(options.startDate, options.endDate);

    const studentRows = await database.query(
      `SELECT 
        e.id,
        e.nombre,
        e.apellidos,
        g.nombre as grado,
        g.jornada,
        e.fecha_ingreso,
        u.matricula,
        u.email
      FROM estudiantes e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
      WHERE e.id = ?
      LIMIT 1`,
      [studentId]
    );

    if (studentRows.length === 0) {
      return null;
    }

    const student = studentRows[0];

    const attendanceRows = await database.query(
      `SELECT 
        id,
        fecha,
        hora_entrada,
        metodo_registro,
        observaciones
      FROM asistencias
      WHERE estudiante_id = ?
        AND validado = 1
        AND rechazado = 0
        AND fecha BETWEEN ? AND ?
      ORDER BY fecha DESC`,
      [studentId, startISO, endISO]
    );

    const justificationRows = await database.query(
      `SELECT 
        id,
        fecha_falta AS fecha,
        estado,
        motivo,
        fecha_revision
      FROM justificaciones
      WHERE estudiante_id = ?
        AND fecha_falta BETWEEN ? AND ?
      ORDER BY fecha_falta DESC`,
      [studentId, startISO, endISO]
    );

    const { rows, summary } = await this.buildDataset({
      startDate: startISO,
      endDate: endISO,
      studentIds: [studentId]
    });

    const consolidated = rows[0] || null;

    const attendanceEvents = attendanceRows.map((item) => ({
      tipo: 'asistencia',
      fecha: normalizeDate(item.fecha),
      hora: item.hora_entrada,
      metodo: item.metodo_registro,
      observaciones: item.observaciones
    }));

    const justificationEvents = justificationRows.map((item) => ({
      tipo: 'justificacion',
      fecha: normalizeDate(item.fecha),
      estado: item.estado,
      motivo: item.motivo,
      fecha_revision: normalizeDate(item.fecha_revision)
    }));

    const events = [...attendanceEvents, ...justificationEvents]
      .filter((event) => event.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let workingDays = [];
    if (consolidated) {
      const effectiveStart = computeEffectiveStart(startISO, consolidated.fecha_ingreso);
      if (effectiveStart && effectiveStart <= endISO) {
        workingDays = getWorkingDatesBetween(effectiveStart, endISO);
      }
    }

    return {
      student,
      resumen: consolidated,
      eventos: events,
      metadata: {
        periodo: {
          inicio: startISO,
          fin: endISO
        },
        total_dias_habiles: workingDays.length
      },
      estadisticasGlobales: summary
    };
  }
}

module.exports = CustomReportService;
