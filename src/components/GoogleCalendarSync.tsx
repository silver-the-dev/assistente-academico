import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  FolderUp,
  LogOut,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  AcademicEvent,
  Discipline,
  StudyPlan,
} from '../types/academic';
import {
  downloadICSFile,
  generateGoogleCalendarTemplateUrl,
} from '../utils/calendarUtils';
import {
  initGoogleCalendarAuth,
  signInWithGoogleCalendar,
  signOutGoogleCalendar,
  getCachedGoogleAccessToken,
  getCachedGoogleUserEmail,
} from '../services/googleCalendarAuth';
import { storage } from '../services/storage';

interface GoogleCalendarSyncProps {
  events: AcademicEvent[];
  disciplines: Discipline[];
  studyPlans: StudyPlan[];
  onNavigateToMaterials: () => void;
  onNavigateToPlanner: (disciplineId: string) => void;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  events,
  disciplines,
  studyPlans,
  onNavigateToMaterials,
  onNavigateToPlanner,
}) => {
  const [connected, setConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [syncRecurringClasses, setSyncRecurringClasses] = useState(true);
  const [syncStudyBlocks, setSyncStudyBlocks] = useState(true);
  const [semesterStart, setSemesterStart] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() < 6 ? '02-15' : '08-01'}`;
  });
  const [semesterEnd, setSemesterEnd] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() < 6 ? '07-05' : '12-15'}`;
  });

  const [syncSummary, setSyncSummary] = useState<{
    calendarName: string;
    createdCount: number;
    updatedCount: number;
    deletedCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmSyncModal, setShowConfirmSyncModal] = useState(false);

  const confirmedEvents = events.filter(
    (e) => !e.needsReview && Boolean(e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date))
  );
  const pendingReviewEvents = events.filter((e) => e.needsReview || !e.date);

  useEffect(() => {
    setSelectedEventIds(confirmedEvents.map((e) => e.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  useEffect(() => {
    const unsub = initGoogleCalendarAuth(
      (user) => {
        setConnected(true);
        setUserEmail(user.email || 'Conta Google Conectada');
      },
      () => {
        setConnected(false);
        setUserEmail(null);
      }
    );
    return () => unsub();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setConnected(true);
        setUserEmail(res.user.email || 'Conta Google Conectada');
      }
    } catch (err: unknown) {
      setErrorMessage(
        (err as Error)?.message ||
          'Não foi possível concluir a autenticação com o Google Agenda. Verifique se popups estão permitidos no navegador.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogleCalendar();
    setConnected(false);
    setUserEmail(null);
    setSyncSummary(null);
  };

  const totalClassSlots = disciplines.reduce((acc, d) => acc + (d.schedule?.length || 0), 0);
  const totalStudyBlocks = studyPlans.reduce((acc, p) => acc + (p.blocks?.length || 0), 0);

  const executeCalendarSync = async () => {
    setShowConfirmSyncModal(false);
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncSummary(null);

    try {
      let bearerToken = getCachedGoogleAccessToken();
      if (!bearerToken) {
        const refreshed = await signInWithGoogleCalendar();
        bearerToken = refreshed?.accessToken || null;
      }

      if (!bearerToken) {
        throw new Error('Sua sessão do Google Agenda expirou. Clique em "Entrar com o Google" novamente.');
      }

      const classesPayload = syncRecurringClasses
        ? disciplines.flatMap((disc) =>
            (disc.schedule || []).map((slot, sIdx) => ({
              appEventId: `class-${disc.id}-${slot.dayOfWeek}-${slot.startTime}-${sIdx}`,
              disciplineName: disc.name,
              professor: disc.professor,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              location: slot.location,
              semesterStart,
              semesterEnd,
              holidays: confirmedEvents
                .filter((ev) => ev.kind === 'feriado' && ev.date)
                .map((ev) => ev.date!),
            }))
          )
        : [];

      const eventsPayload = confirmedEvents
        .filter((ev) => selectedEventIds.includes(ev.id) && ev.date)
        .map((ev) => ({
          appEventId: `event-${ev.id}`,
          title: ev.title,
          disciplineName: ev.disciplineName,
          kind: ev.kind,
          date: ev.date!,
          startTime: ev.startTime,
          endTime: ev.endTime,
          location: ev.location,
          weight: ev.weight,
          description: ev.description,
          topics: ev.topics,
          sourceDocName: ev.source?.docName,
          sourceExcerpt: ev.source?.excerpt,
        }));

      const studyBlocksPayload = syncStudyBlocks
        ? studyPlans.flatMap((plan) =>
            plan.blocks.map((block) => ({
              appEventId: `studyblock-${plan.id}-${block.id}`,
              title: `${plan.disciplineName}: ${block.topic}`,
              disciplineName: plan.disciplineName,
              kind: 'revisao' as const,
              date: block.date,
              startTime: block.startTime,
              endTime: block.endTime,
              location: 'Bloco de Estudo Planejado',
              description: `Técnica: ${block.technique}\nExercício Prático: ${block.practicalExercise}\nMeta do Dia: ${block.dailyGoal}`,
            }))
          )
        : [];

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
          classes: classesPayload,
          events: [...eventsPayload, ...studyBlocksPayload],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao sincronizar eventos com o Google Agenda.');
      }

      for (const item of data.syncedResults || []) {
        if (item.appEventId.startsWith('event-')) {
          const rawId = item.appEventId.replace('event-', '');
          const found = events.find((e) => e.id === rawId);
          if (found) {
            await storage.saveEvent({
              ...found,
              googleCalendarEventId: item.googleCalendarEventId,
            });
          }
        }
      }

      setSyncSummary({
        calendarName: data.calendarName || 'Agente Acadêmico ADS',
        createdCount: data.createdCount || 0,
        updatedCount: data.updatedCount || 0,
        deletedCount: data.deletedCount || 0,
        failedCount: data.failedCount || 0,
        errors: data.errors || [],
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Falha ao sincronizar com o Google Agenda.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Native Google Sign-In */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Calendar className="w-4 h-4" />
              <span>Integração Nativa Google Agenda · AI Studio</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Sincronização com Google Agenda
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Cria e mantém atualizado o calendário secundário dedicado{' '}
              <strong className="text-slate-200">&ldquo;Agente Acadêmico ADS&rdquo;</strong> com aulas recorrentes,
              provas confirmadas, entregas e blocos do seu plano de estudos, com a sua permissão, sem poluir sua agenda principal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {connected ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Conectado: {userEmail || getCachedGoogleUserEmail() || 'Conta Google'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isConnecting}
                onClick={handleConnectGoogle}
                className="gsi-material-button inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning if pending review events exist */}
      {pendingReviewEvents.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 space-y-0.5">
              <p className="font-bold">
                Existem {pendingReviewEvents.length} evento(s) com data pendente de revisão
              </p>
              <p className="text-amber-300/90">
                Por segurança anti-alucinação, eventos sem data confirmada não são enviados ao Google Agenda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToMaterials}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold shrink-0 cursor-pointer"
          >
            Revisar Datas em Materiais
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-xs sm:text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Sync Result Summary */}
      {syncSummary && (
        <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>
              Sincronização concluída no calendário &ldquo;{syncSummary.calendarName}&rdquo;!
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-mono tabular-nums">
            {syncSummary.createdCount} criados · {syncSummary.updatedCount} atualizados ·{' '}
            {syncSummary.failedCount} falharam
          </p>
          {syncSummary.errors.length > 0 && (
            <ul className="text-xs text-red-300 list-disc pl-4 pt-1">
              {syncSummary.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Empty State if no events and no disciplines */}
      {confirmedEvents.length === 0 && totalClassSlots === 0 && totalStudyBlocks === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Nenhum evento confirmado para sincronizar</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Envie seus planos de ensino ou cronogramas na aba <strong>Materiais</strong> para extrair horários de aula,
            provas e entregas antes de sincronizar com o Google Agenda.
          </p>
          <button
            type="button"
            onClick={onNavigateToMaterials}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            <span>Ir para Materiais</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Selection of Events */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Itens Prontos para Sincronização
                </h2>
                <p className="text-xs text-slate-400">
                  Selecione as provas, entregas, aulas semanais e blocos de estudo que deseja enviar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadICSFile(confirmedEvents, disciplines)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Baixar .ICS (Prefiro não conectar)</span>
                </button>
              </div>
            </div>

            {/* Recurring Classes Option */}
            {totalClassSlots > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncRecurringClasses}
                      onChange={(e) => setSyncRecurringClasses(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span>Sincronizar Aulas Semanais Recorrentes ({totalClassSlots} horários)</span>
                  </label>
                  <span className="text-xs text-indigo-400 font-mono">RRULE:FREQ=WEEKLY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Início do Semestre</label>
                    <input
                      type="date"
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fim do Semestre (UNTIL)</label>
                    <input
                      type="date"
                      value={semesterEnd}
                      onChange={(e) => setSemesterEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {disciplines.map((d) =>
                    (d.schedule || []).map((s, idx) => (
                      <span
                        key={`${d.id}-${idx}`}
                        className="text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono"
                      >
                        {d.name}: {DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Study Plan Blocks Option */}
            {totalStudyBlocks > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 text-sm font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncStudyBlocks}
                    onChange={(e) => setSyncStudyBlocks(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span>
                    Incluir Blocos dos Planos de Estudo ({totalStudyBlocks} sessões de estudo)
                  </span>
                </label>
                <span className="text-xs text-emerald-400">Cor Verde · Lembrete 30min</span>
              </div>
            )}

            {/* Confirmed Events List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">
                  Provas, Trabalhos e Entregas Confirmadas ({confirmedEvents.length})
                </h3>
                {confirmedEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEventIds(
                        selectedEventIds.length === confirmedEvents.length
                          ? []
                          : confirmedEvents.map((e) => e.id)
                      )
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {selectedEventIds.length === confirmedEvents.length
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {confirmedEvents.map((ev) => {
                  const isChecked = selectedEventIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedEventIds((prev) =>
                              checked ? [...prev, ev.id] : prev.filter((id) => id !== ev.id)
                            );
                          }}
                          className="mt-1 w-4 h-4 rounded accent-indigo-600"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono uppercase text-indigo-400">
                              [{ev.kind}]
                            </span>
                            <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                            {ev.googleCalendarEventId && (
                              <span className="text-[11px] text-emerald-400">· Já sincronizado</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                            <span>Data: {ev.date}</span>
                            {ev.startTime && <span>· {ev.startTime}</span>}
                            {ev.location && <span>· {ev.location}</span>}
                            {ev.weight && <span>· Peso: {ev.weight}</span>}
                          </div>
                        </div>
                      </label>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {ev.disciplineId && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPlanner(ev.disciplineId!)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs cursor-pointer"
                          >
                            Planejar Estudo
                          </button>
                        )}
                        <a
                          href={generateGoogleCalendarTemplateUrl(ev)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-xs"
                        >
                          <span>Link Direto</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Action Panel */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Resumo da Sincronização</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-300 font-mono tabular-nums bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span>Calendário alvo:</span>
                  <strong className="text-indigo-300">Agente Acadêmico ADS</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fuso horário:</span>
                  <span>America/Sao_Paulo</span>
                </div>
                <div className="flex justify-between">
                  <span>Aulas semanais:</span>
                  <span>{syncRecurringClasses ? totalClassSlots : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provas e entregas:</span>
                  <span>{selectedEventIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blocos de estudo:</span>
                  <span>{syncStudyBlocks ? totalStudyBlocks : 0}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!connected || isSyncing}
                onClick={() => setShowConfirmSyncModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sincronizando com Google Agenda...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Enviar para o Google Agenda</span>
                  </>
                )}
              </button>

              {!connected && (
                <p className="text-[11px] text-center text-slate-400">
                  Clique em &ldquo;Sign in with Google&rdquo; acima para conectar via integração nativa do AI Studio, ou baixe o arquivo .ICS ao lado.
                </p>
              )}
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Escopo Mínimo e Privacidade</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A integração utiliza exclusivamente o escopo nativo <code>calendar.app.created</code>, criando e gerenciando apenas o calendário secundário dedicado <strong>Agente Acadêmico ADS</strong>, sem ler nem alterar seus eventos pessoais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before mutating Google Calendar */}
      {showConfirmSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Confirmar Sincronização no Google Agenda</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Você está prestes a criar/atualizar no calendário secundário{' '}
              <strong>&ldquo;Agente Acadêmico ADS&rdquo;</strong> da sua conta Google:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5 font-mono">
              <li>{syncRecurringClasses ? totalClassSlots : 0} aula(s) semanal(is) recorrente(s)</li>
              <li>{selectedEventIds.length} prova(s) / entrega(s) confirmada(s)</li>
              <li>{syncStudyBlocks ? totalStudyBlocks : 0} bloco(s) de estudo</li>
            </ul>
            <p className="text-[11px] text-slate-400">
              Eventos já enviados anteriormente serão apenas atualizados (idempotência por <code>appEventId</code>), sem gerar duplicatas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSyncModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeCalendarSync}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar e Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
