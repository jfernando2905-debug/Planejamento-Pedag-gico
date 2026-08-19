import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FileDown, 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  BookOpen, 
  Sparkles, 
  FileCheck, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Boxes,
  ExternalLink,
  Layers,
  Calendar,
  Eye,
  BookMarked,
  BookOpenCheck,
  ArrowLeft,
  X,
  AlertTriangle,
  FolderPlus,
  FolderDown,
  Search,
  ListChecks,
  RefreshCw
} from 'lucide-react';
import { getWeekDatesFromStartDate, buildDefaultRoutineForDay, formatIsoToBrDate } from '../lib/dateUtils';
import { convertPlainTextToHtml } from '../lib/richTextUtils';
import { 
  WeeklyPlanning, 
  DayPlanning, 
  RoutineItem, 
  Lesson, 
  SchoolSettings,
  SavedLesson,
  Story,
  BibleLesson
} from '../types';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploader } from './ImageUploader';
import { BnccSelectorModal } from './BnccSelectorModal';
import { PlanningPreviewModal } from './PlanningPreviewModal';
import { StorySelectorModal } from './StorySelectorModal';
import { BibleLessonSelectorModal } from './BibleLessonSelectorModal';
import { RoutinePresetModal } from './RoutinePresetModal';
import { generatePlanningPDF } from '../lib/pdfExport';
import { generatePlanningDOCX } from '../lib/docxExport';
import { DEFAULT_MATERIALS } from '../data/materialsData';

interface PlanningEditorProps {
  currentPlanning: WeeklyPlanning;
  onChangePlanning: (planning: WeeklyPlanning) => void;
  onSaveFirebase: (planning: WeeklyPlanning) => void;
  settings: SchoolSettings | null;
  onOpenAiAssistant: () => void;
  savedLessons: SavedLesson[];
  onSaveLessonToBank?: (lesson: SavedLesson) => void;
  stories?: Story[];
  bibleLessons?: BibleLesson[];
  onClose?: () => void;
  onDiscardChanges?: () => void;
}

const DAYS_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'] as const;
type DayKey = typeof DAYS_KEYS[number];

const DAY_LABELS: Record<DayKey, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira'
};

const SUBJECT_OPTIONS = [
  'LINGUAGEM',
  'MATEMÁTICA',
  'ARTES',
  'NATUREZA E SOCIEDADE',
  'MUSICALIZAÇÃO',
  'AULA BÍBLICA / DEVOCIONAL',
  'BILÍNGUE',
  'CONTAÇÃO DE HISTÓRIA',
  'ATIVIDADE RECREATIVA',
  'EDUCAÇÃO FÍSICA'
];

export const PlanningEditor: React.FC<PlanningEditorProps> = ({
  currentPlanning,
  onChangePlanning,
  onSaveFirebase,
  settings,
  onOpenAiAssistant,
  savedLessons,
  onSaveLessonToBank,
  stories = [],
  bibleLessons = [],
  onClose,
  onDiscardChanges
}) => {
  const [activeDayKey, setActiveDayKey] = useState<DayKey>('segunda');
  const [bnccModalOpen, setBnccModalOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('Salvo');
  const [showImportLessonModal, setShowImportLessonModal] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  
  // Toast & Import Modal states
  const [toastMessage, setToastMessage] = useState<string>('');
  const [importSearchTerm, setImportSearchTerm] = useState<string>('');
  const [importSubjectFilter, setImportSubjectFilter] = useState<string>('todos');
  const [importPreviewLesson, setImportPreviewLesson] = useState<SavedLesson | null>(null);

  // Block AI Assistant States
  const [generatingRoutineId, setGeneratingRoutineId] = useState<string | null>(null);
  const [blockAiModalLesson, setBlockAiModalLesson] = useState<Lesson | null>(null);
  const [blockAiPrompt, setBlockAiPrompt] = useState<string>('');
  const [isGeneratingBlockLesson, setIsGeneratingBlockLesson] = useState<boolean>(false);

  // Retractable Title Model Preset State
  const [expandedTitleItemId, setExpandedTitleItemId] = useState<string | null>(null);

  // AI Handler for individual Routine Block
  const handleGenerateRoutineWithAi = async (routineItem: RoutineItem) => {
    setGeneratingRoutineId(routineItem.id);
    try {
      const res = await fetch('/api/ai/generate-routine-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: routineItem.title,
          time: routineItem.time,
          prompt: routineItem.description || routineItem.title,
          ageGroup: currentPlanning.className || settings?.defaultClass || 'KINDER 3'
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar descrição da rotina com IA');
      }
      handleUpdateRoutine(routineItem.id, 'description', data.description);
      setToastMessage(`Descrição da rotina "${routineItem.title || 'Rotina'}" gerada com IA!`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err: any) {
      alert(err?.message || 'Falha ao gerar rotina com IA');
    } finally {
      setGeneratingRoutineId(null);
    }
  };

  // AI Handler for individual Lesson Block
  const handleGenerateBlockLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockAiModalLesson) return;

    setIsGeneratingBlockLesson(true);
    try {
      const res = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: blockAiPrompt || blockAiModalLesson.theme || blockAiModalLesson.subject,
          subject: blockAiModalLesson.subject,
          theme: blockAiModalLesson.theme,
          ageGroup: currentPlanning.className || settings?.defaultClass || 'KINDER 3'
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao gerar aula');
      }

      const aiLesson = data.lesson;
      const updatedLesson: Lesson = {
        ...blockAiModalLesson,
        subject: aiLesson.disciplina || blockAiModalLesson.subject,
        theme: aiLesson.nome || aiLesson.tema || blockAiModalLesson.theme,
        objectives: aiLesson.objetivos || blockAiModalLesson.objectives,
        bnccCodes: aiLesson.bnccCodes || blockAiModalLesson.bnccCodes,
        development: aiLesson.desenvolvimento || blockAiModalLesson.development,
        materials: aiLesson.materiais || blockAiModalLesson.materials,
        notes: aiLesson.observacoes || blockAiModalLesson.notes
      };

      const currentDayObj = currentPlanning.days[activeDayKey];
      const updatedLessons = currentDayObj.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l);
      updateDayField({
        ...currentDayObj,
        lessons: updatedLessons
      });

      // Save to lesson bank as well
      if (onSaveLessonToBank) {
        onSaveLessonToBank({
          id: `ai-block-${Date.now()}`,
          userId: 'current-user',
          name: updatedLesson.theme || updatedLesson.subject,
          subject: updatedLesson.subject,
          theme: updatedLesson.theme,
          objectives: updatedLesson.objectives,
          bnccCodes: updatedLesson.bnccCodes,
          development: updatedLesson.development,
          materials: updatedLesson.materials,
          notes: updatedLesson.notes,
          createdAt: new Date().toISOString()
        });
      }

      setToastMessage(`Aula das ${updatedLesson.time} gerada com IA e preenchida!`);
      setTimeout(() => setToastMessage(''), 3500);
      setBlockAiModalLesson(null);
      setBlockAiPrompt('');
    } catch (err: any) {
      alert(err?.message || 'Falha ao gerar conteúdo da aula com IA');
    } finally {
      setIsGeneratingBlockLesson(false);
    }
  };

  // Export lesson from planning to Bank
  const handleExportLessonToBank = (lesson: Lesson) => {
    const saved: SavedLesson = {
      id: `exported-${Date.now()}`,
      userId: 'current-user',
      name: lesson.theme || lesson.subject || 'Aula do Planejamento',
      subject: lesson.subject || 'LINGUAGEM',
      theme: lesson.theme || '',
      objectives: lesson.objectives || '',
      bnccCodes: lesson.bnccCodes || [],
      development: lesson.development || '',
      materials: lesson.materials || [],
      notes: lesson.notes || '',
      createdAt: new Date().toISOString()
    };

    if (onSaveLessonToBank) {
      onSaveLessonToBank(saved);
    }
    setToastMessage(`Aula "${saved.name}" exportada com sucesso para o Banco de Aulas!`);
    setTimeout(() => setToastMessage(''), 3500);
  };
  
  // Track saved snapshot to detect unsaved modifications
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => JSON.stringify(currentPlanning));

  useEffect(() => {
    // When switching to a different planning, reset initial snapshot
    setLastSavedSnapshot(JSON.stringify(currentPlanning));
  }, [currentPlanning.id]);

  const isDirty = JSON.stringify(currentPlanning) !== lastSavedSnapshot;

  const handleSave = () => {
    onSaveFirebase(currentPlanning);
    setLastSavedSnapshot(JSON.stringify(currentPlanning));
    setSaveStatus('Salvo com sucesso!');
  };

  const handleCloseEditor = () => {
    if (isDirty) {
      setUnsavedModalOpen(true);
    } else if (onClose) {
      onClose();
    }
  };

  const [storySelectorTarget, setStorySelectorTarget] = useState<{
    type: 'routine' | 'lesson';
    id: string;
    targetTitle?: string;
  } | null>(null);

  const [routinePresetTarget, setRoutinePresetTarget] = useState<{
    routineId: string;
    mode: 'title' | 'description';
    currentValue: string;
  } | null>(null);

  const handleSelectRoutinePreset = (selectedValue: string, append?: boolean) => {
    if (!routinePresetTarget) return;
    const { routineId, mode, currentValue } = routinePresetTarget;

    if (mode === 'title') {
      handleUpdateRoutine(routineId, 'title', selectedValue);
    } else if (mode === 'description') {
      const presetHtml = convertPlainTextToHtml(selectedValue);
      if (append && currentValue && currentValue.trim().length > 0) {
        const curHtml = convertPlainTextToHtml(currentValue);
        handleUpdateRoutine(routineId, 'description', `${curHtml}${presetHtml}`);
      } else {
        handleUpdateRoutine(routineId, 'description', presetHtml);
      }
    }
  };

  const handleSelectStoryForTarget = (story: Story) => {
    if (!storySelectorTarget) return;

    const { type, id } = storySelectorTarget;
    const currentDay = currentPlanning.days[activeDayKey];

    if (type === 'routine') {
      const updatedRoutine = currentDay.routine.map((item) => {
        if (item.id !== id) return item;

        const newTitle = item.title && item.title.trim() !== '' 
          ? (item.title.toLowerCase().includes(story.title.toLowerCase()) ? item.title : `${item.title}: ${story.title}`)
          : `CONTAÇÃO DE HISTÓRIA: ${story.title}`;

        const storyDetails = `<p><strong>📖 História:</strong> "${story.title}" (${story.author || 'Autor desconhecido'})</p><p><strong>Sinopse:</strong> ${story.description}</p>${story.objectives ? `<p><strong>Objetivos:</strong> ${story.objectives}</p>` : ''}`;
        const newDesc = item.description ? `${storyDetails}<br/>${convertPlainTextToHtml(item.description)}` : storyDetails;

        const images = [...(item.images || [])];
        if (story.imageUrl && !images.includes(story.imageUrl)) {
          images.push(story.imageUrl);
        }

        return {
          ...item,
          title: newTitle,
          description: newDesc,
          images,
        };
      });

      const updatedDay = { ...currentDay, routine: updatedRoutine };
      const updatedPlanning = {
        ...currentPlanning,
        days: { ...currentPlanning.days, [activeDayKey]: updatedDay }
      };
      onChangePlanning(updatedPlanning);
    } else if (type === 'lesson') {
      const updatedLessons = currentDay.lessons.map((lesson) => {
        if (lesson.id !== id) return lesson;

        const storyDev = `<p><strong>📖 Livro / História:</strong> ${story.title} ${story.author ? `(Autor: ${story.author})` : ''}</p><p><strong>Faixa Etária:</strong> ${story.ageRange || 'Educação Infantil'}</p><p><strong>Sinopse:</strong> ${story.description}</p>${story.objectives ? `<p><strong>Objetivos Pedagógicos:</strong> ${story.objectives}</p>` : ''}<br/>${lesson.development || ''}`;

        const images = [...(lesson.images || [])];
        if (story.imageUrl && !images.includes(story.imageUrl)) {
          images.push(story.imageUrl);
        }

        return {
          ...lesson,
          theme: story.title,
          objectives: lesson.objectives ? `${lesson.objectives}\n${story.objectives}` : (story.objectives || lesson.objectives),
          development: storyDev,
          images,
        };
      });

      const updatedDay = { ...currentDay, lessons: updatedLessons };
      const updatedPlanning = {
        ...currentPlanning,
        days: { ...currentPlanning.days, [activeDayKey]: updatedDay }
      };
      onChangePlanning(updatedPlanning);
    }

    setStorySelectorTarget(null);
  };

  const [bibleSelectorTarget, setBibleSelectorTarget] = useState<{
    type: 'routine' | 'lesson';
    id: string;
    targetTitle?: string;
  } | null>(null);

  const handleSelectBibleLessonForTarget = (bLesson: BibleLesson) => {
    if (!bibleSelectorTarget) return;

    const { type, id } = bibleSelectorTarget;
    const currentDay = currentPlanning.days[activeDayKey];

    if (type === 'routine') {
      const updatedRoutine = currentDay.routine.map((item) => {
        if (item.id !== id) return item;

        const newTitle = item.title && item.title.trim() !== '' 
          ? (item.title.toLowerCase().includes(bLesson.title.toLowerCase()) ? item.title : `AULA BÍBLICA: ${bLesson.title}`)
          : `AULA BÍBLICA: ${bLesson.title}`;

        const passageText = bLesson.passage ? `<p><strong>📖 Passagem:</strong> ${bLesson.passage}</p>` : '';
        const principleText = bLesson.principle ? `<p><strong>✨ Princípio:</strong> ${bLesson.principle}</p>` : '';
        const verseText = bLesson.keyVerse ? `<p><strong>💬 Versículo:</strong> "${bLesson.keyVerse}"</p>` : '';
        const objText = bLesson.objectives ? `<p><strong>📌 Objetivos:</strong></p>${convertPlainTextToHtml(bLesson.objectives)}` : '';
        const matText = bLesson.materials ? `<p><strong>🎨 Materiais:</strong> ${bLesson.materials}</p>` : '';
        const devText = bLesson.development ? `<p><strong>📝 Desenvolvimento:</strong></p>${convertPlainTextToHtml(bLesson.development)}` : '';

        const fullDesc = `${passageText}${principleText}${verseText}${objText}${matText}${devText}`.trim();
        const finalDesc = item.description ? `${fullDesc}<br/>${convertPlainTextToHtml(item.description)}` : fullDesc;

        return {
          ...item,
          title: newTitle,
          description: finalDesc,
        };
      });

      const updatedDay = { ...currentDay, routine: updatedRoutine };
      const updatedPlanning = {
        ...currentPlanning,
        days: { ...currentPlanning.days, [activeDayKey]: updatedDay }
      };
      onChangePlanning(updatedPlanning);
    } else if (type === 'lesson') {
      const updatedLessons = currentDay.lessons.map((lesson) => {
        if (lesson.id !== id) return lesson;

        const bibleDev = `<p><strong>📖 Passagem Bíblica:</strong> ${bLesson.passage || 'Bíblia Sagrada'}</p>${bLesson.principle ? `<p><strong>✨ Princípio:</strong> ${bLesson.principle}</p>` : ''}${bLesson.keyVerse ? `<p><strong>💬 Versículo Chave:</strong> "${bLesson.keyVerse}"</p>` : ''}<br/>${bLesson.development || ''}`;

        return {
          ...lesson,
          subject: 'AULA BÍBLICA / DEVOCIONAL',
          theme: bLesson.title,
          objectives: bLesson.objectives + (bLesson.keyVerse ? `\n\nVersículo Chave: "${bLesson.keyVerse}"` : ''),
          development: bibleDev,
          materials: bLesson.materials ? [bLesson.materials] : lesson.materials,
        };
      });

      const updatedDay = { ...currentDay, lessons: updatedLessons };
      const updatedPlanning = {
        ...currentPlanning,
        days: { ...currentPlanning.days, [activeDayKey]: updatedDay }
      };
      onChangePlanning(updatedPlanning);
    }

    setBibleSelectorTarget(null);
  };

  const handleExportPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generatePlanningPDF(currentPlanning, settings || undefined);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsGeneratingDocx(true);
      await generatePlanningDOCX(currentPlanning, settings || undefined);
    } catch (err) {
      console.error('Erro ao gerar DOCX:', err);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Save status indicator sync
  useEffect(() => {
    if (isDirty) {
      setSaveStatus('Alterações pendentes');
    } else {
      setSaveStatus('Salvo com sucesso');
    }
  }, [isDirty]);

  // Fill default 13:00 - 17:15 school routine for active day
  const handleFillDefaultRoutine = (dayKey: DayKey) => {
    const dayObj = currentPlanning.days[dayKey] || {
      dayName: DAY_LABELS[dayKey],
      dateStr: '',
      routine: [],
      lessons: []
    };
    const defaultItems = buildDefaultRoutineForDay(dayKey.substring(0, 3));
    updateDayField({
      ...dayObj,
      routine: defaultItems
    });
    setToastMessage(`Rotina padrão (13:00 às 17:15) preenchida para ${DAY_LABELS[dayKey]}!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Update Top General Info
  const updateGeneralField = (field: keyof WeeklyPlanning, value: any) => {
    onChangePlanning({
      ...currentPlanning,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  // Recalculate and auto-populate week dates for Monday-Friday
  const handleAutoRecalculateDates = (customStartDate?: string) => {
    const refDateStr = customStartDate || currentPlanning.startDate || new Date().toISOString().split('T')[0];
    const weekData = getWeekDatesFromStartDate(refDateStr);

    const safeDays = (currentPlanning.days || {}) as WeeklyPlanning['days'];

    const updatedDays = {
      segunda: { ...(safeDays.segunda || { dayName: 'Segunda-feira', routine: [], lessons: [] }), dateStr: weekData.daysDdMm.segunda },
      terca: { ...(safeDays.terca || { dayName: 'Terça-feira', routine: [], lessons: [] }), dateStr: weekData.daysDdMm.terca },
      quarta: { ...(safeDays.quarta || { dayName: 'Quarta-feira', routine: [], lessons: [] }), dateStr: weekData.daysDdMm.quarta },
      quinta: { ...(safeDays.quinta || { dayName: 'Quinta-feira', routine: [], lessons: [] }), dateStr: weekData.daysDdMm.quinta },
      sexta: { ...(safeDays.sexta || { dayName: 'Sexta-feira', routine: [], lessons: [] }), dateStr: weekData.daysDdMm.sexta },
    };

    const updatedPlanning: WeeklyPlanning = {
      ...currentPlanning,
      startDate: weekData.startDateIso,
      endDate: weekData.endDateIso,
      year: new Date(weekData.monday).getFullYear().toString(),
      week: weekData.weekLabel,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    };

    onChangePlanning(updatedPlanning);
    setToastMessage(`Datas atualizadas (${weekData.daysDdMm.segunda} a ${weekData.daysDdMm.sexta})!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper for current day
  const currentDay = currentPlanning.days[activeDayKey] || {
    dayName: DAY_LABELS[activeDayKey],
    dateStr: '',
    routine: [],
    lessons: []
  };

  const updateDayField = (updatedDay: DayPlanning) => {
    onChangePlanning({
      ...currentPlanning,
      days: {
        ...currentPlanning.days,
        [activeDayKey]: updatedDay
      },
      updatedAt: new Date().toISOString()
    });
  };

  // Routine Handlers
  const handleAddRoutine = () => {
    const newItem: RoutineItem = {
      id: `r-${Date.now()}`,
      time: '13:00 – 13:20',
      title: 'NOVA ROTINA',
      description: '- Higienização\n- Chamada',
      order: currentDay.routine.length + 1
    };
    updateDayField({
      ...currentDay,
      routine: [...currentDay.routine, newItem]
    });
  };

  const handleUpdateRoutine = (id: string, field: keyof RoutineItem, value: any) => {
    const routineList = currentDay.routine || [];
    const updated = routineList.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateDayField({ ...currentDay, routine: updated });
  };

  const handleDeleteRoutine = (id: string) => {
    const routineList = currentDay.routine || [];
    updateDayField({
      ...currentDay,
      routine: routineList.filter(item => item.id !== id)
    });
  };

  const handleDuplicateRoutine = (item: RoutineItem) => {
    const duplicated: RoutineItem = {
      ...item,
      id: `r-${Date.now()}`,
      title: `${item.title} (Cópia)`
    };
    const routineList = currentDay.routine || [];
    updateDayField({
      ...currentDay,
      routine: [...routineList, duplicated]
    });
  };

  const handleMoveRoutine = (index: number, direction: 'up' | 'down') => {
    const newRoutine = [...(currentDay.routine || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRoutine.length) return;

    const temp = newRoutine[index];
    newRoutine[index] = newRoutine[targetIndex];
    newRoutine[targetIndex] = temp;

    updateDayField({ ...currentDay, routine: newRoutine });
  };

  // Lesson Handlers
  const handleAddLesson = () => {
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      subject: 'LINGUAGEM',
      time: '15:30 – 16:20',
      theme: 'Tema da Aula',
      objectives: 'Desenvolver oralidade e coordenação',
      bnccCodes: ['EI03EF01'],
      development: 'Iniciarei a aula com uma roda de conversa...',
      materials: ['Cartolina', 'Lápis de cor'],
      notes: ''
    };
    const lessonsList = currentDay.lessons || [];
    updateDayField({
      ...currentDay,
      lessons: [...lessonsList, newLesson]
    });
  };

  const handleUpdateLesson = (id: string, field: keyof Lesson, value: any) => {
    const lessonsList = currentDay.lessons || [];
    const updated = lessonsList.map(l => l.id === id ? { ...l, [field]: value } : l);
    updateDayField({ ...currentDay, lessons: updated });
  };

  const handleDeleteLesson = (id: string) => {
    const lessonsList = currentDay.lessons || [];
    updateDayField({
      ...currentDay,
      lessons: lessonsList.filter(l => l.id !== id)
    });
  };

  const handleDuplicateLesson = (lesson: Lesson) => {
    const duplicated: Lesson = {
      ...lesson,
      id: `l-${Date.now()}`,
      theme: `${lesson.theme} (Cópia)`
    };
    updateDayField({
      ...currentDay,
      lessons: [...currentDay.lessons, duplicated]
    });
  };

  // BNCC Selection Modal trigger
  const openBnccForLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setBnccModalOpen(true);
  };

  const handleApplyBnccCodes = (codes: string[]) => {
    if (activeLessonId) {
      handleUpdateLesson(activeLessonId, 'bnccCodes', codes);
    }
  };

  // Import lesson from Bank
  const handleImportSavedLesson = (saved: SavedLesson) => {
    const importedLesson: Lesson = {
      id: `l-${Date.now()}`,
      subject: saved.subject || 'LINGUAGEM',
      time: '14:00 – 15:00',
      theme: saved.theme || saved.name,
      objectives: saved.objectives || '',
      bnccCodes: saved.bnccCodes || [],
      development: saved.development || '',
      materials: saved.materials || [],
      notes: saved.notes || ''
    };
    updateDayField({
      ...currentDay,
      lessons: [...currentDay.lessons, importedLesson]
    });
    setToastMessage(`Aula "${saved.name}" inserida com sucesso em ${DAY_LABELS[activeDayKey]}!`);
    setTimeout(() => setToastMessage(''), 3500);
    setShowImportLessonModal(false);
    setImportPreviewLesson(null);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Top Action Bar - Clean Non-Sticky Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6 transition-all flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              id="planning-close-btn"
              onClick={handleCloseEditor}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0"
              title="Fechar / Voltar aos Planejamentos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {currentPlanning.schoolName || settings?.schoolName ? `${currentPlanning.schoolName || settings?.schoolName} • ` : ''}
              {currentPlanning.className || 'Nova Turma'} – {currentPlanning.week || 'Semana'}
            </h1>
            <div className="text-xs flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-slate-500 dark:text-slate-400">
                Profe: <strong className="text-slate-700 dark:text-slate-200">{currentPlanning.teacher || settings?.teacherName || 'Professor(a)'}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                • Turno: <strong className="text-slate-700 dark:text-slate-200">{currentPlanning.period || settings?.defaultPeriod || 'Vespertino'}</strong>
              </span>
              {currentPlanning.startDate && (
                <span className="text-slate-400 dark:text-slate-500">
                  ({formatIsoToBrDate(currentPlanning.startDate)} a {formatIsoToBrDate(currentPlanning.endDate)})
                </span>
              )}
              {isDirty ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Alterações não salvas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Visualizar Impressão */}
          <button
            id="planning-preview-btn"
            onClick={() => setPreviewModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar Impressão</span>
          </button>

          {/* Export PDF */}
          <button
            id="planning-export-pdf-btn"
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}</span>
          </button>

          {/* Export DOCX */}
          <button
            id="planning-export-docx-btn"
            onClick={handleExportDocx}
            disabled={isGeneratingDocx}
            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingDocx ? 'Gerando Word...' : 'Gerar Word (DOCX)'}</span>
          </button>

          {/* Save Button */}
          <button
            id="planning-save-firebase-btn"
            onClick={handleSave}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>

          {/* Close/Exit Button */}
          {onClose && (
            <button
              id="planning-exit-btn"
              onClick={handleCloseEditor}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Fechar Edição"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          )}
        </div>
      </div>

      {/* General Information Header Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Informações Gerais do Planejamento</span>
          </h2>

          <button
            id="planning-auto-recalculate-dates-btn"
            type="button"
            onClick={() => handleAutoRecalculateDates()}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            title="Calcular e preencher automaticamente as datas de Segunda a Sexta no cabeçalho e nos dias da semana"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Corrigir / Atualizar Datas da Semana</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Escola / Instituição</label>
            <input 
              id="planning-school-input"
              type="text"
              value={currentPlanning.schoolName || ''}
              onChange={(e) => updateGeneralField('schoolName', e.target.value)}
              placeholder={settings?.schoolName || "Ex: Escola de Educação Infantil"}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Professor(a)</label>
            <input 
              id="planning-teacher-input"
              type="text"
              value={currentPlanning.teacher || ''}
              onChange={(e) => updateGeneralField('teacher', e.target.value)}
              placeholder={settings?.teacherName || "Profe Camila"}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Turma</label>
            <input 
              id="planning-class-input"
              type="text"
              value={currentPlanning.className}
              onChange={(e) => updateGeneralField('className', e.target.value)}
              placeholder="Ex: KINDER 3"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno / Período</label>
            <input 
              id="planning-period-input"
              type="text"
              value={currentPlanning.period || ''}
              onChange={(e) => updateGeneralField('period', e.target.value)}
              placeholder={settings?.defaultPeriod || "Vespertino"}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ano Letivo</label>
            <input 
              id="planning-year-input"
              type="text"
              value={currentPlanning.year}
              onChange={(e) => updateGeneralField('year', e.target.value)}
              placeholder="2026"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semana (Título/Identificação)</label>
            <input 
              id="planning-week-input"
              type="text"
              value={currentPlanning.week}
              onChange={(e) => updateGeneralField('week', e.target.value)}
              placeholder="Ex: Semana 33 (10/08 à 14/08)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Inicial (Segunda-feira)</label>
            <input 
              id="planning-start-date-input"
              type="date"
              value={currentPlanning.startDate || ''}
              onChange={(e) => {
                const newStart = e.target.value;
                if (newStart) {
                  handleAutoRecalculateDates(newStart);
                } else {
                  updateGeneralField('startDate', '');
                }
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Final (Sexta-feira)</label>
            <input 
              id="planning-end-date-input"
              type="date"
              value={currentPlanning.endDate || ''}
              onChange={(e) => updateGeneralField('endDate', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tema Geral da Semana</label>
            <input 
              id="planning-general-theme-input"
              type="text"
              value={currentPlanning.generalTheme}
              onChange={(e) => updateGeneralField('generalTheme', e.target.value)}
              placeholder="Ex: Meios de Transporte e Numeral 6"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Projeto Escolar (opcional)</label>
            <input 
              id="planning-project-input"
              type="text"
              value={currentPlanning.project || ''}
              onChange={(e) => updateGeneralField('project', e.target.value)}
              placeholder="Ex: Projeto Identidade"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Livro Trabalhado (opcional)</label>
            <input 
              id="planning-book-input"
              type="text"
              value={currentPlanning.bookWorked || ''}
              onChange={(e) => updateGeneralField('bookWorked', e.target.value)}
              placeholder="Ex: A menina e o Barquinho"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Days Tabs (Segunda a Sexta) */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-slate-200 dark:bg-slate-800 rounded-2xl">
          {DAYS_KEYS.map((key) => {
            const dayObj = currentPlanning.days[key];
            const isActive = activeDayKey === key;
            const routineCount = dayObj?.routine?.length || 0;
            const lessonCount = dayObj?.lessons?.length || 0;

            return (
              <button
                key={key}
                id={`day-tab-${key}`}
                onClick={() => setActiveDayKey(key)}
                className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{DAY_LABELS[key]}</span>
                <span className="text-[10px] font-medium opacity-75">
                  {dayObj?.dateStr || ''} • {lessonCount} aula(s)
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Day Active Workspace */}
        <div className="space-y-6">
          
          {/* Day SubHeader & Date Config */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 max-w-full">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white shrink-0">
                {DAY_LABELS[activeDayKey]}
              </span>
              <input 
                id={`day-date-input-${activeDayKey}`}
                type="text"
                value={currentDay.dateStr || ''}
                onChange={(e) => updateDayField({ ...currentDay, dateStr: e.target.value })}
                placeholder="Data ex: 27/07"
                className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input 
                id={`day-subheader-input-${activeDayKey}`}
                type="text"
                value={currentDay.subHeader || ''}
                onChange={(e) => updateDayField({ ...currentDay, subHeader: e.target.value })}
                placeholder="Obs ex: PEDAGÓGICA"
                className="w-36 sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="import-from-bank-btn"
                onClick={() => setShowImportLessonModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-200 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Usar Aula do Banco</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: ROTINA DA ACOLHIDA */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Rotina & Acolhida Diária</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Higienização, chamada, calendário, lanche, parque, devocional.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="fill-default-routine-btn"
                  onClick={() => handleFillDefaultRoutine(activeDayKey)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800"
                  title="Preencher com os horários e rotinas padrão da escola"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Carregar Rotina Padrão</span>
                </button>

                <button
                  id="add-routine-item-btn"
                  onClick={handleAddRoutine}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Item</span>
                </button>
              </div>
            </div>

            {currentDay.routine.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <p>Nenhum item de rotina cadastrado para este dia.</p>
                <button
                  onClick={() => handleFillDefaultRoutine(activeDayKey)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Carregar Rotina e Horários Padrão (13:00 às 17:15)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentDay.routine.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative group"
                  >
                    {/* Top Row: Time, Title Input + Retractable "Modelos de Título" Button and Item Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
                        <input
                          id={`routine-time-${item.id}`}
                          type="text"
                          value={item.time}
                          onChange={(e) => handleUpdateRoutine(item.id, 'time', e.target.value)}
                          placeholder="13:00 – 13:20"
                          className="w-28 sm:w-32 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
                        />

                        <div className="relative flex-1 min-w-[200px] flex items-center gap-1.5">
                          <input
                            id={`routine-title-${item.id}`}
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateRoutine(item.id, 'title', e.target.value)}
                            placeholder="Título ex: ROTINA / CONTAÇÃO DE HISTÓRIA"
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />

                          {/* Retractable Blue "Modelos de Título" Button */}
                          <button
                            type="button"
                            onClick={() => setExpandedTitleItemId(expandedTitleItemId === item.id ? null : item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                            title="Modelos de Título"
                          >
                            <ListChecks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">Modelos de Título</span>
                            <span className="sm:hidden">Modelos</span>
                            {expandedTitleItemId === item.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Reordering & Action Controls */}
                      <div className="flex items-center gap-1 text-slate-400 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveRoutine(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRoutine(idx, 'down')}
                          disabled={idx === currentDay.routine.length - 1}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateRoutine(item)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600"
                          title="Duplicar item"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoutine(item.id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600"
                          title="Excluir item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Panel for Title Models */}
                    {expandedTitleItemId === item.id && (
                      <div className="p-3 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                            <ListChecks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Selecione um Modelo de Título:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedTitleItemId(null)}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Recolher ▲
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                          {[
                            "ROTINA / ACOLHIDA",
                            "RODA DE CONVERSA / CHAMADINHA",
                            "ALMOÇO / HIGIENE / BANHEIRO",
                            "LANCHINHO / HIGIENIZAÇÃO",
                            "PARQUE / RECREAÇÃO / PARQUINHO",
                            "CONTAÇÃO DE HISTÓRIAS / RODA DE LEITURA",
                            "MOMENTO BÍBLICO / DEVOCIONAL",
                            "ATIVIDADE DIRIGIDA / PEDAGÓGICA",
                            "MÚSICA E MOVIMENTO / EXPRESSÃO CORPORAL",
                            "SONO / DESCANSO / CALMARIA",
                            "DESPEDIDA / ORGANIZAÇÃO DA SALA"
                          ].map((titleOpt) => (
                            <button
                              key={titleOpt}
                              type="button"
                              onClick={() => {
                                handleUpdateRoutine(item.id, 'title', titleOpt);
                                setExpandedTitleItemId(null);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold border transition-all ${
                                item.title === titleOpt
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                              }`}
                            >
                              {titleOpt}
                            </button>
                          ))}
                        </div>
                        <div className="pt-1 border-t border-blue-200/60 dark:border-blue-800/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setRoutinePresetTarget({ routineId: item.id, mode: 'title', currentValue: item.title });
                              setExpandedTitleItemId(null);
                            }}
                            className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                          >
                            <span>Ver todos / Gerenciar títulos...</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Description Section with RichTextEditor */}
                    <div className="space-y-1.5">
                      <RichTextEditor
                        label="Descrição / Atividades da Rotina"
                        value={item.description || ''}
                        onChange={(val) => handleUpdateRoutine(item.id, 'description', val)}
                        placeholder="- Higienização: Banheiro e água&#10;- Chamada e calendário&#10;- Devocional"
                        rows={2}
                      />

                      {/* Bottom Toolbar: Green "Modelos de Descrição" Button on Left, alongside AI / Bank actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Green "Modelos de Descrição" Button */}
                          <button
                            type="button"
                            onClick={() => setRoutinePresetTarget({ routineId: item.id, mode: 'description', currentValue: item.description })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                            title="Escolher modelo pré-configurado de descrição"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Modelos de Descrição</span>
                          </button>

                          {/conta(ç|c)(ã|a)o|hist(ó|o)ria/i.test(item.title) && (
                            <button
                              type="button"
                              onClick={() => setStorySelectorTarget({ type: 'routine', id: item.id, targetTitle: `Rotina (${item.title || 'Contação de História'})` })}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1.5 border border-amber-500/30 transition-colors"
                              title="Selecionar uma história do Banco de Histórias"
                            >
                              <BookMarked className="w-3.5 h-3.5 text-amber-500" />
                              <span>Escolher História</span>
                            </button>
                          )}

                          {/b(í|i)bli|devocional|religi/i.test(item.title) && (
                            <button
                              type="button"
                              onClick={() => setBibleSelectorTarget({ type: 'routine', id: item.id, targetTitle: `Rotina (${item.title || 'Aula Bíblica'})` })}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
                              title="Selecionar uma aula bíblica do Banco de Aulas Bíblicas"
                            >
                              <BookOpenCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Escolher Aula Bíblica</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerateRoutineWithAi(item)}
                          disabled={generatingRoutineId === item.id}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                          title="Usar Assistente de IA para gerar o conteúdo deste bloco de tempo"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{generatingRoutineId === item.id ? 'Gerando...' : 'Gerar c/ IA'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Image Upload for Routine */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <ImageUploader
                        images={item.images || []}
                        onImagesChange={(imgs) => handleUpdateRoutine(item.id, 'images', imgs)}
                        multiple={true}
                        label="Fotos / Imagens da Rotina"
                        hint="Anexe fotos de murais, fichas ou ilustrações da acolhida"
                        maxFiles={4}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: AULAS E ATIVIDADES PEDAGÓGICAS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Aulas e Atividades do Dia</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Disciplinas, objetivos BNCC, desenvolvimento detalhado e materiais.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="add-lesson-ai-btn"
                  onClick={onOpenAiAssistant}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-all"
                  title="Gerar nova aula do zero com IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Gerar com IA</span>
                </button>

                <button
                  id="import-lesson-bank-btn"
                  onClick={() => setShowImportLessonModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-purple-200 dark:border-purple-800/80"
                  title="Selecionar planos de aula da IA e do Banco de Aulas"
                >
                  <FolderDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Selecionar do Banco (IA)</span>
                </button>

                <button
                  id="add-lesson-btn"
                  onClick={handleAddLesson}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Aula</span>
                </button>
              </div>
            </div>

            {currentDay.lessons.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma aula cadastrada para {DAY_LABELS[activeDayKey]}. Clique em "Adicionar Aula" acima, selecione do Banco de IA ou use a IA.
              </div>
            ) : (
              <div className="space-y-6">
                {currentDay.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-slate-800/60 space-y-4 shadow-sm relative"
                  >
                    {/* Lesson Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>

                        <select
                          id={`lesson-subject-${lesson.id}`}
                          value={lesson.subject}
                          onChange={(e) => handleUpdateLesson(lesson.id, 'subject', e.target.value)}
                          className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 outline-none"
                        >
                          {SUBJECT_OPTIONS.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>

                        <input
                          id={`lesson-time-${lesson.id}`}
                          type="text"
                          value={lesson.time}
                          onChange={(e) => handleUpdateLesson(lesson.id, 'time', e.target.value)}
                          placeholder="15:30 – 16:20"
                          className="w-32 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/b(í|i)bli|devocional|religi/i.test(lesson.subject + ' ' + (lesson.theme || '')) && (
                          <button
                            type="button"
                            onClick={() => setBibleSelectorTarget({ type: 'lesson', id: lesson.id, targetTitle: `Aula (${lesson.theme || lesson.subject || 'Aula Bíblica'})` })}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                            title="Selecionar uma aula bíblica do Banco de Aulas Bíblicas"
                          >
                            <BookOpenCheck className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Escolher Aula Bíblica</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setBlockAiModalLesson(lesson);
                            setBlockAiPrompt(lesson.theme || lesson.subject || '');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                          title="Gerar e preencher este bloco de aula com o Assistente de IA"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Preencher c/ IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportLessonToBank(lesson)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Exportar esta aula para o Banco de Aulas (IA)"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Exportar p/ Banco (IA)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateLesson(lesson)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Duplicar aula"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                          title="Excluir aula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Theme & Objectives */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Tema da Aula
                          </label>
                          {(lesson.subject === 'CONTAÇÃO DE HISTÓRIA' || /conta(ç|c)(ã|a)o|hist(ó|o)ria/i.test(lesson.subject + ' ' + lesson.theme)) && (
                            <button
                              type="button"
                              onClick={() => setStorySelectorTarget({ type: 'lesson', id: lesson.id, targetTitle: 'Aula de Contação de História' })}
                              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 transition-colors"
                            >
                              <BookMarked className="w-3.5 h-3.5 text-amber-500" />
                              <span>Selecionar História do Banco</span>
                            </button>
                          )}
                        </div>
                        <input
                          id={`lesson-theme-${lesson.id}`}
                          type="text"
                          value={lesson.theme}
                          onChange={(e) => handleUpdateLesson(lesson.id, 'theme', e.target.value)}
                          placeholder="Ex: Minhas lembranças das férias / Numeral 6"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Objetivos BNCC
                          </label>
                          <button
                            type="button"
                            onClick={() => openBnccForLesson(lesson.id)}
                            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Selecionar BNCC</span>
                          </button>
                        </div>
                        <div className="min-h-[40px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-wrap gap-1 items-center">
                          {lesson.bnccCodes?.length > 0 ? (
                            lesson.bnccCodes.map((code) => (
                              <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 font-bold text-[11px]">
                                {code}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLesson(lesson.id, 'bnccCodes', (lesson.bnccCodes || []).filter(c => c !== code))}
                                  className="hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">Nenhum código BNCC selecionado.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Objectives Text */}
                    <RichTextEditor
                      label="Objetivos Específicos da Aula"
                      value={lesson.objectives}
                      onChange={(val) => handleUpdateLesson(lesson.id, 'objectives', val)}
                      placeholder="Ex: - Desenvolver oralidade ao compartilhar vivências..."
                      rows={3}
                    />

                    {/* Development Rich Editor */}
                    <RichTextEditor
                      label="Desenvolvimento da Aula (Passo a Passo)"
                      value={lesson.development}
                      onChange={(val) => handleUpdateLesson(lesson.id, 'development', val)}
                      placeholder="Para começar irei perguntar aos alunos... Em seguida faremos uma roda..."
                      rows={5}
                    />

                    {/* Materials & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Materiais Utilizados
                        </label>
                        <input
                          id={`lesson-materials-${lesson.id}`}
                          type="text"
                          value={Array.isArray(lesson.materials) ? lesson.materials.join(', ') : lesson.materials}
                          onChange={(e) => handleUpdateLesson(lesson.id, 'materials', e.target.value.split(',').map(s => s.trim()))}
                          placeholder="Massinha, Cartolina, EVA, Bolinhas"
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Observações / Dicas
                        </label>
                        <input
                          id={`lesson-notes-${lesson.id}`}
                          type="text"
                          value={lesson.notes || ''}
                          onChange={(e) => handleUpdateLesson(lesson.id, 'notes', e.target.value)}
                          placeholder="Observar engajamento dos alunos..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Image Upload for Lesson */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <ImageUploader
                        images={lesson.images || []}
                        onImagesChange={(imgs) => handleUpdateLesson(lesson.id, 'images', imgs)}
                        multiple={true}
                        label="Fotos & Anexos Ilustrativos da Aula"
                        hint="Adicione fotos de modelos de atividades, moldes, fotos dos alunos ou esquemas pedagógicos"
                        maxFiles={6}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BNCC Multi Selector Modal */}
      <BnccSelectorModal
        isOpen={bnccModalOpen}
        onClose={() => setBnccModalOpen(false)}
        selectedCodes={
          activeLessonId 
            ? (currentDay.lessons.find(l => l.id === activeLessonId)?.bnccCodes || [])
            : []
        }
        onSelectCodes={handleApplyBnccCodes}
      />

      {/* Import Lesson from Bank Modal */}
      {showImportLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Banco de Aulas da IA e do Professor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecione uma aula salva ou criada com IA para inserir em <strong className="text-purple-600 dark:text-purple-400">{DAY_LABELS[activeDayKey]}</strong>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowImportLessonModal(false);
                  setImportPreviewLesson(null);
                }} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Subject Filter Bar */}
            <div className="py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={importSearchTerm}
                  onChange={(e) => setImportSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, tema, disciplina ou código BNCC..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={importSubjectFilter}
                onChange={(e) => setImportSubjectFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="todos">Todas as Disciplinas</option>
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* List / Preview Section */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {importPreviewLesson ? (
                /* Detailed View of Single Lesson */
                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setImportPreviewLesson(null)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      ← Voltar para a Lista
                    </button>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      {importPreviewLesson.subject}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {importPreviewLesson.name}
                  </h4>

                  {importPreviewLesson.objectives && (
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>Objetivos:</strong>
                      <p className="whitespace-pre-line mt-0.5">{importPreviewLesson.objectives}</p>
                    </div>
                  )}

                  {importPreviewLesson.bnccCodes?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mr-1">BNCC:</span>
                      {importPreviewLesson.bnccCodes.map((code) => (
                        <span key={code} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  {importPreviewLesson.development && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 border-t border-purple-100 dark:border-purple-900/40 pt-2">
                      <strong>Desenvolvimento:</strong>
                      <div 
                        className="whitespace-pre-line mt-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800"
                        dangerouslySetInnerHTML={{ __html: importPreviewLesson.development }}
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleImportSavedLesson(importPreviewLesson)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inserir em {DAY_LABELS[activeDayKey]}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* List of Saved Lessons */
                (() => {
                  const safeSavedLessons = Array.isArray(savedLessons) ? savedLessons : [];
                  const filtered = safeSavedLessons.filter((l) => {
                    if (!l) return false;
                    const matchesSubject = importSubjectFilter === 'todos' || l.subject === importSubjectFilter;
                    const matchesSearch = !importSearchTerm.trim() || 
                      l.name?.toLowerCase().includes(importSearchTerm.toLowerCase()) ||
                      l.theme?.toLowerCase().includes(importSearchTerm.toLowerCase()) ||
                      l.subject?.toLowerCase().includes(importSearchTerm.toLowerCase()) ||
                      l.bnccCodes?.some(c => c.toLowerCase().includes(importSearchTerm.toLowerCase()));
                    return matchesSubject && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                        <p>Nenhuma aula encontrada no banco.</p>
                        <p className="text-[11px] text-slate-400">
                          Dica: Você pode gerar aulas com a IA no botão "Gerar com IA" e salvá-las no banco a qualquer momento.
                        </p>
                      </div>
                    );
                  }

                  return filtered.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 text-xs space-y-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {l.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            {l.subject}
                          </span>
                          {l.id.includes('ai') && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-yellow-500" /> Criado por IA
                            </span>
                          )}
                        </div>

                        <div className="text-slate-500 dark:text-slate-400 line-clamp-1">
                          {l.theme ? `Tema: ${l.theme}` : l.objectives ? `Objetivos: ${l.objectives}` : ''}
                        </div>

                        {l.bnccCodes?.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {l.bnccCodes.map((code) => (
                              <span key={code} className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setImportPreviewLesson(l)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportSavedLesson(l)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-1 text-[11px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Inserir</span>
                        </button>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block AI Assistant Modal for Individual Time Slots */}
      {blockAiModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Gerar Aula com IA para este Bloco
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Horário: <strong className="text-blue-600 dark:text-blue-400">{blockAiModalLesson.time}</strong> • Disciplina: <strong className="text-purple-600 dark:text-purple-400">{blockAiModalLesson.subject}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBlockAiModalLesson(null);
                  setBlockAiPrompt('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBlockLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  O que deseja trabalhar nesta aula?
                </label>
                <textarea
                  value={blockAiPrompt}
                  onChange={(e) => setBlockAiPrompt(e.target.value)}
                  placeholder="Ex: Atividade prática lúdica sobre identificação de vogais usando pintura a dedo e músicas em roda."
                  rows={4}
                  className="w-full p-3 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A IA gerará o tema lúdico, objetivos BNCC, desenvolvimento passo a passo e materiais necessários especificamente para este horário.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setBlockAiModalLesson(null);
                    setBlockAiPrompt('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isGeneratingBlockLesson}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{isGeneratingBlockLesson ? 'Gerando Aula...' : 'Gerar e Preencher Aula'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom duration-200 border border-slate-700 dark:border-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Preview Modal */}
      <PlanningPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        planning={currentPlanning}
        settings={settings}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        isGeneratingPdf={isGeneratingPdf}
        isGeneratingDocx={isGeneratingDocx}
      />

      {/* Story Selector Modal */}
      <StorySelectorModal
        isOpen={!!storySelectorTarget}
        onClose={() => setStorySelectorTarget(null)}
        stories={stories}
        onSelectStory={handleSelectStoryForTarget}
        targetTitle={storySelectorTarget?.targetTitle}
      />

      {/* Routine Title and Description Preset Modal */}
      <RoutinePresetModal
        isOpen={routinePresetTarget !== null}
        onClose={() => setRoutinePresetTarget(null)}
        mode={routinePresetTarget?.mode || 'title'}
        currentValue={routinePresetTarget?.currentValue || ''}
        onSelect={handleSelectRoutinePreset}
      />

      {/* Bible Lesson Selector Modal */}
      <BibleLessonSelectorModal
        isOpen={!!bibleSelectorTarget}
        onClose={() => setBibleSelectorTarget(null)}
        bibleLessons={bibleLessons}
        onSelectBibleLesson={handleSelectBibleLessonForTarget}
        targetTitle={bibleSelectorTarget?.targetTitle}
      />

      {/* Unsaved Changes Confirmation Modal */}
      {unsavedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Alterações Não Salvas!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Você fez edições neste planejamento.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja salvar as alterações realizadas antes de fechar o editor de planejamento?
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                id="unsaved-modal-cancel-btn"
                onClick={() => setUnsavedModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Continuar Editando
              </button>
              <button
                id="unsaved-modal-discard-btn"
                onClick={() => {
                  setUnsavedModalOpen(false);
                  onDiscardChanges?.();
                  onClose?.();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Sair sem Salvar
              </button>
              <button
                id="unsaved-modal-save-btn"
                onClick={() => {
                  handleSave();
                  setUnsavedModalOpen(false);
                  onClose?.();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar e Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
