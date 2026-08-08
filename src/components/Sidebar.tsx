import React, { useState } from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Library, 
  BookMarked, 
  Music, 
  Gamepad2, 
  FileText, 
  ListOrdered, 
  Settings, 
  Sparkles, 
  Moon, 
  Sun, 
  User as UserIcon, 
  LogOut, 
  Download,
  BookOpenCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { UserProfile, SchoolSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  settings: SchoolSettings | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAiAssistant: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  installPrompt: any;
  onInstallPwa: () => void;
  onNewPlanning?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  settings,
  onOpenAuth,
  onLogout,
  onOpenSettings,
  onOpenAiAssistant,
  darkMode,
  setDarkMode,
  installPrompt,
  onInstallPwa,
  onNewPlanning,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', label: 'Início', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400' },
        { id: 'novo-planejamento', label: 'Novo Planejamento', icon: PlusCircle, color: 'text-emerald-600 dark:text-emerald-400' },
        { id: 'planejamentos', label: 'Meus Planejamentos', icon: ListOrdered, color: 'text-indigo-600 dark:text-indigo-400' },
      ]
    },
    {
      title: 'BANCOS PEDAGÓGICOS',
      items: [
        { id: 'banco-aulas', label: 'Planos de Aula', icon: Library, color: 'text-purple-600 dark:text-purple-400' },
        { id: 'banco-historias', label: 'Histórias Infantil', icon: BookMarked, color: 'text-amber-600 dark:text-amber-400' },
        { id: 'banco-biblico', label: 'Aulas Bíblicas', icon: BookOpenCheck, color: 'text-indigo-600 dark:text-indigo-400' },
        { id: 'banco-musicas', label: 'Músicas e Cantigas', icon: Music, color: 'text-pink-600 dark:text-pink-400' },
        { id: 'banco-brincadeiras', label: 'Brincadeiras e Jogos', icon: Gamepad2, color: 'text-cyan-600 dark:text-cyan-400' },
        { id: 'banco-bncc', label: 'Consulta BNCC', icon: FileText, color: 'text-sky-600 dark:text-sky-400' },
      ]
    }
  ];

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'novo-planejamento' && onNewPlanning) {
      onNewPlanning();
    } else {
      setActiveTab(tabId);
    }
    setMobileOpen(false);
  };

  const SidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Top Brand Logo */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div 
          onClick={() => handleSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          id="sidebar-brand-logo"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm sm:text-base bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
              CCC Planejamento
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-tight">
              Educação Infantil BNCC
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        
        {/* AI Assistant Quick Callout */}
        <button
          id="sidebar-ai-assistant-btn"
          onClick={() => { onOpenAiAssistant(); setMobileOpen(false); }}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 group transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-extrabold">Assistente IA</span>
              <span className="block text-[10px] text-purple-200 font-normal">Gerar aulas e rotinas</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Navigation Groups */}
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Actions & User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        
        {/* PWA Install */}
        <button
          id="sidebar-pwa-install-btn"
          onClick={onInstallPwa}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-200" />
          <span>Instalar App (Android / iOS)</span>
        </button>

        {/* Dark Mode & Settings Row */}
        <div className="flex items-center gap-1.5">
          <button
            id="sidebar-dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>

          <button
            id="sidebar-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Configurações da Escola e Professor"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between px-1">
          {user ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Usuário'} 
                    className="w-8 h-8 rounded-full ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {(user.displayName || user.email || 'P')[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Professor(a)'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="sidebar-login-btn"
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              CCC Planejamento
            </span>
          </div>
        </div>

        <button
          onClick={onOpenAiAssistant}
          className="p-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-xs">IA</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Permanent Left Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {SidebarContent}
      </aside>
    </>
  );
};
