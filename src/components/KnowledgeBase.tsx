import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Loader2,
  FolderUp,
  Clock,
  GraduationCap,
  Layers,
  CheckSquare,
  FileText,
  X,
} from 'lucide-react';
import { Discipline, SourceDoc } from '../types/academic';
import { renderSafeMarkdown } from '../utils/markdown';

interface KnowledgeBaseProps {
  disciplines: Discipline[];
  documents: SourceDoc[];
  onNavigateToMaterials: () => void;
  onOpenSimulado: (disciplineId: string) => void;
  onOpenFlashcards: (disciplineId: string) => void;
  onOpenPlanner: (disciplineId: string) => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  disciplines,
  documents,
  onNavigateToMaterials,
  onOpenSimulado,
  onOpenFlashcards,
  onOpenPlanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [explainingTopic, setExplainingTopic] = useState<string | null>(null);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (disciplines.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Nenhuma disciplina cadastrada ainda</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          As matérias, ementas, bibliografias e horários não são mais fictícios: eles são extraídos automaticamente dos
          seus documentos reais (Planos de Ensino, Cronogramas ou Apostilas).
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onNavigateToMaterials}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            <span>Ir para Materiais e Enviar Documentos</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredDisciplines = disciplines.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.professor && d.professor.toLowerCase().includes(q)) ||
      d.syllabus.some((s) => s.toLowerCase().includes(q))
    );
  });

  const activeDiscipline =
    disciplines.find((d) => d.id === selectedDisciplineId) || filteredDisciplines[0] || disciplines[0];

  const handleExplainTopic = async (topic: string, disc: Discipline) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExplainingTopic(topic);
    setExplanationResult(null);
    setExplanationError(null);

    try {
      const response = await fetch('/api/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: topic,
          disciplineId: disc.id,
          disciplineName: disc.name,
          documents: documents.map((doc) => ({
            id: doc.id,
            name: doc.name,
            kind: doc.kind,
            disciplineIds: doc.disciplineIds,
            extractedText: doc.extractedText,
          })),
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao explicar o tópico.');
      }
      setExplanationResult(data.explanation);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setExplanationError((err as Error)?.message || 'Falha ao buscar explicação.');
    } finally {
      setExplainingTopic(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Disciplinas Extraídas dos Seus Documentos ({disciplines.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clique em qualquer tópico da ementa para gerar uma aula completa baseada no seu material.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar disciplina ou tópico..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Disciplines */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredDisciplines.map((disc) => {
            const isSelected = activeDiscipline?.id === disc.id;
            return (
              <button
                key={disc.id}
                type="button"
                onClick={() => {
                  setSelectedDisciplineId(disc.id);
                  setExplanationResult(null);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white leading-snug">{disc.name}</h3>
                  {disc.code && <span className="text-[11px] font-mono text-indigo-300 shrink-0">{disc.code}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                  {disc.professor && <span>Prof. {disc.professor}</span>}
                  {disc.workloadHours && <span>· {disc.workloadHours}h</span>}
                  <span>· {disc.syllabus.length} tópicos</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Panel */}
        {activeDiscipline && (
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-400 font-mono">
                  {activeDiscipline.code && <span>{activeDiscipline.code}</span>}
                  {activeDiscipline.semester && <span>· Semestre: {activeDiscipline.semester}</span>}
                  {activeDiscipline.workloadHours && <span>· Carga: {activeDiscipline.workloadHours}h</span>}
                </div>
                <h2 className="text-xl font-bold text-white">{activeDiscipline.name}</h2>
                {activeDiscipline.professor && (
                  <p className="text-xs sm:text-sm text-slate-400">Docente: {activeDiscipline.professor}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenSimulado(activeDiscipline.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Gerar Simulado</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenFlashcards(activeDiscipline.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Flashcards</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPlanner(activeDiscipline.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Plano de Estudo</span>
                </button>
              </div>
            </div>

            {/* Schedule & Evaluation Criteria */}
            {(activeDiscipline.schedule.length > 0 || activeDiscipline.evaluationCriteria) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDiscipline.schedule.length > 0 && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Horários de Aula</span>
                    </h4>
                    <div className="space-y-1 text-xs text-slate-400 font-mono">
                      {activeDiscipline.schedule.map((slot, idx) => (
                        <div key={idx}>
                          {DAY_NAMES[slot.dayOfWeek]} · {slot.startTime} às {slot.endTime}
                          {slot.location ? ` (${slot.location})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDiscipline.evaluationCriteria && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Critérios de Avaliação</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{activeDiscipline.evaluationCriteria}</p>
                  </div>
                )}
              </div>
            )}

            {/* Syllabus Topics with AI Explanation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Conteúdo Programático / Ementa ({activeDiscipline.syllabus.length})
                </h3>
                <span className="text-xs text-slate-400">Clique em um tópico para explicação com IA</span>
              </div>

              {activeDiscipline.syllabus.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  Nenhum tópico individual listado na ementa desta disciplina.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeDiscipline.syllabus.map((topic, idx) => {
                    const isLoadingThis = explainingTopic === topic;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleExplainTopic(topic, activeDiscipline)}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm text-slate-200 group-hover:text-white font-medium">
                          {topic}
                        </span>
                        {isLoadingThis ? (
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Concept Explanation Box */}
            {(explainingTopic || explanationResult || explanationError) && (
              <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Explicação Didática Ancorada nos Documentos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExplanationResult(null);
                      setExplanationError(null);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {explainingTopic && (
                  <div className="py-6 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span>Consultando seus materiais para explicar &ldquo;{explainingTopic}&rdquo;...</span>
                  </div>
                )}

                {explanationError && <p className="text-xs text-red-400">{explanationError}</p>}

                {explanationResult && (
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(explanationResult) }}
                  />
                )}
              </div>
            )}

            {/* Bibliography & Source Documents */}
            {activeDiscipline.bibliography && activeDiscipline.bibliography.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300">Bibliografia Extraída</h4>
                <ul className="space-y-1 text-xs text-slate-400 list-disc pl-4">
                  {activeDiscipline.bibliography.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
