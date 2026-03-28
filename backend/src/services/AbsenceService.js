const database = require('../config/database');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Justification = require('../models/Justification');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const { isHoliday } = require('../utils/holidayUtils');

class AbsenceService {
  static lastProcessedISO = null;
  static processingPromise = null;
  static parseISODate(isoDate) {
    if (!isoDate) return null;
    if (isoDate instanceof Date) {
      return new Date(Date.UTC(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate()));
    }
    const [year, month, day] = isoDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }

  static toISODate(date) {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.includes('T') ? date.split('T')[0] : date;
    }
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static isWeekend(date) {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  }

  static isNonWorkingDay(dateInput) {
    const reference = dateInput instanceof Date
      ? new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()))
      : AbsenceService.parseISODate(dateInput);

    if (!reference) {
      return false;
    }

    if (AbsenceService.isWeekend(reference)) {
      return true;
    }

    return isHoliday(AbsenceService.toISODate(reference));
  }

  static countBusinessDays(startInclusive, endInclusive) {
    if (!startInclusive || !endInclusive) return 0;
    const start = new Date(Date.UTC(
      startInclusive.getUTCFullYear(),
      startInclusive.getUTCMonth(),
      startInclusive.getUTCDate()
    ));
    const end = new Date(Date.UTC(
      endInclusive.getUTCFullYear(),
      endInclusive.getUTCMonth(),
      endInclusive.getUTCDate()
    ));

    let counter = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      if (!AbsenceService.isNonWorkingDay(cursor)) {
        counter += 1;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return counter;
  }

  static subtractBusinessDay(date, days = 1) {
    const result = new Date(date);
    let remaining = days;
    while (remaining > 0) {
      result.setUTCDate(result.getUTCDate() - 1);
      if (!AbsenceService.isNonWorkingDay(result)) {
        remaining -= 1;
      }
    }
    return result;
  }

  static async getLastNonAbsenceDate(studentId, targetISO) {
    const [attendance] = await database.query(
      `SELECT fecha FROM asistencias 
       WHERE estudiante_id = ? AND fecha <= ? AND validado = 1 AND rechazado = 0
       ORDER BY fecha DESC
       LIMIT 1`,
      [studentId, targetISO]
    );

    const [justification] = await database.query(
      `SELECT fecha_falta as fecha FROM justificaciones
       WHERE estudiante_id = ? AND fecha_falta <= ? AND estado = 'aprobada'
       ORDER BY fecha_falta DESC
       LIMIT 1`,
      [studentId, targetISO]
    );

    const attendanceDate = attendance?.fecha ? AbsenceService.parseISODate(AbsenceService.toISODate(attendance.fecha)) : null;
    const justificationDate = justification?.fecha ? AbsenceService.parseISODate(AbsenceService.toISODate(justification.fecha)) : null;

    if (attendanceDate && justificationDate) {
      return attendanceDate > justificationDate ? attendanceDate : justificationDate;
    }

    return attendanceDate || justificationDate || null;
  }

  static async calculateConsecutiveAbsences(student, targetISO) {
    const { id: studentId, fecha_ingreso: rawIngreso } = student;
    const targetDate = AbsenceService.parseISODate(targetISO);
    if (!targetDate) return 0;

    if (!rawIngreso) return 0;

    const ingresoISO = typeof rawIngreso === 'string'
      ? rawIngreso
      : AbsenceService.toISODate(rawIngreso);

    if (!ingresoISO) {
      return 0;
    }

    const ingresoDate = AbsenceService.parseISODate(ingresoISO);

    if (!ingresoDate) {
      return 0;
    }

    if (targetDate < ingresoDate) {
      return 0;
    }

    const lastNonAbsenceDate = await AbsenceService.getLastNonAbsenceDate(studentId, targetISO);

    const referenceStart = lastNonAbsenceDate
      ? new Date(lastNonAbsenceDate)
      : new Date(ingresoDate.getTime() - 24 * 60 * 60 * 1000);

    const current = new Date(referenceStart);
    current.setUTCDate(current.getUTCDate() + 1);

    let consecutive = 0;

    while (current <= targetDate) {
      if (AbsenceService.isNonWorkingDay(current)) {
        current.setUTCDate(current.getUTCDate() + 1);
        continue;
      }

      const isoCurrent = AbsenceService.toISODate(current);
      const attendance = await Attendance.checkAttendance(studentId, isoCurrent);
      if (attendance) {
        consecutive = 0;
        break;
      }

      const justification = await Justification.checkJustifiedAbsence(studentId, isoCurrent);
      if (justification) {
        consecutive = 0;
        break;
      }

      consecutive += 1;
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return consecutive;
  }

  static async processDailyAbsences({ targetDate = null, dryRun = false } = {}) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let referenceDate;
    if (targetDate) {
      referenceDate = typeof targetDate === 'string'
        ? AbsenceService.parseISODate(targetDate)
        : new Date(targetDate);
    } else {
      referenceDate = AbsenceService.subtractBusinessDay(today, 1);
    }

    if (!referenceDate) {
      throw new Error('Fecha de referencia inválida para procesar ausencias');
    }

    referenceDate.setUTCHours(0, 0, 0, 0);

    if (referenceDate > today) {
      throw new Error('No es posible procesar ausencias para fechas futuras');
    }

    if (AbsenceService.isNonWorkingDay(referenceDate)) {
      const reason = AbsenceService.isWeekend(referenceDate) ? 'WEEKEND' : 'HOLIDAY';
      return {
        status: 'SKIPPED',
        reason,
        processedDate: AbsenceService.toISODate(referenceDate),
        totalStudentsEvaluated: 0,
        updates: 0,
        suspended: []
      };
    }

    const targetISO = AbsenceService.toISODate(referenceDate);

    if (!dryRun && AbsenceService.lastProcessedISO === targetISO) {
      return {
        status: 'SKIPPED',
        reason: 'ALREADY_PROCESSED',
        processedDate: targetISO,
        totalStudentsEvaluated: 0,
        updates: 0,
        suspended: []
      };
    }

    if (!dryRun && AbsenceService.processingPromise) {
      await AbsenceService.processingPromise.catch(() => { });
    }

    const limit = await Student.getMaxConsecutiveAbsences();

    const execution = AbsenceService.performProcessing({
      referenceDate,
      targetISO,
      limit,
      dryRun
    });

    if (!dryRun) {
      AbsenceService.processingPromise = execution;
    }

    try {
      const result = await execution;

      if (!dryRun) {
        AbsenceService.lastProcessedISO = result.processedDate;
      }

      return result;
    } finally {
      if (!dryRun) {
        AbsenceService.processingPromise = null;
      }
    }
  }

  static async performProcessing({ referenceDate, targetISO, limit, dryRun }) {
    const students = await database.query(`
      SELECT e.id, e.nombre, e.apellidos, e.fecha_ingreso, e.faltas_consecutivas,
             u.id as usuario_id, u.email as usuario_email, u.estado as usuario_estado,
             a.email as acudiente_email, a.nombre as acudiente_nombre, a.apellidos as acudiente_apellidos
      FROM estudiantes e
      JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN acudientes a ON e.id = a.estudiante_id
      WHERE u.rol = 'estudiante'
        AND u.estado IN ('validado', 'suspendido')
    `);

    let updates = 0;
    const suspendedStudents = [];

    for (const student of students) {
      const fechaIngresoISO = AbsenceService.toISODate(student.fecha_ingreso);

      if (!fechaIngresoISO) {
        continue;
      }

      if (fechaIngresoISO > targetISO) {
        continue;
      }

      const consecutive = await AbsenceService.calculateConsecutiveAbsences(student, targetISO);

      if (Number.isInteger(consecutive) && consecutive !== student.faltas_consecutivas) {
        if (!dryRun) {
          await Student.setConsecutiveAbsences(student.id, consecutive);
        }
        updates += 1;
      }

      const shouldSuspend = consecutive >= limit && student.usuario_estado !== 'suspendido';

      if (shouldSuspend) {
        suspendedStudents.push({
          studentId: student.id,
          usuarioId: student.usuario_id,
          nombre: student.nombre,
          apellidos: student.apellidos,
          email: student.usuario_email,
          acudiente_email: student.acudiente_email,
          acudiente_nombre: student.acudiente_nombre,
          acudiente_apellidos: student.acudiente_apellidos,
          faltas_consecutivas: consecutive
        });

        if (!dryRun) {
          const motivo = `Suspensión automática por ${consecutive} faltas consecutivas registradas al ${targetISO}`;
          await User.updateStatusWithReason(student.usuario_id, 'suspendido', motivo);

          const formattedDate = referenceDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          try {
            const html = await emailService.loadTemplate('suspension-faltas-consecutivas', {
              nombre_estudiante: `${student.nombre} ${student.apellidos}`.trim(),
              fecha_suspension: formattedDate,
              faltas_consecutivas: consecutive,
              limite_faltas: limit
            });

            if (student.usuario_email) {
              await emailService.sendEmail({
                to: student.usuario_email,
                subject: 'Suspensión temporal por inasistencias consecutivas',
                html
              });
            }

            if (student.acudiente_email) {
              await emailService.sendEmail({
                to: student.acudiente_email,
                subject: `Suspensión temporal - ${student.nombre} ${student.apellidos}`,
                html
              });
            }
          } catch (emailError) {
            console.error('⚠️ Error enviando email de suspensión:', emailError.message);
          }
        }
      } else if (consecutive === limit - 1 && student.usuario_estado !== 'suspendido') {
        // ✅ MEJORA 4: Notificación Inteligente de Advertencia
        if (!dryRun) {
          try {
            const html = await emailService.loadTemplate('advertencia-inasistencia', {
              nombre_estudiante: `${student.nombre} ${student.apellidos}`.trim(),
              faltas_consecutivas: consecutive,
              limite_faltas: limit
            });

            if (student.usuario_email) {
              await emailService.sendEmail({
                to: student.usuario_email,
                subject: '⚠️ Importante: Advertencia de inasistencias consecutivas',
                html
              });
            }

            if (student.acudiente_email) {
              await emailService.sendEmail({
                to: student.acudiente_email,
                subject: `⚠️ Advertencia de Inasistencia - ${student.nombre} ${student.apellidos}`,
                html
              });
            }
          } catch (warningError) {
            console.error('⚠️ Error enviando email de advertencia:', warningError.message);
          }
        }
      }
    }

    return {
      status: 'PROCESSED',
      processedDate: targetISO,
      totalStudentsEvaluated: students.length,
      updates,
      suspended: suspendedStudents,
      limit
    };
  }
}

module.exports = AbsenceService;
