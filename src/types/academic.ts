export type DocKind =
  | 'plano_ensino'
  | 'cronograma'
  | 'grade_horaria'
  | 'apostila'
  | 'slides'
  | 'prova_anterior'
  | 'trabalhos'
  | 'outro';

export interface SourceDoc {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string; // ISO
  kind: DocKind;
  disciplineIds: string[];
  extractedText: string;
  summary?: string;
  semesterStart?: string; // YYYY-MM-DD
  semesterEnd?: string; // YYYY-MM-DD
  warnings?: string[];
}

export interface ClassSlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
}

export interface Discipline {
  id: string;
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
  sourceDocIds: string[];
  sourceExcerpt?: string;
}

export type EventKind =
  | 'aula'
  | 'prova'
  | 'trabalho'
  | 'entrega'
  | 'apresentacao'
  | 'revisao'
  | 'feriado'
  | 'outro';

export interface AcademicEvent {
  id: string;
  title: string;
  disciplineId?: string;
  disciplineName?: string;
  kind: EventKind;
  date?: string; // YYYY-MM-DD (undefined se o documento não trouxer data clara)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  weight?: string;
  description: string;
  topics?: string[];
  source: {
    docId: string;
    docName?: string;
    excerpt: string;
  };
  confidence: 'alta' | 'media' | 'baixa';
  needsReview: boolean;
  status: 'pendente' | 'confirmado' | 'concluido';
  googleCalendarEventId?: string;
}

export interface StudyBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  topic: string;
  technique: string;
  practicalExercise: string;
  dailyGoal: string;
  done: boolean;
  googleCalendarEventId?: string;
}

export interface StudyPlan {
  id: string;
  disciplineId: string;
  disciplineName: string;
  targetEventId?: string;
  targetEventTitle?: string;
  targetEventDate: string; // YYYY-MM-DD
  createdAt: string;
  hoursPerDay: number;
  availableDays: number[];
  preferredStartTime: string;
  difficulties?: string;
  blocks: StudyBlock[];
  strategySummary: string;
  eveChecklist: string[];
}

export interface Flashcard {
  id: string;
  disciplineId: string;
  disciplineName?: string;
  category: string;
  front: string;
  back: string;
  hint?: string;
  sourceDocId: string;
  sourceExcerpt: string;
  box: 1 | 2 | 3 | 4 | 5;
  nextReviewAt: string; // YYYY-MM-DD
}

export interface QuizOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  options: QuizOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceExcerpt: string;
}

export type QuizStyle = 'conceitual' | 'codigo' | 'estudo_de_caso' | 'formato_prova_anterior';

export interface QuizAttempt {
  id: string;
  takenAt: string;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  wrongQuestionIds: number[];
}

export interface Quiz {
  id: string;
  title: string;
  disciplineId: string;
  disciplineName: string;
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  style: QuizStyle;
  createdAt: string;
  sourceDocIds: string[];
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  subjectsCount: number;
}

export interface PromptVersion {
  id: string;
  category: 'Estudo' | 'Simulado' | 'Cronograma' | 'Datas e Provas';
  title: string;
  versions: {
    version: 'v1' | 'v2' | 'v3';
    date: string;
    promptText: string;
    targetOutput: string;
    improvements: string[];
    status: 'Básico' | 'Melhorado' | 'Otimizado para Produção';
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  disciplineId?: string;
}
