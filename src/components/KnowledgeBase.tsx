import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  User, 
  Sparkles, 
  HelpCircle, 
  CheckCircle, 
  Code, 
  Layers, 
  Calendar, 
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { marked } from 'marked';
import { SUBJECTS, TEAM_MEMBERS } from '../data/fsgData';
import { Subject } from '../types/academic';

interface KnowledgeBaseProps {
  onSelectSubjectForChat: (subjectName: string) => void;
  onSelectSubjectForPlanner: (subjectName: string) => void;
  onSelectSubjectForQuiz: (subjectName: string) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  onSelectSubjectForChat,
  onSelectSubjectForPlanner,
  onSelectSubjectForQuiz,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(SUBJECTS[0].id);

  // Concept Explainer Drawer
  const [conceptQuery, setConceptQuery] = useState('');
  const [conceptSubject, setConceptSubject] = useState(SUBJECTS[0].name);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);
  const [showExplainerModal, setShowExplainerModal] = useState(false);

  const filteredSubjects = SUBJECTS.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.topics.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      subject.keyTerms.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMember =
      selectedMember === 'all' || subject.responsible === selectedMember;

    return matchesSearch && matchesMember;
  });

  const handleExplainConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptQuery) return;
    setIsExplaining(true);
    setExplanationResult(null);

    try {
      const response = await fetch('/api/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptQuery,
          subject: conceptSubject,
        }),
      });

      if (!response.ok) throw new Error('Erro ao explicar conceito');
      const data = await response.json();
      setExplanationResult(data.explanation);
    } catch (err: any) {
      setExplanationResult(`### ⚠️ Erro ao gerar explicação\nDetalhes: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const openExplainerForSubject = (subject: Subject, term?: string) => {
    setConceptSubject(subject.name);
    if (term) setConceptQuery(term);
    setShowExplainerModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Base de Conhecimento ADS · FSG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            15 Matérias do Curso de ADS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Ementas, tópicos práticos, palavras-chave e materiais organizados em 3 frentes de 5 matérias cada pelos integrantes Davi Chidem, Guilherme Matte e João.
          </p>
        </div>

        <button
          onClick={() => {
            setConceptQuery('Orientação a Objetos');
            setConceptSubject('Programação Orientada a Objetos (POO)');
            setShowExplainerModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span>Explicar Conceito de Forma Simples</span>
        </button>
      </div>

      {/* Team Allocation Cards (Etapa 1 do Plano de Ação) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(selectedMember === member.name ? 'all' : member.name)}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedMember === member.name
                ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{member.name}</h3>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {member.subjectsCount} matérias de ADS
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 mb-2 font-light">
              Foco: {member.role}
            </p>
            <div className="text-[10px] text-slate-400 font-medium">
              {selectedMember === member.name ? '✓ Filtro Ativo (clique para limpar)' : 'Clique para filtrar matérias'}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Member Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por disciplina, ementa ou palavra-chave (ex: SQL, Big-O, Docker, Scrum)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Responsável:</span>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Integrantes (15 Matérias)</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {filteredSubjects.map((subject) => {
          const isExpanded = expandedSubjectId === subject.id;

          return (
            <div
              key={subject.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg transition"
            >
              {/* Header row */}
              <div 
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {subject.code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {subject.semester}º Semestre · Carga: {subject.workload}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Responsável: {subject.responsible}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white hover:text-indigo-300 transition">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                    {subject.description}
                  </p>
                </div>

                <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0 mt-1">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Key terms pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Termos-chave:</span>
                {subject.keyTerms.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => openExplainerForSubject(subject, term)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 hover:bg-indigo-950/80 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                  {/* Topics list */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      Ementa Detalhada e Tópicos de Prova
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subject.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-300 flex items-start gap-2"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample exam questions */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                      Exemplos de Questões Respondidas pelo Agente
                    </h4>
                    <div className="space-y-1.5">
                      {subject.sampleQuestions.map((q, i) => (
                        <div
                          key={i}
                          onClick={() => onSelectSubjectForChat(`${subject.name}: ${q}`)}
                          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 cursor-pointer transition flex items-center justify-between group"
                        >
                          <span>"{q}"</span>
                          <span className="text-[11px] text-indigo-400 opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            Perguntar ao Tutor <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => onSelectSubjectForChat(`Olá tutor! Preciso de ajuda na matéria de ${subject.name}. Poderia me dar um resumo dos pontos mais importantes?`)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Tirar Dúvidas com o Tutor</span>
                    </button>

                    <button
                      onClick={() => onSelectSubjectForPlanner(subject.name)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Montar Cronograma</span>
                    </button>

                    <button
                      onClick={() => onSelectSubjectForQuiz(subject.name)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Fazer Simulado</span>
                    </button>

                    <button
                      onClick={() => openExplainerForSubject(subject)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition ml-auto"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Explicar Conceito</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explainer Modal */}
      {showExplainerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Explicador Didático de Conceitos de ADS
              </h3>
              <button
                onClick={() => setShowExplainerModal(false)}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleExplainConcept} className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Disciplina
                  </label>
                  <select
                    value={conceptSubject}
                    onChange={(e) => setConceptSubject(e.target.value)}
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
                    Conceito a Descomplicar
                  </label>
                  <input
                    type="text"
                    required
                    value={conceptQuery}
                    onChange={(e) => setConceptQuery(e.target.value)}
                    placeholder="Ex: Polimorfismo, JOINs, 3FN, Recursão, Big-O..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isExplaining || !conceptQuery}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                {isExplaining ? 'Gerando explicação didática...' : 'Explicar de Forma Simples com Analogia e Código'}
              </button>
            </form>

            {explanationResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 prose prose-invert prose-sm max-w-none text-xs leading-relaxed overflow-x-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(explanationResult, { breaks: true, gfm: true }) as string,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
