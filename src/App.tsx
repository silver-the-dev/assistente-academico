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
    } catch (e) {
      // fallback
    }
    return INITIAL_EXAMS;
  });

  // Selected parameters for cross-tab transitions
  const [plannerSubject, setPlannerSubject] = useState('Modelagem e Banco de Dados Relacional');
  const [plannerDate, setPlannerDate] = useState('2026-11-20');
  const [quizSubject, setQuizSubject] = useState('Modelagem e Banco de Dados Relacional');

  useEffect(() => {
    try {
      localStorage.setItem('fsg_ads_exams', JSON.stringify(exams));
    } catch (e) {
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
  };

  const handleOpenQuiz = (subject: string) => {
    setQuizSubject(subject);
    setActiveTab('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-indigo-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        examCount={exams.length}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatTutor
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
            onSelectSubjectForChat={(prompt) => {
              setActiveTab('chat');
            }}
            onSelectSubjectForPlanner={(subject) => handleOpenPlanner(subject, '2026-11-20')}
            onSelectSubjectForQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'prompts' && <PromptEngineeringLab />}

        {activeTab === 'report' && <ProjectReport />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-slate-400">Agente Acadêmico ADS · FSG</strong> — Projeto desenvolvido no Google AI Studio
          </p>
          <p className="text-slate-400">
            Davi Chidem · Guilherme Matte · João
          </p>
        </div>
      </footer>
    </div>
  );
}
