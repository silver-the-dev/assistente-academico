import { TeamMember, Subject, ExamEvent, Flashcard, PromptVersion, Quiz } from '../types/academic';

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'davi',
    name: 'Davi Chidem',
    role: 'Engenharia de Prompts & Lógica de Programação',
    responsibilities: [
      'Desenvolvimento e validação dos prompts de uso (v1, v2, v3)',
      'Levantamento dos materiais das 5 matérias de Programação e Frontend',
      'Testes de robustez contra alucinações de sintaxe de código',
    ],
    subjectsCount: 5,
  },
  {
    id: 'guilherme',
    name: 'Guilherme Matte',
    role: 'Integração Google Agenda & Bancos de Dados',
    responsibilities: [
      'Estruturação da integração com Google Agenda, geração de links e .ics',
      'Elaboração dos scripts de automação via Google Apps Script',
      'Curadoria dos materiais de Bancos de Dados, Redes e Cibersegurança',
    ],
    subjectsCount: 5,
  },
  {
    id: 'joao',
    name: 'João',
    role: 'Instruções do Sistema & Apresentação Executiva',
    responsibilities: [
      'Definição das System Instructions e persona do Tutor ADS',
      'Alimentação da base de conhecimento com ementas de DevOps, IA e Qualidade',
      'Montagem do relatório acadêmico e apresentação final do projeto',
    ],
    subjectsCount: 5,
  },
];

export const SUBJECTS: Subject[] = [
  // --- Davi Chidem (5 matérias) ---
  {
    id: 'algoritmos',
    name: 'Algoritmos e Lógica de Programação',
    code: 'ADS-101',
    semester: 1,
    responsible: 'Davi Chidem',
    workload: '80h',
    description: 'Fundamentos de computação, raciocínio lógico, variáveis, estruturas condicionais e de repetição, vetores e matrizes.',
    topics: [
      'Tipos primitivos e operadores aritméticos/lógicos',
      'Estruturas condicionais (if, else if, else, switch-case)',
      'Estruturas de repetição (for, while, do-while)',
      'Vetores (arrays unidimensionais) e Matrizes',
      'Modularização, parâmetros e escopo de funções',
    ],
    keyTerms: ['Algoritmo', 'Pseudocódigo', 'Condicional', 'Laço', 'Vetor', 'Matriz', 'Função'],
    sampleQuestions: [
      'Qual a diferença entre o laço while e o do-while?',
      'Como funciona a busca linear em um vetor de inteiros?',
      'Explique o conceito de passagem de parâmetro por valor e por referência.',
    ],
  },
  {
    id: 'estrutura-dados',
    name: 'Estrutura de Dados',
    code: 'ADS-102',
    semester: 2,
    responsible: 'Davi Chidem',
    workload: '80h',
    description: 'Organização e manipulação eficiente de dados em memória. Análise assintótica de algoritmos (Big-O).',
    topics: [
      'Complexidade de algoritmos: Notação Big-O (tempo e espaço)',
      'Pilhas (LIFO - Last In, First Out)',
      'Filas (FIFO - First In, First Out)',
      'Listas Simplesmente e Duplamente Encadeadas',
      'Árvores Binárias de Busca (BST) e Grafos',
      'Algoritmos de ordenação (Bubble, Insertion, QuickSort, MergeSort)',
    ],
    keyTerms: ['Big-O', 'Pilha (Stack)', 'Fila (Queue)', 'Lista Encadeada', 'Árvore Binária', 'QuickSort'],
    sampleQuestions: [
      'Qual a complexidade de tempo de busca em uma árvore binária balanceada vs desbalanceada?',
      'Em que situações uma lista encadeada é mais eficiente que um vetor estático?',
      'Como funciona o algoritmo de ordenação QuickSort com pivô?',
    ],
  },
  {
    id: 'poo',
    name: 'Programação Orientada a Objetos (POO)',
    code: 'ADS-201',
    semester: 2,
    responsible: 'Davi Chidem',
    workload: '80h',
    description: 'Paradigma orientado a objetos, modelagem de classes, encapsulamento, herança, polimorfismo, interfaces e princípios SOLID.',
    topics: [
      'Classes, objetos, atributos e métodos',
      'Encapsulamento e modificadores de acesso (public, private, protected)',
      'Herança e reutilização de código',
      'Polimorfismo (sobrecarga e sobreposição de métodos)',
      'Classes abstratas e Interfaces',
      'Introdução aos princípios SOLID',
    ],
    keyTerms: ['Classe', 'Objeto', 'Encapsulamento', 'Herança', 'Polimorfismo', 'Interface', 'SOLID'],
    sampleQuestions: [
      'Explique a diferença entre herança e composição com exemplos práticos.',
      'O que é polimorfismo em tempo de execução vs tempo de compilação?',
      'Para que serve uma interface e quando usá-la em vez de uma classe abstrata?',
    ],
  },
  {
    id: 'web-front',
    name: 'Desenvolvimento Web Frontend',
    code: 'ADS-202',
    semester: 3,
    responsible: 'Davi Chidem',
    workload: '80h',
    description: 'Construção de interfaces ricas e responsivas. HTML5, CSS moderno, JavaScript ES6+ e introdução a bibliotecas de componentes (React).',
    topics: [
      'HTML5 semântico e acessibilidade básica',
      'CSS3 moderno: Flexbox, CSS Grid e design responsivo (Mobile First)',
      'JavaScript ES6+: arrow functions, destructuring, promises e async/await',
      'Manipulação de DOM e eventos',
      'Componentização com React: Hooks (useState, useEffect) e props',
      'Consumo de APIs REST usando fetch e axios',
    ],
    keyTerms: ['DOM', 'Flexbox', 'CSS Grid', 'Promises', 'Async/Await', 'React', 'Hooks', 'REST API'],
    sampleQuestions: [
      'Como o useEffect no React gerencia o ciclo de vida e dependências?',
      'Qual a diferença entre display: flex e display: grid na prática?',
      'O que é o Virtual DOM e como ele otimiza renderizações?',
    ],
  },
  {
    id: 'web-back',
    name: 'Desenvolvimento Web Backend',
    code: 'ADS-301',
    semester: 3,
    responsible: 'Davi Chidem',
    workload: '80h',
    description: 'Arquitetura de servidores, APIs RESTful, Node.js, Express, middlewares, autenticação JWT e integração com bancos de dados.',
    topics: [
      'Arquitetura Cliente-Servidor e protocolo HTTP/HTTPS',
      'Criação de APIs REST com Node.js e Express',
      'Padrão arquitetural MVC (Model-View-Controller)',
      'Middlewares, tratamento centralizado de erros e validação de dados',
      'Autenticação e autorização com Tokens JWT (JSON Web Tokens)',
      'Status codes HTTP (200, 201, 400, 401, 403, 404, 500)',
    ],
    keyTerms: ['Node.js', 'Express', 'API REST', 'Middleware', 'JWT', 'HTTP Status Codes', 'MVC'],
    sampleQuestions: [
      'Qual a diferença entre os status HTTP 401 Unauthorized e 403 Forbidden?',
      'Como funciona o fluxo de autenticação com access token JWT e refresh token?',
      'O que faz a função next() em um middleware do Express?',
    ],
  },

  // --- Guilherme Matte (5 matérias) ---
  {
    id: 'banco-dados-relacional',
    name: 'Modelagem e Banco de Dados Relacional',
    code: 'ADS-103',
    semester: 2,
    responsible: 'Guilherme Matte',
    workload: '80h',
    description: 'Projeto conceitual, lógico e físico de bancos de dados. Álgebra relacional, normalização e linguagem SQL.',
    topics: [
      'Modelo Entidade-Relacionamento (MER) e Diagrama ER (DER)',
      'Chaves primárias (PK), estrangeiras (FK) e integridade referencial',
      'Normalização de dados (1FN, 2FN, 3FN)',
      'Linguagem SQL: DDL (CREATE, ALTER, DROP) e DML (INSERT, UPDATE, DELETE)',
      'Consultas complexas: SELECT, WHERE, JOINs (INNER, LEFT, RIGHT), GROUP BY, HAVING',
      'Transações e propriedades ACID (Atomicidade, Consistência, Isolamento, Durabilidade)',
    ],
    keyTerms: ['MER', 'DER', 'Chave Primária', 'Chave Estrangeira', '1FN 2FN 3FN', 'JOIN', 'ACID', 'SQL'],
    sampleQuestions: [
      'O que caracteriza uma tabela na Terceira Forma Normal (3FN)?',
      'Explique as 4 propriedades ACID de uma transação bancária.',
      'Qual a diferença de resultado entre um INNER JOIN e um LEFT JOIN?',
    ],
  },
  {
    id: 'banco-dados-nosql',
    name: 'Bancos de Dados NoSQL e Big Data',
    code: 'ADS-302',
    semester: 4,
    responsible: 'Guilherme Matte',
    workload: '60h',
    description: 'Bancos de dados não-relacionais, teorema CAP, modelos chave-valor, documentos, colunares e grafos. Fundamentos de Big Data.',
    topics: [
      'Limitações dos bancos relacionais e ascensão do NoSQL',
      'O Teorema CAP (Consistência, Disponibilidade, Tolerância a Particionamento)',
      'Banco de Documentos: MongoDB (BSON, Coleções, Queries e Agregações)',
      'Banco Chave-Valor e Cache em Memória: Redis',
      'Bancos de Grafos (Neo4j) e Colunares (Cassandra)',
      'Conceitos de Big Data: Volume, Velocidade, Variedade e Veracidade',
    ],
    keyTerms: ['NoSQL', 'Teorema CAP', 'MongoDB', 'Documentos', 'Redis', 'Big Data', 'BSON'],
    sampleQuestions: [
      'Como o Teorema CAP orienta a escolha entre MongoDB e PostgreSQL?',
      'Quando vale a pena utilizar o Redis como cache na frente do banco relacional?',
      'Como funciona o pipeline de agregação ($match, $group) no MongoDB?',
    ],
  },
  {
    id: 'engenharia-software',
    name: 'Engenharia de Software e Metodologias Ágeis',
    code: 'ADS-203',
    semester: 3,
    responsible: 'Guilherme Matte',
    workload: '80h',
    description: 'Ciclos de vida de software, engenharia de requisitos funcionais/não-funcionais, modelagem UML, Scrum e Kanban.',
    topics: [
      'Ciclos de vida: Cascata vs Métodos Ágeis (Manifesto Ágil)',
      'Framework Scrum: Papéis (PO, Scrum Master, Devs), Sprints, Dailies e Retrospectivas',
      'Kanban: fluxo contínuo, limites de WIP (Work in Progress)',
      'Elicitação e documentação de requisitos funcionais e não-funcionais',
      'Escrita de User Stories com critérios de aceitação (INVEST e Gherkin)',
      'Diagramas UML principais: Casos de Uso, Classes e Sequência',
    ],
    keyTerms: ['Scrum', 'Sprint', 'Kanban', 'WIP', 'User Story', 'UML', 'Requisitos'],
    sampleQuestions: [
      'Quais são os 4 valores fundamentais do Manifesto Ágil?',
      'Como diferenciar um requisito funcional de um requisito não-funcional?',
      'Qual a função da reunião de Retrospectiva da Sprint no Scrum?',
    ],
  },
  {
    id: 'arquitetura-redes',
    name: 'Arquitetura de Computadores e Redes',
    code: 'ADS-104',
    semester: 1,
    responsible: 'Guilherme Matte',
    workload: '80h',
    description: 'Organização básica de hardware, CPU, hierarquia de memória, Modelo OSI, pilha TCP/IP, endereçamento IPv4/IPv6 e serviços de rede.',
    topics: [
      'Arquitetura de Von Neumann: CPU, registradores, barramentos e memória',
      'Hierarquia de memória (registradores, cache L1/L2/L3, RAM, armazenamento secundário)',
      'Modelo de referência OSI (7 camadas) e Pilha TCP/IP (4 camadas)',
      'Protocolos da camada de aplicação: HTTP, HTTPS, DNS, DHCP, SSH',
      'Camada de transporte: TCP (confiável, orientado a conexão) vs UDP (rápido, sem conexão)',
      'Endereçamento IP, máscaras de sub-rede e conceitos de roteamento',
    ],
    keyTerms: ['Von Neumann', 'Cache', 'Modelo OSI', 'TCP/IP', 'TCP vs UDP', 'DNS', 'IPv4'],
    sampleQuestions: [
      'Por que serviços de streaming de voz ou jogos preferem UDP em vez de TCP?',
      'Como o protocolo DNS resolve um domínio para um endereço IP?',
      'Qual a relação entre as camadas do modelo OSI e a pilha TCP/IP?',
    ],
  },
  {
    id: 'seguranca-info',
    name: 'Segurança da Informação e Cibersegurança',
    code: 'ADS-303',
    semester: 4,
    responsible: 'Guilherme Matte',
    workload: '60h',
    description: 'Fundamentos de segurança, triângulo CIA, vulnerabilidades web (OWASP Top 10), criptografia, hashing e LGPD.',
    topics: [
      'Princípios de Segurança da Informação: Tríade CIA (Confidencialidade, Integridade, Disponibilidade)',
      'OWASP Top 10: SQL Injection, Cross-Site Scripting (XSS), Broken Authentication',
      'Criptografia simétrica (AES) vs assimétrica (RSA) e Certificados SSL/TLS',
      'Funções de resumo criptográfico (Hash): SHA-256 e algoritmos de derivação (bcrypt, Argon2)',
      'Autenticação multifator (MFA) e princípio do menor privilégio',
      'Noções fundamentais da LGPD (Lei Geral de Proteção de Dados)',
    ],
    keyTerms: ['Tríade CIA', 'OWASP Top 10', 'SQL Injection', 'XSS', 'Criptografia', 'Hash', 'LGPD'],
    sampleQuestions: [
      'Como se previne ataques de SQL Injection no código da aplicação?',
      'Por que senhas de usuários nunca devem ser armazenadas em texto puro ou com MD5?',
      'Qual a diferença entre autenticação (quem você é) e autorização (o que você pode fazer)?',
    ],
  },

  // --- João (5 matérias) ---
  {
    id: 'devops-cloud',
    name: 'DevOps, CI/CD e Computação em Nuvem',
    code: 'ADS-401',
    semester: 4,
    responsible: 'João',
    workload: '80h',
    description: 'Cultura DevOps, virtualização e contêineres Docker, esteiras de Integração e Entrega Contínua (CI/CD) e serviços de Cloud Computing.',
    topics: [
      'Cultura DevOps: quebrando silos entre desenvolvimento e operação',
      'Contêineres com Docker: Dockerfile, imagens, volumes e docker-compose',
      'Pipelines de CI/CD: automação de testes, build e deploy contínuo (GitHub Actions)',
      'Modelos de nuvem: IaaS, PaaS, SaaS e Serverless',
      'Introdução aos principais provedores (Google Cloud Platform, AWS, Azure)',
      'Monitoramento, observabilidade e logs de aplicação',
    ],
    keyTerms: ['DevOps', 'Docker', 'Dockerfile', 'CI/CD', 'GitHub Actions', 'Cloud (IaaS/PaaS)', 'Serverless'],
    sampleQuestions: [
      'Qual a diferença entre uma máquina virtual tradicional e um contêiner Docker?',
      'Quais são os passos essenciais em um pipeline de CI/CD para deploy seguro?',
      'Quando compensa utilizar uma arquitetura Serverless (como Cloud Functions)?',
    ],
  },
  {
    id: 'ia-ml',
    name: 'Inteligência Artificial e Machine Learning',
    code: 'ADS-402',
    semester: 5,
    responsible: 'João',
    workload: '80h',
    description: 'Introdução à inteligência artificial, tipos de aprendizado de máquina, redes neurais, modelos generativos (LLMs) e engenharia de prompt.',
    topics: [
      'História e evolução da IA: sistemas especialistas até modelos fundacionais',
      'Aprendizado Supervisionado, Não-Supervisionado e por Reforço',
      'Redes Neurais Artificiais e Deep Learning básico',
      'Modelos de Linguagem de Grande Escala (LLMs) e Arquitetura Transformer',
      'Engenharia de Prompt: zero-shot, few-shot, chain-of-thought e RAG',
      'Ética em IA, viés algorítmico e boas práticas de uso de APIs generativas (Google AI Studio/Gemini)',
    ],
    keyTerms: ['Machine Learning', 'Deep Learning', 'LLM', 'Engenharia de Prompt', 'RAG', 'Google AI Studio'],
    sampleQuestions: [
      'Qual a diferença entre aprendizado supervisionado e aprendizado não-supervisionado?',
      'Como a técnica de Chain-of-Thought (Cadeia de Raciocínio) aprimora respostas de LLMs?',
      'O que é Retrieval-Augmented Generation (RAG) e qual seu benefício contra alucinações?',
    ],
  },
  {
    id: 'testes-qualidade',
    name: 'Testes e Qualidade de Software',
    code: 'ADS-304',
    semester: 3,
    responsible: 'João',
    workload: '60h',
    description: 'Estratégias de garantia de qualidade (QA), pirâmide de testes, testes unitários, de integração e ponta a ponta (E2E), TDD.',
    topics: [
      'A Pirâmide de Testes (Unitários, Integração e E2E)',
      'Desenvolvimento Orientado a Testes (TDD: Red-Green-Refactor)',
      'Frameworks de testes modernos em JS/TS (Jest, Vitest) e asserções',
      'Mocks, Stubs e Spies para isolamento de dependências externas',
      'Métricas de qualidade: Cobertura de código (Code Coverage) e Débito Técnico',
      'Testes estáticos: Linters (ESLint) e tipagem estática (TypeScript)',
    ],
    keyTerms: ['Pirâmide de Testes', 'TDD', 'Teste Unitário', 'Mock', 'Cobertura de Código', 'Vitest'],
    sampleQuestions: [
      'Explique as etapas do ciclo TDD: Red, Green e Refactor.',
      'Por que a pirâmide de testes recomenda mais testes unitários do que testes de ponta a ponta (E2E)?',
      'Qual o papel de um Mock em um teste de integração de pagamento?',
    ],
  },
  {
    id: 'ihc-ux',
    name: 'Interface Humano-Computador (IHC) e UX/UI',
    code: 'ADS-204',
    semester: 2,
    responsible: 'João',
    workload: '60h',
    description: 'Ergonomia de software, experiência do usuário (UX), design de interfaces (UI), Heurísticas de Nielsen, acessibilidade e prototipação.',
    topics: [
      'Conceitos de UX (User Experience) vs UI (User Interface)',
      'As 10 Heurísticas de Usabilidade de Jakob Nielsen',
      'Diretrizes de Acessibilidade para Conteúdo Web (WCAG)',
      'Fluxos de usuário (User Flow), Wireframes e Protótipos de alta fidelidade',
      'Design Systems, consistência visual, hierarquia tipográfica e contraste de cores',
      'Testes de usabilidade com usuários reais e métricas (SUS - System Usability Scale)',
    ],
    keyTerms: ['UX/UI', 'Heurísticas de Nielsen', 'Acessibilidade WCAG', 'Wireframe', 'Design System', 'Usabilidade'],
    sampleQuestions: [
      'Cite e explique 3 das 10 heurísticas de usabilidade de Jakob Nielsen.',
      'Como garantir um contraste de cor adequado para atender aos critérios da WCAG AA?',
      'O que é um Design System e qual o benefício para times de desenvolvimento?',
    ],
  },
  {
    id: 'gestao-projetos',
    name: 'Gestão de Projetos de TI e Empreendedorismo',
    code: 'ADS-403',
    semester: 5,
    responsible: 'João',
    workload: '60h',
    description: 'Planejamento e governança de projetos tecnológicos, MVP, Business Model Canvas, viabilidade e apresentação de projetos (Pitch).',
    topics: [
      'Fundamentos de projetos: escopo, tempo, custo e qualidade (Triângulo de Ferro)',
      'Metodologias tradicionais (PMBOK) vs abordagens enxutas (Lean Startup)',
      'Construção de Produto Mínimo Viável (MVP) e validação de hipóteses de mercado',
      'Business Model Canvas: proposta de valor, segmentos de clientes e fontes de receita',
      'Gestão de riscos técnicos e de cronograma em projetos de software',
      'Estruturação de pitch de apresentação executiva e relatório técnico',
    ],
    keyTerms: ['Gestão de Projetos', 'Lean Startup', 'MVP', 'Business Model Canvas', 'Gestão de Riscos', 'Pitch'],
    sampleQuestions: [
      'O que define um MVP (Produto Mínimo Viável) e como validar hipóteses com ele?',
      'Como equilibrar escopo, prazo e custo quando um imprevisto técnico ocorre?',
      'Quais são os 9 blocos do Business Model Canvas essenciais para uma solução digital?',
    ],
  },
];

export const INITIAL_EXAMS: ExamEvent[] = [
  {
    id: 'exam-1',
    title: 'Prova A1 de Banco de Dados Relacional',
    subjectId: 'banco-dados-relacional',
    subjectName: 'Modelagem e Banco de Dados Relacional',
    type: 'Prova A1',
    date: '2026-11-20',
    time: '19:15',
    location: 'FSG Prédio Central - Lab 402',
    weight: '40% da nota do semestre',
    description: 'Conteúdo: Modelo Entidade-Relacionamento, Álgebra Relacional, 1FN/2FN/3FN, DDL e consultas SQL com JOINs.',
    completed: false,
  },
  {
    id: 'exam-2',
    title: 'Avaliação Prática de Lógica e Algoritmos',
    subjectId: 'algoritmos',
    subjectName: 'Algoritmos e Lógica de Programação',
    type: 'Prova A1',
    date: '2026-11-25',
    time: '20:45',
    location: 'FSG Prédio de Tecnologia - Lab 301',
    weight: '30% da nota',
    description: 'Estruturas de repetição, matrizes bidimensionais e funções com vetores.',
    completed: false,
  },
  {
    id: 'exam-3',
    title: 'Entrega do Projeto Integrador: API Backend MVC',
    subjectId: 'web-back',
    subjectName: 'Desenvolvimento Web Backend',
    type: 'Projeto Integrador',
    date: '2026-12-02',
    time: '23:59',
    location: 'Portal AVA FSG / GitHub Classroom',
    weight: '50% da nota',
    description: 'Entrega de repositório com autenticação JWT, documentação Swagger e testes unitários.',
    completed: false,
  },
  {
    id: 'exam-4',
    title: 'Prova A2 de Programação Orientada a Objetos',
    subjectId: 'poo',
    subjectName: 'Programação Orientada a Objetos (POO)',
    type: 'Prova A2',
    date: '2026-12-08',
    time: '19:15',
    location: 'FSG Auditório 2 / Lab 405',
    weight: '50% da nota',
    description: 'Polimorfismo, interfaces, tratamento de exceções e refatoração com princípios SOLID.',
    completed: false,
  },
  {
    id: 'exam-5',
    title: 'Simulado Geral & Prova Substitutiva',
    subjectId: 'engenharia-software',
    subjectName: 'Engenharia de Software e Metodologias Ágeis',
    type: 'Substitutiva',
    date: '2026-12-15',
    time: '19:15',
    location: 'FSG Sala 312',
    weight: 'Substituição de A1/A2',
    description: 'Scrum, métricas de qualidade, User Stories e diagramas UML de classes.',
    completed: false,
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subjectId: 'banco-dados-relacional',
    category: 'SQL & Normalização',
    front: 'O que define a 3ª Forma Normal (3FN)?',
    back: 'Uma tabela está na 3FN se estiver na 2FN e NÃO possuir dependências transitivas, ou seja, nenhum atributo não-chave pode depender de outro atributo não-chave.',
    hint: 'Lembre-se: "A chave, toda a chave, e nada além da chave".',
  },
  {
    id: 'fc-2',
    subjectId: 'banco-dados-relacional',
    category: 'Transações',
    front: 'Quais são as 4 propriedades ACID em Bancos de Dados?',
    back: 'Atomicidade (tudo ou nada), Consistência (regras e restrições respeitadas), Isolamento (transações concorrentes não interferem entre si) e Durabilidade (dados persistem após o commit).',
    hint: 'A - C - I - D',
  },
  {
    id: 'fc-3',
    subjectId: 'poo',
    category: 'Conceitos Fundamentais',
    front: 'Qual a diferença crucial entre Herança e Polimorfismo?',
    back: 'Herança é o mecanismo de reutilização onde uma classe filha herda atributos e comportamentos da classe mãe. Polimorfismo é a capacidade de um mesmo método se comportar de formas diferentes conforme o objeto concreto.',
    hint: 'Herança = "É um tipo de". Polimorfismo = "Muitas formas de executar a mesma ação".',
  },
  {
    id: 'fc-4',
    subjectId: 'algoritmos',
    category: 'Lógica',
    front: 'Qual a diferença entre passar um parâmetro por Valor vs por Referência?',
    back: 'Por Valor: uma cópia do dado é passada, alterações dentro da função não afetam a variável original. Por Referência: o endereço de memória é compartilhado, alterações afetam diretamente a variável original.',
    hint: 'Cópia vs Ponteiro/Endereço.',
  },
  {
    id: 'fc-5',
    subjectId: 'estrutura-dados',
    category: 'Big-O',
    front: 'O que significa a complexidade de tempo O(1) e O(n)?',
    back: 'O(1) = Tempo constante: o algoritmo demora o mesmo tempo independente do tamanho da entrada (ex: acesso a vetor por índice). O(n) = Tempo linear: o tempo cresce proporcionalmente ao número de elementos (ex: busca linear em vetor).',
    hint: 'Imediato vs Varredura completa.',
  },
  {
    id: 'fc-6',
    subjectId: 'devops-cloud',
    category: 'Contêineres',
    front: 'Por que contêineres Docker são mais leves que Máquinas Virtuais (VMs)?',
    back: 'Contêineres compartilham o mesmo Kernel do sistema operacional do host e isolam apenas os processos e bibliotecas da aplicação. Já as VMs emulam hardware completo e exigem um SO convidado (Guest OS) inteiro com seu próprio kernel.',
    hint: 'Compartilha o Kernel vs SO convidado completo.',
  },
  {
    id: 'fc-7',
    subjectId: 'seguranca-info',
    category: 'Vulnerabilidades',
    front: 'Como prevenir SQL Injection em aplicações modernas?',
    back: 'Utilizando Prepared Statements (Consultas Parametrizadas) ou ORMs que separam o comando SQL dos dados de entrada do usuário, nunca concatenando strings puras em queries.',
    hint: 'Prepared Statements & consultas parametrizadas.',
  },
  {
    id: 'fc-8',
    subjectId: 'testes-qualidade',
    category: 'TDD',
    front: 'Quais são as três etapas do ciclo TDD?',
    back: '1. RED: Escreva um teste que falha antes de codificar a funcionalidade. 2. GREEN: Escreva o código mínimo necessário para fazer o teste passar. 3. REFACTOR: Limpe e melhore o design do código mantendo os testes passando.',
    hint: 'Vermelho -> Verde -> Refatorar.',
  },
];

export const INITIAL_QUIZ: Quiz = {
  title: 'Simulado Rápido de Nivelamento - ADS FSG',
  subject: 'Conceitos Fundamentais de ADS',
  questions: [
    {
      id: 1,
      question: 'Em Bancos de Dados Relacionais, qual cláusula SQL é utilizada para filtrar grupos de registros após uma agregação (GROUP BY)?',
      codeSnippet: `SELECT departamento_id, COUNT(*) as total_devs
FROM funcionarios
GROUP BY departamento_id
_____ COUNT(*) > 5;`,
      options: [
        { key: 'A', text: 'WHERE' },
        { key: 'B', text: 'HAVING' },
        { key: 'C', text: 'FILTER' },
        { key: 'D', text: 'ORDER BY' },
      ],
      correctAnswer: 'B',
      explanation: 'A cláusula HAVING é aplicada para filtrar grupos criados pela cláusula GROUP BY (baseado em funções agregadas como COUNT, SUM, AVG). A cláusula WHERE só filtra linhas individuais antes do agrupamento.',
    },
    {
      id: 2,
      question: 'No paradigma de Programação Orientada a Objetos, qual princípio do SOLID orienta que "entidades de software devem estar abertas para extensão, mas fechadas para modificação"?',
      options: [
        { key: 'A', text: 'Single Responsibility Principle (SRP)' },
        { key: 'B', text: 'Open/Closed Principle (OCP)' },
        { key: 'C', text: 'Liskov Substitution Principle (LSP)' },
        { key: 'D', text: 'Dependency Inversion Principle (DIP)' },
      ],
      correctAnswer: 'B',
      explanation: 'O Princípio Aberto/Fechado (OCP - Open/Closed Principle) preconiza que o comportamento de um módulo pode ser estendido sem alterar seu código-fonte original, comumente usando abstrações, herança ou interfaces.',
    },
    {
      id: 3,
      question: 'Em algoritmos e estruturas de dados, qual é a estrutura do tipo LIFO (Last-In, First-Out) onde o último elemento adicionado é o primeiro a ser retirado?',
      options: [
        { key: 'A', text: 'Fila (Queue)' },
        { key: 'B', text: 'Pilha (Stack)' },
        { key: 'C', text: 'Árvore AVL' },
        { key: 'D', text: 'Tabela Hash' },
      ],
      correctAnswer: 'B',
      explanation: 'A Pilha (Stack) opera sob a regra LIFO (o último que entra é o primeiro que sai), com operações push() para empilhar e pop() para desempilhar. Já a Fila opera como FIFO (First-In, First-Out).',
    },
    {
      id: 4,
      question: 'Em desenvolvimento de APIs REST, qual é o status code HTTP adequado para indicar que um novo recurso foi criado com sucesso no servidor?',
      options: [
        { key: 'A', text: '200 OK' },
        { key: 'B', text: '201 Created' },
        { key: 'C', text: '204 No Content' },
        { key: 'D', text: '302 Found' },
      ],
      correctAnswer: 'B',
      explanation: 'O status code 201 Created indica que a requisição POST foi atendida com sucesso e resultou na criação efetiva de um novo recurso no servidor, frequentemente acompanhado do cabeçalho Location apontando para o recurso criado.',
    },
    {
      id: 5,
      question: 'Qual das seguintes práticas é essencial para evitar o risco de alucinação de datas de provas pelo Agente Acadêmico de IA?',
      options: [
        { key: 'A', text: 'Instruir no System Prompt para nunca inventar datas e solicitar que o aluno confirme a data real quando omitida' },
        { key: 'B', text: 'Aumentar a temperatura do modelo para deixá-lo mais criativo' },
        { key: 'C', text: 'Deixar o agente adivinhar a data com base no ano atual sem restrições' },
        { key: 'D', text: 'Desativar o contexto da faculdade no prompt' },
      ],
      correctAnswer: 'A',
      explanation: 'A regra número 1 especificada no plano de ação é instruir explicitamente o modelo a não inventar datas e perguntar educadamente quando faltar a informação exata da prova ou do calendário.',
    },
  ],
};

export const PROMPT_VERSIONS: PromptVersion[] = [
  {
    id: 'pv-study-plan',
    category: 'Cronograma',
    title: 'Geração de Plano de Estudos em Tabela',
    versions: [
      {
        version: 'v1',
        date: '2026-10-15',
        promptText: 'Faça um cronograma de estudos para minha prova de Banco de Dados que é dia 20/11.',
        targetOutput: 'Texto corrido com dicas soltas de estudo.',
        improvements: [
          'Tentativa inicial básica.',
          'Problema: Resposta genérica sem tabela, sem divisão de horas diárias e sem divisão de tópicos de ADS.',
        ],
        status: 'Básico',
      },
      {
        version: 'v2',
        date: '2026-10-28',
        promptText: 'Você é tutor de ADS da FSG. Tenho prova de Banco de Dados dia 20/11 e posso estudar 2h por dia. Monte um plano de estudos em formato de tabela com tópicos de normalização e SQL.',
        targetOutput: 'Tabela simples com dias da semana e matérias.',
        improvements: [
          'Adição do papel do tutor FSG.',
          'Formato exigido em tabela com carga horária definida.',
          'Problema: Não especificava técnicas de estudo ativas (Pomodoro, simulados) nem checklist pré-prova.',
        ],
        status: 'Melhorado',
      },
      {
        version: 'v3',
        date: '2026-11-05',
        promptText: `Atue como Tutor Especialista do curso de ADS da FSG. O aluno informará:
- Disciplina: [Nome da matéria da ementa]
- Data da Prova: [DD/MM/AAAA]
- Horas diárias disponíveis: [X horas]
- Maiores dificuldades: [Tópicos específicos]

Regras Rígidas:
1. Nunca invente datas. Se não foi fornecida, pergunte antes de prosseguir.
2. Monte uma Tabela Markdown contendo: | Dia / Data | Tópico da Ementa | Técnica de Estudo Ativa | Exercício Prático | Meta do Dia |
3. Inclua checklist de véspera de prova e lembrete explícito para cadastrar no Google Agenda com antecedência de 7, 3 e 1 dia.`,
        targetOutput: 'Tabela detalhada, técnicas pedagógicas validadas (Pomodoro, Feynman, exercícios práticos) e sincronização com Google Agenda.',
        improvements: [
          'Proteção contra alucinação de datas implementada.',
          'Colunas padronizadas com técnica e exercício prático de programação.',
          'Integração direta instruída com Google Agenda para notificações.',
        ],
        status: 'Otimizado para Produção',
      },
    ],
  },
  {
    id: 'pv-quiz',
    category: 'Simulado',
    title: 'Geração de Simulado com Gabarito Comentado',
    versions: [
      {
        version: 'v1',
        date: '2026-10-18',
        promptText: 'Crie 5 perguntas sobre lógica de programação com respostas.',
        targetOutput: '5 perguntas simples com respostas no final.',
        improvements: [
          'Muito simples, alternativas óbvias e sem justificativa técnica.',
        ],
        status: 'Básico',
      },
      {
        version: 'v2',
        date: '2026-10-30',
        promptText: 'Crie 5 questões de múltipla escolha (A, B, C, D) para alunos de ADS da FSG sobre lógica de programação, com gabarito no final.',
        targetOutput: 'Questões de múltipla escolha com gabarito simples (ex: 1-A, 2-C).',
        improvements: [
          'Adicionado formato de 4 alternativas e foco em alunos de ADS.',
          'Problema: Faltava gabarito comentado explicando o erro das outras opções.',
        ],
        status: 'Melhorado',
      },
      {
        version: 'v3',
        date: '2026-11-08',
        promptText: `Gere um simulado acadêmico rigoroso para alunos de ADS da FSG.
Matéria: [Disciplina de ADS]
Nível: [Fácil | Médio | Avançado]
Total de questões: [N]

Formato obrigatório em JSON estruturado com:
- question: Enunciado contextualizado com cenário real de desenvolvimento.
- codeSnippet: Código ou comando SQL representativo.
- options: 4 opções (A, B, C, D) com distratores verossímeis.
- correctAnswer: Letra correta.
- explanation: Gabarito comentado explicando ponto a ponto por que a correta está certa e os erros conceituais das alternativas incorretas.`,
        targetOutput: 'Simulado interativo consumível pelo frontend com pontuação em tempo real e feedback imediato por questão.',
        improvements: [
          'Schema JSON estrito para renderização interativa na interface.',
          'Distratores verossímeis simulando pegadinhas comuns em provas de ADS.',
          'Explicação didática profunda que ensina enquanto o aluno responde.',
        ],
        status: 'Otimizado para Produção',
      },
    ],
  },
  {
    id: 'pv-concept',
    category: 'Estudo',
    title: 'Explicação Didática de Conceitos Complexos',
    versions: [
      {
        version: 'v1',
        date: '2026-10-20',
        promptText: 'Explique orientação a objetos.',
        targetOutput: 'Definição acadêmica pesada copiada de livro.',
        improvements: [
          'Linguagem excessivamente formal e abstrata, pouco compreensível para calouros.',
        ],
        status: 'Básico',
      },
      {
        version: 'v2',
        date: '2026-11-01',
        promptText: 'Explique orientação a objetos de forma simples com exemplos em código.',
        targetOutput: 'Analogia com carros e um trecho de código solto.',
        improvements: [
          'Melhoria na didática, porém sem destacar erros comuns de prova e sem cobrir polimorfismo.',
        ],
        status: 'Melhorado',
      },
      {
        version: 'v3',
        date: '2026-11-09',
        promptText: `Atue como Tutor de ADS da FSG. Explique o conceito de [CONCEITO] de forma simples, instigante e precisa:
1. Analogia do dia a dia (clareza para calouros).
2. Definição técnica precisa e vocabulário correto de mercado.
3. Exemplo limpo e comentado de código em TypeScript, JavaScript, Python ou SQL.
4. Pegadinha clássica em provas da FSG ou entrevistas técnicas.
5. 1 Pergunta rápida para o aluno testar o entendimento.`,
        targetOutput: 'Explicação estruturada em 5 blocos com analogia, código limpo e aviso de pegadinhas.',
        improvements: [
          'Estrutura em 5 passos pedagógicos comprovados.',
          'Alerta proativo de pegadinhas frequentes em provas.',
          'Incentivo à prática imediata do aluno.',
        ],
        status: 'Otimizado para Produção',
      },
    ],
  },
];
