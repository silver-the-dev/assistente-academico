import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  FolderUp,
  GraduationCap,
  Layers,
  CheckSquare,
  Calendar,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import {
  ChatMessage,
  Discipline,
  AcademicEvent,
  SourceDoc,
} from '../types/academic';
import { renderSafeMarkdown } from '../utils/markdown';

interface ChatTutorProps {
  disciplines: Discipline[];
  events: AcademicEvent[];
  documents: SourceDoc[];
  onNavigateToMaterials: () => void;
  onOpenPlannerWithDiscipline: (disciplineId: string) => void;
  onOpenSimuladoWithDiscipline: (disciplineId: string) => void;
  onOpenFlashcardsWithDiscipline: (disciplineId: string) => void;
  onNavigateToCalendar: () => void;
}

export const ChatTutor: React.FC<ChatTutorProps> = ({
  disciplines,
  events,
  documents,
  onNavigateToMaterials,
  onOpenPlannerWithDiscipline,
  onOpenSimuladoWithDiscipline,
  onOpenFlashcardsWithDiscipline,
  onNavigateToCalendar,
}) => {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Olá! Sou o seu **Tutor Acadêmico de ADS da FSG**. Minhas respostas são baseadas diretamente nos planos de ensino, cronogramas, apostilas e provas anteriores que você envia na aba **Materiais**.\n\nComo posso ajudar nos seus estudos hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const activeDiscipline = disciplines.find((d) => d.id === selectedDisciplineId);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      disciplineId: selectedDisciplineId || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          selectedDisciplineId: selectedDisciplineId || undefined,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          disciplines: disciplines.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            professor: d.professor,
            syllabus: d.syllabus,
            evaluationCriteria: d.evaluationCriteria,
          })),
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            kind: e.kind,
            date: e.date,
            startTime: e.startTime,
            weight: e.weight,
            disciplineId: e.disciplineId,
            needsReview: e.needsReview,
          })),
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
        throw new Error(data.error || 'Falha ao obter resposta do Tutor IA.');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        disciplineId: selectedDisciplineId || undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `**Não foi possível concluir a resposta:** ${(err as Error)?.message || 'Erro de comunicação com o servidor.'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts =
    activeDiscipline && activeDiscipline.syllabus.length > 0
      ? [
          `Resuma os pontos mais importantes de ${activeDiscipline.name} segundo meu material`,
          `Explique o tópico "${activeDiscipline.syllabus[0]}" com exemplos práticos`,
          `Quais são as avaliações e critérios de nota de ${activeDiscipline.name}?`,
        ]
      : disciplines.length > 0
      ? [
          `Quais são as próximas provas e entregas confirmadas nos meus documentos?`,
          `Faça um resumo das matérias que já enviei até agora`,
          `Como organizar minha semana de estudos com base nas minhas disciplinas?`,
        ]
      : [];

  return (
    <div className="space-y-4">
      {/* Banner when no documents uploaded yet */}
      {documents.length === 0 && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderUp className="w-4 h-4 text-indigo-400" />
              <span>Nenhum documento enviado ainda</span>
            </h2>
            <p className="text-xs text-slate-300">
              Para que o Tutor IA responda citando seus planos de ensino, datas reais de provas e apostilas, envie seus arquivos na aba Materiais.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToMaterials}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            <span>Enviar Materiais Agora</span>
          </button>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-13rem)] min-h-[520px] max-h-[820px] shadow-xl">
        {/* Top Bar with Discipline Context Filter */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white">Tutor Acadêmico ADS · Gemini 4 Argon</h1>
              <p className="text-[11px] text-slate-400">
                {documents.length > 0
                  ? `Ancorado em ${documents.length} documento(s) e ${disciplines.length} disciplina(s)`
                  : 'Modo geral (envie documentos para ancoragem acadêmica)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedDisciplineId}
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[240px]"
            >
              <option value="">Todas as disciplinas ({disciplines.length})</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: `welcome-${Date.now()}`,
                    role: 'assistant',
                    content:
                      'Conversa reiniciada! Selecione uma disciplina ou pergunte qualquer dúvida sobre os seus documentos.',
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              title="Limpar conversa"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const targetDiscId = msg.disciplineId || selectedDisciplineId || disciplines[0]?.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-indigo-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div className={`max-w-[88%] sm:max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3.5 ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950/90 border border-slate-800 text-slate-200'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(msg.content) }}
                      />
                    )}
                  </div>

                  {/* Contextual Quick Actions under Assistant replies when disciplines exist */}
                  {!isUser && disciplines.length > 0 && targetDiscId && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onOpenSimuladoWithDiscipline(targetDiscId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <GraduationCap className="w-3 h-3 text-indigo-400" />
                        <span>Gerar simulado desta matéria</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenFlashcardsWithDiscipline(targetDiscId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Gerar flashcards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPlannerWithDiscipline(targetDiscId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3 h-3 text-emerald-400" />
                        <span>Criar cronograma até a prova</span>
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateToCalendar}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        <span>Adicionar ao Google Agenda</span>
                      </button>
                    </div>
                  )}

                  <span className="block text-[10px] text-slate-500 font-mono px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400">
                Consultando seus documentos acadêmicos e elaborando resposta...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        {quickPrompts.length > 0 && (
          <div className="px-4 sm:px-6 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeDiscipline
                ? `Pergunte sobre ${activeDiscipline.name}...`
                : 'Pergunte sobre suas matérias, provas, ementa ou dúvidas de código...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
