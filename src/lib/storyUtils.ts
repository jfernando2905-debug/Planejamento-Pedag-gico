import { Story } from '../types';

/**
 * Normalizes a string by converting to lowercase and removing diacritics/accents.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Robust detection helper to identify whether a routine item title is a Story / Storytelling routine.
 * Handles variations in case, accents, and phrasing (e.g., "Contação de História", "Roda de Leitura",
 * "Hora do Conto", "Momento da História", "História Infantil", "Leitura de Livro", etc.).
 */
export function isStoryRoutine(title: string): boolean {
  if (!title || typeof title !== 'string') return false;
  
  const normalized = normalizeText(title);

  // Story-related keywords and patterns (without diacritics)
  const patterns = [
    /contacao/,                  // Contação, contação de histórias, etc.
    /historia/,                  // História, histórias, etc.
    /roda de leitura/,           // Roda de leitura
    /leitura de livro/,          // Leitura de livro
    /leitura/,                   // Leitura
    /hora do conto/,             // Hora do conto
    /momento da historia/,       // Momento da história
    /conto de fadas/,            // Conto de fadas
    /literatura infantil/,       // Literatura infantil
    /livro infantil/,            // Livro infantil
    /fabula/                     // Fábulas
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

/**
 * Extracts a suggested story title from a routine title string.
 * Example: "CONTAÇÃO DE HISTÓRIA: A Menina e o Barquinho" -> "A Menina e o Barquinho"
 * Example: "Roda de Leitura - O Pequeno Príncipe" -> "O Pequeno Príncipe"
 */
export function extractStoryTitleFromRoutine(routineTitle: string): string {
  if (!routineTitle) return '';
  
  const trimmed = routineTitle.trim();
  
  // Check for colon separator: "Contação de História: Nome do Livro"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const candidate = parts.slice(1).join(':').trim();
    if (candidate.length > 0) return candidate;
  }

  // Check for hyphen/dash separator: "Contação de Histórias - Nome do Livro"
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ');
    const candidate = parts.slice(1).join(' - ').trim();
    if (candidate.length > 0) return candidate;
  }

  // If the title itself is not just the generic label, return it
  const normalized = normalizeText(trimmed);
  const genericLabels = [
    'contacao de historia',
    'contacao de historias',
    'contacao de historias / roda de leitura',
    'roda de leitura',
    'hora do conto',
    'momento da historia',
    'historia'
  ];

  if (genericLabels.includes(normalized)) {
    return '';
  }

  return trimmed;
}

/**
 * Checks if a story with a similar or identical title already exists in the given stories bank.
 */
export function findDuplicateStory(stories: Story[], title: string, excludeId?: string): Story | undefined {
  if (!title || !Array.isArray(stories)) return undefined;
  const targetNorm = normalizeText(title);
  if (!targetNorm) return undefined;

  return stories.find((s) => {
    if (!s || (excludeId && s.id === excludeId)) return false;
    const existingNorm = normalizeText(s.title || '');
    return existingNorm === targetNorm;
  });
}
