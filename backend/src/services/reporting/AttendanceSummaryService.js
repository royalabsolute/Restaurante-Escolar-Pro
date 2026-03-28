const database = require('../../config/database');
const { isHoliday } = require('../../utils/holidayUtils');

const TIMEZONE = process.env.REPORTING_TIMEZONE || 'America/Bogota';
const CUTOFF_HOUR = Number.parseInt(process.env.REPORTING_CUTOFF_HOUR ?? '15', 10);

const PRIORITY_STATES = ['aprobada', 'pendiente', 'rechazada'];

function ensureNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function parseISODate(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return new Date(Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate()
    ));
  }

  if (typeof input === 'string') {
    const [year, month, day] = input.split('-').map((segment) => Number.parseInt(segment, 10));
    if (!year || !month || !day) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, day));
  }

  if (typeof input === 'number') {
    return parseISODate(new Date(input));
  }

  return null;
}

function toISODateString(date) {
  if (!(date instanceof Date)) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateInput(input) {
  const parsed = parseISODate(input);
  return parsed ? toISODateString(parsed) : null;
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function isWorkingDay(date) {
  if (!(date instanceof Date)) {
    return false;
  }

  if (isWeekend(date)) {
    return false;
  }

  const iso = toISODateString(date);
  return iso ? !isHoliday(iso) : false;
}

function getWorkingDatesBetween(startISO, endISO) {
  const startDate = parseISODate(startISO);
  const endDate = parseISODate(endISO);

  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const cursor = new Date(startDate);
  const dates = [];

  while (cursor <= endDate) {
    if (isWorkingDay(cursor)) {
      dates.push(toISODateString(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function getJustificationPriority(existing, incoming) {
  if (!incoming) {
    return existing;
  }

  if (!existing) {
    return incoming;
  }

  const incomingIndex = PRIORITY_STATES.indexOf(incoming);
  const existingIndex = PRIORITY_STATES.indexOf(existing);

  if (incomingIndex === -1) {
    return existing;
  }

  if (existingIndex === -1) {
    return incoming;
  }

  return incomingIndex < existingIndex ? incoming : existing;
}

function createDistributionBucket() {
  return {
    total: 0,
    asistencias: 0,
    faltasPotenciales: 0,
    faltasConfirmadas: 0,
    faltasJustificadas: 0,
    faltasPendientesRevision: 0,
    faltasSinJustificar: 0
  };
}

function serializeDistribution(map) {
  return Array.from(map.entries())
    .sort((a, b) => {
      const [labelA] = a;
      const [labelB] = b;
      return labelA.localeCompare(labelB, 'es');
    })
    .map(([label, data]) => ({
      label,
      total: data.total,
      asistencias: data.asistencias,
      faltas_potenciales: data.faltasPotenciales,
      faltas_confirmadas: data.faltasConfirmadas,
      faltas_justificadas: data.faltasJustificadas,
      faltas_pendientes: data.faltasPendientesRevision,
      faltas_sin_justificar: data.faltasSinJustificar,
      porcentaje_asistencia: data.total > 0
        ? Number(((data.asistencias / data.total) * 100).toFixed(2))
        : 0
    }));
}

function getEvaluationState(targetDate) {
  const now = new Date();

  const todayUTC = parseISODate(toISODateString(now));
  if (!todayUTC) {
    return {
      cutoffApplied: true,
      pendingCount: 0
    };
  }

  const targetISO = toISODateString(targetDate);
  const todayISO = toISODateString(todayUTC);

  if (!targetISO || !todayISO) {
    return {
      cutoffApplied: true,
      pendingCount: 0
    };
  }

  if (targetISO < todayISO) {
    return {
      cutoffApplied: true,
      pendingCount: 0
    };
  }

  if (targetISO > todayISO) {
    return {
      cutoffApplied: false,
      pendingCount: Infinity
    };
  }

  const currentHourLocal = now.getHours();

  return {
    cutoffApplied: currentHourLocal >= CUTOFF_HOUR,
    pendingCount: 0
  };
}

async function fetchValidatedStudentsForDate(dateISO) {
  const rows = await database.query(`
    SELECT 
      e.id,
      e.nombre,
      e.apellidos,
      g.nombre AS grado,
      g.jornada,
      e.fecha_ingreso,
      IFNULL(u.matricula, '') AS matricula
    FROM estudiantes e
    INNER JOIN usuarios u ON e.usuario_id = u.id
    LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
    WHERE u.estado = 'validado'
      AND (e.fecha_ingreso IS NULL OR e.fecha_ingreso <= ?)
  `, [dateISO]);

  return rows;
}

async function fetchStudentAttendanceIds(dateISO) {
  const rows = await database.query(`
    SELECT DISTINCT estudiante_id
    FROM asistencias
    WHERE fecha = ?
      AND validado = 1
      AND rechazado = 0
  `, [dateISO]);

  return new Set(rows.map((row) => row.estudiante_id));
}

async function fetchStudentJustifications(dateISO) {
  const rows = await database.query(`
    SELECT estudiante_id, estado
    FROM justificaciones
    WHERE fecha_falta = ?
  `, [dateISO]);

  const result = new Map();

  for (const row of rows) {
    const current = result.get(row.estudiante_id) || null;
    const next = getJustificationPriority(current, row.estado);
    if (next) {
      result.set(row.estudiante_id, next);
    }
  }

  return result;
}

async function fetchSuplenteDailyCounts(dateISO) {
  const rows = await database.query(`
    SELECT 
      CASE 
        WHEN HOUR(hora_registro) < 12 THEN 'mañana'
        ELSE 'tarde'
      END as jornada,
      COUNT(*) as total
    FROM conteo_suplentes_diario
    WHERE fecha = ?
    GROUP BY jornada
  `, [dateISO]);
  return rows;
}

class AttendanceSummaryService {
  static async getDailySnapshot(dateInput, options = {}) {
    const dateISO = normalizeDateInput(dateInput) || toISODateString(new Date());
    const targetDate = parseISODate(dateISO);

    if (!targetDate) {
      throw new Error('Fecha inválida para el resumen diario');
    }

    const settings = {
      includeDistribution: options.includeDistribution !== false,
      includeAbsences: options.includeAbsences !== false
    };

    const dayIsWorkingDay = isWorkingDay(targetDate);
    const evaluation = getEvaluationState(targetDate);

    const metadata = {
      fecha: dateISO,
      timezone: TIMEZONE,
      hora_corte: `${String(CUTOFF_HOUR).padStart(2, '0')}:00`,
      es_dia_habil: dayIsWorkingDay,
      corte_aplicado: evaluation.cutoffApplied,
      generado_en: new Date().toISOString()
    };

    if (!dayIsWorkingDay) {
      return {
        fecha: dateISO,
        metadata,
        estudiantes: this.#emptyStudentMetrics(),
        suplentes: this.#emptySuplenteMetrics(),
        global: this.#emptyGlobalMetrics(),
        asistencias_estudiantes: 0,
        faltas_estudiantes: 0,
        asistencias_suplentes: 0,
        faltas_suplentes: 0,
        justificaciones: 0,
        justificaciones_detalle: {
          aprobadas: 0,
          pendientes: 0,
          rechazadas: 0,
          total: 0
        },
        distribucion_por_grado: [],
        distribucion_por_jornada: [],
        ausentes_sin_justificacion: [],
        mensajes: [
          'La fecha consultada no corresponde a un día hábil. No se contabilizan asistencias ni faltas.'
        ]
      };
    }

    const [students, studentAttendanceIds, studentJustifications, suplenteCounts] = await Promise.all([
      fetchValidatedStudentsForDate(dateISO),
      fetchStudentAttendanceIds(dateISO),
      fetchStudentJustifications(dateISO),
      fetchSuplenteDailyCounts(dateISO)
    ]);

    const gradeDistribution = new Map();
    const jornadaDistribution = new Map();

    const ausentes = [];

    let asistenciasEstudiantes = 0;
    let faltasPotenciales = 0;
    let faltasConfirmadas = 0;
    let faltasJustificadas = 0;
    let faltasPendientesRevision = 0;
    let justificacionesAprobadas = 0;
    let justificacionesPendientes = 0;
    let justificacionesRechazadas = 0;

    for (const student of students) {
      const bucketByGrade = gradeDistribution.get(student.grado) || createDistributionBucket();
      const bucketByJornada = jornadaDistribution.get(student.jornada) || createDistributionBucket();

      const asistio = studentAttendanceIds.has(student.id);
      const justificacion = studentJustifications.get(student.id) || null;

      bucketByGrade.total += 1;
      bucketByJornada.total += 1;

      if (asistio) {
        asistenciasEstudiantes += 1;
        bucketByGrade.asistencias += 1;
        bucketByJornada.asistencias += 1;
      } else {
        faltasPotenciales += 1;
        bucketByGrade.faltasPotenciales += 1;
        bucketByJornada.faltasPotenciales += 1;

        if (evaluation.cutoffApplied) {
          faltasConfirmadas += 1;
          bucketByGrade.faltasConfirmadas += 1;
          bucketByJornada.faltasConfirmadas += 1;
        }

        if (justificacion === 'aprobada') {
          faltasJustificadas += 1;
          bucketByGrade.faltasJustificadas += 1;
          bucketByJornada.faltasJustificadas += 1;
          justificacionesAprobadas += 1;
        } else if (justificacion === 'pendiente') {
          faltasPendientesRevision += 1;
          bucketByGrade.faltasPendientesRevision += 1;
          bucketByJornada.faltasPendientesRevision += 1;
          justificacionesPendientes += 1;
        } else if (justificacion === 'rechazada') {
          justificacionesRechazadas += 1;
        }

        const sinJustificacion = !justificacion || justificacion === 'rechazada';

        if (evaluation.cutoffApplied && sinJustificacion && settings.includeAbsences) {
          ausentes.push({
            id: student.id,
            nombre: student.nombre,
            apellidos: student.apellidos,
            grado: student.grado,
            jornada: student.jornada,
            matricula: student.matricula || '',
            estado_justificacion: justificacion || 'sin_registro'
          });
          bucketByGrade.faltasSinJustificar += 1;
          bucketByJornada.faltasSinJustificar += 1;
        }
      }

      if (!gradeDistribution.has(student.grado)) {
        gradeDistribution.set(student.grado, bucketByGrade);
      }
      if (!jornadaDistribution.has(student.jornada)) {
        jornadaDistribution.set(student.jornada, bucketByJornada);
      }
    }

    const totalEstudiantes = students.length;
    const faltasPendientesCorte = evaluation.cutoffApplied ? 0 : faltasPotenciales;
    const faltasSinJustificar = evaluation.cutoffApplied
      ? Math.max(faltasPotenciales - faltasJustificadas - faltasPendientesRevision, 0)
      : 0;

    const studentMetrics = {
      total_convocados: totalEstudiantes,
      asistencias: asistenciasEstudiantes,
      faltas_potenciales: faltasPotenciales,
      faltas_confirmadas: evaluation.cutoffApplied ? faltasPotenciales : 0,
      faltas_justificadas: faltasJustificadas,
      faltas_pendientes_revision: faltasPendientesRevision,
      faltas_sin_justificar: faltasSinJustificar,
      faltas_pendientes_corte: faltasPendientesCorte,
      porcentaje_asistencia: totalEstudiantes > 0
        ? Number(((asistenciasEstudiantes / totalEstudiantes) * 100).toFixed(2))
        : 0,
      porcentaje_asistencia_confirmada: evaluation.cutoffApplied && totalEstudiantes > 0
        ? Number(((asistenciasEstudiantes / totalEstudiantes) * 100).toFixed(2))
        : 0,
      justificaciones: {
        aprobadas: justificacionesAprobadas,
        pendientes: justificacionesPendientes,
        rechazadas: justificacionesRechazadas,
        total: justificacionesAprobadas + justificacionesPendientes + justificacionesRechazadas
      }
    };

    const asistenciasSuplentes = suplenteCounts.reduce((acc, current) => acc + ensureNumber(current.total), 0);
    const totalSuplentes = asistenciasSuplentes; // En el nuevo modelo, los convocados son los mismos que asistieron (es un contador)
    const suplenteFaltasPotenciales = 0;

    const suplenteMetrics = {
      total_convocados: totalSuplentes,
      asistencias: asistenciasSuplentes,
      faltas_potenciales: suplenteFaltasPotenciales,
      faltas_confirmadas: 0,
      faltas_sin_registro: 0,
      faltas_pendientes_corte: 0,
      porcentaje_asistencia: totalSuplentes > 0 ? 100 : 0
    };

    const globalMetrics = {
      total_convocados: studentMetrics.total_convocados + suplenteMetrics.total_convocados,
      asistencias: studentMetrics.asistencias + suplenteMetrics.asistencias,
      faltas_potenciales: studentMetrics.faltas_potenciales + suplenteMetrics.faltas_potenciales,
      faltas_confirmadas: studentMetrics.faltas_confirmadas + suplenteMetrics.faltas_confirmadas,
      porcentaje_asistencia: (studentMetrics.total_convocados + suplenteMetrics.total_convocados) > 0
        ? Number((((studentMetrics.asistencias + suplenteMetrics.asistencias) /
          (studentMetrics.total_convocados + suplenteMetrics.total_convocados)) * 100).toFixed(2))
        : 0
    };

    return {
      fecha: dateISO,
      metadata,
      estudiantes: studentMetrics,
      suplentes: suplenteMetrics,
      global: globalMetrics,
      asistencias_estudiantes: studentMetrics.asistencias,
      faltas_estudiantes: studentMetrics.faltas_confirmadas,
      asistencias_suplentes: suplenteMetrics.asistencias,
      faltas_suplentes: suplenteMetrics.faltas_confirmadas,
      justificaciones: studentMetrics.justificaciones.aprobadas,
      justificaciones_detalle: studentMetrics.justificaciones,
      distribucion_por_grado: settings.includeDistribution ? serializeDistribution(gradeDistribution) : [],
      distribucion_por_jornada: settings.includeDistribution ? serializeDistribution(jornadaDistribution) : [],
      ausentes_sin_justificacion: settings.includeAbsences ? ausentes : []
    };
  }

  static #emptyStudentMetrics() {
    return {
      total_convocados: 0,
      asistencias: 0,
      faltas_potenciales: 0,
      faltas_confirmadas: 0,
      faltas_justificadas: 0,
      faltas_pendientes_revision: 0,
      faltas_sin_justificar: 0,
      faltas_pendientes_corte: 0,
      porcentaje_asistencia: 0,
      porcentaje_asistencia_confirmada: 0,
      justificaciones: {
        aprobadas: 0,
        pendientes: 0,
        rechazadas: 0,
        total: 0
      }
    };
  }

  static #emptySuplenteMetrics() {
    return {
      total_convocados: 0,
      asistencias: 0,
      faltas_potenciales: 0,
      faltas_confirmadas: 0,
      faltas_sin_registro: 0,
      faltas_pendientes_corte: 0,
      porcentaje_asistencia: 0
    };
  }

  static #emptyGlobalMetrics() {
    return {
      total_convocados: 0,
      asistencias: 0,
      faltas_potenciales: 0,
      faltas_confirmadas: 0,
      porcentaje_asistencia: 0
    };
  }

  static async getMonthlySnapshot({ month, year }) {
    const numericMonth = Number.parseInt(month, 10) || (new Date().getUTCMonth() + 1);
    const numericYear = Number.parseInt(year, 10) || new Date().getUTCFullYear();

    const firstDay = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
    const lastDay = new Date(Date.UTC(numericYear, numericMonth, 0));

    const today = parseISODate(toISODateString(new Date()));
    let effectiveEndDate = lastDay;

    if (today && today < lastDay) {
      const sameMonth = today.getUTCFullYear() === numericYear && (today.getUTCMonth() + 1) === numericMonth;
      if (sameMonth) {
        effectiveEndDate = today;
      }
    }

    const startISO = toISODateString(firstDay);
    const endISO = toISODateString(lastDay);
    const effectiveEndISO = toISODateString(effectiveEndDate);

    const workingDays = getWorkingDatesBetween(startISO, effectiveEndISO);

    const dailySummaries = [];
    for (const day of workingDays) {
      const summary = await this.getDailySnapshot(day, {
        includeDistribution: false,
        includeAbsences: false
      });
      dailySummaries.push(summary);
    }

    const studentPopulation = await fetchValidatedStudentsForDate(effectiveEndISO ?? startISO);

    const { ranking: topStudents, totals: studentTotals } = await this.#getTopStudentsWithAbsences({
      workingDays,
      month: numericMonth,
      year: numericYear
    });

    const mensual = {
      total_convocados_estudiantes: studentTotals.estudiantesConsiderados,
      oportunidades_estudiantes: studentTotals.oportunidades,
      asistencias_estudiantes: studentTotals.asistencias,
      faltas_estudiantes: studentTotals.faltas_totales,
      faltas_justificadas: studentTotals.faltas_justificadas,
      faltas_sin_justificar: studentTotals.faltas_sin_justificar,
      faltas_pendientes_revision: studentTotals.faltas_pendientes_revision,
      total_convocados_suplentes: 0,
      oportunidades_suplentes: 0,
      asistencias_suplentes: 0,
      faltas_suplentes: 0,
      justificaciones: studentTotals.justificaciones
    };

    const monthlySuplenteCounts = await database.query(`
      SELECT 
        COUNT(*) AS total_periodo
      FROM conteo_suplentes_diario
      WHERE fecha BETWEEN ? AND ?
    `, [startISO, endISO]);

    mensual.asistencias_suplentes = ensureNumber(monthlySuplenteCounts?.[0]?.total_periodo);
    mensual.oportunidades_suplentes = mensual.asistencias_suplentes; // En el nuevo modelo son iguales

    mensual.faltas_suplentes = Math.max(mensual.oportunidades_suplentes - mensual.asistencias_suplentes, 0);

    const totalOportunidadesGlobal = mensual.oportunidades_estudiantes + mensual.oportunidades_suplentes;
    const totalAsistenciasGlobal = mensual.asistencias_estudiantes + mensual.asistencias_suplentes;
    const totalFaltasGlobal = mensual.faltas_estudiantes + mensual.faltas_suplentes;

    const asistenciaDiaria = dailySummaries.map((day) => ({
      fecha: day.fecha,
      estudiantes_asistencias: day.estudiantes.asistencias,
      estudiantes_faltas: day.estudiantes.faltas_confirmadas,
      suplentes_asistencias: day.suplentes.asistencias,
      suplentes_faltas: day.suplentes.faltas_confirmadas,
      porcentaje_asistencia_estudiantes: day.estudiantes.porcentaje_asistencia,
      porcentaje_asistencia_global: day.global.porcentaje_asistencia
    }));

    const monthMetadata = {
      mes: numericMonth,
      año: numericYear,
      fecha_inicio: startISO,
      fecha_fin: effectiveEndISO,
      dias_habiles: workingDays.length,
      generado_en: new Date().toISOString(),
      estudiantes_registrados: studentPopulation.length,
      suplentes_activos: 0, // En el nuevo modelo no hay "población activa" de suplentes
      estudiantes_considerados: mensual.total_convocados_estudiantes,
      oportunidades_estudiantes: mensual.oportunidades_estudiantes,
      oportunidades_suplentes: mensual.asistencias_suplentes // Simplificado
    };

    return {
      metadata: monthMetadata,
      resumen: {
        estudiantes: {
          total_convocados: mensual.total_convocados_estudiantes,
          oportunidades: mensual.oportunidades_estudiantes,
          asistencias: mensual.asistencias_estudiantes,
          faltas_confirmadas: mensual.faltas_estudiantes,
          faltas_justificadas: mensual.faltas_justificadas,
          faltas_pendientes_revision: mensual.faltas_pendientes_revision,
          faltas_sin_justificar: mensual.faltas_sin_justificar,
          porcentaje_asistencia: mensual.oportunidades_estudiantes > 0
            ? Number(((mensual.asistencias_estudiantes / mensual.oportunidades_estudiantes) * 100).toFixed(2))
            : 0
        },
        suplentes: {
          total_convocados: mensual.total_convocados_suplentes,
          oportunidades: mensual.oportunidades_suplentes,
          asistencias: mensual.asistencias_suplentes,
          faltas_confirmadas: mensual.faltas_suplentes,
          porcentaje_asistencia: mensual.oportunidades_suplentes > 0
            ? Number(((mensual.asistencias_suplentes / mensual.oportunidades_suplentes) * 100).toFixed(2))
            : 0
        },
        global: {
          total_convocados: mensual.total_convocados_estudiantes + mensual.total_convocados_suplentes,
          oportunidades: totalOportunidadesGlobal,
          asistencias: totalAsistenciasGlobal,
          faltas_confirmadas: totalFaltasGlobal,
          porcentaje_asistencia: totalOportunidadesGlobal > 0
            ? Number(((totalAsistenciasGlobal / totalOportunidadesGlobal) * 100).toFixed(2))
            : 0
        },
        justificaciones: mensual.justificaciones
      },
      asistencia_diaria: asistenciaDiaria,
      estudiantes_con_mas_faltas: topStudents
    };
  }

  static async #getTopStudentsWithAbsences({ workingDays, month, year }) {
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return {
        ranking: [],
        totals: {
          estudiantesConsiderados: 0,
          oportunidades: 0,
          asistencias: 0,
          faltas_totales: 0,
          faltas_justificadas: 0,
          faltas_sin_justificar: 0,
          faltas_pendientes_revision: 0,
          justificaciones: {
            aprobadas: 0,
            pendientes: 0,
            rechazadas: 0,
            total: 0
          }
        }
      };
    }

    const startISO = workingDays[0];
    const endISO = workingDays[workingDays.length - 1];

    const students = await database.query(`
      SELECT 
        e.id,
        e.nombre,
        e.apellidos,
        g.nombre AS grado,
        g.jornada,
        e.fecha_ingreso,
        IFNULL(u.matricula, '') AS matricula
      FROM estudiantes e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
      WHERE u.estado = 'validado'
    `);

    if (students.length === 0) {
      return [];
    }

    const attendanceRows = await database.query(`
      SELECT estudiante_id, COUNT(*) AS asistencias
      FROM asistencias
      WHERE fecha BETWEEN ? AND ?
        AND validado = 1
        AND rechazado = 0
      GROUP BY estudiante_id
    `, [startISO, endISO]);

    const attendanceMap = new Map();
    for (const row of attendanceRows) {
      attendanceMap.set(row.estudiante_id, ensureNumber(row.asistencias));
    }

    const justificationRows = await database.query(`
      SELECT estudiante_id, estado, COUNT(*) AS cantidad
      FROM justificaciones
      WHERE fecha_falta BETWEEN ? AND ?
      GROUP BY estudiante_id, estado
    `, [startISO, endISO]);

    const justificationMap = new Map();
    for (const row of justificationRows) {
      const entry = justificationMap.get(row.estudiante_id) || {
        aprobadas: 0,
        pendientes: 0,
        rechazadas: 0
      };
      if (row.estado === 'aprobada') {
        entry.aprobadas += ensureNumber(row.cantidad);
      } else if (row.estado === 'pendiente') {
        entry.pendientes += ensureNumber(row.cantidad);
      } else if (row.estado === 'rechazada') {
        entry.rechazadas += ensureNumber(row.cantidad);
      }
      justificationMap.set(row.estudiante_id, entry);
    }

    const ranking = [];

    let consideredStudents = 0;
    let totalOpportunities = 0;
    let totalAsistencias = 0;
    let totalFaltasTotales = 0;
    let totalFaltasJustificadas = 0;
    let totalFaltasSinJustificar = 0;
    let totalJustAprobadas = 0;
    let totalJustPendientes = 0;
    let totalJustRechazadas = 0;

    for (const student of students) {
      const ingresoISO = student.fecha_ingreso
        ? normalizeDateInput(student.fecha_ingreso)
        : null;

      const eligibleDays = workingDays.filter((day) => {
        if (!ingresoISO) {
          return true;
        }
        return day >= ingresoISO;
      }).length;

      if (eligibleDays === 0) {
        continue;
      }

      const asistencias = attendanceMap.get(student.id) || 0;
      const justifications = justificationMap.get(student.id) || {
        aprobadas: 0,
        pendientes: 0,
        rechazadas: 0
      };

      const faltasTotales = Math.max(eligibleDays - asistencias, 0);
      const faltasJustificadas = Math.min(faltasTotales, justifications.aprobadas);
      const faltasSinJustificar = Math.max(faltasTotales - justifications.aprobadas, 0);

      consideredStudents += 1;
      totalOpportunities += eligibleDays;
      totalAsistencias += asistencias;
      totalFaltasTotales += faltasTotales;
      totalFaltasJustificadas += faltasJustificadas;
      totalFaltasSinJustificar += faltasSinJustificar;
      totalJustAprobadas += justifications.aprobadas;
      totalJustPendientes += justifications.pendientes;
      totalJustRechazadas += justifications.rechazadas;

      if (faltasTotales > 0) {
        ranking.push({
          id: student.id,
          nombre: student.nombre,
          apellidos: student.apellidos,
          grado: student.grado,
          jornada: student.jornada,
          matricula: student.matricula,
          total_dias_habiles: eligibleDays,
          asistencias,
          faltas_totales: faltasTotales,
          faltas_justificadas: faltasJustificadas,
          faltas_sin_justificar: faltasSinJustificar,
          justificaciones: justifications
        });
      }
    }

    ranking.sort((a, b) => {
      if (b.faltas_sin_justificar !== a.faltas_sin_justificar) {
        return b.faltas_sin_justificar - a.faltas_sin_justificar;
      }
      if (b.faltas_totales !== a.faltas_totales) {
        return b.faltas_totales - a.faltas_totales;
      }
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    const rankingTop = ranking.slice(0, 15);

    const totals = {
      estudiantesConsiderados: consideredStudents,
      oportunidades: totalOpportunities,
      asistencias: totalAsistencias,
      faltas_totales: totalFaltasTotales,
      faltas_justificadas: totalFaltasJustificadas,
      faltas_sin_justificar: totalFaltasSinJustificar,
      faltas_pendientes_revision: totalJustPendientes,
      justificaciones: {
        aprobadas: totalJustAprobadas,
        pendientes: totalJustPendientes,
        rechazadas: totalJustRechazadas,
        total: totalJustAprobadas + totalJustPendientes + totalJustRechazadas
      }
    };

    return {
      ranking: rankingTop,
      totals
    };
  }

  static async getTrendSeries({ startDate, endDate }) {
    const startISO = normalizeDateInput(startDate);
    const endISO = normalizeDateInput(endDate);

    const effectiveStart = startISO || (() => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
      return toISODateString(thirtyDaysAgo);
    })();

    const effectiveEnd = endISO || toISODateString(new Date());

    const workingDays = getWorkingDatesBetween(effectiveStart, effectiveEnd);

    const trend = [];
    for (const day of workingDays) {
      const summary = await this.getDailySnapshot(day, {
        includeDistribution: false,
        includeAbsences: false
      });
      trend.push({
        fecha: summary.fecha,
        estudiantes_asistencias: summary.estudiantes.asistencias,
        estudiantes_faltas: summary.estudiantes.faltas_confirmadas,
        suplentes_asistencias: summary.suplentes.asistencias,
        suplentes_faltas: summary.suplentes.faltas_confirmadas,
        porcentaje_asistencia_estudiantes: summary.estudiantes.porcentaje_asistencia,
        porcentaje_asistencia_global: summary.global.porcentaje_asistencia
      });
    }

    return {
      metadata: {
        fecha_inicio: workingDays[0] || effectiveStart,
        fecha_fin: workingDays[workingDays.length - 1] || effectiveEnd,
        puntos: trend.length
      },
      series: trend
    };
  }

  static countWorkingDaysInclusive(startISO, endISO) {
    if (!startISO || !endISO) {
      return 0;
    }
    const dates = getWorkingDatesBetween(startISO, endISO);
    return dates.length;
  }

  static getEffectiveEvaluationDate(referenceDate = new Date()) {
    const refISO = normalizeDateInput(referenceDate);
    const refDate = parseISODate(refISO);

    if (!refDate) {
      return {
        dateISO: null,
        cutoffApplied: false
      };
    }

    const MAX_LOOKBACK = 365;

    if (!isWorkingDay(refDate)) {
      const cursor = new Date(refDate);
      let steps = 0;
      while (steps < MAX_LOOKBACK) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        if (isWorkingDay(cursor)) {
          return {
            dateISO: toISODateString(cursor),
            cutoffApplied: true
          };
        }
        steps += 1;
      }
      return {
        dateISO: refISO,
        cutoffApplied: true
      };
    }

    const evaluation = getEvaluationState(refDate);
    if (evaluation.cutoffApplied) {
      return {
        dateISO: refISO,
        cutoffApplied: true
      };
    }

    const cursor = new Date(refDate);
    let steps = 0;
    do {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      steps += 1;
      if (steps > MAX_LOOKBACK) {
        return {
          dateISO: refISO,
          cutoffApplied: false
        };
      }
    } while (!isWorkingDay(cursor));

    return {
      dateISO: toISODateString(cursor),
      cutoffApplied: false
    };
  }
}

module.exports = AttendanceSummaryService;
