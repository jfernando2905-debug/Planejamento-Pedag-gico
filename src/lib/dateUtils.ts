/**
 * Utility functions for calculating school weekly planning dates and week numbers.
 */

// Helper to format Date object to YYYY-MM-DD
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format Date object to DD/MM
export function formatDateToDdMm(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// Helper to calculate ISO Week number of the year
export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Calculates Monday to Friday dates for a given date or for the next upcoming week.
 * If reference date is Saturday (6) or Sunday (0), moves to upcoming Monday.
 */
export function getWeekDates(referenceDate: Date = new Date()) {
  const d = new Date(referenceDate);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  let diffToMonday = 0;
  if (dayOfWeek === 0) {
    diffToMonday = 1; // Move to next day (Monday)
  } else if (dayOfWeek === 6) {
    diffToMonday = 2; // Move to Monday (+2 days)
  } else {
    diffToMonday = 1 - dayOfWeek; // e.g., if Wednesday (3), diff is -2
  }

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const terca = new Date(monday);
  terca.setDate(monday.getDate() + 1);

  const quarta = new Date(monday);
  quarta.setDate(monday.getDate() + 2);

  const quinta = new Date(monday);
  quinta.setDate(monday.getDate() + 3);

  const sexta = new Date(monday);
  sexta.setDate(monday.getDate() + 4);

  const weekNum = getWeekNumber(monday);
  const startDdMm = formatDateToDdMm(monday);
  const endDdMm = formatDateToDdMm(sexta);

  return {
    monday,
    terca,
    quarta,
    quinta,
    sexta,
    startDateIso: formatDateToIso(monday),
    endDateIso: formatDateToIso(sexta),
    weekLabel: `Semana ${weekNum} (${startDdMm} à ${endDdMm})`,
    weekNum: `Semana ${weekNum}`,
    daysDdMm: {
      segunda: formatDateToDdMm(monday),
      terca: formatDateToDdMm(terca),
      quarta: formatDateToDdMm(quarta),
      quinta: formatDateToDdMm(quinta),
      sexta: formatDateToDdMm(sexta)
    }
  };
}

/**
 * Recalculates week dates starting from a specific Monday ISO date string (e.g. "2026-08-10")
 */
export function getWeekDatesFromStartDate(startDateStr: string) {
  if (!startDateStr) return getWeekDates();
  const parts = startDateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return getWeekDates(date);
    }
  }
  return getWeekDates();
}
