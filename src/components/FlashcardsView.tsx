import React, { useState } from 'react';
import { 
  Layers, 
  RotateCw, 
  Check, 
  X, 
  Sparkles, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Flashcard } from '../types/academic';
import { INITIAL_FLASHCARDS, SUBJECTS } from '../data/fsgData';

export const FlashcardsView: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());

  // Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSubject, setGenSubject] = useState(SUBJECTS[0].name);
  const [showGenModal, setShowGenModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCards = selectedSubjectFilter === 'all'
    ? cards
    : cards.filter((c) => c.subjectId === selectedSubjectFilter);

  const currentCard: Flashcard | undefined = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + (filteredCards.length || 1)) % (filteredCards.length || 1));
  };

  const markMastered = (id: string) => {
    setMasteredIds((prev) => new Set(prev).add(id));
    setReviewIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    handleNext();
  };

  const markReview = (id: string) => {
    setReviewIds((prev) => new Set(prev).add(id));
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    handleNext();
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: genSubject, count: 6 }),
      });

      if (!res.ok) throw new Error('Falha ao gerar flashcards no servidor.');

      const data = await res.json();
      const subjectObj = SUBJECTS.find((s) => s.name === genSubject);
      const newFlashcards: Flashcard[] = data.map((item: any, i: number) => ({
        id: `ai-fc-${Date.now()}-${i}`,
        subjectId: subjectObj ? subjectObj.id : 'ads-general',
        category: item.category || 'Fixação ADS',
        front: item.front,
        back: item.back,
        hint: item.hint,
      }));

      setCards((prev) => [...newFlashcards, ...prev]);
      setSelectedSubjectFilter('all');
      setShowGenModal(false);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gerar flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide mb-1">
            <Layers className="h-4 w-4 shrink-0" />
            <span>Memorização Ativa & Revisão Espaçada</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Flashcards de ADS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fixe conceitos fundamentais para provas, estágios e entrevistas técnicas com cartões de repetição ativa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setShowGenModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-indigo-200 shrink-0" />
          <span>Criar Flashcards com IA</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="flex-1 sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 truncate cursor-pointer"
          >
            <option value="all">Todas as Disciplinas ({cards.length})</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono tabular-nums pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5 shrink-0" /> Dominados: <strong>{masteredIds.size}</strong>
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <X className="h-3.5 w-3.5 shrink-0" /> Revisar: <strong>{reviewIds.size}</strong>
          </span>
        </div>
      </div>

      {/* Main Flashcard Container */}
      {currentCard ? (
        <div className="flex flex-col items-center">
          {/* 3D Flip Card with dedicated Front and Back faces (no mirrored text) */}
          <div
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFlip();
              }
            }}
            className="w-full max-w-2xl cursor-pointer group perspective select-none focus:outline-none"
          >
            <div
              className={`relative w-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT FACE (Question / Concept) */}
              <div className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-8 bg-slate-900 border border-slate-800 group-hover:border-slate-700 shadow-2xl backface-hidden flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <span className="font-medium text-indigo-300 truncate">
                    {currentCard.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums shrink-0">
                    <RotateCw className="h-3.5 w-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span>{currentIndex + 1} / {filteredCards.length}</span>
                  </span>
                </div>

                {/* Center Question */}
                <div className="my-auto py-4 overflow-y-auto custom-scrollbar">
                  <span className="text-xs font-semibold text-indigo-400 block mb-2">
                    Pergunta / Conceito
                  </span>
                  <h2 className="text-base sm:text-xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </h2>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
                  {currentCard.hint ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint((prev) => !prev);
                      }}
                      className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer"
                    >
                      <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{showHint ? currentCard.hint : 'Ver dica'}</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <span className="text-[11px] text-slate-400 shrink-0">
                    Toque para ver a resposta
                  </span>
                </div>
              </div>

              {/* BACK FACE (Answer / Practical Explanation — counter-rotated so text is never mirrored) */}
              <div className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-8 bg-slate-900 border border-indigo-500/50 shadow-2xl backface-hidden rotate-y-180 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <span className="font-medium text-emerald-400 truncate">
                    {currentCard.category} · Resposta
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums shrink-0">
                    <RotateCw className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{currentIndex + 1} / {filteredCards.length}</span>
                  </span>
                </div>

                {/* Center Answer */}
                <div className="my-auto py-4 overflow-y-auto custom-scrollbar">
                  <span className="text-xs font-semibold text-emerald-400 block mb-2">
                    Explicação e Aplicação Prática
                  </span>
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-indigo-300">
                    Avalie seu domínio abaixo
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Toque para voltar à pergunta
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons under card — Responsive on mobile and desktop */}
          <div className="w-full max-w-2xl grid grid-cols-2 sm:flex items-center justify-between gap-2.5 sm:gap-3 mt-6">
            <button
              type="button"
              onClick={() => markReview(currentCard.id)}
              className="order-2 sm:order-1 sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4 shrink-0" />
              <span>Preciso Revisar</span>
            </button>

            <div className="order-1 sm:order-2 col-span-2 sm:col-span-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 sm:flex-initial h-10 px-4 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1 text-xs font-medium transition-colors cursor-pointer"
                title="Cartão anterior"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sm:hidden">Anterior</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-initial h-10 px-4 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1 text-xs font-medium transition-colors cursor-pointer"
                title="Próximo cartão"
              >
                <span className="sm:hidden">Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => markMastered(currentCard.id)}
              className="order-3 sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Acertei / Já Sei</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          Nenhum cartão encontrado para este filtro.
        </div>
      )}

      {/* Generator Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Gerar Flashcards com IA</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGenModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              O assistente criará 6 flashcards conceituais focados em provas e entrevistas técnicas.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleGenerateCards} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Selecione a Disciplina de ADS
                </label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.responsible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isGenerating ? 'Gerando...' : 'Criar Cartões'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
