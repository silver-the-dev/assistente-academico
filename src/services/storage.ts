import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useState, useEffect, useCallback } from 'react';
import {
  SourceDoc,
  Discipline,
  AcademicEvent,
  StudyPlan,
  Quiz,
  Flashcard,
} from '../types/academic';

interface AcademicDBSchema extends DBSchema {
  documents: {
    key: string;
    value: SourceDoc;
  };
  disciplines: {
    key: string;
    value: Discipline;
  };
  events: {
    key: string;
    value: AcademicEvent;
  };
  studyPlans: {
    key: string;
    value: StudyPlan;
  };
  quizzes: {
    key: string;
    value: Quiz;
  };
  flashcards: {
    key: string;
    value: Flashcard;
  };
}

const DB_NAME = 'fsg_ads_academic_db';
const DB_VERSION = 1;
const STORAGE_CHANGE_EVENT = 'fsg-academic-storage-changed';

let dbPromise: Promise<IDBPDatabase<AcademicDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<AcademicDBSchema>> {
  if (!dbPromise) {
    // Limpa chave legada com mocks na primeira inicialização
    try {
      localStorage.removeItem('fsg_ads_exams');
    } catch {
      // ignore
    }

    dbPromise = openDB<AcademicDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('disciplines')) {
          db.createObjectStore('disciplines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('studyPlans')) {
          db.createObjectStore('studyPlans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('quizzes')) {
          db.createObjectStore('quizzes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function notifyStorageChanged() {
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
}

export function normalizeTextKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const storage = {
  // --- DOCUMENTS ---
  async getAllDocuments(): Promise<SourceDoc[]> {
    const db = await getDb();
    const docs = await db.getAll('documents');
    return docs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },

  async saveDocument(doc: SourceDoc): Promise<void> {
    const db = await getDb();
    await db.put('documents', doc);
    notifyStorageChanged();
  },

  async deleteDocument(docId: string, removeOrphans = true): Promise<void> {
    const db = await getDb();
    await db.delete('documents', docId);

    if (removeOrphans) {
      // Update or remove disciplines whose only sourceDocId was docId
      const allDiscs = await db.getAll('disciplines');
      for (const disc of allDiscs) {
        const remainingDocs = (disc.sourceDocIds || []).filter((id) => id !== docId);
        if (remainingDocs.length === 0) {
          await db.delete('disciplines', disc.id);
        } else {
          await db.put('disciplines', { ...disc, sourceDocIds: remainingDocs });
        }
      }

      // Remove events from this document
      const allEvents = await db.getAll('events');
      for (const ev of allEvents) {
        if (ev.source?.docId === docId) {
          await db.delete('events', ev.id);
        }
      }

      // Remove flashcards from this document
      const allCards = await db.getAll('flashcards');
      for (const card of allCards) {
        if (card.sourceDocId === docId) {
          await db.delete('flashcards', card.id);
        }
      }
    }

    notifyStorageChanged();
  },

  // --- DISCIPLINES (with intelligent deduplication by normalized name/code) ---
  async getAllDisciplines(): Promise<Discipline[]> {
    const db = await getDb();
    const list = await db.getAll('disciplines');
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },

  async upsertDisciplineWithMerge(incoming: Discipline): Promise<Discipline> {
    const db = await getDb();
    const existingList = await db.getAll('disciplines');
    const incomingNameKey = normalizeTextKey(incoming.name);
    const incomingCodeKey = incoming.code ? normalizeTextKey(incoming.code) : '';

    const match = existingList.find((d) => {
      const nameMatch = normalizeTextKey(d.name) === incomingNameKey;
      const codeMatch = incomingCodeKey && d.code && normalizeTextKey(d.code) === incomingCodeKey;
      return nameMatch || Boolean(codeMatch);
    });

    if (!match) {
      await db.put('disciplines', incoming);
      notifyStorageChanged();
      return incoming;
    }

    // Merge syllabus topics, schedules, and sourceDocIds without duplicates
    const syllabusSet = new Map<string, string>();
    for (const item of [...(match.syllabus || []), ...(incoming.syllabus || [])]) {
      const k = normalizeTextKey(item);
      if (k && !syllabusSet.has(k)) syllabusSet.set(k, item.trim());
    }

    const objectivesSet = new Map<string, string>();
    for (const item of [...(match.objectives || []), ...(incoming.objectives || [])]) {
      const k = normalizeTextKey(item);
      if (k && !objectivesSet.has(k)) objectivesSet.set(k, item.trim());
    }

    const bibSet = new Map<string, string>();
    for (const item of [...(match.bibliography || []), ...(incoming.bibliography || [])]) {
      const k = normalizeTextKey(item);
      if (k && !bibSet.has(k)) bibSet.set(k, item.trim());
    }

    const scheduleMap = new Map<string, Discipline['schedule'][number]>();
    for (const slot of [...(match.schedule || []), ...(incoming.schedule || [])]) {
      const k = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
      if (!scheduleMap.has(k)) scheduleMap.set(k, slot);
    }

    const mergedDocIds = Array.from(new Set([...(match.sourceDocIds || []), ...(incoming.sourceDocIds || [])]));

    const merged: Discipline = {
      ...match,
      code: match.code || incoming.code,
      semester: match.semester || incoming.semester,
      professor: match.professor || incoming.professor,
      workloadHours: match.workloadHours || incoming.workloadHours,
      evaluationCriteria: incoming.evaluationCriteria || match.evaluationCriteria,
      syllabus: Array.from(syllabusSet.values()),
      objectives: Array.from(objectivesSet.values()),
      bibliography: Array.from(bibSet.values()),
      schedule: Array.from(scheduleMap.values()),
      sourceDocIds: mergedDocIds,
      sourceExcerpt: incoming.sourceExcerpt || match.sourceExcerpt,
    };

    await db.put('disciplines', merged);
    notifyStorageChanged();
    return merged;
  },

  async saveDiscipline(disc: Discipline): Promise<void> {
    const db = await getDb();
    await db.put('disciplines', disc);
    notifyStorageChanged();
  },

  async deleteDiscipline(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('disciplines', id);
    notifyStorageChanged();
  },

  // --- EVENTS (with deduplication by discipline + kind + date + normalized title) ---
  async getAllEvents(): Promise<AcademicEvent[]> {
    const db = await getDb();
    const events = await db.getAll('events');
    return events.sort((a, b) => {
      if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
      const dateA = a.date || '9999-99-99';
      const dateB = b.date || '9999-99-99';
      return dateA.localeCompare(dateB);
    });
  },

  async upsertEventWithMerge(incoming: AcademicEvent): Promise<AcademicEvent> {
    const db = await getDb();
    const all = await db.getAll('events');
    const titleKey = normalizeTextKey(incoming.title);

    const duplicate = all.find((e) => {
      const sameDisc =
        (e.disciplineId && incoming.disciplineId && e.disciplineId === incoming.disciplineId) ||
        normalizeTextKey(e.disciplineName || '') === normalizeTextKey(incoming.disciplineName || '');
      const sameKind = e.kind === incoming.kind;
      const sameDate = Boolean(e.date && incoming.date && e.date === incoming.date);
      const sameTitle = normalizeTextKey(e.title) === titleKey;
      return sameDisc && sameKind && (sameDate || sameTitle);
    });

    if (duplicate) {
      const updated: AcademicEvent = {
        ...duplicate,
        ...incoming,
        id: duplicate.id,
        googleCalendarEventId: duplicate.googleCalendarEventId || incoming.googleCalendarEventId,
      };
      await db.put('events', updated);
      notifyStorageChanged();
      return updated;
    }

    await db.put('events', incoming);
    notifyStorageChanged();
    return incoming;
  },

  async saveEvent(event: AcademicEvent): Promise<void> {
    const db = await getDb();
    await db.put('events', event);
    notifyStorageChanged();
  },

  async deleteEvent(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('events', id);
    notifyStorageChanged();
  },

  // --- STUDY PLANS ---
  async getAllStudyPlans(): Promise<StudyPlan[]> {
    const db = await getDb();
    const plans = await db.getAll('studyPlans');
    return plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async saveStudyPlan(plan: StudyPlan): Promise<void> {
    const db = await getDb();
    await db.put('studyPlans', plan);
    notifyStorageChanged();
  },

  async deleteStudyPlan(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('studyPlans', id);
    notifyStorageChanged();
  },

  // --- QUIZZES ---
  async getAllQuizzes(): Promise<Quiz[]> {
    const db = await getDb();
    const list = await db.getAll('quizzes');
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async saveQuiz(quiz: Quiz): Promise<void> {
    const db = await getDb();
    await db.put('quizzes', quiz);
    notifyStorageChanged();
  },

  async deleteQuiz(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('quizzes', id);
    notifyStorageChanged();
  },

  // --- FLASHCARDS ---
  async getAllFlashcards(): Promise<Flashcard[]> {
    const db = await getDb();
    return db.getAll('flashcards');
  },

  async saveFlashcardsBatch(cards: Flashcard[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('flashcards', 'readwrite');
    for (const c of cards) {
      await tx.store.put(c);
    }
    await tx.done;
    notifyStorageChanged();
  },

  async saveFlashcard(card: Flashcard): Promise<void> {
    const db = await getDb();
    await db.put('flashcards', card);
    notifyStorageChanged();
  },

  async deleteFlashcard(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('flashcards', id);
    notifyStorageChanged();
  },

  // --- CLEAR ALL DATA ---
  async clearAllData(): Promise<void> {
    const db = await getDb();
    await Promise.all([
      db.clear('documents'),
      db.clear('disciplines'),
      db.clear('events'),
      db.clear('studyPlans'),
      db.clear('quizzes'),
      db.clear('flashcards'),
    ]);
    try {
      localStorage.removeItem('fsg_ads_exams');
    } catch {
      // ignore
    }
    notifyStorageChanged();
  },
};

// --- REACTIVE HOOKS ---
function useStoreCollection<T>(fetcher: () => Promise<T[]>): {
  data: T[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetcher();
      setData(res);
    } catch (e) {
      console.error('Erro ao ler IndexedDB:', e);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const handler = () => {
      refresh();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [refresh]);

  return { data, loading, refresh };
}

export function useDocuments() {
  return useStoreCollection(storage.getAllDocuments);
}

export function useDisciplines() {
  return useStoreCollection(storage.getAllDisciplines);
}

export function useEvents() {
  return useStoreCollection(storage.getAllEvents);
}

export function useStudyPlans() {
  return useStoreCollection(storage.getAllStudyPlans);
}

export function useQuizzes() {
  return useStoreCollection(storage.getAllQuizzes);
}

export function useFlashcards() {
  return useStoreCollection(storage.getAllFlashcards);
}
