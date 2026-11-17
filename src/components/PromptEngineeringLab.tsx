import React, { useState } from 'react';
import {
  Code2,
  GitBranch,
  CheckCircle,
  Copy,
  Check,
  Terminal,
  Play,
  TrendingUp,
} from 'lucide-react';
import { PROMPT_VERSIONS } from '../data/fsgData';
import { PromptVersion } from '../types/academic';
import { renderSafeMarkdown } from '../utils/markdown';

export const PromptEngineeringLab: React.FC = () => {
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<string>(PROMPT_VERSIONS[0].id);
  const [selectedVersion, setSelectedVersion] = useState<'v1' | 'v2' | 'v3'>('v3');
  const [copiedText, setCopiedText] = useState(false);

  const [playgroundPrompt, setPlaygroundPrompt] = useState(
    'Explique o princípio do Polimorfismo em Orientação a Objetos de forma simples com exemplo em código e pegadinhas de prova de ADS.'
  );
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const activeCategory: PromptVersion =
    PROMPT_VERSIONS.find((p) => p.id === selectedPromptCategory) || PROMPT_VERSIONS[0];
  const activeVersionData =
    activeCategory.versions.find((v) => v.version === selectedVersion) || activeCategory.versions[2];

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
          message: playgroundPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao testar no Playground');
      setPlaygroundOutput(data.reply);
    } catch (err: unknown) {
      setPlaygroundOutput(`### Erro no Playground\n${(err as Error)?.message || 'Erro inesperado'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide mb-1">
          <Code2 className="h-4 w-4 shrink-0" />
          <span>Laboratório de Engenharia de Prompts</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          Evolução de Prompts (v1 → v2 → v3)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Documentação sistemática dos refinamentos de prompt, schemas JSON com validação Zod, regras anti-alucinação de datas e testes realizados por Davi Chidem, Guilherme Matte e João.
        </p>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
        {PROMPT_VERSIONS.map((pv) => {
          const isSelected = selectedPromptCategory === pv.id;
          return (
            <button
              key={pv.id}
              type="button"
              onClick={() => {
                setSelectedPromptCategory(pv.id);
                setSelectedVersion('v3');
              }}
              className={`p-3.5 rounded-2xl text-xs font-semibold border text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-4 w-4 shrink-0" />
                <span className="truncate">{pv.title}</span>
              </div>
              <span className="text-[11px] opacity-80 shrink-0">{pv.category}</span>
            </button>
          );
        })}
      </div>

      {/* Version Tabs & Detailed Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {(['v1', 'v2', 'v3'] as const).map((v) => {
              const vData = activeCategory.versions.find((x) => x.version === v);
              const isActive = selectedVersion === v;

              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVersion(v)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">{v.toUpperCase()}</span>
                  {vData && <span className="text-[11px] opacity-85">· {vData.status}</span>}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedText ? 'Copiado!' : 'Copiar Prompt'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Prompt Enviado ao Modelo:</span>
                <span className="font-mono tabular-nums">{activeVersionData.date}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 whitespace-pre-wrap break-words leading-relaxed">
                {activeVersionData.promptText}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Resultado Esperado / Comportamento:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">{activeVersionData.targetOutput}</p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>Diagnóstico e Melhorias da Versão</span>
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
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPlaygroundPrompt(activeVersionData.promptText);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5 shrink-0" />
                <span>Carregar no Playground Abaixo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Prompt Playground */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Terminal className="h-5 w-5 text-indigo-400 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-white">Playground Interativo de Teste</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Modifique o prompt ou envie variações para inspecionar a resposta em tempo real com o Gemini 4 Argon.
        </p>

        <div className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Digite um prompt de teste para o Agente Acadêmico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              System Instruction Dinâmica: Gemini 4 Argon ativo no servidor
            </span>

            <button
              type="button"
              onClick={handleTestInPlayground}
              disabled={isTesting || !playgroundPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Executando...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current shrink-0" />
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
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 markdown-content max-w-full overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: renderSafeMarkdown(playgroundOutput),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
