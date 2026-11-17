import React, { useState } from 'react';
import {
  Bot,
  Calendar,
  BookOpen,
  GraduationCap,
  Layers,
  Terminal,
  FileText,
  Sparkles,
  CheckSquare,
  Menu,
  X,
  FolderUp,
} from 'lucide-react';

export type ActiveTab =
  | 'materials'
  | 'chat'
  | 'planner'
  | 'quiz'
  | 'flashcards'
  | 'calendar'
  | 'knowledge'
  | 'prompts'
  | 'report';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  documentsCount?: number;
  pendingReviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  documentsCount = 0,
  pendingReviewCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
    badgeAlert?: boolean;
  }[] = [
    {
      id: 'materials',
      label: 'Materiais',
      shortLabel: 'Materiais',
      icon: <FolderUp className="w-4 h-4 shrink-0" />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : documentsCount,
      badgeAlert: pendingReviewCount > 0,
    },
    { id: 'chat', label: 'Tutor IA', shortLabel: 'Tutor', icon: <Bot className="w-4 h-4 shrink-0" /> },
    {
      id: 'planner',
      label: 'Cronograma',
      shortLabel: 'Plano',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
    },
    { id: 'quiz', label: 'Simulados', shortLabel: 'Simulado', icon: <GraduationCap className="w-4 h-4 shrink-0" /> },
    { id: 'flashcards', label: 'Flashcards', shortLabel: 'Cards', icon: <Layers className="w-4 h-4 shrink-0" /> },
    {
      id: 'calendar',
      label: 'Google Agenda',
      shortLabel: 'Agenda',
      icon: <Calendar className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'knowledge',
      label: 'Matérias',
      shortLabel: 'Matérias',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'prompts',
      label: 'Lab de Prompts',
      shortLabel: 'Prompts',
      icon: <Terminal className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'report',
      label: 'Relatório',
      shortLabel: 'Relatório',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => handleSelectTab('materials')}
            className="flex items-center gap-3 shrink-0 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Agente Acadêmico
                </span>
                <span className="text-[11px] font-mono text-indigo-300">ADS · FSG</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Assistente Acadêmico Dirigido por Documentos
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`ml-0.5 text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-md ${
                        item.badgeAlert
                          ? 'bg-amber-500/20 text-amber-300'
                          : isActive
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Tablet / Compact Horizontal Scroll Bar + Mobile Toggle */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Abrir menu de navegação"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-indigo-400" /> : <Menu className="w-4 h-4 text-indigo-400" />}
              <span>{navItems.find((i) => i.id === activeTab)?.shortLabel || 'Menu'}</span>
            </button>
          </div>
        </div>

        {/* Tablet/Mobile Quick Horizontal Strip */}
        <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 pt-0.5 -mx-1 px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.shortLabel}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="text-[10px] font-mono tabular-nums opacity-90">({item.badge})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-3 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
