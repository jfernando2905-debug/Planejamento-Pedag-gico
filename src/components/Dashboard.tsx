import React from 'react';
import { 
  PlusCircle, 
  Library, 
  BookMarked, 
  Music, 
  Gamepad2, 
  FileText, 
  ListOrdered, 
  Settings, 
  Sparkles, 
  BookOpenCheck, 
  Calendar, 
  ArrowRight,
  Bookmark,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Award
} from 'lucide-react';
import { WeeklyPlanning, SavedLesson, Story, Song, Game, BibleLesson } from '../types';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  plannings: WeeklyPlanning[];
  lessons: SavedLesson[];
  stories: Story[];
  songs: Song[];
  games: Game[];
  bibleLessons?: BibleLesson[];
  onOpenAiAssistant: () => void;
  onOpenSettings: () => void;
  onSelectPlanning: (planning: WeeklyPlanning) => void;
  onNewPlanning?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  plannings,
  lessons,
  stories,
  songs,
  games,
  bibleLessons = [],
  onOpenAiAssistant,
  onOpenSettings,
  onSelectPlanning,
  onNewPlanning,
}) => {

  const recentPlannings = plannings.slice(0, 3);

  const handleCreateNew = () => {
    if (onNewPlanning) {
      onNewPlanning();
    } else {
      setActiveTab('novo-planejamento');
    }
  };

  const modules = [
    {
      id: 'novo-planejamento',
      title: 'Novo Planejamento',
      description: 'Criar planejamento semanal por turma e dias da semana com BNCC',
      icon: PlusCircle,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      badge: 'Principal',
      action: handleCreateNew
    },
    {
      id: 'planejamentos',
      title: 'Planejamentos',
      description: 'Visualizar, editar, duplicar e exportar planejamentos salvos em PDF/DOCX',
      icon: ListOrdered,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-700 dark:text-blue-300',
      count: plannings.length,
      action: () => setActiveTab('planejamentos')
    },
    {
      id: 'banco-aulas',
      title: 'Banco de Aulas',
      description: 'Biblioteca de planos de aula completos e reutilizáveis',
      icon: Library,
      color: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-700 dark:text-purple-300',
      count: lessons.length,
      action: () => setActiveTab('banco-aulas')
    },
    {
      id: 'banco-historias',
      title: 'Banco de Histórias',
      description: 'Acervo de livros infantis, autores, sinopses e objetivos',
      icon: BookMarked,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-700 dark:text-amber-300',
      count: stories.length,
      action: () => setActiveTab('banco-historias')
    },
    {
      id: 'banco-musicas',
      title: 'Banco de Músicas',
      description: 'Cantigas, ritmos, links do YouTube e atividades musicais',
      icon: Music,
      color: 'from-pink-500 to-rose-600',
      textColor: 'text-pink-700 dark:text-pink-300',
      count: songs.length,
      action: () => setActiveTab('banco-musicas')
    },
    {
      id: 'banco-brincadeiras',
      title: 'Banco de Brincadeiras',
      description: 'Circuitos motores, jogos lúdicos e dinâmicas de grupo',
      icon: Gamepad2,
      color: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      count: games.length,
      action: () => setActiveTab('banco-brincadeiras')
    },
    {
      id: 'banco-biblico',
      title: 'Aulas Bíblicas',
      description: 'Acervo de lições bíblicas, princípios morais, versículos e devocionais infantis',
      icon: BookOpenCheck,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      count: bibleLessons.length,
      action: () => setActiveTab('banco-biblico')
    },
    {
      id: 'banco-bncc',
      title: 'Banco BNCC',
      description: 'Consulta rápida a todos os códigos e objetivos da BNCC Educação Infantil',
      icon: FileText,
      color: 'from-sky-500 to-cyan-600',
      textColor: 'text-sky-700 dark:text-sky-300',
      badge: 'Oficial',
      action: () => setActiveTab('banco-bncc')
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Dados da escola, professor, logo e cabeçalho para exportação',
      icon: Settings,
      color: 'from-slate-600 to-slate-800',
      textColor: 'text-slate-700 dark:text-slate-300',
      action: onOpenSettings
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-4 border border-white/20">
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span>Educação Infantil • PWA + BNCC 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Planejamento Pedagógico Semanal
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-6">
            Crie planejamentos completos para a Educação Infantil com rotina diária, códigos BNCC, banco de conteúdos e exportação instantânea para PDF e Word (DOCX).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-hero-new-btn"
              onClick={handleCreateNew}
              className="px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg shadow-black/10 flex items-center gap-2 transition-transform active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Novo Planejamento</span>
            </button>

            <button
              id="dash-hero-ai-btn"
              onClick={onOpenAiAssistant}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Gerar com IA</span>
            </button>
          </div>
        </div>

        {/* Abstract Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-20 -top-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
      </div>

      {/* Grid of Main Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Módulos do Sistema</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">9 Módulos Principais</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                id={`dash-module-card-${mod.id}`}
                onClick={mod.action}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mod.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {mod.count !== undefined ? (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {mod.count} {mod.count === 1 ? 'item' : 'itens'}
                    </span>
                  ) : mod.badge ? (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                      {mod.badge}
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>{mod.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Plannings Quick Section */}
      {recentPlannings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Planejamentos Recentes</span>
            </h2>
            <button
              id="dash-view-all-plannings-btn"
              onClick={() => setActiveTab('planejamentos')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentPlannings.map((p) => (
              <div
                key={p.id}
                id={`dash-recent-planning-${p.id}`}
                onClick={() => {
                  onSelectPlanning(p);
                  setActiveTab('novo-planejamento');
                }}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {p.className} – {p.year}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {p.week}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {p.generalTheme || 'Sem tema cadastrado'} • {p.teacher}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Editar Planejamento</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
