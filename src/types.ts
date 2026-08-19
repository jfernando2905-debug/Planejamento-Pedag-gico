export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export interface SchoolSettings {
  userId: string;
  schoolName: string;
  logoUrl?: string;
  teacherName: string;
  city: string;
  state: string;
  phone?: string;
  defaultClass?: string;
  defaultPeriod?: string;
}

export interface BNCCItem {
  id: string;
  code: string;
  description: string;
  area: string;
  fieldOfExperience: string; // e.g., 'EO', 'CG', 'TS', 'EF', 'ET'
  fieldName: string; // e.g., 'O eu, o outro e o nós'
  ageGroup: string; // e.g., 'Bebês', 'Crianças bem pequenas', 'Crianças pequenas'
  ageGroupCode: string; // 'EI01', 'EI02', 'EI03'
}

export interface RoutineItem {
  id: string;
  time: string; // e.g., "13:00 – 13:20"
  title: string; // e.g., "ROTINA / ACOLHIDA"
  description: string; // e.g., "- Higienização: Banheiro e encher as garrafas\n- Rotina: Chamada, calendário, tempo, quantos somos\n- Devocional."
  order: number;
  images?: string[]; // Attached images/photos of activity
  storyId?: string; // Optional linked story ID from Story Bank
}

export interface Lesson {
  id: string;
  subject: string; // e.g., "LINGUAGEM", "MATEMÁTICA", "AULA BÍBLICA", "ARTES", "NATUREZA E SOCIEDADE"
  time: string; // e.g., "15:30 – 16:20"
  theme: string; // e.g., "Minhas lembranças das férias", "Numeral 6"
  objectives: string; // General objectives or BNCC objective description
  bnccCodes: string[]; // e.g., ["EI03ET07", "EI03CG02"]
  development: string; // Detailed lesson development text
  materials: string[]; // List of materials used
  notes?: string; // Observações adicionais
  estimatedTime?: string; // e.g., "50 minutos"
  attachments?: string[]; // Links or URLs
  images?: string[]; // Attached images/photos of activity or materials
}

export interface DayPlanning {
  dayName: string; // "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"
  dateStr: string; // "27/07"
  subHeader?: string; // e.g., "PEDAGÓGICA"
  routine: RoutineItem[];
  lessons: Lesson[];
}

export interface WeeklyPlanning {
  id: string;
  userId: string;
  schoolName?: string; // e.g., "Escola de Educação Infantil Cristão de Curitiba"
  className: string; // e.g., "KINDER 3"
  year: string; // e.g., "2026"
  teacher: string; // e.g., "Profe Camila"
  period: string; // e.g., "Vespertino"
  week: string; // e.g., "Semana 26"
  startDate: string; // e.g., "2026-07-27"
  endDate: string; // e.g., "2026-07-31"
  generalTheme: string; // e.g., "Regresso às Aulas e Meios de Transporte"
  project?: string; // e.g., "Projeto Identidade e Meio Ambiente"
  bookWorked?: string; // e.g., "A menina e o Barquinho"
  generalNotes?: string;
  days: {
    segunda: DayPlanning;
    terca: DayPlanning;
    quarta: DayPlanning;
    quinta: DayPlanning;
    sexta: DayPlanning;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SavedLesson {
  id: string;
  userId: string;
  name: string;
  subject: string;
  theme: string;
  objectives: string;
  bnccCodes: string[];
  development: string;
  materials: string[];
  games?: string;
  notes?: string;
  images?: string[];
  isFavorite?: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  author: string;
  description: string;
  objectives: string;
  ageRange: string; // e.g., "3 a 5 anos"
  imageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface Song {
  id: string;
  userId: string;
  name: string;
  author?: string;
  youtubeUrl?: string;
  objective: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface Game {
  id: string;
  userId: string;
  name: string;
  category: string; // e.g., "Circuito Motor", "Simbólica", "Música e Dança", "Raciocínio"
  materials: string;
  description: string;
  objectives: string;
  ageRange: string;
  imageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
}

export interface BibleLesson {
  id: string;
  userId: string;
  title: string;
  passage: string;
  principle: string;
  keyVerse: string;
  objectives: string;
  ageRange: string;
  materials: string;
  development: string;
  imageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
}
