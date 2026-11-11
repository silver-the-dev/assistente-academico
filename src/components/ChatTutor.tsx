import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage, Subject } from '../types/academic';
import { SUBJECTS } from '../data/fsgData';

interface ChatTutorProps {
  onOpenPlannerWithParams?: (subject: string, date: string) => void;
  onOpenSimuladoWithSubject?: (subject: string) => void;
  onNavigateToCalendar?: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `### 🎓 Olá! Sou o Agente Acadêmico de ADS da FSG
**Projeto desenvolvido no Google AI Studio | Curso de ADS - FSG**  
*Desenvolvido por Davi Chidem, Guilherme Matte e João*

Estou aqui para apoiar sua jornada acadêmica em todas as **15 matérias de Análise e Desenvolvimento de Sistemas**. Como posso te ajudar hoje?

#### 📌 O que posso fazer por você:
* 📖 **Explicar conceitos difíceis** de forma simples, com analogias e exemplos em código.
* 📅 **Montar planos e cronogramas de estudo em tabela** para suas provas e trabalhos.
* 📝 **Criar simulados interativos** com gabarito comentado para fixação.
* ⏰ **Alertar sobre datas importantes** e preparar lembretes para o **Google Agenda**.

> 💡 **Dica importante:** Minha diretriz de projeto é **nunca inventar datas**. Sempre que pedir um cronograma, informe a data exata da sua prova!`,
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

export const ChatTutor: React.FC<ChatTutorProps> = ({ 
  onOpenPlannerWithParams, 
  onOpenSimuladoWithSubject,
  onNavigateToCalendar 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const quickSubjects = [
    'Modelagem e Banco de Dados Relacional',
    'Algoritmos e Lógica de Programação',
    'Programação Orientada a Objetos (POO)',
    'DevOps, CI/CD e Computação em Nuvem',
    'Segurança da Informação e Cibersegurança',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
        content: `⚠️ **Aviso:** Houve uma instabilidade momentânea na conexão com o modelo de IA no servidor. Por favor, tente novamente em instantes.\n\n*Detalhes técnicos:* ${err.message || 'Erro de rede'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-4">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Bot className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              Tutor Acadêmico ADS
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online (Gemini 3.8 Flash)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Base de conhecimento conectada às 15 disciplinas de ADS da FSG
            </p>
          </div>
        </div>

        {/* Quick Discipline Filter & Clear */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 flex-1 sm:flex-initial"
          >
            <option value="">Foco: Todas as Matérias</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.responsible})
              </option>
            ))}
          </select>

          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
            title="Limpar histórico da conversa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2 custom-scrollbar">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-indigo-300" />
                </div>
              )}

              <div
                className={`group relative max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-sm rounded-tl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-[11px] opacity-80">
                  <span className="font-medium">
                    {isUser ? 'Você (Aluno FSG)' : 'Tutor ADS · FSG'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{message.timestamp}</span>
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition p-0.5 rounded"
                      title="Copiar texto"
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
                  className="prose prose-invert prose-sm max-w-none break-words leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(message.content, { breaks: true, gfm: true }) as string,
                  }}
                />

                {/* Contextual Action Buttons for specific responses */}
                {!isUser && message.content.includes('Banco de Dados') && message.content.includes('plano de estudos') && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenPlannerWithParams?.('Modelagem e Banco de Dados Relacional', '2026-11-20')}
                      className="inline-flex items-center gap-1.5 text-xs bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded-md transition"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Abrir no Gerador de Cronograma
                    </button>
                    <button
                      onClick={() => onNavigateToCalendar?.()}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Ver na Google Agenda
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-indigo-300" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-indigo-300 animate-pulse" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-slate-400 text-xs flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></span>
              </div>
              <span>Consultando ementas da FSG e formulando explicação...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions (Mandatory examples from action plan) */}
      <div className="my-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Perguntas sugeridas do plano de ação:
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Clique em qualquer opção para enviar instantaneamente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedPrompts.map((sp, idx) => {
            const Icon = sp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(sp.label)}
                disabled={isLoading}
                className="text-left text-xs bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-lg p-2.5 transition flex items-center gap-2 group text-slate-300 hover:text-white"
              >
                <div className="h-6 w-6 rounded bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:border-indigo-500">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="truncate flex-1 font-medium">{sp.label}</span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500 shadow-lg transition"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedSubject
                ? `Tire dúvidas sobre ${selectedSubject} ou peça um simulado...`
                : 'Pergunte sobre matérias de ADS, cronogramas de provas, simulados ou conceitos...'
            }
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Send className="h-4 w-4 mr-1.5" />
            <span>Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
};
