export interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  subjectsCount: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  responsible: string;
  workload: string;
  description: string;
  topics: string[];
  keyTerms: string[];
  sampleQuestions: string[];
}

export interface ExamEvent {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  type: 'Prova A1' | 'Prova A2' | 'Trabalho Prático' | 'Projeto Integrador' | 'Substitutiva';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  weight: string;
  description: string;
  completed?: boolean;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  category: string;
  front: string;
  back: string;
  hint?: string;
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  title: string;
  subject: string;
  questions: QuizQuestion[];
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
  suggestedActions?: { label: string; action: () => void }[];
}
