import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Library, 
  Plus, 
  Star, 
  Trash2, 
  Edit2, 
  BookOpen, 
  Check, 
  FileText,
  X,
  Layers
} from 'lucide-react';
import { SavedLesson } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { BnccSelectorModal } from './BnccSelectorModal';
import { FormattedContent } from './FormattedContent';

interface LessonBankProps {
  lessons: SavedLesson[];
  onSaveLesson: (lesson: SavedLesson) => void;
  onDeleteLesson: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const LessonBank: React.FC<LessonBankProps> = ({
  lessons = [],
  onSaveLesson,
  onDeleteLesson,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<SavedLesson | null>(null);
  const [bnccModalOpen, setBnccModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('LINGUAGEM');
  const [theme, setTheme] = useState('');
  const [objectives, setObjectives] = useState('');
  const [bnccCodes, setBnccCodes] = useState<string[]>([]);
  const [development, setDevelopment] = useState('');
  const [materials, setMaterials] = useState('');
  const [games, setGames] = useState('');
  const [notes, setNotes] = useState('');

  const safeLessons = Array.isArray(lessons) ? lessons : [];

  const filteredLessons = useMemo(() => {
    return safeLessons.filter((l) => {
      if (!l) return false;
      return (
        (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.theme || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [safeLessons, searchTerm]);

  const openModal = (lesson?: SavedLesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setName(lesson.name);
      setSubject(lesson.subject);
      setTheme(lesson.theme);
      setObjectives(lesson.objectives);
      setBnccCodes(lesson.bnccCodes || []);
      setDevelopment(lesson.development);
      setMaterials(Array.isArray(lesson.materials) ? lesson.materials.join(', ') : lesson.materials);
      setGames(lesson.games || '');
      setNotes(lesson.notes || '');
    } else {
      setEditingLesson(null);
      setName('');
      setSubject('LINGUAGEM');
      setTheme('');
      setObjectives('');
      setBnccCodes([]);
      setDevelopment('');
      setMaterials('');
      setGames('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const materialsArray = materials.split(',').map(s => s.trim()).filter(Boolean);

    const lessonObj: SavedLesson = {
      id: editingLesson ? editingLesson.id : `lesson-${Date.now()}`,
      userId: editingLesson ? editingLesson.userId : 'current-user',
      name,
      subject,
      theme,
      objectives,
      bnccCodes,
      development,
      materials: materialsArray,
      games,
      notes,
      isFavorite: editingLesson ? editingLesson.isFavorite : false,
      createdAt: editingLesson ? editingLesson.createdAt : new Date().toISOString()
    };

    onSaveLesson(lessonObj);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Library className="w-5 h-5 text-purple-600" />
            <span>Banco de Aulas</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Guarde planos de aula completos para reutilizar quando quiser.
          </p>
        </div>

        <button
          id="lesson-bank-new-btn"
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Aula</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input 
          id="lesson-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome da aula, disciplina ou tema..."
          className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Grid */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Nenhuma aula encontrada no banco.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((l) => (
            <div
              key={l.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    {l.subject}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {l.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{l.theme}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(l.id)}
                  className="p-1 rounded text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star className={`w-5 h-5 ${l.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {l.bnccCodes?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {l.bnccCodes.map((code) => (
                    <span key={code} className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                      {code}
                    </span>
                  ))}
                </div>
              )}

              {l.development && (
                <FormattedContent
                  content={l.development}
                  className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl"
                />
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {l.materials?.length ? `${l.materials.length} materiais` : ''}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(l)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteLesson(l.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {editingLesson ? 'Editar Aula do Banco' : 'Cadastrar Nova Aula'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Aula</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Explorando o Numeral 6 com Circuito Motor"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Disciplina</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="MATEMÁTICA / LINGUAGEM"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tema</label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Numeral 6"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">BNCC</label>
                  <button type="button" onClick={() => setBnccModalOpen(true)} className="text-xs text-sky-600 font-semibold">+ Escolher BNCC</button>
                </div>
                <div className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex flex-wrap gap-1">
                  {bnccCodes.length ? bnccCodes.map(c => <span key={c} className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900 font-bold">{c}</span>) : 'Nenhum código selecionado.'}
                </div>
              </div>

              <RichTextEditor label="Objetivos" value={objectives} onChange={setObjectives} rows={3} />
              <RichTextEditor label="Desenvolvimento" value={development} onChange={setDevelopment} rows={5} />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Materiais (separados por vírgula)</label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="Cones, Bolinhas, Massinha"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl">Salvar no Banco</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BnccSelectorModal
        isOpen={bnccModalOpen}
        onClose={() => setBnccModalOpen(false)}
        selectedCodes={bnccCodes}
        onSelectCodes={setBnccCodes}
      />
    </div>
  );
};
