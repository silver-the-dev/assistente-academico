import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const FSG_ADS_KNOWLEDGE_BASE = `
CONTEXTO DO AGENTE:
- Nome: Agente Acadêmico ADS - FSG
- Instituição: Centro Universitário FSG (Caxias do Sul / Bento Gonçalves)
- Curso: Análise e Desenvolvimento de Sistemas (ADS)
- Desenvolvedores: Davi Chidem, Guilherme Matte e João (alunos do curso de ADS)
- Papel: Tutor de IA e assistente acadêmico para estudantes de ADS.
- Tom: Didático, encorajador, técnico e objetivo, com exemplos práticos em linguagens comuns no curso (JavaScript, TypeScript, Python, Java, C#, SQL).

DISCIPLINAS DE ADS NA BASE DE CONHECIMENTO (15 matérias organizadas pelos integrantes):
1. Davi Chidem:
   - Algoritmos e Lógica de Programação: variáveis, tipos primitivos, estruturas condicionais (if/else, switch), laços de repetição (for, while), funções, vetores e matrizes.
   - Estrutura de Dados: pilhas, filas, listas encadeadas, árvores binárias, complexidade assintótica (Notação Big-O), ordenação e busca.
   - Programação Orientada a Objetos (POO): classes, objetos, encapsulamento, herança, polimorfismo, interfaces, classes abstratas, SOLID.
   - Desenvolvimento Web Frontend: HTML5 semântico, CSS3 flexbox/grid, JavaScript moderno (ES6+), React, Tailwind, requisições fetch/axios, consumo de APIs REST.
   - Desenvolvimento Web Backend: Node.js, Express, arquitetura MVC, rotas, middleware, autenticação JWT, status codes HTTP, tratamento de exceções.

2. Guilherme Matte:
   - Modelagem e Bancos de Dados Relacionais: Modelo Entidade-Relacionamento (MER/DER), Normalização (1FN, 2FN, 3FN), DDL/DML, SQL (SELECT, JOINs, GROUP BY, subqueries, índices, transações ACID).
   - Bancos de Dados Não-Relacionais (NoSQL) & Big Data: MongoDB, Redis, bancos de documentos vs chave-valor vs grafos, conceitos de Big Data e escalabilidade horizontal.
   - Engenharia de Software e Metodologias Ágeis: Scrum (sprints, dailies, retrospectivas), Kanban, User Stories, elicitação de requisitos funcionais e não-funcionais, diagramas UML.
   - Arquitetura de Computadores e Redes: Modelo OSI e TCP/IP, protocolos (HTTP, HTTPS, DNS, TCP, UDP), endereçamento IP, roteamento, hardware e memória.
   - Segurança da Informação e Cibersegurança: Princípios CIA (Confidencialidade, Integridade, Disponibilidade), OWASP Top 10 (SQL Injection, XSS, CSRF), criptografia simétrica e assimétrica, hash (bcrypt).

3. João:
   - DevOps, CI/CD e Computação em Nuvem: Docker, contêineres, pipelines de deploy (GitHub Actions), conceitos de IaaS/PaaS, nuvem (AWS/GCP/Azure).
   - Inteligência Artificial e Machine Learning: Conceitos fundamentais de IA, aprendizado supervisionado vs não supervisionado, LLMs, engenharia de prompt, APIs generativas.
   - Testes e Qualidade de Software: Testes unitários, testes de integração, TDD (Test-Driven Development), Jest/Vitest, QA, cobertura de código.
   - Interface Humano-Computador (IHC) e UX/UI: Heurísticas de Nielsen, usabilidade, acessibilidade (WCAG), prototipação no Figma, design systems.
   - Gestão de Projetos de TI e Empreendedorismo: PMBOK vs Ágil, MVP (Minimum Viable Product), viabilidade técnica e financeira, liderança de equipes de TI.

REGRAS RÍGIDAS DE ATUAÇÃO:
1. NUNCA invente datas de provas ou trabalhos. Se o aluno não informar as datas ou a disciplina com clareza, peça amavelmente para ele fornecer a data exata ou o período.
2. Seja sempre prestativo e forneça exemplos de código limpos e comentados quando o assunto envolver programação.
3. Ao gerar cronogramas de estudo, divida o tempo de forma realista (técnica Pomodoro, exercícios práticos e revisão ativa).
4. Forneça atalhos para lembretes no Google Agenda.
`;

// Chat completion with Academic Tutor Persona
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Mensagens são obrigatórias em formato de array.' });
    }

    const conversationHistory = messages.map((m: { role: string; content: string }) => {
      return `${m.role === 'user' ? 'Aluno' : 'Tutor ADS'}: ${m.content}`;
    }).join('\n\n');

    const prompt = `
Histórico da conversa recente:
${conversationHistory}

Contexto adicional do aluno (se houver):
${JSON.stringify(userContext || {})}

Responda como o Tutor de IA da FSG ADS para o último questionamento do aluno. Mantenha a resposta com formatação rica em Markdown (títulos, listas, blocos de código com linguagem especificada, tabelas quando couber). Se for sugerir cronograma ou estudo, lembre o aluno de sincronizar no Google Agenda. Nunca invente datas se não tiver sido fornecida.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FSG_ADS_KNOWLEDGE_BASE,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Erro na rota /api/chat:', error);
    return res.status(500).json({
      error: 'Não foi possível processar a resposta do tutor no momento. Verifique sua chave de API e tente novamente.',
      details: error.message,
    });
  }
});

// Generate Study Plan (Cronograma em Tabela)
app.post('/api/study-plan', async (req: Request, res: Response) => {
  try {
    const { subject, examDate, availableHoursPerDay, difficulties, currentLevel } = req.body;

    if (!subject || !examDate) {
      return res.status(400).json({ error: 'Disciplina e data da prova são obrigatórias.' });
    }

    const prompt = `
O aluno de ADS da FSG precisa de um plano de estudos estruturado para a disciplina: "${subject}".
Data da prova: ${examDate}
Horas diárias disponíveis: ${availableHoursPerDay || 2} horas por dia
Tópicos de maior dificuldade informados: ${difficulties || 'Conceitos gerais e aplicação prática'}
Nível atual na matéria: ${currentLevel || 'Intermediário'}

Crie um cronograma completo e detalhado até a data da prova.
Estruture a resposta com:
1. Visão Geral da Estratégia de Aprovação (foco prático para ADS).
2. Tabela de Estudos em Markdown com as colunas:
   | Dia / Data | Tópico da Ementa | Técnica & Atividade | Prática / Exercício Recomendado | Meta do Dia |
3. Check-list de Revisão Rápida para o dia anterior à prova.
4. Instrução para adicionar lembretes no Google Agenda.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FSG_ADS_KNOWLEDGE_BASE,
      },
    });

    return res.json({ plan: response.text });
  } catch (error: any) {
    console.error('Erro na rota /api/study-plan:', error);
    return res.status(500).json({
      error: 'Erro ao gerar plano de estudos.',
      details: error.message,
    });
  }
});

// Generate Interactive Quiz with commented answer key (Gabarito Comentado)
app.post('/api/quiz', async (req: Request, res: Response) => {
  try {
    const { subject, topic, count = 5, difficulty = 'médio' } = req.body;

    const prompt = `
Gere um simulado acadêmico de alta qualidade para alunos de ADS da FSG sobre:
Disciplina: ${subject}
Tópico específico: ${topic || 'Tópicos essenciais da matéria'}
Quantidade de questões: ${count}
Nível de dificuldade: ${difficulty}

Cada questão deve ser de múltipla escolha com 4 alternativas (A, B, C, D), trazendo enunciado contextualizado com situações reais de desenvolvimento de software e gabarito comentado justificando por que a alternativa correta está certa e por que as outras estão erradas.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FSG_ADS_KNOWLEDGE_BASE,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  codeSnippet: { type: Type.STRING, description: 'Trecho de código ou SQL opcional, ou vazio' },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING, description: 'A, B, C ou D' },
                        text: { type: Type.STRING },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  correctAnswer: { type: Type.STRING, description: 'A, B, C ou D' },
                  explanation: { type: Type.STRING, description: 'Gabarito comentado detalhado com justificativa técnica' },
                },
                required: ['id', 'question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'subject', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na rota /api/quiz:', error);
    return res.status(500).json({
      error: 'Erro ao gerar simulado.',
      details: error.message,
    });
  }
});

// Generate Flashcards
app.post('/api/flashcards', async (req: Request, res: Response) => {
  try {
    const { subject, count = 6 } = req.body;

    const prompt = `
Gere ${count} flashcards de fixação ativa para a matéria de ADS: "${subject}".
Foque em conceitos cruciais para provas e entrevistas técnicas de estágio/júnior.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FSG_ADS_KNOWLEDGE_BASE,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: 'Pergunta ou conceito no anverso do cartão' },
              back: { type: Type.STRING, description: 'Explicação direta, didática e prática no verso' },
              category: { type: Type.STRING, description: 'Categoria ou subtema' },
              hint: { type: Type.STRING, description: 'Dica curta de memorização' },
            },
            required: ['front', 'back', 'category', 'hint'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na rota /api/flashcards:', error);
    return res.status(500).json({
      error: 'Erro ao gerar flashcards.',
      details: error.message,
    });
  }
});

// Explain Concept in simple terms
app.post('/api/explain-concept', async (req: Request, res: Response) => {
  try {
    const { concept, subject } = req.body;
    if (!concept) {
      return res.status(400).json({ error: 'Conceito não informado.' });
    }

    const prompt = `
Explique o conceito de "${concept}" da disciplina de "${subject || 'ADS'}" de forma simples e intuitiva para um estudante de tecnologia.
Use:
1. Analogia do mundo real fácil de entender.
2. Definição técnica precisa.
3. Exemplo prático de código ou sintaxe limpa.
4. Principais erros ou pegadinhas comuns em provas.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FSG_ADS_KNOWLEDGE_BASE,
      },
    });

    return res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Erro na rota /api/explain-concept:', error);
    return res.status(500).json({
      error: 'Erro ao gerar explicação.',
      details: error.message,
    });
  }
});

// Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server Agente Acadêmico ADS FSG running on http://localhost:${PORT}`);
  });
}

startServer();
