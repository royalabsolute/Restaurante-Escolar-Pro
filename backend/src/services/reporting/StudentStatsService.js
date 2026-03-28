const database = require('../../config/database');
const AttendanceSummaryService = require('./AttendanceSummaryService');

function normalizeISODate(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

async function getStudentStatistics(options = {}) {
  const {
    studentIds = [],
    referenceDate = new Date()
  } = options;

  let studentFilterClause = '';
  let studentFilterParams = [];
  if (studentIds && studentIds.length > 0) {
    const placeholders = studentIds.map(() => '?').join(',');
    studentFilterClause = ` AND e.id IN (${placeholders})`;
    studentFilterParams = studentIds;
  }

  const students = await database.query(
    `SELECT 
      e.id,
      e.nombre,
      e.apellidos,
      g.nombre AS grado,
      g.jornada,
      e.foto_perfil,
      e.fecha_ingreso,
      u.matricula,
      u.email,
      CASE WHEN u.estado = 'validado' THEN 1 ELSE 0 END AS activo
    FROM estudiantes e
    INNER JOIN usuarios u ON e.usuario_id = u.id
    LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
    WHERE u.estado = 'validado'
      ${studentFilterClause}
    ORDER BY e.apellidos, e.nombre`,
    studentFilterParams
  );

  let attendanceFilterClause = '';
  let attendanceParams = [];
  if (studentIds && studentIds.length > 0) {
    const placeholders = studentIds.map(() => '?').join(',');
    attendanceFilterClause = ` AND estudiante_id IN (${placeholders})`;
    attendanceParams = studentIds;
  }

  const attendanceRows = await database.query(
    `SELECT 
        estudiante_id,
        COUNT(*) AS total_asistencias,
        MIN(fecha) AS primera_fecha
      FROM asistencias
      WHERE validado = 1
        AND rechazado = 0
        ${attendanceFilterClause}
      GROUP BY estudiante_id`,
    attendanceParams
  );

  let justificationFilterClause = '';
  let justificationParams = [];
  if (studentIds && studentIds.length > 0) {
    const placeholders = studentIds.map(() => '?').join(',');
    justificationFilterClause = ` WHERE estudiante_id IN (${placeholders})`;
    justificationParams = studentIds;
  }

  const justificationRows = await database.query(
    `SELECT 
        estudiante_id,
        SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) AS rechazadas,
        MIN(fecha_falta) AS primera_fecha
      FROM justificaciones
      ${justificationFilterClause}
      GROUP BY estudiante_id`,
    justificationParams
  );

  const attendanceMap = new Map();
  for (const row of attendanceRows) {
    attendanceMap.set(row.estudiante_id, {
      total: Number(row.total_asistencias) || 0,
      primeraFecha: normalizeISODate(row.primera_fecha)
    });
  }

  const justificationMap = new Map();
  for (const row of justificationRows) {
    justificationMap.set(row.estudiante_id, {
      aprobadas: Number(row.aprobadas) || 0,
      pendientes: Number(row.pendientes) || 0,
      rechazadas: Number(row.rechazadas) || 0,
      primeraFecha: normalizeISODate(row.primera_fecha)
    });
  }

  const { dateISO: corteISO } = AttendanceSummaryService.getEffectiveEvaluationDate(referenceDate);
  const effectiveCorte = corteISO || new Date().toISOString().split('T')[0];

  const results = students.map((student) => {
    const asistenciaInfo = attendanceMap.get(student.id) || { total: 0, primeraFecha: null };
    const justInfo = justificationMap.get(student.id) || {
      aprobadas: 0,
      pendientes: 0,
      rechazadas: 0,
      primeraFecha: null
    };

    const candidateDates = [
      normalizeISODate(student.fecha_ingreso),
      asistenciaInfo.primeraFecha,
      justInfo.primeraFecha
    ].filter(Boolean).sort();

    let inicioISO = candidateDates.length > 0 ? candidateDates[0] : effectiveCorte;
    if (inicioISO > effectiveCorte) {
      inicioISO = effectiveCorte;
    }

    const oportunidades = AttendanceSummaryService.countWorkingDaysInclusive(inicioISO, effectiveCorte);
    const totalAsistencias = asistenciaInfo.total;
    const faltasTotales = Math.max(oportunidades - totalAsistencias, 0);

    let faltasRestantes = faltasTotales;
    const faltasJustificadas = Math.min(faltasRestantes, justInfo.aprobadas);
    faltasRestantes -= faltasJustificadas;
    const faltasPendientesRevision = Math.min(faltasRestantes, justInfo.pendientes);
    faltasRestantes -= faltasPendientesRevision;
    const faltasSinJustificar = Math.max(faltasRestantes, 0);

    return {
      id: student.id,
      nombre: student.nombre,
      apellidos: student.apellidos,
      grado: student.grado,
      jornada: student.jornada,
      foto_perfil: student.foto_perfil,
      matricula: student.matricula,
      email: student.email,
      activo: Boolean(student.activo),
      total_asistencias: totalAsistencias,
      total_faltas: faltasTotales,
      total_justificaciones: justInfo.aprobadas,
      justificaciones_pendientes: justInfo.pendientes,
      justificaciones_rechazadas: justInfo.rechazadas,
      faltas_justificadas: faltasJustificadas,
      faltas_pendientes_revision: faltasPendientesRevision,
      faltas_sin_justificar: faltasSinJustificar,
      oportunidades_registradas: oportunidades,
      fecha_inicio_registro: inicioISO,
      fecha_corte: effectiveCorte
    };
  });

  return results;
}

module.exports = {
  getStudentStatistics
};
