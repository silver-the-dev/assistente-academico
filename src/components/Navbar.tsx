import React from 'react';
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
  Users
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
  const navItems = [
    { id: 'chat' as ActiveTab, label: 'Tutor IA', icon: Bot, badge: 'ADS' },
    { id: 'planner' as ActiveTab, label: 'Cronograma', icon: Calendar },
    { id: 'quiz' as ActiveTab, label: 'Simulados', icon: CheckSquare },
    { id: 'flashcards' as ActiveTab, label: 'Flashcards', icon: Layers },
    { id: 'calendar' as ActiveTab, label: 'Google Agenda', icon: Sparkles, count: examCount },
    { id: 'subjects' as ActiveTab, label: '15 Matérias', icon: BookOpen },
    { id: 'prompts' as ActiveTab, label: 'Prompt Lab (v1/v2/v3)', icon: Code2 },
    { id: 'report' as ActiveTab, label: 'Relatório do Projeto', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Agente Acadêmico</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  FSG · ADS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Davi Chidem · Guilherme Matte · João
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="px-1.5 py-0.2 bg-slate-800 text-[9px] rounded text-slate-300">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile indicator & Team Info */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Ver Projeto e Integrantes"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Equipe ADS</span>
            </button>
          </div>
        </div>

        {/* Subnav for Mobile and Tablet */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] bg-indigo-400/20 px-1 rounded-full text-indigo-300">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
