import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MaterialsManager } from './components/MaterialsManager';
import { ChatTutor } from './components/ChatTutor';
import { StudyPlanner } from './components/StudyPlanner';
import { SimuladoEngine } from './components/SimuladoEngine';
import { FlashcardsView } from './components/FlashcardsView';
import { GoogleCalendarSync } from './components/GoogleCalendarSync';
import { KnowledgeBase } from './components/KnowledgeBase';
import { PromptEngineeringLab } from './components/PromptEngineeringLab';
import { ProjectReport } from './components/ProjectReport';
import {
  useDocuments,
  useDisciplines,
  useEvents,
  useStudyPlans,
  useQuizzes,
  useFlashcards,
  storage,
} from './services/storage';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function App() {
  const { data: documents, loading: loadingDocs } = useDocuments();
  const { data: disciplines } = useDisciplines();
  const { data: events } = useEvents();
  const { data: studyPlans } = useStudyPlans();
  const { data: quizzes } = useQuizzes();
  const { data: flashcards } = useFlashcards();

  const [activeTab, setActiveTab] = useState<ActiveTab>('materials');
  const [hasInitializedDefaultTab, setHasInitializedDefaultTab] = useState(false);

  // Cross-tab context state (without any hardcoded mock strings or dates)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [pendingErrorFlashcards, setPendingErrorFlashcards] = useState<{
    disciplineId: string;
    wrongQuestionsContext: string[];
  } | null>(null);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  useEffect(() => {
    if (!loadingDocs && !hasInitializedDefaultTab) {
      setActiveTab(documents.length > 0 ? 'chat' : 'materials');
      setHasInitializedDefaultTab(true);
    }
  }, [loadingDocs, documents.length, hasInitializedDefaultTab]);

  const pendingReviewCount = events.filter((e) => e.needsReview).length;

  const handleOpenPlannerWithDiscipline = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId);
    setActiveTab('planner');
  };

  const handleOpenSimuladoWithDiscipline = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId);
    setActiveTab('quiz');
  };

  const handleOpenFlashcardsWithDiscipline = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId);
    setActiveTab('flashcards');
  };

  const handleGenerateFlashcardsFromErrors = (
    disciplineId: string,
    wrongQuestionsContext: string[]
  ) => {
    setSelectedDisciplineId(disciplineId);
    setPendingErrorFlashcards({ disciplineId, wrongQuestionsContext });
    setActiveTab('flashcards');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-indigo-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documentsCount={documents.length}
        pendingReviewCount={pendingReviewCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {activeTab === 'materials' && (
          <MaterialsManager
            documents={documents}
            disciplines={disciplines}
            events={events}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTutor
            disciplines={disciplines}
            events={events}
            documents={documents}
            onNavigateToMaterials={() => setActiveTab('materials')}
            onOpenPlannerWithDiscipline={handleOpenPlannerWithDiscipline}
            onOpenSimuladoWithDiscipline={handleOpenSimuladoWithDiscipline}
            onOpenFlashcardsWithDiscipline={handleOpenFlashcardsWithDiscipline}
            onNavigateToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'planner' && (
          <StudyPlanner
            disciplines={disciplines}
            events={events}
            documents={documents}
            studyPlans={studyPlans}
            initialDisciplineId={selectedDisciplineId}
            onNavigateToMaterials={() => setActiveTab('materials')}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onNavigateToQuiz={handleOpenSimuladoWithDiscipline}
          />
        )}

        {activeTab === 'quiz' && (
          <SimuladoEngine
            disciplines={disciplines}
            documents={documents}
            quizzes={quizzes}
            initialDisciplineId={selectedDisciplineId}
            onNavigateToMaterials={() => setActiveTab('materials')}
            onNavigateToPlanner={handleOpenPlannerWithDiscipline}
            onGenerateFlashcardsFromErrors={handleGenerateFlashcardsFromErrors}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            disciplines={disciplines}
            documents={documents}
            flashcards={flashcards}
            initialDisciplineId={selectedDisciplineId}
            pendingErrorContext={pendingErrorFlashcards}
            onClearPendingErrorContext={() => setPendingErrorFlashcards(null)}
            onNavigateToMaterials={() => setActiveTab('materials')}
          />
        )}

        {activeTab === 'calendar' && (
          <GoogleCalendarSync
            events={events}
            disciplines={disciplines}
            studyPlans={studyPlans}
            onNavigateToMaterials={() => setActiveTab('materials')}
            onNavigateToPlanner={handleOpenPlannerWithDiscipline}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBase
            disciplines={disciplines}
            documents={documents}
            onNavigateToMaterials={() => setActiveTab('materials')}
            onOpenSimulado={handleOpenSimuladoWithDiscipline}
            onOpenFlashcards={handleOpenFlashcardsWithDiscipline}
            onOpenPlanner={handleOpenPlannerWithDiscipline}
          />
        )}

        {activeTab === 'prompts' && <PromptEngineeringLab />}

        {activeTab === 'report' && (
          <ProjectReport
            documentsCount={documents.length}
            disciplinesCount={disciplines.length}
            eventsCount={events.length}
          />
        )}
      </main>

      {/* Footer with Clear All Data action */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span>Agente Acadêmico ADS – FSG · Equipe: Davi Chidem, Guilherme Matte e João</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono tabular-nums">
              {documents.length} doc(s) · {disciplines.length} matéria(s) · {events.length} evento(s)
            </span>
            <button
              type="button"
              onClick={() => setShowClearDataConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Apagar todos os meus dados</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modal: Clear All Data Confirmation */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Apagar Todos os Dados Locais?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Esta ação removerá permanentemente todos os documentos enviados, disciplinas extraídas, eventos,
              cronogramas, simulados e flashcards armazenados no IndexedDB deste navegador.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDataConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await storage.clearAllData();
                  setShowClearDataConfirm(false);
                  setActiveTab('materials');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
