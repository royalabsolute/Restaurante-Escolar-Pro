const ExcelJS = require('exceljs');

function buildColumnMap(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [
      { id: 'id', label: 'ID' },
      { id: 'nombre', label: 'Nombre' },
      { id: 'apellidos', label: 'Apellidos' },
      { id: 'grado', label: 'Grado' },
      { id: 'jornada', label: 'Jornada' },
      { id: 'matricula', label: 'Matrícula' },
      { id: 'email', label: 'Email' },
      { id: 'fecha_ingreso', label: 'Fecha Ingreso' },
      { id: 'oportunidades', label: 'Oportunidades' },
      { id: 'total_asistencias', label: 'Total Asistencias' },
      { id: 'total_faltas', label: 'Total Faltas' },
      { id: 'faltas_justificadas', label: 'Faltas Justificadas' },
      { id: 'faltas_pendientes_revision', label: 'Faltas Pendientes' },
      { id: 'faltas_sin_justificar', label: 'Faltas Sin Justificar' },
      { id: 'porcentaje_asistencia', label: '% Asistencia' },
      { id: 'justificaciones_rechazadas', label: 'Justificaciones Rechazadas' },
      { id: 'ultima_asistencia', label: 'Última Asistencia' },
      { id: 'ultima_justificacion', label: 'Última Justificación' }
    ];
  }

  return columns.map((column) => ({
    id: column.id,
    label: column.label || column.id
  }));
}

function buildCsvContent(rows, columns) {
  const columnMap = buildColumnMap(columns);
  const headers = columnMap.map((column) => column.label);

  const escape = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    const values = columnMap.map((column) => escape(row[column.id]));
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

async function buildWorkbook(rows, summary, metadata, columns) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Restaurante Escolar';
  workbook.created = new Date();

  const resumenSheet = workbook.addWorksheet('Resumen');

  resumenSheet.columns = [
    { header: 'Métrica', key: 'metrica', width: 32 },
    { header: 'Valor', key: 'valor', width: 30 }
  ];

  const periodo = metadata?.periodo || {};

  resumenSheet.addRows([
    { metrica: 'Periodo - Inicio', valor: periodo.inicio || 'N/D' },
    { metrica: 'Periodo - Fin', valor: periodo.fin || 'N/D' },
    { metrica: 'Total Estudiantes', valor: summary.totalEstudiantes },
    { metrica: 'Total Asistencias', valor: summary.totalAsistencias },
    { metrica: 'Total Faltas', valor: summary.totalFaltas },
    { metrica: 'Faltas Justificadas', valor: summary.totalFaltasJustificadas },
    { metrica: 'Faltas Pendientes', valor: summary.totalFaltasPendientes },
    { metrica: 'Faltas Sin Justificar', valor: summary.totalFaltasSinJustificar },
    { metrica: 'Promedio % Asistencia', valor: summary.promedioAsistencia }
  ]);

  resumenSheet.getRow(1).font = { bold: true };

  if (Array.isArray(summary.distribucionGrado) && summary.distribucionGrado.length > 0) {
    const startRow = resumenSheet.rowCount + 2;
    resumenSheet.getCell(`A${startRow}`).value = 'Distribución por Grado';
    resumenSheet.getCell(`A${startRow}`).font = { bold: true };

    resumenSheet.getCell(`A${startRow + 1}`).value = 'Grado';
    resumenSheet.getCell(`B${startRow + 1}`).value = 'Estudiantes';
    resumenSheet.getCell(`C${startRow + 1}`).value = 'Promedio % Asistencia';
    resumenSheet.getCell(`A${startRow + 1}`).font = { bold: true };
    resumenSheet.getCell(`B${startRow + 1}`).font = { bold: true };
    resumenSheet.getCell(`C${startRow + 1}`).font = { bold: true };

    summary.distribucionGrado.forEach((item, index) => {
      resumenSheet.getCell(`A${startRow + 2 + index}`).value = item.grado;
      resumenSheet.getCell(`B${startRow + 2 + index}`).value = item.estudiantes;
      resumenSheet.getCell(`C${startRow + 2 + index}`).value = item.promedio_asistencia;
    });
  }

  if (Array.isArray(summary.distribucionJornada) && summary.distribucionJornada.length > 0) {
    const startRow = resumenSheet.rowCount + 2;
    resumenSheet.getCell(`A${startRow}`).value = 'Distribución por Jornada';
    resumenSheet.getCell(`A${startRow}`).font = { bold: true };

    resumenSheet.getCell(`A${startRow + 1}`).value = 'Jornada';
    resumenSheet.getCell(`B${startRow + 1}`).value = 'Estudiantes';
    resumenSheet.getCell(`C${startRow + 1}`).value = 'Promedio % Asistencia';
    resumenSheet.getCell(`A${startRow + 1}`).font = { bold: true };
    resumenSheet.getCell(`B${startRow + 1}`).font = { bold: true };
    resumenSheet.getCell(`C${startRow + 1}`).font = { bold: true };

    summary.distribucionJornada.forEach((item, index) => {
      resumenSheet.getCell(`A${startRow + 2 + index}`).value = item.jornada;
      resumenSheet.getCell(`B${startRow + 2 + index}`).value = item.estudiantes;
      resumenSheet.getCell(`C${startRow + 2 + index}`).value = item.promedio_asistencia;
    });
  }

  const columnMap = buildColumnMap(columns);

  const detalleSheet = workbook.addWorksheet('Detalle Estudiantes');
  detalleSheet.columns = columnMap.map((column) => ({
    header: column.label,
    key: column.id,
    width: 18
  }));

  const normalizedRows = rows.map((row) => {
    const record = {};
    columnMap.forEach((column) => {
      record[column.id] = row[column.id];
    });
    return record;
  });

  detalleSheet.addRows(normalizedRows);

  detalleSheet.getRow(1).font = { bold: true };

  return workbook.xlsx.writeBuffer();
}

async function generateCsvBuffer(rows, columns) {
  const csv = buildCsvContent(rows, columns);
  return Buffer.from(csv, 'utf8');
}

async function generateXlsxBuffer(rows, summary, metadata, columns) {
  const buffer = await buildWorkbook(rows, summary, metadata, columns);
  return Buffer.from(buffer);
}

module.exports = {
  generateCsvBuffer,
  generateXlsxBuffer
};
