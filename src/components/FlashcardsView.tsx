import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Loader2,
  FolderUp,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  RefreshCw,
  FileText,
  Lightbulb,
  Trash2,
} from 'lucide-react';
import { Discipline, SourceDoc, Flashcard } from '../types/academic';
import { storage } from '../services/storage';

interface FlashcardsViewProps {
  disciplines: Discipline[];
  documents: SourceDoc[];
  flashcards: Flashcard[];
  initialDisciplineId?: string;
  pendingErrorContext?: { disciplineId: string; wrongQuestionsContext: string[] } | null;
  onClearPendingErrorContext?: () => void;
  onNavigateToMaterials: () => void;
}

const LEITNER_INTERVAL_DAYS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

function addDaysIso(days: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  disciplines,
  documents,
  flashcards,
  initialDisciplineId,
  pendingErrorContext,
  onClearPendingErrorContext,
  onNavigateToMaterials,
}) => {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(
    initialDisciplineId || disciplines[0]?.id || ''
  );
  const [filterMode, setFilterMode] = useState<'due' | 'all'>('all');
  const [cardCountToGenerate, setCardCountToGenerate] = useState<number>(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialDisciplineId) {
      setSelectedDisciplineId(initialDisciplineId);
    } else if (!selectedDisciplineId && disciplines.length > 0) {
      setSelectedDisciplineId(disciplines[0].id);
    }
  }, [initialDisciplineId, disciplines, selectedDisciplineId]);

  const generateCards = async (disc: Discipline, wrongQuestionsContext?: string[]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplineId: disc.id,
          disciplineName: disc.name,
          syllabus: disc.syllabus,
          count: cardCountToGenerate,
          wrongQuestionsContext,
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
        throw new Error(data.error || 'Erro ao gerar flashcards.');
      }

      const todayIso = new Date().toISOString().split('T')[0];
      const newCards: Flashcard[] = (data.flashcards || []).map(
        (
          c: {
            category: string;
            front: string;
            back: string;
            hint?: string;
            sourceExcerpt: string;
          },
          idx: number
        ) => ({
          id: `fc-${Date.now()}-${idx}`,
          disciplineId: disc.id,
          disciplineName: disc.name,
          category: c.category,
          front: c.front,
          back: c.back,
          hint: c.hint,
          sourceDocId: disc.sourceDocIds[0] || documents[0]?.id || 'doc',
          sourceExcerpt: c.sourceExcerpt,
          box: 1,
          nextReviewAt: todayIso,
        })
      );

      await storage.saveFlashcardsBatch(newCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setErrorMessage((err as Error)?.message || 'Falha ao gerar flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger automatic generation when redirected from SimuladoEngine errors
  useEffect(() => {
    if (pendingErrorContext && disciplines.length > 0) {
      const targetDisc =
        disciplines.find((d) => d.id === pendingErrorContext.disciplineId) || disciplines[0];
      setSelectedDisciplineId(targetDisc.id);
      generateCards(targetDisc, pendingErrorContext.wrongQuestionsContext);
      if (onClearPendingErrorContext) onClearPendingErrorContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingErrorContext]);

  if (disciplines.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Flashcards com Repetição Espaçada (Leitner)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Envie seus documentos acadêmicos na aba <strong>Materiais</strong> para gerar flashcards ancorados na sua
          ementa e praticar com o método de 5 caixas de Leitner.
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

  const todayIso = new Date().toISOString().split('T')[0];
  const disciplineCards = flashcards.filter(
    (c) => !selectedDisciplineId || c.disciplineId === selectedDisciplineId
  );
  const dueCards = disciplineCards.filter((c) => c.nextReviewAt <= todayIso);
  const activeDeck = filterMode === 'due' ? dueCards : disciplineCards;

  const safeIndex = activeDeck.length > 0 ? Math.min(currentIndex, activeDeck.length - 1) : 0;
  const currentCard = activeDeck[safeIndex];

  const handleReviewAnswer = async (knewIt: boolean) => {
    if (!currentCard) return;
    const nextBox = knewIt ? (Math.min(5, currentCard.box + 1) as 1 | 2 | 3 | 4 | 5) : 1;
    const nextReviewAt = addDaysIso(LEITNER_INTERVAL_DAYS[nextBox]);

    await storage.saveFlashcard({
      ...currentCard,
      box: nextBox,
      nextReviewAt,
    });

    setIsFlipped(false);
    setShowHint(false);
    if (safeIndex + 1 < activeDeck.length) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const selectedDiscipline =
    disciplines.find((d) => d.id === selectedDisciplineId) || disciplines[0];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Sistema Leitner de 5 Caixas · Repetição Espaçada</span>
          </div>
          <h1 className="text-xl font-bold text-white">Flashcards Inteligentes</h1>
          <p className="text-xs text-slate-400">
            Cartões gerados diretamente dos seus arquivos com controle automático de vencimento de revisão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDisciplineId}
            onChange={(e) => {
              setSelectedDisciplineId(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas as disciplinas ({flashcards.length})</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={cardCountToGenerate}
            onChange={(e) => setCardCountToGenerate(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
          >
            <option value={6}>+6 cartões</option>
            <option value={10}>+10 cartões</option>
            <option value={15}>+15 cartões</option>
          </select>

          <button
            type="button"
            disabled={isGenerating || !selectedDiscipline}
            onClick={() => selectedDiscipline && generateCards(selectedDiscipline)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Novos Cartões com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Leitner Filter & Box Distribution */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos os Cartões ({disciplineCards.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode('due');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'due' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Para Revisar Hoje ({dueCards.length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          {[1, 2, 3, 4, 5].map((boxNum) => {
            const count = disciplineCards.filter((c) => c.box === boxNum).length;
            return (
              <span key={boxNum} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Caixa {boxNum}: <strong className="text-white">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main 3D Card Viewport */}
      {!currentCard ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {filterMode === 'due'
              ? 'Parabéns! Você revisou todos os flashcards vencidos de hoje.'
              : 'Nenhum flashcard gerado para esta disciplina ainda.'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Clique em &ldquo;Gerar Novos Cartões com IA&rdquo; acima para criar flashcards a partir dos documentos enviados.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Card Counter & Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              Cartão {safeIndex + 1} de {activeDeck.length} · {currentCard.category}
            </span>
            <div className="flex items-center gap-3">
              <span>
                Caixa Leitner {currentCard.box}/5 · Próxima revisão: {currentCard.nextReviewAt}
              </span>
              <button
                type="button"
                onClick={() => storage.deleteFlashcard(currentCard.id)}
                title="Excluir cartão"
                className="text-slate-500 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className="perspective cursor-pointer select-none"
          >
            <div
              className={`relative w-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span>FRENTE · PERGUNTA</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Clique para virar</span>
                  </span>
                </div>

                <div className="my-auto py-6 text-center">
                  <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </h2>
                </div>

                <div className="flex items-center justify-between">
                  {currentCard.hint ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showHint ? currentCard.hint : 'Ver dica'}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-slate-500">{currentCard.disciplineName}</span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 border-2 border-indigo-500/70 rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>VERSO · RESPOSTA OFICIAL</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Clique para voltar</span>
                  </span>
                </div>

                <div className="my-auto py-4 space-y-4">
                  <p className="text-sm sm:text-lg text-slate-100 leading-relaxed text-center">
                    {currentCard.back}
                  </p>

                  {currentCard.sourceExcerpt && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Fonte no documento:</strong> &ldquo;
                        {currentCard.sourceExcerpt}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Avalie sua recordação abaixo para atualizar a caixa Leitner
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Leitner Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setShowHint(false);
                  setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setShowHint(false);
                  setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleReviewAnswer(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Preciso Revisar (Volta Caixa 1)</span>
              </button>
              <button
                type="button"
                onClick={() => handleReviewAnswer(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Acertei (Avançar Caixa)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
