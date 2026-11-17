import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Flame,
  ArrowRight,
  ListChecks
} from 'lucide-react';
import { marked } from 'marked';
import { SUBJECTS } from '../data/fsgData';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { ExamEvent } from '../types/academic';

interface StudyPlannerProps {
  initialSubject?: string;
  initialDate?: string;
  onNavigateToCalendar: () => void;
  onNavigateToQuiz: (subject: string) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  initialSubject = 'Modelagem e Banco de Dados Relacional',
  initialDate = '2026-11-20',
  onNavigateToCalendar,
  onNavigateToQuiz,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [examDate, setExamDate] = useState(initialDate);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [difficulties, setDifficulties] = useState('Normalização (3FN), subconsultas SQL e propriedades ACID');
  const [currentLevel, setCurrentLevel] = useState('Intermediário');
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject);
    if (initialDate) setExamDate(initialDate);
  }, [initialSubject, initialDate]);

  // Quick preset exam scenarios
  const examPresets = [
    {
      label: 'Banco de Dados (20/11)',
      subject: 'Modelagem e Banco de Dados Relacional',
      date: '2026-11-20',
      difficulty: 'Normalização 1FN/2FN/3FN, SQL JOINs e ACID',
    },
    {
      label: 'Lógica e Algoritmos (25/11)',
      subject: 'Algoritmos e Lógica de Programação',
      date: '2026-11-25',
      difficulty: 'Matrizes, funções com parâmetros e laços aninhados',
    },
    {
      label: 'Projeto Backend MVC (02/12)',
      subject: 'Desenvolvimento Web Backend',
      date: '2026-12-02',
      difficulty: 'Autenticação JWT, middlewares Express e CRUD',
    },
    {
      label: 'POO & SOLID (08/12)',
      subject: 'Programação Orientada a Objetos (POO)',
      date: '2026-12-08',
      difficulty: 'Polimorfismo, interfaces e princípios SOLID',
    },
  ];

  const handleGeneratePlan = async () => {
    if (!selectedSubject || !examDate) return;
    setLoading(true);
    setPlanResult(null);

    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          examDate,
          availableHoursPerDay: hoursPerDay,
          difficulties,
          currentLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar plano de estudos.');
      }

      const data = await response.json();
      setPlanResult(data.plan);
    } catch (err: any) {
      console.error(err);
      setPlanResult(`### Erro ao gerar plano\nNão foi possível conectar ao modelo Gemini. Detalhes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentSubjectObj = SUBJECTS.find((s) => s.name === selectedSubject) || SUBJECTS[0];

  const currentExamObj: ExamEvent = {
    id: `custom-plan-${Date.now()}`,
    title: `Prova de ${selectedSubject}`,
    subjectId: currentSubjectObj.id,
    subjectName: selectedSubject,
    type: 'Prova A1',
    date: examDate,
    time: '19:15',
    location: 'FSG Centro Universitário - Prédio Central',
    weight: 'Avaliação Semestral',
    description: `Plano de estudos focado em: ${difficulties}. Horas diárias: ${hoursPerDay}h.`,
  };

  const handleCopyMarkdown = () => {
    if (!planResult) return;
    navigator.clipboard.writeText(planResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
      {/* Page Title */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide mb-1">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Planejador Acadêmico de ADS</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          Cronograma de Estudos em Tabela
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Informe a disciplina e a data da sua prova. O agente calcula os dias restantes, distribui a ementa da FSG e monta uma tabela com metas diárias e exercícios práticos.
        </p>
      </div>

      {/* Preset Quick Buttons */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
        <span className="text-xs font-medium text-slate-400 block mb-2.5">
          Atalhos de provas do semestre na FSG:
        </span>
        <div className="flex flex-wrap gap-2">
          {examPresets.map((preset, idx) => {
            const isSelected = selectedSubject === preset.subject && examDate === preset.date;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedSubject(preset.subject);
                  setExamDate(preset.date);
                  setDifficulties(preset.difficulty);
                }}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Configuration Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Parâmetros do Seu Estudo</span>
          </h2>

          {/* Subject Select */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Disciplina de ADS (FSG)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.responsible})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Curadoria da disciplina: <strong className="text-slate-300">{currentSubjectObj.responsible}</strong> · Carga: <span className="font-mono tabular-nums">{currentSubjectObj.workload}</span>
            </p>
          </div>

          {/* Exam Date & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Data da Prova ou Entrega
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Nível Atual na Matéria
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Iniciante">Iniciante (Do zero)</option>
                <option value="Intermediário">Intermediário (Revisão)</option>
                <option value="Avançado">Avançado (Prática intensiva)</option>
              </select>
            </div>
          </div>

          {/* Hours per day */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Horas diárias dedicadas
              </label>
              <span className="text-xs font-mono tabular-nums font-bold text-indigo-400">
                {hoursPerDay}h / dia
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 px-0.5 font-mono tabular-nums">
              <span>1h (Rápido)</span>
              <span>2h (Ideal)</span>
              <span>4h+ (Intensivo)</span>
            </div>
          </div>

          {/* Difficulties */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Tópicos de maior dificuldade / Foco prioritário
            </label>
            <textarea
              rows={3}
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="Ex: Não entendi direito a 3FN, tenho dificuldade com subqueries e transações..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Montando cronograma em tabela...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-200 shrink-0" />
                <span>Gerar Cronograma em Tabela</span>
              </>
            )}
          </button>
        </div>

        {/* Results Area (7 cols) */}
        <div className="lg:col-span-7 min-w-0">
          {planResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
              {/* Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white text-sm">
                    Plano Personalizado Concluído
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar markdown"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <a
                    href={createGoogleCalendarUrl(currentExamObj)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Google Agenda</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Rendered Markdown with enhanced table styling */}
              <div 
                className="mt-4 markdown-content max-w-full overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(planResult, { breaks: true, gfm: true }) as string,
                }}
              />

              {/* Next Steps Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigateToQuiz(selectedSubject)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                >
                  <ListChecks className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Fazer Simulado desta Matéria</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadIcsFile([currentExamObj])}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Baixar Arquivo .ICS</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToCalendar}
                  className="px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors sm:ml-auto cursor-pointer"
                >
                  <span>Ver Todos os Lembretes</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[340px] sm:min-h-[420px]">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Seu cronograma em tabela aparecerá aqui
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
                Selecione sua matéria e a data da avaliação no painel ao lado para calcular a distribuição ideal de tópicos da ementa e métodos de revisão ativa.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Baseado na ementa oficial das 15 matérias de ADS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
