import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  Loader2,
  FolderUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  CheckSquare,
  FileText,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  Discipline,
  SourceDoc,
  Quiz,
  QuizQuestion,
  QuizStyle,
  QuizAttempt,
} from '../types/academic';
import { storage } from '../services/storage';

interface SimuladoEngineProps {
  disciplines: Discipline[];
  documents: SourceDoc[];
  quizzes: Quiz[];
  initialDisciplineId?: string;
  onNavigateToMaterials: () => void;
  onNavigateToPlanner: (disciplineId: string) => void;
  onGenerateFlashcardsFromErrors: (disciplineId: string, wrongQuestionsContext: string[]) => void;
}

export const SimuladoEngine: React.FC<SimuladoEngineProps> = ({
  disciplines,
  documents,
  quizzes,
  initialDisciplineId,
  onNavigateToMaterials,
  onNavigateToPlanner,
  onGenerateFlashcardsFromErrors,
}) => {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(
    initialDisciplineId || disciplines[0]?.id || ''
  );
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Médio' | 'Avançado'>('Médio');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [style, setStyle] = useState<QuizStyle>('conceitual');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeQuizId, setActiveQuizId] = useState<string>(quizzes[0]?.id || '');
  const [retryWrongOnlyIds, setRetryWrongOnlyIds] = useState<number[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number>(Date.now());

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialDisciplineId) {
      setSelectedDisciplineId(initialDisciplineId);
    } else if (!selectedDisciplineId && disciplines.length > 0) {
      setSelectedDisciplineId(disciplines[0].id);
    }
  }, [initialDisciplineId, disciplines, selectedDisciplineId]);

  useEffect(() => {
    if (!activeQuizId && quizzes.length > 0) {
      setActiveQuizId(quizzes[0].id);
    }
  }, [quizzes, activeQuizId]);

  if (disciplines.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Simulados Baseados nos Seus Materiais</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Envie seus planos de ensino, apostilas, slides ou provas anteriores na aba <strong>Materiais</strong> para gerar
          simulados inéditos com gabarito comentado e trecho de referência do documento.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onNavigateToMaterials}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            <span>Enviar Documentos na Aba Materiais</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedDiscipline = disciplines.find((d) => d.id === selectedDisciplineId) || disciplines[0];
  const hasPastExamDoc = documents.some((doc) => doc.kind === 'prova_anterior');

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscipline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplineId: selectedDiscipline.id,
          disciplineName: selectedDiscipline.name,
          syllabus: selectedDiscipline.syllabus,
          topics: selectedTopics,
          difficulty,
          count: questionCount,
          style,
          documents: documents.map((d) => ({
            id: d.id,
            name: d.name,
            kind: d.kind,
            disciplineIds: d.disciplineIds,
            extractedText: d.extractedText,
          })),
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar simulado.');
      }

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: data.title || `Simulado de ${selectedDiscipline.name}`,
        disciplineId: selectedDiscipline.id,
        disciplineName: selectedDiscipline.name,
        difficulty,
        style,
        createdAt: new Date().toISOString(),
        sourceDocIds: selectedDiscipline.sourceDocIds,
        questions: data.questions || [],
        attempts: [],
      };

      await storage.saveQuiz(newQuiz);
      setActiveQuizId(newQuiz.id);
      setRetryWrongOnlyIds(null);
      setUserAnswers({});
      setIsSubmitted(false);
      setStartTimeMs(Date.now());
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setErrorMessage((err as Error)?.message || 'Falha ao gerar o simulado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || quizzes[0];

  const displayedQuestions: QuizQuestion[] = activeQuiz
    ? retryWrongOnlyIds
      ? activeQuiz.questions.filter((q) => retryWrongOnlyIds.includes(q.id))
      : activeQuiz.questions
    : [];

  const handleSelectOption = (qId: number, optKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || displayedQuestions.length === 0) return;
    setIsSubmitted(true);

    let correct = 0;
    const wrongIds: number[] = [];

    for (const q of displayedQuestions) {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      } else {
        wrongIds.push(q.id);
      }
    }

    const pct = Math.round((correct / displayedQuestions.length) * 100);
    if (pct >= 70) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore confetti error
      }
    }

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      takenAt: new Date().toISOString(),
      answers: userAnswers,
      score: correct,
      totalQuestions: displayedQuestions.length,
      durationSeconds: Math.max(1, Math.round((Date.now() - startTimeMs) / 1000)),
      wrongQuestionIds: wrongIds,
    };

    const updatedQuiz: Quiz = {
      ...activeQuiz,
      attempts: [attempt, ...(activeQuiz.attempts || [])],
    };
    await storage.saveQuiz(updatedQuiz);
  };

  const wrongQuestionsInCurrentRun = displayedQuestions.filter(
    (q) => isSubmitted && userAnswers[q.id] !== q.correctAnswer
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Generator Panel */}
        <form
          onSubmit={handleGenerateQuiz}
          className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Motor de Simulados Acadêmicos</span>
            </div>
            <h1 className="text-lg font-bold text-white">Gerar Novo Simulado</h1>
            <p className="text-xs text-slate-400">
              Questões inéditas ancoradas nos seus documentos com gabarito comentado das 4 alternativas.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Disciplina *</label>
              <select
                value={selectedDiscipline?.id || ''}
                onChange={(e) => {
                  setSelectedDisciplineId(e.target.value);
                  setSelectedTopics([]);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nº de Questões</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white"
                >
                  <option value={5}>5 questões</option>
                  <option value={10}>10 questões</option>
                  <option value={15}>15 questões</option>
                  <option value={20}>20 questões</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'Fácil' | 'Médio' | 'Avançado')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estilo de Cobrança</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as QuizStyle)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white"
              >
                <option value="conceitual">Conceitual & Fundamentos</option>
                <option value="codigo">Análise de Código / SQL / Prática</option>
                <option value="estudo_de_caso">Estudo de Caso de Engenharia</option>
                <option value="formato_prova_anterior" disabled={!hasPastExamDoc}>
                  Formato de Prova Anterior {hasPastExamDoc ? '(Disponível)' : '(Envie uma prova antes)'}
                </option>
              </select>
            </div>

            {selectedDiscipline && selectedDiscipline.syllabus.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Filtrar Tópicos da Ementa (opcional)
                </label>
                <div className="max-h-36 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                  {selectedDiscipline.syllabus.map((topic, idx) => {
                    const checked = selectedTopics.includes(topic);
                    return (
                      <label key={idx} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedTopics((prev) =>
                              checked ? prev.filter((t) => t !== topic) : [...prev, topic]
                            )
                          }
                          className="mt-0.5 rounded accent-indigo-600"
                        />
                        <span className="leading-snug">{topic}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Elaborando Questões Inéditas...</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Gerar Simulado Agora</span>
              </>
            )}
          </button>
        </form>

        {/* Right Active Quiz Area */}
        <div className="lg:col-span-8 space-y-5">
          {quizzes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActiveQuizId(q.id);
                    setRetryWrongOnlyIds(null);
                    setUserAnswers({});
                    setIsSubmitted(false);
                    setStartTimeMs(Date.now());
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeQuiz?.id === q.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {q.title} ({q.questions.length}q)
                </button>
              ))}
            </div>
          )}

          {!activeQuiz ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
              <GraduationCap className="w-9 h-9 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhum simulado gerado ainda</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Selecione uma disciplina e clique em &ldquo;Gerar Simulado Agora&rdquo; para testar seus conhecimentos no conteúdo real dos seus arquivos.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Quiz Header */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                    <span>{activeQuiz.disciplineName}</span>
                    <span>· {activeQuiz.difficulty}</span>
                    <span>· {displayedQuestions.length} questões</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1">{activeQuiz.title}</h2>
                </div>

                {activeQuiz.attempts && activeQuiz.attempts.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 font-mono tabular-nums">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>
                      Última nota: {activeQuiz.attempts[0].score}/{activeQuiz.attempts[0].totalQuestions}
                    </span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {displayedQuestions.map((q, idx) => {
                  const chosen = userAnswers[q.id];
                  const isCorrect = chosen === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Questão {idx + 1} de {displayedQuestions.length}
                        </span>
                        {isSubmitted && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold ${
                              isCorrect ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correta</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span>Incorreta (Gabarito: {q.correctAnswer})</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">{q.question}</p>

                      {q.codeSnippet && q.codeSnippet.trim().length > 0 && (
                        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      )}

                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = chosen === opt.key;
                          const isRightOption = opt.key === q.correctAnswer;

                          let btnStyle =
                            'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700';
                          if (!isSubmitted && isSelected) {
                            btnStyle = 'bg-indigo-600/20 border-indigo-500 text-white';
                          } else if (isSubmitted) {
                            if (isRightOption) {
                              btnStyle = 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200';
                            } else if (isSelected && !isRightOption) {
                              btnStyle = 'bg-red-950/40 border-red-500/70 text-red-200';
                            }
                          }

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectOption(q.id, opt.key)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                            >
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 shrink-0">
                                {opt.key}
                              </span>
                              <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Source Excerpt after Submission */}
                      {isSubmitted && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-1.5">
                            <p className="text-xs font-bold text-indigo-400">Gabarito Comentado:</p>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {q.explanation}
                            </p>
                          </div>

                          {q.sourceExcerpt && (
                            <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                              <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-300">Referência no seu material: </span>
                                <span className="italic">&ldquo;{q.sourceExcerpt}&rdquo;</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Post-Quiz Actions */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
                {!isSubmitted ? (
                  <>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      Respondidas: {Object.keys(userAnswers).length} / {displayedQuestions.length}
                    </span>
                    <button
                      type="button"
                      disabled={Object.keys(userAnswers).length < displayedQuestions.length}
                      onClick={handleSubmitQuiz}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      Finalizar e Corrigir Simulado
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRetryWrongOnlyIds(null);
                          setUserAnswers({});
                          setIsSubmitted(false);
                          setStartTimeMs(Date.now());
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refazer Simulado Completo</span>
                      </button>

                      {wrongQuestionsInCurrentRun.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRetryWrongOnlyIds(wrongQuestionsInCurrentRun.map((q) => q.id));
                              setUserAnswers({});
                              setIsSubmitted(false);
                              setStartTimeMs(Date.now());
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refazer Só as Que Errei ({wrongQuestionsInCurrentRun.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onGenerateFlashcardsFromErrors(
                                activeQuiz.disciplineId,
                                wrongQuestionsInCurrentRun.map(
                                  (q) => `Pergunta errada: ${q.question} | Explicação correta: ${q.explanation}`
                                )
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Gerar Flashcards dos Meus Erros</span>
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToPlanner(activeQuiz.disciplineId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Abrir Cronograma da Matéria</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
