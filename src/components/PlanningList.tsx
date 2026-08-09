import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  FileDown, 
  FileText, 
  Filter, 
  Clock,
  Layers,
  Eye
} from 'lucide-react';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { generatePlanningPDF } from '../lib/pdfExport';
import { generatePlanningDOCX } from '../lib/docxExport';
import { PlanningPreviewModal } from './PlanningPreviewModal';
import { formatIsoToBrDate } from '../lib/dateUtils';

interface PlanningListProps {
  plannings: WeeklyPlanning[];
  onSelectPlanning: (planning: WeeklyPlanning) => void;
  onDuplicatePlanning: (planning: WeeklyPlanning) => void;
  onDeletePlanning: (id: string) => void;
  onNewPlanning: () => void;
  settings: SchoolSettings | null;
}

export const PlanningList: React.FC<PlanningListProps> = ({
  plannings = [],
  onSelectPlanning,
  onDuplicatePlanning,
  onDeletePlanning,
  onNewPlanning,
  settings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [previewPlanning, setPreviewPlanning] = useState<WeeklyPlanning | null>(null);
  const [planningToDelete, setPlanningToDelete] = useState<WeeklyPlanning | null>(null);

  const safePlannings = Array.isArray(plannings) ? plannings : [];

  const yearsOptions = useMemo(() => {
    const years = Array.from(new Set(safePlannings.map(p => p?.year).filter(Boolean)));
    return ['ALL', ...years];
  }, [safePlannings]);

  const classOptions = useMemo(() => {
    const classes = Array.from(new Set(safePlannings.map(p => p?.className).filter(Boolean)));
    return ['ALL', ...classes];
  }, [safePlannings]);

  const filteredPlannings = useMemo(() => {
    return safePlannings.filter((p) => {
      if (!p) return false;
      const matchSearch = 
        (p.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.week || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.generalTheme || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.teacher || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchYear = yearFilter === 'ALL' || p.year === yearFilter;
      const matchClass = classFilter === 'ALL' || p.className === classFilter;

      return matchSearch && matchYear && matchClass;
    });
  }, [safePlannings, searchTerm, yearFilter, classFilter]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Meus Planejamentos Pedagógicos</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie, filtre e exporte todos os seus planejamentos em um único lugar.
            </p>
          </div>

          <button
            id="list-new-planning-btn"
            onClick={onNewPlanning}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Planejamento</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              id="list-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por turma, tema, semana..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              id="list-year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">Todos os Anos</option>
              {yearsOptions.filter(y => y !== 'ALL').map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="list-class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">Todas as Turmas</option>
              {classOptions.filter(c => c !== 'ALL').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredPlannings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Calendar className="w-10 h-10 mx-auto opacity-40 text-blue-500" />
          <p className="text-sm">Nenhum planejamento encontrado.</p>
          <button
            onClick={onNewPlanning}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
          >
            Criar Primeiro Planejamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlannings.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    {p.className}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{p.year}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {p.week}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {p.generalTheme || 'Sem tema definido'}
                </p>

                <div className="text-[11px] text-slate-500 dark:text-slate-500 space-y-0.5">
                  <div>Profe: <span className="font-semibold">{p.teacher || settings?.teacherName || 'Professor(a)'}</span> • Turno: <span className="font-semibold">{p.period || settings?.defaultPeriod || 'Vespertino'}</span></div>
                  {p.startDate && <div>Período: {formatIsoToBrDate(p.startDate)} a {formatIsoToBrDate(p.endDate)}</div>}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                {/* Main View / Edit buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id={`list-view-btn-${p.id}`}
                    onClick={() => setPreviewPlanning(p)}
                    className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    title="Visualizar Impressão"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    id={`list-edit-btn-${p.id}`}
                    onClick={() => onSelectPlanning(p)}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    title="Editar Planejamento"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>

                {/* Secondary Utilities toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      id={`list-pdf-btn-${p.id}`}
                      onClick={() => generatePlanningPDF(p, settings || undefined)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="Exportar PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      id={`list-docx-btn-${p.id}`}
                      onClick={() => generatePlanningDOCX(p, settings || undefined)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="Exportar Word"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Word</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`list-duplicate-btn-${p.id}`}
                      onClick={() => onDuplicatePlanning(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="Duplicar Planejamento"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    <button
                      id={`list-delete-btn-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanningToDelete(p);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title="Excluir Planejamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Preview Modal */}
      {previewPlanning && (
        <PlanningPreviewModal
          isOpen={!!previewPlanning}
          onClose={() => setPreviewPlanning(null)}
          planning={previewPlanning}
          settings={settings}
          onExportPdf={() => generatePlanningPDF(previewPlanning, settings || undefined)}
          onExportDocx={() => generatePlanningDOCX(previewPlanning, settings || undefined)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {planningToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Excluir Planejamento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza de que deseja excluir o planejamento da turma <strong>"{planningToDelete.className}" ({planningToDelete.week})</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="delete-modal-cancel-btn"
                onClick={() => setPlanningToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                id="delete-modal-confirm-btn"
                onClick={() => {
                  onDeletePlanning(planningToDelete.id);
                  setPlanningToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
