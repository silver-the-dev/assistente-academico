import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  HelpCircle, 
  CheckCircle, 
  Calendar, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X
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

  // Concept Explainer Modal
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
      setExplanationResult(`### Erro ao gerar explicação\nDetalhes: ${err.message}`);
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
    <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide mb-1">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Base de Conhecimento ADS · FSG</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            15 Matérias do Curso de ADS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Ementas, tópicos práticos, palavras-chave e materiais organizados em 3 frentes de 5 matérias cada pelos integrantes Davi Chidem, Guilherme Matte e João.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConceptQuery('Orientação a Objetos');
            setConceptSubject('Programação Orientada a Objetos (POO)');
            setShowExplainerModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-indigo-200 shrink-0" />
          <span>Explicar Conceito com IA</span>
        </button>
      </div>

      {/* Team Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {TEAM_MEMBERS.map((member) => {
          const isSelected = selectedMember === member.name;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMember(isSelected ? 'all' : member.name)}
              className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{member.name}</h3>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {member.subjectsCount} matérias de ADS
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                Foco: {member.role}
              </p>
              <div className="text-[11px] text-slate-400 font-medium">
                {isSelected ? 'Filtro ativo (toque para mostrar todas)' : 'Toque para filtrar matérias'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Member Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar disciplina, ementa ou termo (ex: SQL, Big-O, Docker, Scrum)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 shrink-0">Responsável:</span>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="flex-1 sm:flex-initial bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos os Integrantes (15)</option>
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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-colors"
            >
              {/* Header row */}
              <div 
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-indigo-400">
                      {subject.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {subject.semester}º Semestre ({subject.workload})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">
                      Curadoria: {subject.responsible}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
                    {subject.description}
                  </p>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 shrink-0 mt-0.5 cursor-pointer"
                  aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Interactive Key terms filter/explainer buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3.5 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Explicar termo:</span>
                {subject.keyTerms.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openExplainerForSubject(subject, term)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/80 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
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
                    <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>Ementa Detalhada e Tópicos de Prova</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subject.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-2.5"
                        >
                          <span className="font-mono text-indigo-400 font-semibold text-[11px] shrink-0">
                            0{i + 1}.
                          </span>
                          <span className="leading-relaxed">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample exam questions */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Exemplos de Questões Respondidas pelo Agente</span>
                    </h4>
                    <div className="space-y-2">
                      {subject.sampleQuestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSelectSubjectForChat(`Em ${subject.name}: ${q}`)}
                          className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                        >
                          <span className="leading-relaxed">"{q}"</span>
                          <span className="text-[11px] text-indigo-400 shrink-0 flex items-center gap-1 font-medium">
                            <span className="hidden sm:inline">Perguntar ao Tutor</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSubjectForChat(`Olá tutor! Preciso de ajuda na matéria de ${subject.name}. Poderia me dar um resumo dos pontos mais importantes para a prova?`)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-200 shrink-0" />
                      <span>Tirar Dúvidas com o Tutor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectSubjectForPlanner(subject.name)}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>Montar Cronograma</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectSubjectForQuiz(subject.name)}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Fazer Simulado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openExplainerForSubject(subject)}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors sm:ml-auto cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4 pb-2.5 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Explicador Didático de Conceitos de ADS</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExplainerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isExplaining || !conceptQuery}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isExplaining ? 'Gerando explicação didática...' : 'Explicar com Analogia e Código'}
              </button>
            </form>

            {explanationResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 markdown-content max-w-full overflow-x-auto">
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
