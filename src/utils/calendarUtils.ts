import { ExamEvent } from '../types/academic';

/**
 * Format date (YYYY-MM-DD) and time (HH:mm) into Google Calendar ISO format: YYYYMMDDTHHmmssZ
 */
function toCalendarDateTime(dateStr: string, timeStr: string, durationMinutes = 120): { start: string; end: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '19:15').split(':').map(Number);

  // Consider America/Sao_Paulo (UTC-3 approx)
  const startDate = new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0));
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return {
    start: format(startDate),
    end: format(endDate),
  };
}

/**
 * Create a 1-click Google Calendar URL
 */
export function createGoogleCalendarUrl(event: ExamEvent): string {
  const { start, end } = toCalendarDateTime(event.date, event.time);
  const title = encodeURIComponent(`[FSG - ADS] ${event.title}`);
  const details = encodeURIComponent(
    `📚 Disciplina: ${event.subjectName}\n` +
    `🎯 Tipo: ${event.type}\n` +
    `⚖️ Peso: ${event.weight}\n` +
    `📍 Local: ${event.location}\n\n` +
    `📝 Observações e Conteúdo:\n${event.description}\n\n` +
    `🤖 Gerado pelo Agente Acadêmico ADS - FSG (Davi Chidem, Guilherme Matte e João)`
  );
  const location = encodeURIComponent(event.location || 'FSG Centro Universitário, Caxias do Sul - RS');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * Generate iCalendar (.ics) string for one or multiple events
 */
export function generateIcsContent(events: ExamEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FSG//Agente Academico ADS//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calendario Academico ADS FSG',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  events.forEach((event) => {
    const { start, end } = toCalendarDateTime(event.date, event.time);
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const cleanDesc = (event.description || '').replace(/\n/g, '\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:fsg-ads-${event.id}-${Date.now()}@fsg.edu.br`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:[FSG ADS] ${event.title}`,
      `DESCRIPTION:Disciplina: ${event.subjectName}\\nTipo: ${event.type}\\nPeso: ${event.weight}\\nConteudo: ${cleanDesc}`,
      `LOCATION:${event.location || 'FSG Centro Universitário'}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Lembrete: ${event.title} amanha!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Lembrete: ${event.title} em 7 dias!`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger download of .ics file
 */
export function downloadIcsFile(events: ExamEvent[], filename = 'calendario-provas-ads-fsg.ics'): void {
  const content = generateIcsContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Apps Script code to create reminders in Google Calendar
 */
export function generateAppsScriptCode(events: ExamEvent[]): string {
  const eventsJson = JSON.stringify(
    events.map((e) => ({
      title: `[FSG ADS] ${e.title}`,
      date: e.date,
      time: e.time,
      location: e.location,
      description: `Disciplina: ${e.subjectName} | Tipo: ${e.type} | Conteúdo: ${e.description}`,
    })),
    null,
    2
  );

  return `/**
 * Google Apps Script - Agente Acadêmico ADS FSG
 * Projeto por Davi Chidem, Guilherme Matte e João
 * 
 * Instruções de Uso:
 * 1. Acesse https://script.google.com/ e clique em "Novo Projeto".
 * 2. Cole este código no arquivo Código.gs.
 * 3. Clique em "Salvar" e depois em "Executar" na função criarLembretesFSG.
 * 4. Autorize o acesso ao seu Google Calendar.
 * 5. Pronto! Todos os eventos e lembretes serão adicionados à sua agenda principal.
 */

function criarLembretesFSG() {
  const calendar = CalendarApp.getDefaultCalendar();
  const eventos = ${eventsJson};
  
  Logger.log('Iniciando sincronização de ' + eventos.length + ' eventos acadêmicos da FSG...');
  
  eventos.forEach(function(item) {
    const dataPartes = item.date.split('-');
    const horaPartes = item.time.split(':');
    
    const ano = parseInt(dataPartes[0]);
    const mes = parseInt(dataPartes[1]) - 1; // Mês no JS é base 0
    const dia = parseInt(dataPartes[2]);
    const hora = parseInt(horaPartes[0]);
    const minuto = parseInt(horaPartes[1]);
    
    const dataInicio = new Date(ano, mes, dia, hora, minuto, 0);
    const dataFim = new Date(dataInicio.getTime() + (2 * 60 * 60 * 1000)); // 2 horas de duração
    
    // Criar o evento no Google Agenda
    const eventoCriado = calendar.createEvent(item.title, dataInicio, dataFim, {
      location: item.location,
      description: item.description + '\\n\\nCriado pelo Agente Acadêmico ADS FSG'
    });
    
    // Configurar lembretes automáticos por e-mail e notificação push
    eventoCriado.addPopupReminder(1440); // 1 dia antes (24h)
    eventoCriado.addPopupReminder(10080); // 7 dias antes (1 semana)
    eventoCriado.addEmailReminder(2880); // 2 dias antes por e-mail
    
    Logger.log('Evento criado com sucesso: ' + item.title + ' em ' + dataInicio);
  });
  
  Logger.log('Todos os eventos acadêmicos foram adicionados à sua Google Agenda!');
}
`;
}
