import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  HelpCircle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Code, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion } from '../types/academic';
import { INITIAL_QUIZ, SUBJECTS } from '../data/fsgData';

interface SimuladoEngineProps {
  initialSubject?: string;
  onNavigateToPlanner: (subject: string) => void;
}

export const SimuladoEngine: React.FC<SimuladoEngineProps> = ({
  initialSubject,
  onNavigateToPlanner,
}) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(INITIAL_QUIZ);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Generator states
  const [generatorSubject, setGeneratorSubject] = useState(initialSubject || 'Modelagem e Banco de Dados Relacional');
  const [generatorTopic, setGeneratorTopic] = useState('');
  const [generatorCount, setGeneratorCount] = useState(5);
  const [generatorDifficulty, setGeneratorDifficulty] = useState('médio');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubject) {
      setGeneratorSubject(initialSubject);
    }
  }, [initialSubject]);

  const currentQ: QuizQuestion | undefined = currentQuiz.questions[currentQuestionIdx];

  const handleSelectOption = (questionId: number, key: string) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: key }));
    setShowExplanations((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleFinishQuiz = () => {
    setIsFinished(true);
    const allExplanations: Record<number, boolean> = {};
    currentQuiz.questions.forEach((q) => {
      allExplanations[q.id] = true;
    });
    setShowExplanations(allExplanations);

    let correct = 0;
    currentQuiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const percentage = (correct / currentQuiz.questions.length) * 100;
    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setIsFinished(false);
    setCurrentQuestionIdx(0);
  };

  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatorSubject,
          topic: generatorTopic || undefined,
          count: generatorCount,
          difficulty: generatorDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar simulado com IA no servidor.');
      }

      const newQuiz: Quiz = await response.json();
      if (newQuiz && newQuiz.questions && newQuiz.questions.length > 0) {
        setCurrentQuiz(newQuiz);
        handleResetQuiz();
        setShowGeneratorModal(false);
      } else {
        throw new Error('O formato retornado pelo modelo não continha questões válidas.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao gerar simulado. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Score computation
  const correctCount = currentQuiz.questions.filter(
    (q) => selectedAnswers[q.id] === q.correctAnswer
  ).length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const scorePercent = Math.round((correctCount / currentQuiz.questions.length) * 100);

  return (
    <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide mb-1">
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span>Simulados & Gabarito Comentado</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
            {currentQuiz.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Disciplina: <span className="text-indigo-300 font-medium">{currentQuiz.subject}</span> · <span className="font-mono tabular-nums">{currentQuiz.questions.length}</span> questões
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowGeneratorModal(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-200 shrink-0" />
            <span>Gerar Novo com IA</span>
          </button>

          <button
            type="button"
            onClick={handleResetQuiz}
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Reiniciar Simulado"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Question selector buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {currentQuiz.questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
            const isCurrent = idx === currentQuestionIdx;

            let dotColor = 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700';
            if (isAnswered) {
              dotColor = isCorrect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            }
            if (isCurrent) {
              dotColor += ' ring-2 ring-indigo-500';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`h-8 w-8 rounded-lg text-xs font-mono tabular-nums font-semibold flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${dotColor}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Live score summary */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono tabular-nums pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <span className="text-slate-400">
            Respondidas: <strong className="text-white">{answeredCount}</strong>/{currentQuiz.questions.length}
          </span>
          {answeredCount > 0 && (
            <span className="text-indigo-300 font-semibold">
              · Acertos: {correctCount} ({scorePercent}%)
            </span>
          )}
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6">
          {/* Question Header */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2.5 border-b border-slate-800 font-mono tabular-nums">
            <span className="font-sans font-semibold text-indigo-400">
              Questão {currentQuestionIdx + 1} de {currentQuiz.questions.length}
            </span>
            <span>#{currentQ.id}</span>
          </div>

          {/* Enunciado */}
          <h2 className="text-sm sm:text-lg font-semibold text-white leading-relaxed mb-4">
            {currentQ.question}
          </h2>

          {/* Code snippet if present */}
          {currentQ.codeSnippet && (
            <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-2 pb-1.5 border-b border-slate-800">
                <Code className="h-3.5 w-3.5 shrink-0" />
                <span>Código Contextual</span>
              </div>
              <pre className="leading-relaxed">{currentQ.codeSnippet}</pre>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {currentQ.options.map((option) => {
              const isSelected = selectedAnswers[currentQ.id] === option.key;
              const hasAnswered = selectedAnswers[currentQ.id] !== undefined;
              const isCorrectOption = currentQ.correctAnswer === option.key;

              let style = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950';

              if (hasAnswered) {
                if (isCorrectOption) {
                  style = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100';
                } else if (isSelected && !isCorrectOption) {
                  style = 'bg-rose-950/40 border-rose-500/60 text-rose-100';
                } else {
                  style = 'bg-slate-950/40 border-slate-800/60 text-slate-400 opacity-65';
                }
              } else if (isSelected) {
                style = 'bg-indigo-950/50 border-indigo-500 text-white';
              }

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, option.key)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-start gap-3 cursor-pointer ${style}`}
                >
                  <span
                    className={`h-6 w-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                      hasAnswered && isCorrectOption
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : hasAnswered && isSelected && !isCorrectOption
                        ? 'bg-rose-500 text-white border-rose-400'
                        : isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {option.key}
                  </span>
                  <span className="flex-1 leading-relaxed break-words">{option.text}</span>
                  {hasAnswered && isCorrectOption && (
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Commented Answer Key (Gabarito Comentado) */}
          {showExplanations[currentQ.id] && (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 mb-5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-indigo-300 mb-1.5">
                <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Gabarito Comentado · Alternativa Correta: ({currentQ.correctAnswer})</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Anterior</span>
            </button>

            {currentQuestionIdx < currentQuiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="px-4 py-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Award className="h-4 w-4 shrink-0" />
                <span>Finalizar Simulado</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Score Card when Finished */}
      {isFinished && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mx-auto mb-3">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
            Resultado do Simulado
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mb-5 font-mono tabular-nums">
            Você acertou <strong className="text-emerald-400 text-base">{correctCount}</strong> de {currentQuiz.questions.length} questões ({scorePercent}%)
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-2.5">
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
            >
              Tentar Novamente
            </button>
            <button
              type="button"
              onClick={() => onNavigateToPlanner(currentQuiz.subject)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Montar Cronograma para Esta Matéria
            </button>
          </div>
        </div>
      )}

      {/* Modal Generator with AI */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                <span>Gerar Simulado com IA</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              O modelo Gemini criará questões inéditas contextualizadas com os tópicos da ementa de ADS da FSG.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Disciplina de ADS
                </label>
                <select
                  value={generatorSubject}
                  onChange={(e) => setGeneratorSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.responsible})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Tópico específico (opcional)
                </label>
                <input
                  type="text"
                  value={generatorTopic}
                  onChange={(e) => setGeneratorTopic(e.target.value)}
                  placeholder="Ex: Normalização 3FN, JOINs, Polimorfismo, Dockerfile..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Número de Questões
                  </label>
                  <select
                    value={generatorCount}
                    onChange={(e) => setGeneratorCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={3}>3 Questões (Rápido)</option>
                    <option value={5}>5 Questões (Padrão)</option>
                    <option value={8}>8 Questões (Intensivo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Dificuldade
                  </label>
                  <select
                    value={generatorDifficulty}
                    onChange={(e) => setGeneratorDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="fácil">Fácil (Conceitual)</option>
                    <option value="médio">Médio (Padrão FSG)</option>
                    <option value="difícil">Difícil (Pegadinhas & Código)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Gerando Simulado...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-200 shrink-0" />
                      <span>Gerar Simulado</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
