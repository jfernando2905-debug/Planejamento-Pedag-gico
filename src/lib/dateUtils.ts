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

/**
 * Standard daily school routine template pre-filled with times (13:00 - 17:15)
 */
export const DEFAULT_SCHOOL_ROUTINE = [
  {
    time: '13:00 – 13:20',
    title: 'ROTINA / ACOLHIDA',
    description: '- Higienização: Banheiro e encher as garrafas com água.\n- Rotina: Chamada, calendário, tempo, quantos somos.\n- Devocional.',
    order: 1
  },
  {
    time: '13:20 – 14:10',
    title: 'CONTAÇÃO DE HISTÓRIA / AULA DIRIGIDA',
    description: 'Momento de acolhimento em roda e introdução do tema pedagógico da semana.',
    order: 2
  },
  {
    time: '14:10 – 14:40',
    title: 'LANCHE / HIGIENE',
    description: 'Momento da refeição e higienização das mãos.',
    order: 3
  },
  {
    time: '14:40 – 15:30',
    title: 'AULA BILÍNGUE',
    description: 'Atividades lúdicas e vivências na segunda língua.',
    order: 4
  },
  {
    time: '15:30 – 16:20',
    title: 'AULA ESPORTIVA / ARTES / MUSICALIZAÇÃO',
    description: 'Atividades manuais, corporeidade e expressão plástica ou sonora.',
    order: 5
  },
  {
    time: '16:20 – 16:40',
    title: 'FRUTA / HIGIENE',
    description: 'Intervalo da fruta e uso do banheiro.',
    order: 6
  },
  {
    time: '16:40 – 17:15',
    title: 'ATIVIDADE RECREATIVA / PARQUE',
    description: 'Brincadeira livre ou dirigida no parquinho.',
    order: 7
  },
  {
    time: '17:15',
    title: 'SAÍDA',
    description: 'Organização das mochilas e recepção dos pais ou responsáveis.',
    order: 8
  }
];

export function buildDefaultRoutineForDay(dayPrefix: string) {
  return DEFAULT_SCHOOL_ROUTINE.map((item, idx) => ({
    id: `r-${dayPrefix}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
    ...item
  }));
}

