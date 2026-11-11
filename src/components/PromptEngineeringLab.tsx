import React, { useState } from 'react';
import { 
  Code2, 
  GitBranch, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Terminal, 
  Play, 
  History,
  Layers,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { marked } from 'marked';
import { PROMPT_VERSIONS } from '../data/fsgData';
import { PromptVersion } from '../types/academic';

export const PromptEngineeringLab: React.FC = () => {
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<string>(PROMPT_VERSIONS[0].id);
  const [selectedVersion, setSelectedVersion] = useState<'v1' | 'v2' | 'v3'>('v3');
  const [copiedText, setCopiedText] = useState(false);

  // Playground state
  const [playgroundPrompt, setPlaygroundPrompt] = useState(
    'Explique o princípio do Polimorfismo em Orientação a Objetos de forma simples com exemplo em código e pegadinhas de prova da FSG.'
  );
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const activeCategory: PromptVersion = PROMPT_VERSIONS.find((p) => p.id === selectedPromptCategory) || PROMPT_VERSIONS[0];
  const activeVersionData = activeCategory.versions.find((v) => v.version === selectedVersion) || activeCategory.versions[2];

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activeVersionData.promptText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleTestInPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setIsTesting(true);
    setPlaygroundOutput(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: playgroundPrompt }],
        }),
      });

      if (!response.ok) throw new Error('Falha ao testar no Playground');
      const data = await response.json();
      setPlaygroundOutput(data.reply);
    } catch (err: any) {
      setPlaygroundOutput(`### ⚠️ Erro no Playground\n${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Code2 className="h-4 w-4" />
          <span>Laboratório de Engenharia de Prompts · Google AI Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Registro de Evolução de Prompts (v1 → v2 → v3)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Atendendo às etapas 4 e 7 do projeto (Davi Chidem, Guilherme Matte e João): documentação sistemática dos refinamentos de prompt, regras anti-alucinação de datas e métricas de qualidade.
        </p>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PROMPT_VERSIONS.map((pv) => (
          <button
            key={pv.id}
            onClick={() => {
              setSelectedPromptCategory(pv.id);
              setSelectedVersion('v3');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
              selectedPromptCategory === pv.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>{pv.title}</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">
              {pv.category}
            </span>
          </button>
        ))}
      </div>

      {/* Version Tabs & Detailed Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        {/* Version navigation bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {(['v1', 'v2', 'v3'] as const).map((v) => {
              const vData = activeCategory.versions.find((x) => x.version === v);
              const isActive = selectedVersion === v;

              let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
              if (v === 'v1') badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              if (v === 'v2') badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
              if (v === 'v3') badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

              return (
                <button
                  key={v}
                  onClick={() => setSelectedVersion(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Versão {v.toUpperCase()}</span>
                  {vData && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${badgeStyle}`}>
                      {vData.status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopyPrompt}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedText ? 'Copiado!' : 'Copiar Prompt'}</span>
          </button>
        </div>

        {/* Version Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Left: Prompt Text */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Prompt Enviado ao Modelo:</span>
                <span>Registrado em {activeVersionData.date}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                {activeVersionData.promptText}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Resultado Esperado / Comportamento:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeVersionData.targetOutput}
              </p>
            </div>
          </div>

          {/* Right: Evolutions & Rationales */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Diagnóstico e Melhorias da Versão
            </h4>

            <div className="space-y-2.5">
              {activeVersionData.improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{imp}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setPlaygroundPrompt(activeVersionData.promptText);
                }}
                className="w-full py-2 px-3 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Carregar no Playground Interativo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Playground */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">
            Playground Interativo de Teste (Google AI Studio)
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Modifique o prompt ou envie variações para inspecionar a resposta em tempo real com o modelo Gemini 3.8 Flash e a base de conhecimento de ADS da FSG.
        </p>

        <div className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Digite um prompt de teste para o Agente Acadêmico..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              System Instruction: Base de Conhecimento FSG (15 matérias) ativa no servidor
            </span>

            <button
              onClick={handleTestInPlayground}
              disabled={isTesting || !playgroundPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              {isTesting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executando no Gemini...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Executar Teste</span>
                </>
              )}
            </button>
          </div>

          {playgroundOutput && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Resposta Retornada pelo Modelo:
              </span>
              <div 
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs prose prose-invert prose-sm max-w-none leading-relaxed overflow-x-auto shadow-inner"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(playgroundOutput, { breaks: true, gfm: true }) as string,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
