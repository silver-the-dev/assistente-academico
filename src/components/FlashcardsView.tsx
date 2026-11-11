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
  PlusCircle,
  BookOpen
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

  const filteredCards = selectedSubjectFilter === 'all'
    ? cards
    : cards.filter((c) => c.subjectId === selectedSubjectFilter);

  const currentCard: Flashcard | undefined = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
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

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: genSubject, count: 6 }),
      });

      if (!res.ok) throw new Error('Falha ao gerar flashcards');

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
      setShowGenModal(false);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      alert('Erro ao gerar flashcards: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Memorização Ativa & Revisão Espaçada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Flashcards de ADS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fixe conceitos fundamentais para provas, estágios e entrevistas técnicas com cartões de repetição ativa.
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span>Criar Flashcards com IA</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas as Disciplinas ({cards.length})</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Dominados: {masteredIds.size}
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Revisar: {reviewIds.size}
          </span>
        </div>
      </div>

      {/* Main Flashcard Container */}
      {currentCard ? (
        <div className="flex flex-col items-center">
          {/* Flip Card with 3D perspective */}
          <div
            onClick={handleFlip}
            className="w-full max-w-xl min-h-[300px] sm:min-h-[340px] cursor-pointer group perspective select-none"
          >
            <div
              className={`relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-3xl p-6 sm:p-8 transition-transform duration-500 preserve-3d shadow-2xl border flex flex-col justify-between ${
                isFlipped
                  ? 'bg-slate-900 border-indigo-500/50 shadow-indigo-500/10 rotate-y-180'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-slate-950/50'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-medium text-indigo-300">
                  {currentCard.category}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <RotateCw className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Clique para virar ({currentIndex + 1} de {filteredCards.length})</span>
                </span>
              </div>

              {/* Card Center Content */}
              <div className="my-auto py-4">
                {!isFlipped ? (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">
                      Pergunta / Conceito
                    </span>
                    <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                      {currentCard.front}
                    </h2>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                      Resposta / Aplicação Prática
                    </span>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                      {currentCard.back}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                {currentCard.hint ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(!showHint);
                    }}
                    className="flex items-center gap-1 text-amber-400/90 hover:text-amber-300 transition"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>{showHint ? currentCard.hint : 'Ver dica'}</span>
                  </button>
                ) : <span />}

                <span className="text-[11px] text-slate-400">
                  {isFlipped ? 'Verso do Cartão' : 'Anverso'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons under card */}
          <div className="w-full max-w-xl flex items-center justify-between gap-3 mt-6">
            <button
              onClick={() => markReview(currentCard.id)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Preciso Revisar</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Cartão anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Próximo cartão"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => markMastered(currentCard.id)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Acertei / Já Sei!</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Gerar Flashcards com o Modelo Gemini
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              O assistente criará 6 flashcards conceituais focados em provas e entrevistas técnicas.
            </p>

            <form onSubmit={handleGenerateCards} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Selecione a Disciplina de ADS
                </label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.responsible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
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
