import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  ExternalLink, 
  Download, 
  Code, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Copy,
  Check,
  Tag,
  ChevronRight
} from 'lucide-react';
import { ExamEvent } from '../types/academic';
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile, 
  generateAppsScriptCode 
} from '../utils/calendarUtils';
import { SUBJECTS } from '../data/fsgData';

interface GoogleCalendarSyncProps {
  exams: ExamEvent[];
  onAddExam: (exam: ExamEvent) => void;
  onNavigateToPlannerWithExam: (subject: string, date: string) => void;
}

export const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  exams,
  onAddExam,
  onNavigateToPlannerWithExam,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // New Exam Form states
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(SUBJECTS[0].name);
  const [newType, setNewType] = useState<ExamEvent['type']>('Prova A1');
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newTime, setNewTime] = useState('19:15');
  const [newLocation, setNewLocation] = useState('FSG Centro Universitário - Prédio Central');
  const [newWeight, setNewWeight] = useState('40% da média');
  const [newDescription, setNewDescription] = useState('');

  const calculateDaysLeft = (dateStr: string) => {
    const today = new Date('2026-11-10'); // Reference local time from metadata
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredExams = filterType === 'all'
    ? exams
    : exams.filter((e) => e.type === filterType);

  const handleAddNewExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectObj = SUBJECTS.find((s) => s.name === newSubject) || SUBJECTS[0];
    const created: ExamEvent = {
      id: `custom-exam-${Date.now()}`,
      title: newTitle || `Prova de ${newSubject}`,
      subjectId: subjectObj.id,
      subjectName: newSubject,
      type: newType,
      date: newDate,
      time: newTime,
      location: newLocation,
      weight: newWeight,
      description: newDescription || `Conteúdo avaliativo da disciplina ${newSubject}.`,
      completed: false,
    };
    onAddExam(created);
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  const appsScriptCode = generateAppsScriptCode(exams);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Title & Hub Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Notificações & Lembretes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Integração com Google Agenda
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mantenha suas provas e entregas de ADS organizadas. Adicione com 1 clique, baixe arquivo .ICS ou automatize lembretes via Google Apps Script.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadIcsFile(exams)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Baixar todos os eventos no formato padrão iCalendar"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Exportar .ICS Completo</span>
          </button>

          <button
            onClick={() => setShowAppsScriptModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Ver código Apps Script para sincronização direta"
          >
            <Code className="h-4 w-4 text-cyan-400" />
            <span>Script de Automação (.gs)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Prova / Trabalho</span>
          </button>
        </div>
      </div>

      {/* Info notice about rule: não inventar datas */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 mb-6 text-xs text-indigo-200 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Diretriz Pedagógica FSG:</strong> O Agente Acadêmico não inventa datas de provas. As avaliações listadas abaixo seguem o calendário oficial do semestre e as datas cadastradas por você. Sincronize com sua conta do Google para receber alertas no smartphone com 7 dias e 24h de antecedência.
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-slate-400 font-medium mr-1">Filtrar por tipo:</span>
        {['all', 'Prova A1', 'Prova A2', 'Projeto Integrador', 'Substitutiva'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filterType === type
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {type === 'all' ? 'Todas as Avaliações' : type}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((event) => {
          const daysLeft = calculateDaysLeft(event.date);
          const isUrgent = daysLeft <= 14 && daysLeft >= 0;

          return (
            <div
              key={event.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
            >
              <div>
                {/* Event header with type and countdown */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {event.type}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      daysLeft === 0
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isUrgent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {daysLeft === 0
                      ? 'Hoje!'
                      : daysLeft > 0
                      ? `Faltam ${daysLeft} dias`
                      : 'Realizada'}
                  </span>
                </div>

                {/* Event Title */}
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                  {event.title}
                </h3>
                <p className="text-xs text-indigo-400 font-medium mt-0.5">
                  {event.subjectName}
                </p>

                {/* Meta details */}
                <div className="space-y-1.5 mt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.time}h · Peso: {event.weight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                  {event.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigateToPlannerWithExam(event.subjectName, event.date)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
                >
                  <span>Gerar Plano</span>
                  <ChevronRight className="h-3 w-3" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => downloadIcsFile([event], `fsg-${event.id}.ics`)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                    title="Baixar .ics deste evento"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  <a
                    href={createGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>Adicionar à Google Agenda</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Apps Script */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="h-4 w-4 text-cyan-400" />
                Automação com Google Apps Script (.gs)
              </h3>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Conforme especificado no planejamento do grupo, este script permite sincronizar todos os eventos diretamente na sua conta do Google e programar lembretes automáticos com 7 dias, 2 dias e 24h de antecedência.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800 text-xs text-slate-400">
                <span>Código.gs</span>
                <button
                  onClick={handleCopyScript}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1"
                >
                  {copiedScript ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedScript ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56 p-1 custom-scrollbar">
                {appsScriptCode}
              </pre>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-300 space-y-1">
              <strong className="text-white block mb-1">Como rodar em 1 minuto:</strong>
              <p>1. Acesse <strong>script.google.com</strong> e crie um novo projeto.</p>
              <p>2. Substitua o conteúdo do editor pelo código acima.</p>
              <p>3. Clique em <strong>Salvar</strong> e depois em <strong>Executar</strong> na função <code>criarLembretesFSG</code>.</p>
              <p>4. Autorize com sua conta do Google e todas as provas serão agendadas com notificações push!</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Custom Exam */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Cadastrar Nova Prova ou Trabalho
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              O evento será adicionado à sua lista local e você poderá sincronizá-lo com a Google Agenda.
            </p>

            <form onSubmit={handleAddNewExamSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Título da Avaliação
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Prova A1 de Banco de Dados"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Disciplina de ADS
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Tipo de Avaliação
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Prova A1">Prova A1</option>
                    <option value="Prova A2">Prova A2</option>
                    <option value="Trabalho Prático">Trabalho Prático</option>
                    <option value="Projeto Integrador">Projeto Integrador</option>
                    <option value="Substitutiva">Substitutiva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Data da Prova
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Local / Laboratório na FSG
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex: FSG Lab 402 ou Portal AVA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Conteúdo / Observações
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Capítulos, ementa ou links para estudo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
