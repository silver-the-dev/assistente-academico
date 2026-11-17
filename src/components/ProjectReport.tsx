import React from 'react';
import {
  FileText,
  CheckCircle2,
  Users,
  Layers,
  Printer,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { TEAM_MEMBERS } from '../data/fsgData';

interface ProjectReportProps {
  documentsCount?: number;
  disciplinesCount?: number;
  eventsCount?: number;
}

export const ProjectReport: React.FC<ProjectReportProps> = ({
  documentsCount = 0,
  disciplinesCount = 0,
  eventsCount = 0,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const actionPlanSteps = [
    {
      step: '01. Ingestão Multimodal',
      action:
        'Pipeline de upload para PDF, DOCX, DOC, XLSX, CSV, TXT, MD e imagens com validação de magic bytes e extração para Markdown.',
      result: 'Extração fiel de planos de ensino, grades horárias, cronogramas e provas anteriores.',
      status: 'Concluído',
      responsible: 'Davi Chidem',
    },
    {
      step: '02. Extração com Gemini 4 Argon',
      action:
        'Configurar responseSchema + validação Zod com retry automático e regra estrita anti-alucinação de datas.',
      result: 'Eventos sem data explícita são marcados como needsReview=true para confirmação humana.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
    {
      step: '03. Persistência IndexedDB',
      action:
        'Armazenar documentos, disciplinas, eventos, planos de estudo, simulados e flashcards localmente com deduplicação.',
      result: 'Zero dados fictícios (mocks removidos) e persistência offline instantânea no navegador.',
      status: 'Concluído',
      responsible: 'Guilherme Matte',
    },
    {
      step: '04. Engenharia de Prompts (v1–v3)',
      action:
        'Refinar prompts para geração de simulados comentados, flashcards Leitner e cronogramas reversos ancorados nos arquivos.',
      result: 'Todas as questões e cartões exibem o trecho literal (sourceExcerpt) do material do aluno.',
      status: 'Concluído',
      responsible: 'Davi Chidem e João',
    },
    {
      step: '05. Google Calendar API (OAuth 2.0)',
      action:
        'Integrar OAuth 2.0 real com criação do calendário dedicado "Agente Acadêmico ADS", RRULE semanal e idempotência.',
      result: 'Sincronização direta sem duplicar eventos, além de exportação .ICS para quem preferir não conectar.',
      status: 'Concluído',
      responsible: 'Guilherme Matte',
    },
    {
      step: '06. Repetição Espaçada & Simulados',
      action:
        'Implementar sistema Leitner de 5 caixas e botão para transformar erros do simulado diretamente em novos flashcards.',
      result: 'Ciclo ativo de aprendizagem focado nas lacunas reais do estudante.',
      status: 'Concluído',
      responsible: 'João',
    },
  ];

  return (
    <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 print:p-0 print:space-y-4">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide">
          <FileText className="h-4 w-4 shrink-0" />
          <span>Documento Executivo Acadêmico · Dados Ativos: {documentsCount} docs, {disciplinesCount} matérias, {eventsCount} eventos</span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="h-4 w-4 shrink-0" />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Official Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 tracking-wide block mb-0.5">
              Relatório Técnico de Engenharia de Software & IA Generativa
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Agente Acadêmico ADS Dirigido por Documentos
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Curso de Análise e Desenvolvimento de Sistemas (ADS) · Centro Universitário FSG
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          {TEAM_MEMBERS.map((m) => (
            <div key={m.id} className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs font-bold text-white block">{m.name}</span>
              <span className="text-[11px] text-indigo-400 block mt-0.5">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Objetivo */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>1. Objetivo do Projeto</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Fornecer um <strong>assistente acadêmico real e dirigido pelos documentos do próprio aluno</strong> para o curso de Análise e Desenvolvimento de Sistemas (ADS) da FSG. O sistema lê planos de ensino, cronogramas, apostilas e provas anteriores em múltiplos formatos, extrai disciplinas, horários e avaliações com validação rigorosa contra alucinações, gera simulados, flashcards Leitner e cronogramas de estudo, e sincroniza tudo diretamente no Google Agenda via OAuth 2.0.
        </p>
      </section>

      {/* 2. Funcionalidades */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>2. Pilares Técnicos Implementados</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-300">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">01. Ingestão Multimodal & Revisão</strong>
            <p className="leading-relaxed">
              Leitura de PDF, DOCX, DOC, XLSX, CSV, TXT, MD e Imagens com tela de revisão obrigatória onde eventos com datas relativas ficam bloqueados até confirmação manual.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">02. Geração Ancorada com Citação de Fonte</strong>
            <p className="leading-relaxed">
              Simulados comentados, flashcards no sistema Leitner (caixas 1 a 5) e planos de estudo diários gerados pelo Gemini 4 Argon com referência literal ao trecho do documento.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">03. Integração Real com Google Calendar API</strong>
            <p className="leading-relaxed">
              Criação automática do calendário secundário &ldquo;Agente Acadêmico ADS&rdquo;, aulas semanais recorrentes (RRULE/EXDATE), cores distintas por categoria e idempotência via <code>appEventId</code>.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">04. Segurança & Blindagem</strong>
            <p className="leading-relaxed">
              Validação de magic bytes no upload, sanitização de HTML/Markdown com DOMPurify, proteção contra prompt injection em documentos e chave Gemini restrita ao servidor.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Arquitetura */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>3. Plano de Engenharia Executado</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-white font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 min-w-[150px]">Etapa</th>
                <th className="p-3 min-w-[220px]">Implementação</th>
                <th className="p-3 min-w-[220px]">Resultado</th>
                <th className="p-3 min-w-[140px]">Responsável</th>
                <th className="p-3 min-w-[90px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {actionPlanSteps.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3 font-bold text-white whitespace-nowrap">{s.step}</td>
                  <td className="p-3 leading-relaxed">{s.action}</td>
                  <td className="p-3 text-slate-200 leading-relaxed">{s.result}</td>
                  <td className="p-3 text-indigo-300">{s.responsible}</td>
                  <td className="p-3 whitespace-nowrap font-semibold text-emerald-400">✓ {s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Divisão de Responsabilidades */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>4. Divisão de Responsabilidades da Equipe</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{member.name}</h3>
                  <span className="text-[11px] font-semibold text-indigo-400 block">{member.role}</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  {member.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Validação */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
          <span>5. Garantias de Qualidade e Anti-Alucinação</span>
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
            <strong className="text-white block mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Prevenção Estrita de Alucinação de Datas:</span>
            </strong>
            <p>
              Datas relativas (&ldquo;Semana 8&rdquo;, &ldquo;Final do semestre&rdquo;) jamais são convertidas em datas inventadas. O extrator deixa o campo de data vazio e exige revisão explícita do estudante antes de liberar a sincronização com o Google Agenda.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
