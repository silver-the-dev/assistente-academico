import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ChatTutor } from './components/ChatTutor';
import { StudyPlanner } from './components/StudyPlanner';
import { SimuladoEngine } from './components/SimuladoEngine';
import { FlashcardsView } from './components/FlashcardsView';
import { GoogleCalendarSync } from './components/GoogleCalendarSync';
import { KnowledgeBase } from './components/KnowledgeBase';
import { PromptEngineeringLab } from './components/PromptEngineeringLab';
import { ProjectReport } from './components/ProjectReport';
import { INITIAL_EXAMS } from './data/fsgData';
import { ExamEvent } from './types/academic';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [exams, setExams] = useState<ExamEvent[]>(() => {
    try {
      const saved = localStorage.getItem('fsg_ads_exams');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_EXAMS;
  });

  // Selected parameters for cross-tab transitions
  const [plannerSubject, setPlannerSubject] = useState('Modelagem e Banco de Dados Relacional');
  const [plannerDate, setPlannerDate] = useState('2026-11-20');
  const [quizSubject, setQuizSubject] = useState('Modelagem e Banco de Dados Relacional');
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fsg_ads_exams', JSON.stringify(exams));
    } catch {
      // fallback
    }
  }, [exams]);

  const handleAddExam = (newExam: ExamEvent) => {
    setExams((prev) => [newExam, ...prev]);
  };

  const handleOpenPlanner = (subject: string, date: string) => {
    setPlannerSubject(subject);
    setPlannerDate(date);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuiz = (subject: string) => {
    setQuizSubject(subject);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatWithPrompt = (promptText: string) => {
    setPendingChatPrompt(promptText);
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-indigo-200 overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        examCount={exams.length}
      />

      <main className="flex-1 w-full flex flex-col">
        {activeTab === 'chat' && (
          <ChatTutor
            initialPrompt={pendingChatPrompt}
            onClearInitialPrompt={() => setPendingChatPrompt(null)}
            onOpenPlannerWithParams={handleOpenPlanner}
            onOpenSimuladoWithSubject={handleOpenQuiz}
            onNavigateToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'planner' && (
          <StudyPlanner
            initialSubject={plannerSubject}
            initialDate={plannerDate}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onNavigateToQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'quiz' && (
          <SimuladoEngine
            initialSubject={quizSubject}
            onNavigateToPlanner={(subject) => handleOpenPlanner(subject, '2026-11-20')}
          />
        )}

        {activeTab === 'flashcards' && <FlashcardsView />}

        {activeTab === 'calendar' && (
          <GoogleCalendarSync
            exams={exams}
            onAddExam={handleAddExam}
            onNavigateToPlannerWithExam={handleOpenPlanner}
          />
        )}

        {activeTab === 'subjects' && (
          <KnowledgeBase
            onSelectSubjectForChat={handleOpenChatWithPrompt}
            onSelectSubjectForPlanner={(subject) => handleOpenPlanner(subject, '2026-11-20')}
            onSelectSubjectForQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'prompts' && <PromptEngineeringLab />}

        {activeTab === 'report' && <ProjectReport />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-4 text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            <strong className="text-slate-300">Agente Acadêmico ADS · FSG</strong> — Assistente de Estudos e Cronogramas
          </p>
          <p className="text-slate-400">
            Davi Chidem · Guilherme Matte · João
          </p>
        </div>
      </footer>
    </div>
  );
}
