import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import ExcelJS from 'exceljs';

export interface PreparedFilePayload {
  fileName: string;
  mimeType: string;
  size: number;
  extractedMarkdown?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  warnings: string[];
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function validateFileMagicBytesAndExt(file: Express.Multer.File): { valid: boolean; reason?: string } {
  const ext = getExtension(file.originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      reason: `Formato "${ext || 'desconhecido'}" não suportado. Envie arquivos PDF, DOCX, DOC, XLSX, CSV, TXT, MD ou imagens (PNG, JPG, WEBP).`,
    };
  }

  if (ext === '.xls') {
    return {
      valid: false,
      reason: `O arquivo "${file.originalname}" está no formato legado .xls (Excel 97-2003). Por favor, salve-o como .xlsx ou .csv no Excel/Planilhas Google e envie novamente.`,
    };
  }

  const buf = file.buffer;
  if (!buf || buf.length === 0) {
    return { valid: false, reason: `O arquivo "${file.originalname}" está vazio.` };
  }

  // Magic byte sanity checks (ignoring leading whitespace in PDFs)
  if (ext === '.pdf') {
    const header = buf.subarray(0, 1024).toString('ascii');
    if (!header.includes('%PDF-')) {
      return { valid: false, reason: `O arquivo "${file.originalname}" não possui cabeçalho PDF válido.` };
    }
  } else if (ext === '.docx' || ext === '.xlsx') {
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return {
        valid: false,
        reason: `O arquivo "${file.originalname}" está corrompido ou não é um pacote Office (${ext}) válido.`,
      };
    }
  } else if (ext === '.doc') {
    if (buf.length < 4 || buf[0] !== 0xd0 || buf[1] !== 0xcf || buf[2] !== 0x11 || buf[3] !== 0xe0) {
      return {
        valid: false,
        reason: `O arquivo "${file.originalname}" não é um documento Word (.doc) binário válido.`,
      };
    }
  } else if (ext === '.png') {
    if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
      return { valid: false, reason: `A imagem "${file.originalname}" não é um arquivo PNG válido.` };
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    if (buf.length < 3 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
      return { valid: false, reason: `A imagem "${file.originalname}" não é um arquivo JPEG válido.` };
    }
  } else if (ext === '.webp') {
    const riff = buf.subarray(0, 4).toString('ascii');
    const webp = buf.subarray(8, 12).toString('ascii');
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      return { valid: false, reason: `A imagem "${file.originalname}" não é um arquivo WEBP válido.` };
    }
  }

  return { valid: true };
}

function parseCsvToMarkdown(csvText: string): string {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  const firstLine = lines[0];
  const delimiter =
    (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0)
      ? ';'
      : (firstLine.match(/\t/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0)
      ? '\t'
      : ',';

  const rows = lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim().replace(/\|/g, '\\|'));
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim().replace(/\|/g, '\\|'));
    return cells;
  });

  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalized = rows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const header = `| ${normalized[0].join(' | ')} |`;
  const sep = `| ${normalized[0].map(() => '---').join(' | ')} |`;
  const body = normalized
    .slice(1)
    .map((r) => `| ${r.join(' | ')} |`)
    .join('\n');

  return [header, sep, body].filter(Boolean).join('\n');
}

async function extractXlsxToMarkdown(buffer: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sections: string[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as unknown[];
      const cells = values.slice(1).map((val) => {
        if (val === null || val === undefined) return '';
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        if (typeof val === 'object') {
          if ('text' in (val as Record<string, unknown>)) {
            return String((val as Record<string, unknown>).text || '');
          }
          if ('result' in (val as Record<string, unknown>)) {
            return String((val as Record<string, unknown>).result ?? '');
          }
          if ('richText' in (val as Record<string, unknown>)) {
            const rt = (val as { richText?: { text: string }[] }).richText;
            return Array.isArray(rt) ? rt.map((r) => r.text).join('') : '';
          }
        }
        return String(val).replace(/\r?\n/g, ' ').trim().replace(/\|/g, '\\|');
      });
      if (cells.some((c) => c.length > 0)) {
        rows.push(cells);
      }
    });

    if (rows.length > 0) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      const normalized = rows.map((r) => {
        while (r.length < maxCols) r.push('');
        return r;
      });
      const header = `| ${normalized[0].join(' | ')} |`;
      const sep = `| ${normalized[0].map(() => '---').join(' | ')} |`;
      const body = normalized
        .slice(1)
        .map((r) => `| ${r.join(' | ')} |`)
        .join('\n');

      sections.push(`## Planilha: ${worksheet.name}\n\n${[header, sep, body].filter(Boolean).join('\n')}`);
    }
  });

  return sections.join('\n\n');
}

export async function prepareFileForIngest(file: Express.Multer.File): Promise<PreparedFilePayload> {
  const ext = getExtension(file.originalname);
  const warnings: string[] = [];

  if (ext === '.txt' || ext === '.md') {
    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extractedMarkdown: file.buffer.toString('utf-8').trim(),
      warnings,
    };
  }

  if (ext === '.csv') {
    const csvText = file.buffer.toString('utf-8');
    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extractedMarkdown: `# Tabela CSV: ${file.originalname}\n\n${parseCsvToMarkdown(csvText)}`,
      warnings,
    };
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    if (result.messages && result.messages.length > 0) {
      warnings.push(...result.messages.map((m) => m.message));
    }
    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extractedMarkdown: result.value.trim(),
      warnings,
    };
  }

  if (ext === '.doc') {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(file.buffer);
    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extractedMarkdown: doc.getBody().trim(),
      warnings,
    };
  }

  if (ext === '.xlsx') {
    const md = await extractXlsxToMarkdown(file.buffer);
    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extractedMarkdown: md,
      warnings,
    };
  }

  // For PDF and Images (.pdf, .png, .jpg, .jpeg, .webp): pass inlineData directly to Gemini in 1 single multimodal pass
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  const mimeType = mimeMap[ext] || file.mimetype || 'application/pdf';

  return {
    fileName: file.originalname,
    mimeType,
    size: file.size,
    inlineData: {
      mimeType,
      data: file.buffer.toString('base64'),
    },
    warnings,
  };
}
