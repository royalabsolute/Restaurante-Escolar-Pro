const HOLIDAYS_BY_YEAR = {
  2024: [
    '2024-01-01', // Año Nuevo
    '2024-01-08', // Reyes Magos (trasladado)
    '2024-03-25', // San José (trasladado)
    '2024-03-28', // Jueves Santo
    '2024-03-29', // Viernes Santo
    '2024-05-01', // Día del Trabajo
    '2024-05-13', // Ascensión del Señor (trasladado)
    '2024-06-03', // Corpus Christi (trasladado)
    '2024-06-10', // Sagrado Corazón (trasladado)
    '2024-07-01', // San Pedro y San Pablo (trasladado)
    '2024-07-20', // Día de la Independencia
    '2024-08-07', // Batalla de Boyacá
    '2024-08-19', // La Asunción (trasladado)
    '2024-10-14', // Día de la Raza (trasladado)
    '2024-11-04', // Todos los Santos (trasladado)
    '2024-11-11', // Independencia de Cartagena (trasladado)
    '2024-12-08', // Inmaculada Concepción
    '2024-12-25' // Navidad
  ],
  2025: [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes Magos
    '2025-03-24', // San José (trasladado)
    '2025-04-17', // Jueves Santo
    '2025-04-18', // Viernes Santo
    '2025-05-01', // Día del Trabajo
    '2025-06-02', // Ascensión del Señor (trasladado)
    '2025-06-23', // Corpus Christi (trasladado)
    '2025-06-30', // Sagrado Corazón (trasladado)
    '2025-07-20', // Día de la Independencia
    '2025-08-07', // Batalla de Boyacá
    '2025-08-18', // La Asunción (trasladado)
    '2025-10-13', // Día de la Raza (trasladado)
    '2025-11-03', // Todos los Santos (trasladado)
    '2025-11-17', // Independencia de Cartagena (trasladado)
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25' // Navidad
  ],
  2026: [
    '2026-01-01', // Año Nuevo
    '2026-01-12', // Reyes Magos (trasladado)
    '2026-03-23', // San José (trasladado)
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
    '2026-05-18', // Ascensión del Señor (trasladado)
    '2026-06-08', // Corpus Christi (trasladado)
    '2026-06-15', // Sagrado Corazón (trasladado)
    '2026-06-29', // San Pedro y San Pablo (trasladado)
    '2026-07-20', // Día de la Independencia
    '2026-08-07', // Batalla de Boyacá
    '2026-08-17', // La Asunción (trasladado)
    '2026-10-12', // Día de la Raza (trasladado)
    '2026-11-02', // Todos los Santos (trasladado)
    '2026-11-16', // Independencia de Cartagena (trasladado)
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25' // Navidad
  ]
};

function normalizeDateInput(input) {
  if (!input) return null;
  if (input instanceof Date) {
    const safe = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
    return safe.toISOString().split('T')[0];
  }
  if (typeof input === 'string') {
    if (input.length === 10) return input;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

function isHoliday(input) {
  const isoDate = normalizeDateInput(input);
  if (!isoDate) return false;
  const year = Number(isoDate.slice(0, 4));
  const holidays = HOLIDAYS_BY_YEAR[year];
  if (!holidays) return false;
  return holidays.includes(isoDate);
}

function getHolidaysForYear(year) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear)) {
    return [];
  }
  return [...(HOLIDAYS_BY_YEAR[numericYear] || [])];
}

function getHolidaysBetween(startDate, endDate) {
  const startISO = normalizeDateInput(startDate);
  const endISO = normalizeDateInput(endDate);
  if (!startISO || !endISO) {
    return [];
  }

  const startYear = Number(startISO.slice(0, 4));
  const endYear = Number(endISO.slice(0, 4));
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    return [];
  }

  const holidays = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const items = HOLIDAYS_BY_YEAR[year];
    if (Array.isArray(items)) {
      holidays.push(...items.filter((iso) => iso >= startISO && iso <= endISO));
    }
  }
  return holidays;
}

function getSupportedYears() {
  return Object.keys(HOLIDAYS_BY_YEAR).map(Number);
}

module.exports = {
  HOLIDAYS_BY_YEAR,
  isHoliday,
  getHolidaysForYear,
  getHolidaysBetween,
  getSupportedYears
};
