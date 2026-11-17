import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  HelpCircle, 
  Copy, 
  Check, 
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage } from '../types/academic';
import { SUBJECTS } from '../data/fsgData';

interface ChatTutorProps {
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  onOpenPlannerWithParams?: (subject: string, date: string) => void;
  onOpenSimuladoWithSubject?: (subject: string) => void;
  onNavigateToCalendar?: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `### Olá! Sou o Agente Acadêmico de ADS da FSG
**Curso de Análise e Desenvolvimento de Sistemas · Centro Universitário FSG**  
*Desenvolvido por Davi Chidem, Guilherme Matte e João*

Estou aqui para apoiar sua jornada acadêmica em todas as **15 matérias de ADS**. Como posso ajudar hoje?

#### O que posso fazer por você:
* **Explicar conceitos difíceis** de forma simples, com analogias e exemplos práticos em código.
* **Montar planos e cronogramas de estudo em tabela** para suas provas e trabalhos.
* **Criar simulados interativos** com gabarito comentado para fixação.
* **Alertar sobre datas importantes** e preparar lembretes para o **Google Agenda**.

> **Diretriz pedagógica:** Nunca invento datas de avaliações. Sempre que pedir um cronograma, informe a disciplina e a data exata da sua prova.`,
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

export const ChatTutor: React.FC<ChatTutorProps> = ({ 
  initialPrompt,
  onClearInitialPrompt,
  onOpenPlannerWithParams, 
  onOpenSimuladoWithSubject,
  onNavigateToCalendar 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    {
      label: 'Tenho prova de Banco de Dados dia 20/11. Monte meu plano de estudos.',
      icon: Calendar,
      category: 'Cronograma',
    },
    {
      label: 'Crie 5 questões de múltipla escolha sobre lógica de programação.',
      icon: CheckSquare,
      category: 'Simulado',
    },
    {
      label: 'Quais são as minhas provas e datas importantes deste mês?',
      icon: Sparkles,
      category: 'Datas',
    },
    {
      label: 'Explique orientação a objetos de forma simples.',
      icon: HelpCircle,
      category: 'Conceito',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const messageContent = (textToSend ?? input).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      return updated;
    });
    setInput('');
    setIsLoading(true);

    // Collapse suggestions on mobile after first user message to maximize chat space
    if (window.innerWidth < 640) {
      setShowSuggestions(false);
    }

    try {
      const currentHistory = [...messages, userMessage];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentHistory.map((m) => ({ role: m.role, content: m.content })),
          userContext: {
            subjectFilter: selectedSubject || 'Geral ADS',
            calendarContext: 'Provas A1 começam em 20/11/2026. Prova A1 de Banco de Dados: 20/11/2026. Lógica de Programação: 25/11/2026. Projeto Backend: 02/12/2026. POO A2: 08/12/2026.',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha na resposta do servidor (${response.status})`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Desculpe, não consegui formular uma resposta clara. Pode reformular a pergunta?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Aviso:** Houve uma instabilidade momentânea na conexão com o modelo de IA no servidor. Por favor, tente novamente em instantes.\n\n*Detalhes técnicos:* ${err.message || 'Erro de rede'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedSubject]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, handleSend, onClearInitialPrompt]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                Tutor Acadêmico ADS
              </h1>
              <span className="text-xs text-slate-400">
                · 15 disciplinas FSG
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Explicações didáticas, cronogramas em tabela e simulados comentados
            </p>
          </div>
        </div>

        {/* Quick Discipline Filter & Clear */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            aria-label="Filtrar por disciplina"
            className="text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 flex-1 sm:w-64 truncate cursor-pointer"
          >
            <option value="">Foco: Todas as 15 Matérias</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.responsible})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearChat}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Reiniciar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 min-h-[340px] sm:min-h-[420px] max-h-[62dvh] sm:max-h-[calc(100dvh-20rem)] overflow-y-auto space-y-4 p-3 sm:p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl custom-scrollbar">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hidden sm:flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-indigo-300" />
                </div>
              )}

              <div
                className={`group relative max-w-full sm:max-w-[85%] min-w-0 rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] text-slate-300">
                  <span className="font-semibold text-white">
                    {isUser ? 'Você (Aluno FSG)' : 'Tutor ADS · FSG'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono tabular-nums text-[10px] opacity-80">
                      {message.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.content)}
                      className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:text-white transition-opacity p-1 rounded cursor-pointer"
                      title="Copiar mensagem"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Content rendered with Markdown */}
                <div 
                  className={`markdown-content max-w-full overflow-x-auto ${isUser ? 'text-white [&_p]:text-white' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(message.content, { breaks: true, gfm: true }) as string,
                  }}
                />

                {/* Contextual Action Buttons for specific responses */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPlannerWithParams?.(
                          selectedSubject || 'Modelagem e Banco de Dados Relacional',
                          '2026-11-20'
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Abrir Cronograma</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSimuladoWithSubject?.(
                          selectedSubject || 'Modelagem e Banco de Dados Relacional'
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Praticar Simulado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToCalendar?.()}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Google Agenda</span>
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 hidden sm:flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-indigo-300" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hidden sm:flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-indigo-300" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-slate-300 text-xs flex items-center gap-3">
              <div className="flex gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
              </div>
              <span>Consultando ementas da FSG e elaborando resposta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setShowSuggestions((prev) => !prev)}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sugestões rápidas de perguntas</span>
            {showSuggestions ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Clique para enviar ao tutor
          </span>
        </div>

        {showSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {suggestedPrompts.map((sp, idx) => {
              const Icon = sp.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(sp.label)}
                  disabled={isLoading}
                  className="text-left text-xs bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2.5 transition-colors flex items-center gap-2.5 group text-slate-200 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-lg bg-indigo-950/70 border border-indigo-800/50 flex items-center justify-center shrink-0 group-hover:border-indigo-500">
                    <Icon className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <span className="line-clamp-1 flex-1 font-medium">{sp.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 sm:p-2 focus-within:border-indigo-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedSubject
                ? `Tire dúvidas sobre ${selectedSubject}...`
                : 'Pergunte sobre matérias de ADS, cronogramas, simulados ou conceitos...'
            }
            disabled={isLoading}
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
};
