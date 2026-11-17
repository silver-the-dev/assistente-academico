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
  Award
} from 'lucide-react';
import { TEAM_MEMBERS } from '../data/fsgData';

export const ProjectReport: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const actionPlanSteps = [
    {
      step: '01. Divisão das Matérias',
      action: 'Cada integrante assume 5 matérias de ADS da FSG e reúne os materiais (ementas, conteúdos, slides).',
      result: '15 matérias cobertas, com materiais organizados e ementas estruturadas.',
      status: 'Concluído',
      responsible: 'Davi Chidem, Guilherme Matte e João',
    },
    {
      step: '02. Arquitetura do Agente',
      action: 'Definir parâmetros do modelo, instruções do sistema e rotas de backend.',
      result: 'Agente configurado com System Instructions de ADS e respostas estruturadas.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
    {
      step: '03. Alimentar o Agente',
      action: 'Consolidar na base de conhecimento os tópicos essenciais das 15 matérias do curso.',
      result: 'Agente responde com base estrita nas matérias da FSG e diretrizes pedagógicas.',
      status: 'Concluído',
      responsible: 'João e equipe',
    },
    {
      step: '04. Criar os Prompts',
      action: 'Escrever e testar os prompts de estudo, simulados, cronograma e datas; ajustar conforme os erros.',
      result: 'Prompts validados e versões registradas (v1, v2, v3 com histórico de refinamento).',
      status: 'Concluído',
      responsible: 'Davi Chidem',
    },
    {
      step: '05. Integrar o Google Agenda',
      action: 'Conectar o agente ao Google Agenda para lembretes de provas, trabalhos e eventos.',
      result: 'Notificações de datas funcionando via links 1-clique, arquivos .ICS e Google Apps Script.',
      status: 'Concluído',
      responsible: 'Guilherme Matte',
    },
    {
      step: '06. Mensagem de Boas-Vindas',
      action: 'Programar o agente para exibir, ao abrir, um resumo de uso e ideias de perguntas.',
      result: 'Experiência inicial clara para o aluno com 4 perguntas prontas do plano de ação.',
      status: 'Concluído',
      responsible: 'João',
    },
    {
      step: '07. Testes e Ajustes',
      action: 'Simular o uso real (ex.: prova em uma data, pedido de simulado) e corrigir falhas.',
      result: 'Agente estável, confiável e com regra anti-alucinação de datas validada.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
    {
      step: '08. Apresentação & Relatório',
      action: 'Montar relatório/apresentação com objetivo, estrutura, testes, resultados e limitações.',
      result: 'Trabalho entregue, documentado e pronto para apresentação na FSG.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
  ];

  return (
    <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 print:p-0 print:space-y-4">
      {/* Print / Export Action */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide">
          <FileText className="h-4 w-4 shrink-0" />
          <span>Documento Executivo Acadêmico</span>
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
              Relatório Técnico de Engenharia de Software & IA
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Plano de Ação: Agente Acadêmico ADS
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
              <span className="text-[11px] text-slate-400 block mt-1 font-mono tabular-nums">
                {m.subjectsCount} matérias de ADS
              </span>
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
          Criar um <strong>agente inteligente acadêmico</strong> para os alunos de Análise e Desenvolvimento de Sistemas (ADS) da FSG. O assistente conhece em profundidade as 15 matérias do curso, auxilia o estudante a revisar conteúdos com metodologias ativas, organiza cronogramas de provas em tabelas estruturadas e garante que prazos e avaliações não sejam perdidos através de integração com o Google Agenda.
        </p>
      </section>

      {/* 2. Funcionalidades Desenvolvidas */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>2. Funcionalidades do Agente</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-300">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">01. Estudo Ativo para Provas</strong>
            <p className="leading-relaxed">Explicações simples e didáticas com analogias cotidianas, resumos, flashcards com virada 3D e simulados de múltipla escolha com gabarito comentado justificando alternativas corretas e incorretas.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">02. Cronograma de Provas em Tabela</strong>
            <p className="leading-relaxed">O aluno informa as disciplinas e datas de provas/trabalhos; o modelo calcula os dias restantes e estrutura uma tabela dinâmica com tópicos da ementa, técnica Pomodoro e exercícios práticos.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">03. Notificações & Google Agenda</strong>
            <p className="leading-relaxed">Integração de eventos com links diretos para o Google Calendar, exportação completa de arquivo .ICS e script automatizado para o Google Apps Script (.gs) com lembretes de 7 dias e 24h.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">04. Experiência Inicial & Boas-Vindas</strong>
            <p className="leading-relaxed">Mensagem inicial acolhedora explicando os recursos disponíveis, regras anti-alucinação de datas e 4 botões com exemplos reais prontos para envio imediato.</p>
          </div>
        </div>
      </section>

      {/* 3. Estrutura Resumida do Agente */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>3. Arquitetura e Componentes do Sistema</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-white font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 sm:p-3.5 min-w-[160px]">Componente</th>
                <th className="p-3 sm:p-3.5 min-w-[260px]">Implementação Técnica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              <tr>
                <td className="p-3 sm:p-3.5 font-semibold text-white">Instruções do Sistema</td>
                <td className="p-3 sm:p-3.5 leading-relaxed">Define o papel de Tutor Especialista em ADS, o tom encorajador e a regra estrita de nunca inventar datas de avaliações, pedindo informações adicionais quando omitidas.</td>
              </tr>
              <tr>
                <td className="p-3 sm:p-3.5 font-semibold text-white">Base de Conhecimento</td>
                <td className="p-3 sm:p-3.5 leading-relaxed">15 matérias de ADS divididas entre Davi, Guilherme e João cobrindo Algoritmos, Bancos de Dados, POO, Web, DevOps, Redes, IA e Segurança da Informação.</td>
              </tr>
              <tr>
                <td className="p-3 sm:p-3.5 font-semibold text-white">Engenharia de Prompts</td>
                <td className="p-3 sm:p-3.5 leading-relaxed">Conjunto de prompts testados e refinados da v1 à v3, com schemas JSON estritos para simulados e formatação em Markdown para cronogramas.</td>
              </tr>
              <tr>
                <td className="p-3 sm:p-3.5 font-semibold text-white">Integração Google Agenda</td>
                <td className="p-3 sm:p-3.5 leading-relaxed">Criação de eventos com URLs diretas, arquivos universais .ics e script de automação para Google Apps Script com notificações automáticas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Plano de Ação (Tabela com 8 Etapas) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>4. Plano de Ação Executado</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-white font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 min-w-[150px]">Etapa</th>
                <th className="p-3 min-w-[220px]">O que foi feito</th>
                <th className="p-3 min-w-[220px]">Resultado Alcançado</th>
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
                  <td className="p-3 whitespace-nowrap font-semibold text-emerald-400">
                    ✓ {s.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Divisão de Responsabilidades */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>5. Divisão de Responsabilidades da Equipe</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{member.name}</h3>
                  <span className="text-[11px] font-semibold text-indigo-400 block">
                    {member.role}
                  </span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  {member.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 font-mono tabular-nums">
                {member.subjectsCount} Matérias de ADS sob sua curadoria
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Testes, Resultados e Pontos de Atenção */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
          <span>6. Testes Realizados & Validação</span>
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Prevenção de Alucinação de Datas:
            </strong>
            <p>
              Nos testes da versão inicial (v1), o modelo por vezes supunha datas fictícias quando o usuário perguntava genericamente sobre provas. O System Instruction foi atualizado com diretriz estrita para não inventar datas e solicitar educadamente ao estudante o dia exato da avaliação.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Validação dos Simulados com Gabarito Comentado:
            </strong>
            <p>
              Foi implementada resposta estruturada em JSON via Response Schema para alimentar a interface interativa com pontuação imediata e explicações detalhadas, garantindo justificativa pedagógica em todas as alternativas.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Integração Multiplataforma de Agenda:
            </strong>
            <p>
              A emissão de lembretes foi viabilizada via integração com o Google Agenda por três meios complementares: links diretos Web Intent, exportação de arquivos .ICS compatíveis com qualquer calendário e código Google Apps Script para agendamento automatizado com alertas push.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
