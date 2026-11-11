import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Users, 
  Layers, 
  Calendar, 
  Code2, 
  Printer, 
  GraduationCap, 
  Sparkles,
  ShieldAlert,
  Award,
  ChevronRight
} from 'lucide-react';
import { TEAM_MEMBERS, SUBJECTS } from '../data/fsgData';

export const ProjectReport: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const actionPlanSteps = [
    {
      step: '1. Divisão das Matérias',
      action: 'Cada integrante pega 5 matérias de ADS da FSG e reúne os materiais (ementas, conteúdos, slides).',
      result: '15 matérias cobertas, com materiais organizados em pastas e ementas estruturadas.',
      status: 'Concluído',
      responsible: 'Davi Chidem, Guilherme Matte e João',
    },
    {
      step: '2. Entender o AI Studio',
      action: 'Estudar como o Google AI Studio funciona e como criar um agente (prompts, instruções do sistema, parâmetros).',
      result: 'Grupo apto a criar e configurar o agente com modelo Gemini 3.8 Flash no backend.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
    {
      step: '3. Alimentar o Agente',
      action: 'Enviar para o AI Studio os materiais das matérias para que o agente entenda todo o conteúdo do curso.',
      result: 'Agente responde com base estrita nas matérias da FSG e diretrizes pedagógicas.',
      status: 'Concluído',
      responsible: 'João e equipe',
    },
    {
      step: '4. Criar os Prompts',
      action: 'Escrever e testar os prompts de estudo, simulados, cronograma e datas; ajustar conforme os erros.',
      result: 'Prompts validados e versões registradas (v1, v2, v3 com histórico de refinamento).',
      status: 'Concluído',
      responsible: 'Davi Chidem',
    },
    {
      step: '5. Integrar o Google Agenda',
      action: 'Conectar o agente ao Google Agenda para lembretes de provas, trabalhos e eventos.',
      result: 'Notificações de datas funcionando via URLs 1-clique, arquivos .ICS e Google Apps Script.',
      status: 'Concluído',
      responsible: 'Guilherme Matte',
    },
    {
      step: '6. Mensagem de Boas-Vindas',
      action: 'Programar o agente para exibir, ao abrir, um resumo de uso e ideias de perguntas.',
      result: 'Experiência inicial clara para o aluno com 4 perguntas prontas do plano de ação.',
      status: 'Concluído',
      responsible: 'João',
    },
    {
      step: '7. Testes e Ajustes',
      action: 'Simular o uso real (ex.: prova em uma data, pedido de simulado) e corrigir falhas.',
      result: 'Agente estável, confiável e com regra anti-alucinação de datas validada.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
    {
      step: '8. Apresentação & Relatório',
      action: 'Montar relatório/apresentação com objetivo, estrutura, testes, resultados e limitações.',
      result: 'Trabalho entregue, documentado e pronto para apresentação na FSG.',
      status: 'Concluído',
      responsible: 'Toda a equipe',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:p-0 print:space-y-4">
      {/* Print / Export Action */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <FileText className="h-4 w-4" />
          <span>Documento Executivo Acadêmico</span>
        </div>
        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* Official Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block">
              Projeto Desenvolvido no Google AI Studio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Plano de Ação: Agente Acadêmico
            </h1>
            <p className="text-sm text-slate-400">
              Curso de Análise e Desenvolvimento de Sistemas (ADS) · Centro Universitário FSG
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          {TEAM_MEMBERS.map((m) => (
            <div key={m.id} className="bg-slate-950/70 border border-slate-850 p-3 rounded-xl">
              <span className="text-xs font-bold text-white block">{m.name}</span>
              <span className="text-[11px] text-indigo-400 block mb-1">{m.role}</span>
              <span className="text-[10px] text-slate-400 block">{m.subjectsCount} matérias de ADS</span>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Objetivo */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400" />
          1. Objetivo do Projeto
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Criar um <strong>agente de IA no Google AI Studio</strong> que atue como assistente acadêmico para os alunos de Análise e Desenvolvimento de Sistemas (ADS) da FSG. O agente conhece em profundidade as matérias do curso, auxilia o estudante a estudar com metodologias ativas, organiza cronogramas de provas em tabelas estruturadas e garante que prazos e avaliações não sejam perdidos através de notificações no Google Agenda.
        </p>
      </section>

      {/* 2. Funcionalidades Desenvolvidas */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          2. Funcionalidades do Agente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">📖 Estudo para Provas</strong>
            <p>Explicações simples e didáticas com analogias cotidianas, resumos, flashcards com virada 3D e simulados de múltipla escolha com gabarito comentado justificando alternativas corretas e incorretas.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">📅 Cronograma de Provas em Tabela</strong>
            <p>O aluno informa as disciplinas e datas de provas/trabalhos; o modelo calcula os dias restantes e estrutura uma tabela dinâmica com tópicos da ementa, técnica Pomodoro e exercícios práticos.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">⏰ Notificações & Google Agenda</strong>
            <p>Integração de eventos com links diretos Web Intent para o Google Calendar, exportação completa de arquivo .ICS e script automatizado para o Google Apps Script (.gs) com lembretes de 7 dias e 24h.</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-1.5">
            <strong className="text-white text-sm block">👋 Experiência Inicial & Boas-Vindas</strong>
            <p>Mensagem inicial acolhedora explicando os recursos disponíveis, regras anti-alucinação de datas e 4 botões com exemplos reais prontos para clique imediato.</p>
          </div>
        </div>
      </section>

      {/* 3. Estrutura Resumida do Agente */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          3. Estrutura Resumida do Agente no Google AI Studio
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-xl">
            <thead className="bg-slate-800/80 text-white font-semibold">
              <tr>
                <th className="p-3 border-b border-slate-800">Componente</th>
                <th className="p-3 border-b border-slate-800">Implementação no Google AI Studio & Código</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              <tr>
                <td className="p-3 font-semibold text-white">Instruções do Sistema (System Instruction)</td>
                <td className="p-3">Define o papel de Tutor Especialista em ADS, o tom encorajador e a regra estrita de nunca inventar datas de avaliações, pedindo informações adicionais quando omitidas.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Base de Conhecimento</td>
                <td className="p-3">15 matérias de ADS divididas entre Davi, Guilherme e João cobrindo Algoritmos, Bancos de Dados, POO, Web, DevOps, Redes, IA e Segurança da Informação.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Prompts de Uso (Prompt Engineering)</td>
                <td className="p-3">Conjunto de prompts testados e refinados da v1 à v3, com schemas JSON estritos para simulados e formatação em Markdown para cronogramas.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Integração com Google Agenda</td>
                <td className="p-3">Criação de eventos com URLs diretas, arquivos universais .ics e script de automação para Google Apps Script com notificações automáticas.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Mensagem Inicial</td>
                <td className="p-3">Apresentação imediata ao abrir o app com instruções resumidas e os 4 prompts de teste sugeridos pelo plano.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Plano de Ação (Tabela com 8 Etapas) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          4. Plano de Ação (Passo a Passo Executado)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-xl">
            <thead className="bg-slate-800/80 text-white font-semibold">
              <tr>
                <th className="p-3 border-b border-slate-800">Etapa</th>
                <th className="p-3 border-b border-slate-800">O que foi feito</th>
                <th className="p-3 border-b border-slate-800">Resultado Alcançado</th>
                <th className="p-3 border-b border-slate-800">Responsável</th>
                <th className="p-3 border-b border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {actionPlanSteps.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60 transition">
                  <td className="p-3 font-bold text-white whitespace-nowrap">{s.step}</td>
                  <td className="p-3">{s.action}</td>
                  <td className="p-3 text-slate-200">{s.result}</td>
                  <td className="p-3 whitespace-nowrap text-indigo-400">{s.responsible}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Divisão de Responsabilidades */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" />
          5. Divisão de Responsabilidades da Equipe
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
              <h3 className="font-bold text-white text-sm">{member.name}</h3>
              <span className="text-[11px] font-semibold text-indigo-400 block">
                {member.role}
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {member.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                5 Matérias de ADS sob sua curadoria
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Testes, Resultados e Pontos de Atenção */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          6. Testes Realizados & Pontos de Atenção
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Prevenção de Alucinação de Datas:
            </strong>
            <p>
              Nos testes da versão inicial (v1), o modelo por vezes supunha datas fictícias quando o usuário perguntava genericamente sobre provas. O System Instruction foi atualizado com regra estrita para não inventar datas e interpelar educadamente o estudante para fornecer o dia exato da avaliação.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Validação dos Simulados com Gabarito Comentado:
            </strong>
            <p>
              Foi implementada uma resposta com Response Schema estruturado em JSON para alimentar a interface interativa com pontuação imediata e explicações ricas, evitando respostas incompletas ou gabaritos sem justificativa pedagógica.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
            <strong className="text-white block mb-1">
              ✓ Limitações e Próximos Passos:
            </strong>
            <p>
              Como o Google AI Studio é um ambiente de prototipação e teste de modelos de linguagem, a emissão direta de notificações push em segundo plano foi viabilizada via integração com o Google Agenda (Web Intents, arquivos .ics e código Google Apps Script para disparo no calendário oficial do usuário). Como evolução futura, planeja-se integrar a API do AVA da FSG para sincronização automática de notas e faltas.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
