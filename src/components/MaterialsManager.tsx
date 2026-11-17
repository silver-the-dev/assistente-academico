import React, { useState, useRef } from 'react';
import {
  FolderUp,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Plus,
  Calendar,
  BookOpen,
  Sparkles,
  Loader2,
  X,
  Check,
  Edit3,
  Clock,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import {
  SourceDoc,
  Discipline,
  AcademicEvent,
  DocKind,
  EventKind,
  ClassSlot,
} from '../types/academic';
import { storage } from '../services/storage';
import { renderSafeMarkdown } from '../utils/markdown';

interface MaterialsManagerProps {
  documents: SourceDoc[];
  disciplines: Discipline[];
  events: AcademicEvent[];
  onNavigateToTab: (tab: 'chat' | 'planner' | 'quiz' | 'flashcards' | 'calendar' | 'knowledge') => void;
}

interface PendingIngestResult {
  fileName: string;
  mimeType: string;
  size: number;
  extractedText: string;
  warnings: string[];
  docKind: DocKind;
  semesterStart?: string;
  semesterEnd?: string;
  summary: string;
  disciplines: {
    id: string;
    selected: boolean;
    name: string;
    code?: string;
    semester?: string;
    professor?: string;
    workloadHours?: number;
    syllabus: string[];
    objectives?: string[];
    bibliography?: string[];
    evaluationCriteria?: string;
    schedule: ClassSlot[];
    sourceExcerpt: string;
  }[];
  events: {
    id: string;
    selected: boolean;
    title: string;
    disciplineName?: string;
    kind: EventKind;
    date?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    weight?: string;
    description: string;
    topics?: string[];
    confidence: 'alta' | 'media' | 'baixa';
    needsReview: boolean;
    sourceExcerpt: string;
  }[];
}

const DOC_KIND_LABELS: Record<DocKind, string> = {
  plano_ensino: 'Plano de Ensino',
  cronograma: 'Cronograma de Aulas',
  grade_horaria: 'Grade Horária',
  apostila: 'Apostila / Material Teórico',
  slides: 'Slides de Aula',
  prova_anterior: 'Prova Anterior / Exercícios',
  trabalhos: 'Enunciado de Trabalho',
  outro: 'Documento Acadêmico',
};

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
  documents,
  disciplines,
  events,
  onNavigateToTab,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStepText, setUploadStepText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingIngestResult[]>([]);
  const [viewingDoc, setViewingDoc] = useState<SourceDoc | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);

  // Manual creation modals
  const [showManualDisciplineModal, setShowManualDisciplineModal] = useState(false);
  const [manualDiscName, setManualDiscName] = useState('');
  const [manualDiscCode, setManualDiscCode] = useState('');
  const [manualDiscProf, setManualDiscProf] = useState('');
  const [manualDiscSyllabus, setManualDiscSyllabus] = useState('');

  const [showManualEventModal, setShowManualEventModal] = useState(false);
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualEventDiscId, setManualEventDiscId] = useState('');
  const [manualEventKind, setManualEventKind] = useState<EventKind>('prova');
  const [manualEventDate, setManualEventDate] = useState('');
  const [manualEventTime, setManualEventTime] = useState('19:15');
  const [manualEventLocation, setManualEventLocation] = useState('FSG');
  const [manualEventWeight, setManualEventWeight] = useState('');
  const [manualEventDesc, setManualEventDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(fileList);
    if (filesArray.length > 10) {
      setErrorMessage('Selecione no máximo 10 arquivos por envio.');
      return;
    }

    for (const f of filesArray) {
      if (f.size > 20 * 1024 * 1024) {
        setErrorMessage(`O arquivo "${f.name}" excede o limite de 20 MB.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadStepText(`Lendo e extraindo estrutura acadêmica de ${filesArray.length} arquivo(s) com Gemini 4 Argon...`);

    try {
      const formData = new FormData();
      for (const file of filesArray) {
        formData.append('files', file);
      }

      const response = await fetch('/api/documents/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar os documentos enviados.');
      }

      const mappedReviews: PendingIngestResult[] = (data.results || []).map(
        (item: {
          fileName: string;
          mimeType: string;
          size: number;
          extractedText: string;
          warnings: string[];
          extraction: {
            docKind: DocKind;
            semesterStart?: string;
            semesterEnd?: string;
            summary: string;
            disciplines: Omit<PendingIngestResult['disciplines'][number], 'id' | 'selected'>[];
            events: Omit<PendingIngestResult['events'][number], 'id' | 'selected'>[];
          };
        }) => ({
          fileName: item.fileName,
          mimeType: item.mimeType,
          size: item.size,
          extractedText: item.extractedText,
          warnings: item.warnings || [],
          docKind: item.extraction.docKind || 'outro',
          semesterStart: item.extraction.semesterStart,
          semesterEnd: item.extraction.semesterEnd,
          summary: item.extraction.summary || '',
          disciplines: (item.extraction.disciplines || []).map((d, idx) => ({
            ...d,
            id: `temp-disc-${Date.now()}-${idx}`,
            selected: true,
          })),
          events: (item.extraction.events || []).map((e, idx) => ({
            ...e,
            id: `temp-ev-${Date.now()}-${idx}`,
            selected: true,
          })),
        })
      );

      setPendingReviews((prev) => [...mappedReviews, ...prev]);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Erro inesperado ao enviar documentos.');
    } finally {
      setIsUploading(false);
      setUploadStepText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmReviewItem = async (reviewIdx: number) => {
    const review = pendingReviews[reviewIdx];
    if (!review) return;

    // Validate that all selected events have a valid YYYY-MM-DD date if they were marked needsReview
    const invalidSelectedEvent = review.events.find(
      (ev) => ev.selected && (!ev.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date))
    );

    if (invalidSelectedEvent) {
      setErrorMessage(
        `O evento "${invalidSelectedEvent.title}" está selecionado mas não possui uma data completa (AAAA-MM-DD). Preencha a data exata no campo de revisão ou desmarque o evento antes de salvar.`
      );
      return;
    }

    setErrorMessage(null);
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const savedDisciplineIds: string[] = [];
    const disciplineNameMap = new Map<string, Discipline>();

    for (const d of review.disciplines) {
      if (!d.selected) continue;
      const newDisc: Discipline = {
        id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: d.name.trim(),
        code: d.code,
        semester: d.semester,
        professor: d.professor,
        workloadHours: d.workloadHours,
        syllabus: d.syllabus || [],
        objectives: d.objectives || [],
        bibliography: d.bibliography || [],
        evaluationCriteria: d.evaluationCriteria,
        schedule: d.schedule || [],
        sourceDocIds: [docId],
        sourceExcerpt: d.sourceExcerpt,
      };
      const merged = await storage.upsertDisciplineWithMerge(newDisc);
      savedDisciplineIds.push(merged.id);
      disciplineNameMap.set(d.name.toLowerCase().trim(), merged);
    }

    // Also map existing disciplines by name
    for (const existing of disciplines) {
      disciplineNameMap.set(existing.name.toLowerCase().trim(), existing);
    }

    for (const ev of review.events) {
      if (!ev.selected) continue;
      const matchedDisc = ev.disciplineName
        ? disciplineNameMap.get(ev.disciplineName.toLowerCase().trim())
        : savedDisciplineIds.length === 1
        ? Array.from(disciplineNameMap.values()).find((d) => d.id === savedDisciplineIds[0])
        : undefined;

      const hasValidDate = Boolean(ev.date && /^\d{4}-\d{2}-\d{2}$/.test(ev.date));
      const newEvent: AcademicEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: ev.title.trim(),
        disciplineId: matchedDisc?.id,
        disciplineName: matchedDisc?.name || ev.disciplineName,
        kind: ev.kind,
        date: hasValidDate ? ev.date : undefined,
        startTime: ev.startTime,
        endTime: ev.endTime,
        location: ev.location,
        weight: ev.weight,
        description: ev.description,
        topics: ev.topics,
        source: {
          docId,
          docName: review.fileName,
          excerpt: ev.sourceExcerpt || 'Confirmado pelo aluno na revisão de documento',
        },
        confidence: hasValidDate ? 'alta' : ev.confidence,
        needsReview: !hasValidDate,
        status: hasValidDate ? 'confirmado' : 'pendente',
      };

      await storage.upsertEventWithMerge(newEvent);
    }

    const newDoc: SourceDoc = {
      id: docId,
      name: review.fileName,
      mimeType: review.mimeType,
      size: review.size,
      uploadedAt: new Date().toISOString(),
      kind: review.docKind,
      disciplineIds: savedDisciplineIds,
      extractedText: review.extractedText,
      summary: review.summary,
      semesterStart: review.semesterStart,
      semesterEnd: review.semesterEnd,
      warnings: review.warnings,
    };

    await storage.saveDocument(newDoc);
    setPendingReviews((prev) => prev.filter((_, idx) => idx !== reviewIdx));
  };

  const handleAddManualDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDiscName.trim()) return;

    const syllabusList = manualDiscSyllabus
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newDisc: Discipline = {
      id: `disc-manual-${Date.now()}`,
      name: manualDiscName.trim(),
      code: manualDiscCode.trim() || undefined,
      professor: manualDiscProf.trim() || undefined,
      syllabus: syllabusList,
      schedule: [],
      sourceDocIds: [],
      sourceExcerpt: 'Adicionada manualmente pelo aluno',
    };

    await storage.upsertDisciplineWithMerge(newDisc);
    setManualDiscName('');
    setManualDiscCode('');
    setManualDiscProf('');
    setManualDiscSyllabus('');
    setShowManualDisciplineModal(false);
  };

  const handleAddManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEventTitle.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(manualEventDate)) return;

    const disc = disciplines.find((d) => d.id === manualEventDiscId);
    const newEv: AcademicEvent = {
      id: `ev-manual-${Date.now()}`,
      title: manualEventTitle.trim(),
      disciplineId: disc?.id,
      disciplineName: disc?.name,
      kind: manualEventKind,
      date: manualEventDate,
      startTime: manualEventTime || undefined,
      location: manualEventLocation || 'FSG',
      weight: manualEventWeight || undefined,
      description: manualEventDesc || 'Evento cadastrado manualmente pelo aluno.',
      source: {
        docId: 'manual',
        docName: 'Cadastro Manual do Aluno',
        excerpt: 'Inserido manualmente pelo aluno com data confirmada',
      },
      confidence: 'alta',
      needsReview: false,
      status: 'confirmado',
    };

    await storage.upsertEventWithMerge(newEv);
    setManualEventTitle('');
    setManualEventDate('');
    setManualEventWeight('');
    setManualEventDesc('');
    setShowManualEventModal(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      return <ImageIcon className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-indigo-400 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Central de Documentos Acadêmicos · Gemini 4 Argon</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Meus Materiais, Planos de Ensino e Cronogramas
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Envie seus planos de ensino, cronogramas de aula, grades horárias, apostilas ou provas anteriores em{' '}
              <strong className="text-slate-200">PDF, Word (.docx/.doc), Excel (.xlsx/.csv), Markdown/TXT ou Imagens</strong>.
              A IA extrai disciplinas, ementas, horários e datas de provas sem inventar nenhum dado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowManualDisciplineModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Nova Disciplina</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualEventModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Adicionar Prova / Entrega</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <p className="text-xs text-slate-400">Documentos Processados</p>
            <p className="text-2xl font-bold text-white font-mono tabular-nums mt-1">{documents.length}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <p className="text-xs text-slate-400">Disciplinas Extraídas</p>
            <p className="text-2xl font-bold text-indigo-400 font-mono tabular-nums mt-1">{disciplines.length}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <p className="text-xs text-slate-400">Eventos Confirmados</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
              {events.filter((e) => !e.needsReview).length}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <p className="text-xs text-slate-400">Pendentes de Revisão</p>
            <p className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
              {events.filter((e) => e.needsReview).length + pendingReviews.length}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm font-semibold text-white">{uploadStepText}</p>
            <p className="text-xs text-slate-400">
              Transcrevendo conteúdo, identificando disciplinas, ementa, horários e validando datas com Zod...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-white">
                Arraste e solte seus arquivos aqui ou <span className="text-indigo-400 underline">clique para selecionar</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Suporta PDF, Word (.docx, .doc), Excel (.xlsx, .csv), Texto (.txt, .md) e Fotos/Prints de grade (.png, .jpg, .webp) · Máx 20 MB por arquivo
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-200">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MANDATORY REVIEW SCREEN FOR NEWLY UPLOADED DOCUMENTS */}
      {pendingReviews.length > 0 && (
        <div className="space-y-6">
          {pendingReviews.map((review, rIdx) => (
            <div
              key={`${review.fileName}-${rIdx}`}
              className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
                    <Edit3 className="w-4 h-4" />
                    <span>Revisão Obrigatória Antes de Salvar</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{review.fileName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{review.summary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={review.docKind}
                    onChange={(e) => {
                      const val = e.target.value as DocKind;
                      setPendingReviews((prev) =>
                        prev.map((item, idx) => (idx === rIdx ? { ...item, docKind: val } : item))
                      );
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(DOC_KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extracted Disciplines Review */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Disciplinas Identificadas ({review.disciplines.length})</span>
                </h3>

                {review.disciplines.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    Nenhuma disciplina estruturada foi detectada automaticamente neste arquivo (o texto completo ainda ficará disponível para o Tutor, Simulados e Flashcards).
                  </p>
                ) : (
                  <div className="space-y-3">
                    {review.disciplines.map((disc, dIdx) => (
                      <div
                        key={disc.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={disc.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPendingReviews((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx
                                      ? {
                                          ...item,
                                          disciplines: item.disciplines.map((d, i) =>
                                            i === dIdx ? { ...d, selected: checked } : d
                                          ),
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="w-4 h-4 rounded accent-indigo-600"
                            />
                            <input
                              type="text"
                              value={disc.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingReviews((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx
                                      ? {
                                          ...item,
                                          disciplines: item.disciplines.map((d, i) =>
                                            i === dIdx ? { ...d, name: val } : d
                                          ),
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {disc.code && <span>Cód: {disc.code}</span>}
                            {disc.professor && <span>· Prof: {disc.professor}</span>}
                            {disc.workloadHours && <span>· {disc.workloadHours}h</span>}
                          </div>
                        </div>

                        {disc.syllabus.length > 0 && (
                          <div className="text-xs text-slate-300">
                            <span className="text-slate-400 font-medium">Tópicos da Ementa ({disc.syllabus.length}): </span>
                            {disc.syllabus.join(' · ')}
                          </div>
                        )}

                        {disc.schedule.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-300">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Horários semanais:</span>
                            {disc.schedule.map((s, sIdx) => (
                              <span key={sIdx} className="font-mono">
                                {DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}
                                {s.location ? ` (${s.location})` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {disc.sourceExcerpt && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
                            Trecho original: &ldquo;{disc.sourceExcerpt}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extracted Events Review */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Provas, Trabalhos e Eventos Extraídos ({review.events.length})</span>
                </h3>

                {review.events.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    Nenhuma avaliação ou evento datado foi encontrado neste documento.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {review.events.map((ev, eIdx) => {
                      const hasValidDate = Boolean(ev.date && /^\d{4}-\d{2}-\d{2}$/.test(ev.date));
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-xl p-4 border space-y-3 ${
                            !hasValidDate || ev.needsReview
                              ? 'bg-amber-950/20 border-amber-500/50'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1">
                              <input
                                type="checkbox"
                                checked={ev.selected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setPendingReviews((prev) =>
                                    prev.map((item, idx) =>
                                      idx === rIdx
                                        ? {
                                            ...item,
                                            events: item.events.map((x, i) =>
                                              i === eIdx ? { ...x, selected: checked } : x
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="w-4 h-4 rounded accent-indigo-600"
                              />
                              <input
                                type="text"
                                value={ev.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingReviews((prev) =>
                                    prev.map((item, idx) =>
                                      idx === rIdx
                                        ? {
                                            ...item,
                                            events: item.events.map((x, i) =>
                                              i === eIdx ? { ...x, title: val } : x
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-semibold text-white flex-1 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={ev.kind}
                                onChange={(e) => {
                                  const val = e.target.value as EventKind;
                                  setPendingReviews((prev) =>
                                    prev.map((item, idx) =>
                                      idx === rIdx
                                        ? {
                                            ...item,
                                            events: item.events.map((x, i) =>
                                              i === eIdx ? { ...x, kind: val } : x
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                              >
                                <option value="prova">Prova</option>
                                <option value="trabalho">Trabalho</option>
                                <option value="entrega">Entrega</option>
                                <option value="apresentacao">Apresentação</option>
                                <option value="revisao">Revisão</option>
                                <option value="aula">Aula Especial</option>
                                <option value="feriado">Feriado</option>
                                <option value="outro">Outro</option>
                              </select>

                              <input
                                type="date"
                                value={ev.date || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingReviews((prev) =>
                                    prev.map((item, idx) =>
                                      idx === rIdx
                                        ? {
                                            ...item,
                                            events: item.events.map((x, i) =>
                                              i === eIdx
                                                ? {
                                                    ...x,
                                                    date: val,
                                                    needsReview: !val,
                                                    confidence: val ? 'alta' : 'baixa',
                                                  }
                                                : x
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className={`bg-slate-900 border rounded-lg px-2.5 py-1 text-xs font-mono text-white ${
                                  !hasValidDate ? 'border-amber-500' : 'border-slate-700'
                                }`}
                              />

                              <input
                                type="time"
                                value={ev.startTime || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingReviews((prev) =>
                                    prev.map((item, idx) =>
                                      idx === rIdx
                                        ? {
                                            ...item,
                                            events: item.events.map((x, i) =>
                                              i === eIdx ? { ...x, startTime: val } : x
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                              />
                            </div>
                          </div>

                          {(!hasValidDate || ev.needsReview) && (
                            <div className="flex items-center gap-2 text-xs text-amber-300">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>
                                Data ausente ou relativa no documento (Confiança: {ev.confidence}). Informe a data exata acima para confirmar este evento.
                              </span>
                            </div>
                          )}

                          {ev.sourceExcerpt && (
                            <p className="text-[11px] text-slate-400 italic bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">
                              Trecho no documento: &ldquo;{ev.sourceExcerpt}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPendingReviews((prev) => prev.filter((_, idx) => idx !== rIdx))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Descartar Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmReviewItem(rIdx)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Salvar na Base Acadêmica</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Documents List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-indigo-400" />
            <span>Documentos Salvos ({documents.length})</span>
          </h2>
          {documents.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('knowledge')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Ver Matérias Extraídas →
              </button>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Você ainda não enviou nenhum documento acadêmico
            </p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Envie o PDF ou DOCX do Plano de Ensino, Cronograma de Aulas ou Apostila na área acima para liberar o Tutor IA, Simulados, Flashcards, Cronogramas e Sincronização com Google Agenda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {getDocIcon(doc.name)}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{doc.name}</h3>
                      <span className="text-xs text-indigo-300">
                        · {DOC_KIND_LABELS[doc.kind] || 'Documento'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        · {formatBytes(doc.size)}
                      </span>
                    </div>
                    {doc.summary && <p className="text-xs text-slate-400 line-clamp-2">{doc.summary}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ver Texto</span>
                  </button>

                  {confirmDeleteDocId === doc.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await storage.deleteDocument(doc.id, true);
                          setConfirmDeleteDocId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirmar Exclusão
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteDocId(null)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteDocId(doc.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: View Extracted Text */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{viewingDoc.name}</h3>
                <p className="text-xs text-slate-400">
                  Texto extraído em Markdown ({DOC_KIND_LABELS[viewingDoc.kind]})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(viewingDoc.extractedText) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Discipline */}
      {showManualDisciplineModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddManualDiscipline}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Adicionar Disciplina Manualmente</h3>
              <button
                type="button"
                onClick={() => setShowManualDisciplineModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Disciplina *</label>
                <input
                  type="text"
                  required
                  value={manualDiscName}
                  onChange={(e) => setManualDiscName(e.target.value)}
                  placeholder="Ex: Estrutura de Dados"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código (opcional)</label>
                  <input
                    type="text"
                    value={manualDiscCode}
                    onChange={(e) => setManualDiscCode(e.target.value)}
                    placeholder="Ex: ADS-201"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Professor(a)</label>
                  <input
                    type="text"
                    value={manualDiscProf}
                    onChange={(e) => setManualDiscProf(e.target.value)}
                    placeholder="Nome do docente"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tópicos da Ementa (1 por linha)
                </label>
                <textarea
                  rows={4}
                  value={manualDiscSyllabus}
                  onChange={(e) => setManualDiscSyllabus(e.target.value)}
                  placeholder="Pilhas e Filas&#10;Listas Encadeadas&#10;Árvores Binárias"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualDisciplineModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Salvar Disciplina
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Manual Event */}
      {showManualEventModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddManualEvent}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Cadastrar Prova ou Entrega Confirmada</h3>
              <button
                type="button"
                onClick={() => setShowManualEventModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Título da Avaliação / Evento *</label>
                <input
                  type="text"
                  required
                  value={manualEventTitle}
                  onChange={(e) => setManualEventTitle(e.target.value)}
                  placeholder="Ex: Prova A1 - Banco de Dados"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Disciplina</label>
                  <select
                    value={manualEventDiscId}
                    onChange={(e) => setManualEventDiscId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">Geral / Selecionar...</option>
                    {disciplines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
                  <select
                    value={manualEventKind}
                    onChange={(e) => setManualEventKind(e.target.value as EventKind)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="prova">Prova</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="entrega">Entrega</option>
                    <option value="apresentacao">Apresentação</option>
                    <option value="revisao">Revisão</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data Confirmada *</label>
                  <input
                    type="date"
                    required
                    value={manualEventDate}
                    onChange={(e) => setManualEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Horário</label>
                  <input
                    type="time"
                    value={manualEventTime}
                    onChange={(e) => setManualEventTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Local / Sala</label>
                  <input
                    type="text"
                    value={manualEventLocation}
                    onChange={(e) => setManualEventLocation(e.target.value)}
                    placeholder="Ex: Lab 402"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Peso na Nota</label>
                  <input
                    type="text"
                    value={manualEventWeight}
                    onChange={(e) => setManualEventWeight(e.target.value)}
                    placeholder="Ex: 40% da nota"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição / Conteúdo Cobrado</label>
                <textarea
                  rows={2}
                  value={manualEventDesc}
                  onChange={(e) => setManualEventDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualEventModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Evento</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
