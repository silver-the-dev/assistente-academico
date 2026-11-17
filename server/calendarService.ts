import { Express, Request, Response } from 'express';
import { google, calendar_v3 } from 'googleapis';
import {
  DEDICATED_CALENDAR_DESCRIPTION,
  DEDICATED_CALENDAR_SUMMARY,
  TIMEZONE,
} from './config';

function getCalendarClientFromBearer(req: Request): calendar_v3.Calendar | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return null;
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

async function withBackoff<T>(fn: () => Promise<T>, retries = 3, delayMs = 600): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = (err as { code?: number; status?: number })?.code || (err as { status?: number })?.status;
    if (retries > 0 && (status === 429 || status === 500 || status === 503)) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withBackoff(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

async function ensureDedicatedCalendar(calendar: calendar_v3.Calendar): Promise<string> {
  const listRes = await withBackoff(() => calendar.calendarList.list());
  const existing = (listRes.data.items || []).find(
    (item) => item.summary === DEDICATED_CALENDAR_SUMMARY && !item.deleted
  );
  if (existing && existing.id) {
    return existing.id;
  }

  const created = await withBackoff(() =>
    calendar.calendars.insert({
      requestBody: {
        summary: DEDICATED_CALENDAR_SUMMARY,
        description: DEDICATED_CALENDAR_DESCRIPTION,
        timeZone: TIMEZONE,
      },
    })
  );

  if (!created.data.id) {
    throw new Error('Não foi possível criar o calendário secundário "Agente Acadêmico ADS".');
  }
  return created.data.id;
}

export interface SyncClassItem {
  appEventId: string;
  disciplineName: string;
  professor?: string;
  dayOfWeek: number; // 0..6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  semesterStart: string; // YYYY-MM-DD
  semesterEnd: string; // YYYY-MM-DD
  holidays?: string[]; // YYYY-MM-DD[]
}

export interface SyncSingleEventItem {
  appEventId: string;
  title: string;
  disciplineName?: string;
  kind: 'aula' | 'prova' | 'trabalho' | 'entrega' | 'apresentacao' | 'revisao' | 'feriado' | 'outro';
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  weight?: string;
  description?: string;
  topics?: string[];
  sourceDocName?: string;
  sourceExcerpt?: string;
}

function getFirstOccurrenceOnOrAfter(startDateStr: string, targetDayOfWeek: number): string {
  const [y, m, d] = startDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const currentDow = dt.getUTCDay();
  const delta = (targetDayOfWeek - currentDow + 7) % 7;
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().split('T')[0];
}

function addOneHour(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const nextH = Math.min(23, (isNaN(h) ? 19 : h) + 1);
  const nextM = isNaN(m) ? 0 : m;
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

export function registerCalendarRoutes(app: Express) {
  app.post('/api/calendar/sync', async (req: Request, res: Response) => {
    try {
      const calendar = getCalendarClientFromBearer(req);
      if (!calendar) {
        return res.status(401).json({
          error:
            'Sua conta do Google não está conectada ou o token expirou. Clique em "Entrar com o Google" para autorizar o Google Agenda.',
        });
      }

      const calendarId = await ensureDedicatedCalendar(calendar);

      const classes: SyncClassItem[] = Array.isArray(req.body?.classes) ? req.body.classes : [];
      const singleEvents: SyncSingleEventItem[] = Array.isArray(req.body?.events) ? req.body.events : [];
      const deleteAppEventIds: string[] = Array.isArray(req.body?.deleteAppEventIds)
        ? req.body.deleteAppEventIds
        : [];

      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;
      let failedCount = 0;
      const syncedResults: { appEventId: string; googleEventId: string; status: 'created' | 'updated' }[] = [];
      const errors: string[] = [];

      const upsertEvent = async (appEventId: string, requestBody: calendar_v3.Schema$Event) => {
        try {
          const searchRes = await withBackoff(() =>
            calendar.events.list({
              calendarId,
              privateExtendedProperty: [`appEventId=${appEventId}`],
              showDeleted: false,
              maxResults: 5,
            })
          );

          const existing = (searchRes.data.items || [])[0];
          if (existing && existing.id) {
            const updated = await withBackoff(() =>
              calendar.events.update({
                calendarId,
                eventId: existing.id!,
                requestBody,
              })
            );
            updatedCount++;
            syncedResults.push({
              appEventId,
              googleEventId: updated.data.id || existing.id,
              status: 'updated',
            });
          } else {
            const inserted = await withBackoff(() =>
              calendar.events.insert({
                calendarId,
                requestBody,
              })
            );
            createdCount++;
            syncedResults.push({
              appEventId,
              googleEventId: inserted.data.id || '',
              status: 'created',
            });
          }
        } catch (err: unknown) {
          failedCount++;
          errors.push(`Falha no item ${appEventId}: ${(err as Error)?.message || 'Erro na API Google'}`);
        }
      };

      const tasks: (() => Promise<void>)[] = [];

      for (const delId of deleteAppEventIds) {
        tasks.push(async () => {
          try {
            const searchRes = await withBackoff(() =>
              calendar.events.list({
                calendarId,
                privateExtendedProperty: [`appEventId=${delId}`],
                showDeleted: false,
              })
            );
            for (const item of searchRes.data.items || []) {
              if (item.id) {
                await withBackoff(() => calendar.events.delete({ calendarId, eventId: item.id! }));
                deletedCount++;
              }
            }
          } catch (err: unknown) {
            failedCount++;
            errors.push(`Erro ao remover evento ${delId}: ${(err as Error)?.message || 'Falha'}`);
          }
        });
      }

      for (const cls of classes) {
        tasks.push(async () => {
          const firstDate = getFirstOccurrenceOnOrAfter(cls.semesterStart, cls.dayOfWeek);
          const untilCompact = cls.semesterEnd.replace(/-/g, '') + 'T235959Z';
          const recurrenceRules: string[] = [`RRULE:FREQ=WEEKLY;UNTIL=${untilCompact}`];

          if (Array.isArray(cls.holidays) && cls.holidays.length > 0) {
            const startCompact = cls.startTime.replace(':', '') + '00';
            const exdates = cls.holidays
              .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
              .map((d) => `${d.replace(/-/g, '')}T${startCompact}`);
            if (exdates.length > 0) {
              recurrenceRules.push(`EXDATE;TZID=${TIMEZONE}:${exdates.join(',')}`);
            }
          }

          const eventResource: calendar_v3.Schema$Event = {
            summary: `[Aula] ${cls.disciplineName}`,
            location: cls.location || 'FSG',
            description: [
              `Disciplina: ${cls.disciplineName}`,
              cls.professor ? `Professor(a): ${cls.professor}` : '',
              'Sincronizado via Agente Acadêmico ADS - FSG',
            ]
              .filter(Boolean)
              .join('\n'),
            colorId: '9',
            start: {
              dateTime: `${firstDate}T${cls.startTime}:00`,
              timeZone: TIMEZONE,
            },
            end: {
              dateTime: `${firstDate}T${cls.endTime}:00`,
              timeZone: TIMEZONE,
            },
            recurrence: recurrenceRules,
            reminders: {
              useDefault: false,
              overrides: [{ method: 'popup', minutes: 30 }],
            },
            extendedProperties: {
              private: {
                appEventId: cls.appEventId,
              },
            },
          };

          await upsertEvent(cls.appEventId, eventResource);
        });
      }

      for (const ev of singleEvents) {
        if (!ev.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) continue;

        tasks.push(async () => {
          const isExam = ev.kind === 'prova';
          const isAssignment = ev.kind === 'trabalho' || ev.kind === 'entrega' || ev.kind === 'apresentacao';
          const isStudy = ev.kind === 'revisao';

          const prefix = isExam
            ? '[PROVA]'
            : isAssignment
            ? '[ENTREGA]'
            : isStudy
            ? '[ESTUDO]'
            : `[${ev.kind.toUpperCase()}]`;

          const colorId = isExam ? '11' : isAssignment ? '6' : isStudy ? '10' : '9';

          const reminderOverrides = isExam
            ? [
                { method: 'popup', minutes: 10080 },
                { method: 'popup', minutes: 4320 },
                { method: 'popup', minutes: 1440 },
                { method: 'popup', minutes: 120 },
              ]
            : isAssignment
            ? [
                { method: 'popup', minutes: 4320 },
                { method: 'popup', minutes: 1440 },
                { method: 'popup', minutes: 180 },
              ]
            : [{ method: 'popup', minutes: 30 }];

          const descParts = [
            ev.disciplineName ? `Disciplina: ${ev.disciplineName}` : '',
            ev.weight ? `Peso na nota: ${ev.weight}` : '',
            ev.description ? `\nDescrição:\n${ev.description}` : '',
            ev.topics && ev.topics.length > 0 ? `\nTópicos cobrados:\n- ${ev.topics.join('\n- ')}` : '',
            ev.sourceDocName ? `\nDocumento de origem: ${ev.sourceDocName}` : '',
            ev.sourceExcerpt ? `Trecho original: "${ev.sourceExcerpt}"` : '',
          ].filter(Boolean);

          const hasTime = Boolean(ev.startTime && /^\d{2}:\d{2}$/.test(ev.startTime));
          const startTime = hasTime ? ev.startTime! : undefined;
          const endTime =
            ev.endTime && /^\d{2}:\d{2}$/.test(ev.endTime)
              ? ev.endTime
              : startTime
              ? addOneHour(startTime)
              : undefined;

          const eventResource: calendar_v3.Schema$Event = {
            summary: `${prefix} ${ev.title}`,
            location: ev.location || 'FSG',
            description: descParts.join('\n'),
            colorId,
            start: startTime
              ? { dateTime: `${ev.date}T${startTime}:00`, timeZone: TIMEZONE }
              : { date: ev.date },
            end: endTime
              ? { dateTime: `${ev.date}T${endTime}:00`, timeZone: TIMEZONE }
              : { date: ev.date },
            reminders: {
              useDefault: false,
              overrides: reminderOverrides,
            },
            extendedProperties: {
              private: {
                appEventId: ev.appEventId,
              },
            },
          };

          await upsertEvent(ev.appEventId, eventResource);
        });
      }

      const concurrency = 3;
      let idx = 0;
      const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
        while (idx < tasks.length) {
          const currentIdx = idx++;
          await tasks[currentIdx]();
        }
      });
      await Promise.all(workers);

      return res.json({
        calendarId,
        calendarName: DEDICATED_CALENDAR_SUMMARY,
        createdCount,
        updatedCount,
        deletedCount,
        failedCount,
        syncedResults,
        errors,
      });
    } catch (error: unknown) {
      console.error('Erro ao sincronizar com Google Agenda:', error);
      return res.status(500).json({
        error: `Erro ao sincronizar com o Google Agenda: ${(error as Error)?.message || 'Falha inesperada'}`,
      });
    }
  });
}
