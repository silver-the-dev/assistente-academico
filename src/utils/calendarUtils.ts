import { AcademicEvent, Discipline } from '../types/academic';

export function generateGoogleCalendarTemplateUrl(event: AcademicEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const prefix =
    event.kind === 'prova'
      ? '[PROVA]'
      : event.kind === 'trabalho' || event.kind === 'entrega'
      ? '[ENTREGA]'
      : `[${event.kind.toUpperCase()}]`;
  const title = encodeURIComponent(`${prefix} ${event.title}`);

  const dateClean = (event.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  let datesParam = `${dateClean}/${dateClean}`;

  if (event.startTime && /^\d{2}:\d{2}$/.test(event.startTime)) {
    const [h, m] = event.startTime.split(':').map(Number);
    const startStr = `${dateClean}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    let endStr = `${dateClean}T${String(Math.min(23, h + 2)).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    if (event.endTime && /^\d{2}:\d{2}$/.test(event.endTime)) {
      const [eh, em] = event.endTime.split(':').map(Number);
      endStr = `${dateClean}T${String(eh).padStart(2, '0')}${String(em).padStart(2, '0')}00`;
    }
    datesParam = `${startStr}/${endStr}`;
  }

  const details = encodeURIComponent(
    [
      event.disciplineName ? `Disciplina: ${event.disciplineName}` : '',
      event.weight ? `Peso: ${event.weight}` : '',
      event.description ? `\nDescrição: ${event.description}` : '',
      event.source?.docName ? `\nFonte: ${event.source.docName}` : '',
      event.source?.excerpt ? `Trecho: "${event.source.excerpt}"` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );

  const location = encodeURIComponent(event.location || 'FSG');
  return `${baseUrl}&text=${title}&dates=${datesParam}&details=${details}&location=${location}&ctz=America/Sao_Paulo`;
}

export function generateICSContent(events: AcademicEvent[], disciplines: Discipline[] = []): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agente Academico ADS FSG//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Agente Acadêmico ADS',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const event of events) {
    if (!event.date || !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) continue;
    const dateClean = event.date.replace(/-/g, '');
    const hasTime = Boolean(event.startTime && /^\d{2}:\d{2}$/.test(event.startTime));

    let dtStartLine = `DTSTART;VALUE=DATE:${dateClean}`;
    let dtEndLine = `DTEND;VALUE=DATE:${dateClean}`;

    if (hasTime && event.startTime) {
      const [h, m] = event.startTime.split(':').map(Number);
      const startCompact = `${dateClean}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
      let endCompact = `${dateClean}T${String(Math.min(23, h + 2)).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
      if (event.endTime && /^\d{2}:\d{2}$/.test(event.endTime)) {
        const [eh, em] = event.endTime.split(':').map(Number);
        endCompact = `${dateClean}T${String(eh).padStart(2, '0')}${String(em).padStart(2, '0')}00`;
      }
      dtStartLine = `DTSTART;TZID=America/Sao_Paulo:${startCompact}`;
      dtEndLine = `DTEND;TZID=America/Sao_Paulo:${endCompact}`;
    }

    const cleanDesc = [
      event.disciplineName ? `Disciplina: ${event.disciplineName}` : '',
      event.weight ? `Peso: ${event.weight}` : '',
      event.description || '',
      event.source?.excerpt ? `Trecho original: ${event.source.excerpt}` : '',
    ]
      .filter(Boolean)
      .join('\\n')
      .replace(/\r?\n/g, '\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@ads.fsg.edu.br`,
      `DTSTAMP:${nowStamp}`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:[${event.kind.toUpperCase()}] ${event.title}`,
      `LOCATION:${event.location || 'FSG'}`,
      `DESCRIPTION:${cleanDesc}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete Acadêmico ADS - 1 dia antes',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  // Include recurring classes if disciplines have schedule slots
  for (const disc of disciplines) {
    for (let idx = 0; idx < (disc.schedule || []).length; idx++) {
      const slot = disc.schedule[idx];
      const todayIso = new Date().toISOString().split('T')[0];
      const [y, m, d] = todayIso.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const delta = (slot.dayOfWeek - dt.getUTCDay() + 7) % 7;
      dt.setUTCDate(dt.getUTCDate() + delta);
      const firstDateClean = dt.toISOString().split('T')[0].replace(/-/g, '');
      const startCompact = `${firstDateClean}T${slot.startTime.replace(':', '')}00`;
      const endCompact = `${firstDateClean}T${slot.endTime.replace(':', '')}00`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:class-${disc.id}-${idx}@ads.fsg.edu.br`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;TZID=America/Sao_Paulo:${startCompact}`,
        `DTEND;TZID=America/Sao_Paulo:${endCompact}`,
        'RRULE:FREQ=WEEKLY;COUNT=18',
        `SUMMARY:[Aula] ${disc.name}`,
        `LOCATION:${slot.location || 'FSG'}`,
        `DESCRIPTION:Aula semanal de ${disc.name}${disc.professor ? ` - Prof. ${disc.professor}` : ''}`,
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICSFile(events: AcademicEvent[], disciplines: Discipline[] = []): void {
  const content = generateICSContent(events, disciplines);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'calendario-academico-ads-fsg.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
