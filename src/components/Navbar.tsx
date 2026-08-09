import React from 'react';
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
  Boxes
} from 'lucide-react';
import { UserProfile, SchoolSettings } from '../types';

interface NavbarProps {
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

export const Navbar: React.FC<NavbarProps> = ({
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
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
            id="navbar-brand-logo"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
                CCC Planejamento
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Educação Infantil BNCC
              </div>
            </div>
          </div>

          {/* Quick AI & Actions Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Assistant Button */}
            <button
              id="navbar-ai-assistant-btn"
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="hidden sm:inline">Assistente IA</span>
              <span className="sm:hidden">IA</span>
            </button>

            {/* PWA Install Button */}
            {installPrompt && (
              <button
                id="navbar-pwa-install-btn"
                onClick={onInstallPwa}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition-colors"
                title="Instalar como App PWA"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Instalar App</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              id="navbar-dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Settings Button */}
            <button
              id="navbar-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Configurações da Escola e Professor"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Usuário'} 
                    className="w-8 h-8 rounded-full ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    {(user.displayName || user.email || 'P')[0].toUpperCase()}
                  </div>
                )}
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Navigation Row for Modules */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800/60">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Início</span>
          </button>

          <button
            id="nav-tab-novo-planejamento"
            onClick={() => {
              if (onNewPlanning) {
                onNewPlanning();
              } else {
                setActiveTab('novo-planejamento');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'novo-planejamento'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Novo Planejamento</span>
          </button>

          <button
            id="nav-tab-planejamentos"
            onClick={() => setActiveTab('planejamentos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'planejamentos'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Meus Planejamentos</span>
          </button>

          <button
            id="nav-tab-banco-aulas"
            onClick={() => setActiveTab('banco-aulas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-aulas'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Library className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Aulas</span>
          </button>

          <button
            id="nav-tab-banco-historias"
            onClick={() => setActiveTab('banco-historias')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-historias'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Histórias</span>
          </button>

          <button
            id="nav-tab-banco-musicas"
            onClick={() => setActiveTab('banco-musicas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-musicas'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Music className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>Músicas</span>
          </button>

          <button
            id="nav-tab-banco-brincadeiras"
            onClick={() => setActiveTab('banco-brincadeiras')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-brincadeiras'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Brincadeiras</span>
          </button>

          <button
            id="nav-tab-banco-materiais"
            onClick={() => setActiveTab('banco-materiais')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-materiais'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Materiais</span>
          </button>

          <button
            id="nav-tab-banco-bncc"
            onClick={() => setActiveTab('banco-bncc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'banco-bncc'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Banco BNCC</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
