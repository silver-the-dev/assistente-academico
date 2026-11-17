import React, { useState } from 'react';
import { 
  Bot, 
  Calendar, 
  CheckSquare, 
  BookOpen, 
  Sparkles, 
  Code2, 
  FileText, 
  GraduationCap,
  Layers,
  Users,
  Menu,
  X
} from 'lucide-react';

export type ActiveTab = 
  | 'chat' 
  | 'planner' 
  | 'quiz' 
  | 'flashcards' 
  | 'calendar' 
  | 'subjects' 
  | 'prompts' 
  | 'report';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  examCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, examCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'chat' as ActiveTab, label: 'Tutor IA', shortLabel: 'Tutor IA', icon: Bot },
    { id: 'planner' as ActiveTab, label: 'Cronograma', shortLabel: 'Cronograma', icon: Calendar },
    { id: 'quiz' as ActiveTab, label: 'Simulados', shortLabel: 'Simulados', icon: CheckSquare },
    { id: 'flashcards' as ActiveTab, label: 'Flashcards', shortLabel: 'Flashcards', icon: Layers },
    { id: 'calendar' as ActiveTab, label: 'Google Agenda', shortLabel: 'Agenda', icon: Sparkles, count: examCount },
    { id: 'subjects' as ActiveTab, label: '15 Matérias', shortLabel: 'Matérias', icon: BookOpen },
    { id: 'prompts' as ActiveTab, label: 'Prompt Lab', shortLabel: 'Prompts', icon: Code2 },
    { id: 'report' as ActiveTab, label: 'Relatório', shortLabel: 'Relatório', icon: FileText },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-14 sm:h-16">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => handleSelectTab('chat')}
            className="flex items-center gap-2.5 text-left group shrink-0 focus:outline-none cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-400 transition-colors shrink-0">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white block whitespace-nowrap">
                Agente Acadêmico ADS
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:block whitespace-nowrap">
                FSG · Davi Chidem · Guilherme Matte · João
              </span>
            </div>
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`ml-0.5 text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md leading-none ${
                        isActive
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-slate-800 text-indigo-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Mobile Drawer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('report')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
              title="Ver Relatório Executivo e Equipe ADS"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Equipe ADS</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tablet / Mobile Quick Scrollable Bar (Compact) */}
      <div className="xl:hidden border-t border-slate-900 bg-slate-950/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.shortLabel}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1 py-0.5 rounded leading-none ${
                      isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-indigo-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile / Tablet Expandable Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-3 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-7xl mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium border text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 max-w-7xl mx-auto">
            <span>Curso de ADS · Centro Universitário FSG</span>
            <span className="text-slate-300 font-medium">Davi · Guilherme · João</span>
          </div>
        </div>
      )}
    </header>
  );
};
