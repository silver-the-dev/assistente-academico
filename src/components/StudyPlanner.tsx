import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  FolderUp,
  CheckCircle2,
  Circle,
  GraduationCap,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  Discipline,
  AcademicEvent,
  SourceDoc,
  StudyPlan,
} from '../types/academic';
import { storage } from '../services/storage';
import { renderSafeMarkdown } from '../utils/markdown';

interface StudyPlannerProps {
  disciplines: Discipline[];
  events: AcademicEvent[];
  documents: SourceDoc[];
  studyPlans: StudyPlan[];
  initialDisciplineId?: string;
  onNavigateToMaterials: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToQuiz: (disciplineId: string) => void;
}

const WEEKDAYS = [
  { id: 0, short: 'Dom', full: 'Domingo' },
  { id: 1, short: 'Seg', full: 'Segunda' },
  { id: 2, short: 'Ter', full: 'Terça' },
  { id: 3, short: 'Qua', full: 'Quarta' },
  { id: 4, short: 'Qui', full: 'Quinta' },
  { id: 5, short: 'Sex', full: 'Sexta' },
  { id: 6, short: 'Sáb', full: 'Sábado' },
];

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  disciplines,
  events,
  documents,
  studyPlans,
  initialDisciplineId,
  onNavigateToMaterials,
  onNavigateToCalendar,
  onNavigateToQuiz,
}) => {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(
    initialDisciplineId || disciplines[0]?.id || ''
  );
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customExamDate, setCustomExamDate] = useState<string>('');
  const [customExamTitle, setCustomExamTitle] = useState<string>('');
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [preferredStartTime, setPreferredStartTime] = useState<string>('19:00');
  const [difficulties, setDifficulties] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string>(studyPlans[0]?.id || '');

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialDisciplineId) {
      setSelectedDisciplineId(initialDisciplineId);
    } else if (!selectedDisciplineId && disciplines.length > 0) {
      setSelectedDisciplineId(disciplines[0].id);
    }
  }, [initialDisciplineId, disciplines, selectedDisciplineId]);

  useEffect(() => {
    if (!activePlanId && studyPlans.length > 0) {
      setActivePlanId(studyPlans[0].id);
    }
  }, [studyPlans, activePlanId]);

  if (disciplines.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <CheckSquare className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Crie Planos de Estudo Reais Até a Sua Prova</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Para montar um cronograma distribuído entre hoje e a data da sua avaliação com os tópicos reais da ementa,
          primeiro envie seu plano de ensino ou cronograma na aba <strong>Materiais</strong>.
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

  // Confirmed exams/deliveries for the selected discipline (or all if none specific)
  const confirmedEvaluations = events.filter(
    (e) =>
      !e.needsReview &&
      Boolean(e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) &&
      (e.kind === 'prova' || e.kind === 'trabalho' || e.kind === 'entrega' || e.kind === 'apresentacao')
  );

  const disciplineEvaluations = confirmedEvaluations.filter(
    (e) =>
      !selectedDiscipline ||
      e.disciplineId === selectedDiscipline.id ||
      (e.disciplineName && e.disciplineName.toLowerCase() === selectedDiscipline.name.toLowerCase())
  );

  const availableEvaluations =
    disciplineEvaluations.length > 0 ? disciplineEvaluations : confirmedEvaluations;

  const toggleDay = (dayId: number) => {
    setAvailableDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscipline) return;

    const chosenEvent = availableEvaluations.find((ev) => ev.id === selectedEventId);
    const targetDate = chosenEvent?.date || customExamDate;
    const targetTitle = chosenEvent?.title || customExamTitle || `Avaliação de ${selectedDiscipline.name}`;

    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setErrorMessage(
        'Selecione uma avaliação com data confirmada ou informe a data exata da prova para gerar o cronograma.'
      );
      return;
    }

    if (availableDays.length === 0) {
      setErrorMessage('Selecione pelo menos um dia da semana disponível para estudar.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // If user entered a custom exam date that wasn't in events yet, save it as a confirmed event
      let resolvedEventId = chosenEvent?.id;
      if (!chosenEvent && customExamDate) {
        const createdEv: AcademicEvent = {
          id: `ev-plan-${Date.now()}`,
          title: targetTitle,
          disciplineId: selectedDiscipline.id,
          disciplineName: selectedDiscipline.name,
          kind: 'prova',
          date: customExamDate,
          startTime: '19:15',
          description: `Avaliação confirmada pelo aluno ao gerar cronograma de ${selectedDiscipline.name}.`,
          source: {
            docId: 'manual',
            docName: 'Confirmado pelo Aluno no Planejador',
            excerpt: `Data ${customExamDate} informada pelo aluno`,
          },
          confidence: 'alta',
          needsReview: false,
          status: 'confirmado',
        };
        await storage.upsertEventWithMerge(createdEv);
        resolvedEventId = createdEv.id;
      }

      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplineId: selectedDiscipline.id,
          disciplineName: selectedDiscipline.name,
          syllabus: selectedDiscipline.syllabus,
          examTitle: targetTitle,
          examDate: targetDate,
          hoursPerDay,
          availableDays,
          preferredStartTime,
          difficulties,
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
        throw new Error(data.error || 'Não foi possível gerar o plano de estudos.');
      }

      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        disciplineId: selectedDiscipline.id,
        disciplineName: selectedDiscipline.name,
        targetEventId: resolvedEventId,
        targetEventTitle: targetTitle,
        targetEventDate: targetDate,
        createdAt: new Date().toISOString(),
        hoursPerDay,
        availableDays,
        preferredStartTime,
        difficulties,
        strategySummary: data.strategySummary,
        eveChecklist: data.eveChecklist || [],
        blocks: (data.blocks || []).map(
          (
            b: {
              date: string;
              startTime: string;
              endTime: string;
              topic: string;
              technique: string;
              practicalExercise: string;
              dailyGoal: string;
            },
            idx: number
          ) => ({
            id: `block-${Date.now()}-${idx}`,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            topic: b.topic,
            technique: b.technique,
            practicalExercise: b.practicalExercise,
            dailyGoal: b.dailyGoal,
            done: false,
          })
        ),
      };

      await storage.saveStudyPlan(newPlan);
      setActivePlanId(newPlan.id);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setErrorMessage((err as Error)?.message || 'Erro ao gerar o plano de estudos.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activePlan = studyPlans.find((p) => p.id === activePlanId) || studyPlans[0];

  const handleToggleBlockDone = async (plan: StudyPlan, blockId: string) => {
    const updated: StudyPlan = {
      ...plan,
      blocks: plan.blocks.map((b) => (b.id === blockId ? { ...b, done: !b.done } : b)),
    };
    await storage.saveStudyPlan(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Configuration Form */}
        <form
          onSubmit={handleGeneratePlan}
          className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Planejador Reverso de Estudos</span>
            </div>
            <h1 className="text-lg font-bold text-white">Gerar Cronograma Até a Prova</h1>
            <p className="text-xs text-slate-400">
              Distribui os tópicos reais da ementa nos seus dias disponíveis e permite sincronizar cada bloco no Google Agenda.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Disciplina *</label>
              <select
                value={selectedDiscipline?.id || ''}
                onChange={(e) => {
                  setSelectedDisciplineId(e.target.value);
                  setSelectedEventId('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.syllabus.length} tópicos)
                  </option>
                ))}
              </select>
            </div>

            {availableEvaluations.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Avaliação / Entrega Confirmada
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Informar outra data manualmente...</option>
                  {availableEvaluations.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {ev.date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selectedEventId && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <p className="text-[11px] text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Confirme a data exata da avaliação alvo:</span>
                </p>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nome da Prova / Entrega</label>
                  <input
                    type="text"
                    value={customExamTitle}
                    onChange={(e) => setCustomExamTitle(e.target.value)}
                    placeholder={`Ex: Prova A1 - ${selectedDiscipline?.name || ''}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Data Confirmada *</label>
                  <input
                    type="date"
                    required={!selectedEventId}
                    value={customExamDate}
                    onChange={(e) => setCustomExamDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Horas por dia</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Horário de início</label>
                <input
                  type="time"
                  value={preferredStartTime}
                  onChange={(e) => setPreferredStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dias da semana disponíveis
              </label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => {
                  const active = availableDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tópicos de maior dificuldade (opcional)
              </label>
              <textarea
                rows={2}
                value={difficulties}
                onChange={(e) => setDifficulties(e.target.value)}
                placeholder="Ex: Árvores binárias, recursividade, normalização 3FN..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
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
                <span>Montando Blocos de Estudo...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Gerar Plano de Estudos Estruturado</span>
              </>
            )}
          </button>
        </form>

        {/* Right Plan Display */}
        <div className="lg:col-span-8 space-y-5">
          {studyPlans.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {studyPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setActivePlanId(plan.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activePlan?.id === plan.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {plan.disciplineName} ({plan.targetEventDate})
                </button>
              ))}
            </div>
          )}

          {!activePlan ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
              <Clock className="w-9 h-9 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhum cronograma gerado ainda</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Configure a disciplina, a data da prova e os seus dias disponíveis no painel ao lado para gerar os blocos diários de estudo.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <span>Meta: {activePlan.targetEventTitle || 'Avaliação'}</span>
                    <span>· Data: {activePlan.targetEventDate}</span>
                    <span>· {activePlan.hoursPerDay}h/dia</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activePlan.disciplineName}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onNavigateToCalendar}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sincronizar Blocos no Google Agenda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToQuiz(activePlan.disciplineId)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Treinar Simulado</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await storage.deleteStudyPlan(activePlan.id);
                      setActivePlanId('');
                    }}
                    title="Excluir plano"
                    className="p-2 rounded-xl bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Counter */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-300">Progresso dos Blocos de Estudo</p>
                  <p className="text-[11px] text-slate-400">
                    Marque os blocos concluídos para acompanhar sua preparação até o dia da prova.
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-lg font-bold text-indigo-400">
                    {activePlan.blocks.filter((b) => b.done).length}
                  </span>
                  <span className="text-xs text-slate-500"> / {activePlan.blocks.length} blocos</span>
                </div>
              </div>

              {/* Strategy Summary */}
              {activePlan.strategySummary && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(activePlan.strategySummary) }}
                  />
                </div>
              )}

              {/* Study Blocks Table / Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Cronograma Diário de Blocos ({activePlan.blocks.length} sessões)
                </h3>
                <div className="space-y-2.5">
                  {activePlan.blocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={() => handleToggleBlockDone(activePlan, block.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        block.done
                          ? 'bg-emerald-950/15 border-emerald-500/40 opacity-80'
                          : 'bg-slate-950/90 border-slate-800 hover:border-indigo-500/50'
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-indigo-400 shrink-0">
                        {block.done ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              block.done ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {block.topic}
                          </h4>
                          <span className="text-xs font-mono tabular-nums text-indigo-300">
                            {block.date} · {block.startTime}–{block.endTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          <div>
                            <span className="text-slate-500">Técnica: </span>
                            {block.technique}
                          </div>
                          <div>
                            <span className="text-slate-500">Meta do dia: </span>
                            {block.dailyGoal}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <strong className="text-slate-300">Prática recomendada:</strong> {block.practicalExercise}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eve Checklist */}
              {activePlan.eveChecklist && activePlan.eveChecklist.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300">Checklist de Véspera de Prova</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                    {activePlan.eveChecklist.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
