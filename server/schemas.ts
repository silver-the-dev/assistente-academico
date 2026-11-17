import { Type, Schema } from '@google/genai';
import { z } from 'zod';

export const DocKindSchema = z.enum([
  'plano_ensino',
  'cronograma',
  'grade_horaria',
  'apostila',
  'slides',
  'prova_anterior',
  'trabalhos',
  'outro',
]);

export const ClassSlotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
});

export const ExtractedDisciplineSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  semester: z.string().optional(),
  professor: z.string().optional(),
  workloadHours: z.coerce.number().optional(),
  syllabus: z.array(z.string()).default([]),
  objectives: z.array(z.string()).optional(),
  bibliography: z.array(z.string()).optional(),
  evaluationCriteria: z.string().optional(),
  schedule: z.array(ClassSlotSchema).default([]),
  sourceExcerpt: z.string().default(''),
});

export const ExtractedEventSchema = z.object({
  title: z.string().min(1),
  disciplineName: z.string().optional(),
  kind: z
    .enum(['aula', 'prova', 'trabalho', 'entrega', 'apresentacao', 'revisao', 'feriado', 'outro'])
    .catch('outro'),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  weight: z.string().optional(),
  description: z.string().default(''),
  topics: z.array(z.string()).optional(),
  confidence: z.enum(['alta', 'media', 'baixa']).catch('media'),
  needsReview: z.boolean().default(false),
  sourceExcerpt: z.string().default(''),
});

export const DocumentIngestExtractionSchema = z.object({
  docKind: DocKindSchema.catch('outro'),
  semesterStart: z.string().optional(),
  semesterEnd: z.string().optional(),
  extractedMarkdown: z.string().optional(),
  disciplines: z.array(ExtractedDisciplineSchema).default([]),
  events: z.array(ExtractedEventSchema).default([]),
  summary: z.string().default(''),
});

export type DocumentIngestExtraction = z.infer<typeof DocumentIngestExtractionSchema>;

export const geminiIngestResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    docKind: {
      type: Type.STRING,
      description:
        'Classificação do documento: plano_ensino, cronograma, grade_horaria, apostila, slides, prova_anterior, trabalhos, ou outro',
    },
    semesterStart: {
      type: Type.STRING,
      description: 'Data de início do semestre em YYYY-MM-DD se constar literalmente no documento',
    },
    semesterEnd: {
      type: Type.STRING,
      description: 'Data de término do semestre em YYYY-MM-DD se constar literalmente no documento',
    },
    summary: {
      type: Type.STRING,
      description: 'Resumo curto em português do que foi encontrado no documento',
    },
    extractedMarkdown: {
      type: Type.STRING,
      description:
        'Transcrição/síntese completa em Markdown estruturado de todo o conteúdo acadêmico do documento (ementa, cronograma, conceitos, fórmulas, bibliografia e regras de avaliação)',
    },
    disciplines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nome completo da disciplina' },
          code: { type: Type.STRING, description: 'Código da disciplina (se constar)' },
          semester: { type: Type.STRING, description: 'Semestre (ex: 2025/1 ou 3º semestre)' },
          professor: { type: Type.STRING, description: 'Nome do professor(a) se constar' },
          workloadHours: { type: Type.NUMBER, description: 'Carga horária em horas (ex: 80)' },
          syllabus: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Tópicos da ementa ou unidades de ensino extraídos do documento',
          },
          objectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Objetivos da disciplina se constarem',
          },
          bibliography: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Bibliografia básica e complementar se constarem',
          },
          evaluationCriteria: {
            type: Type.STRING,
            description: 'Fórmula de nota, pesos de provas/trabalhos se constarem',
          },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayOfWeek: {
                  type: Type.INTEGER,
                  description: '0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado',
                },
                startTime: { type: Type.STRING, description: 'Horário de início HH:mm (ex: 19:15)' },
                endTime: { type: Type.STRING, description: 'Horário de término HH:mm (ex: 22:00)' },
                location: { type: Type.STRING, description: 'Sala, laboratório ou link' },
              },
              required: ['dayOfWeek', 'startTime', 'endTime'],
            },
          },
          sourceExcerpt: {
            type: Type.STRING,
            description: 'Trecho literal do documento de onde os dados da disciplina foram extraídos',
          },
        },
        required: ['name', 'syllabus', 'schedule', 'sourceExcerpt'],
      },
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Título claro do evento (ex: Prova A1 - Estrutura de Dados)' },
          disciplineName: { type: Type.STRING, description: 'Nome da disciplina associada' },
          kind: {
            type: Type.STRING,
            description: 'aula | prova | trabalho | entrega | apresentacao | revisao | feriado | outro',
          },
          date: {
            type: Type.STRING,
            description:
              'Data exata YYYY-MM-DD SOMENTE se constar completa no documento. Se for relativa ou sem ano/mês claro, deixe vazio ("")',
          },
          startTime: { type: Type.STRING, description: 'HH:mm se explícito no documento' },
          endTime: { type: Type.STRING, description: 'HH:mm se explícito no documento' },
          location: { type: Type.STRING, description: 'Sala, laboratório ou ambiente virtual' },
          weight: { type: Type.STRING, description: 'Peso na nota (ex: 40%, 3,0 pontos)' },
          description: { type: Type.STRING, description: 'Descrição e orientações sobre o evento' },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Tópicos cobrados na prova/entrega',
          },
          confidence: {
            type: Type.STRING,
            description: 'alta (data/hora explícita), media (data clara sem hora), baixa (data incompleta ou relativa)',
          },
          needsReview: {
            type: Type.BOOLEAN,
            description: 'true se a data estiver ausente, relativa ("semana 8") ou ambígua; false se YYYY-MM-DD for explícito',
          },
          sourceExcerpt: {
            type: Type.STRING,
            description: 'Trecho literal exato copiado do documento que comprova este evento',
          },
        },
        required: ['title', 'kind', 'description', 'confidence', 'needsReview', 'sourceExcerpt'],
      },
    },
  },
  required: ['docKind', 'disciplines', 'events', 'summary', 'extractedMarkdown'],
};

// --- QUIZ SCHEMA ---
export const QuizQuestionZodSchema = z.object({
  id: z.coerce.number(),
  question: z.string(),
  codeSnippet: z.string().optional(),
  options: z
    .array(
      z.object({
        key: z.enum(['A', 'B', 'C', 'D']),
        text: z.string(),
      })
    )
    .length(4),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string(),
  sourceExcerpt: z.string(),
});

export const QuizResponseZodSchema = z.object({
  title: z.string(),
  questions: z.array(QuizQuestionZodSchema).min(1),
});

export const geminiQuizResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Título descritivo do simulado' },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING, description: 'Enunciado completo e contextualizado da questão' },
          codeSnippet: {
            type: Type.STRING,
            description: 'Trecho de código, SQL ou pseudocódigo opcional (vazio se não aplicável)',
          },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING, description: 'Letra A, B, C ou D' },
                text: { type: Type.STRING, description: 'Texto da alternativa' },
              },
              required: ['key', 'text'],
            },
          },
          correctAnswer: { type: Type.STRING, description: 'Letra correta: A, B, C ou D' },
          explanation: {
            type: Type.STRING,
            description:
              'Gabarito comentado explicando por que a correta está certa e por que CADA uma das outras 3 alternativas está incorreta',
          },
          sourceExcerpt: {
            type: Type.STRING,
            description: 'Trecho ou tópico literal do documento do aluno em que a questão foi baseada',
          },
        },
        required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'sourceExcerpt'],
      },
    },
  },
  required: ['title', 'questions'],
};

// --- FLASHCARDS SCHEMA ---
export const FlashcardItemZodSchema = z.object({
  category: z.string(),
  front: z.string(),
  back: z.string(),
  hint: z.string().optional(),
  sourceExcerpt: z.string(),
});

export const FlashcardsResponseZodSchema = z.object({
  flashcards: z.array(FlashcardItemZodSchema).min(1),
});

export const geminiFlashcardsResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: 'Tópico ou unidade da disciplina' },
          front: { type: Type.STRING, description: 'Pergunta direta e objetiva na frente do cartão' },
          back: { type: Type.STRING, description: 'Resposta clara, concisa e completa no verso' },
          hint: { type: Type.STRING, description: 'Dica mnemônica curta para lembrar' },
          sourceExcerpt: { type: Type.STRING, description: 'Trecho do documento de origem que fundamenta o cartão' },
        },
        required: ['category', 'front', 'back', 'sourceExcerpt'],
      },
    },
  },
  required: ['flashcards'],
};

// --- STUDY PLAN SCHEMA ---
export const StudyBlockZodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string(),
  endTime: z.string(),
  topic: z.string(),
  technique: z.string(),
  practicalExercise: z.string(),
  dailyGoal: z.string(),
});

export const StudyPlanResponseZodSchema = z.object({
  strategySummary: z.string(),
  blocks: z.array(StudyBlockZodSchema).min(1),
  eveChecklist: z.array(z.string()).default([]),
});

export const geminiStudyPlanResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    strategySummary: {
      type: Type.STRING,
      description: 'Resumo pedagógico em Markdown explicando a estratégia de distribuição até a data da prova',
    },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Data do bloco de estudo em formato YYYY-MM-DD' },
          startTime: { type: Type.STRING, description: 'Horário de início HH:mm' },
          endTime: { type: Type.STRING, description: 'Horário de término HH:mm' },
          topic: { type: Type.STRING, description: 'Tópico real da ementa estudado neste dia' },
          technique: { type: Type.STRING, description: 'Técnica ativa (ex: Pomodoro + Feynman, Prática Deliberada)' },
          practicalExercise: { type: Type.STRING, description: 'Exercício prático concreto baseado no material' },
          dailyGoal: { type: Type.STRING, description: 'Entregável ou meta verificável do dia' },
        },
        required: ['date', 'startTime', 'endTime', 'topic', 'technique', 'practicalExercise', 'dailyGoal'],
      },
    },
    eveChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Checklist prático de revisão final para a véspera da prova',
    },
  },
  required: ['strategySummary', 'blocks', 'eveChecklist'],
};
