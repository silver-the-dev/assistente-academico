import dotenv from 'dotenv';
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';

dotenv.config();

// Modelo padrão: Gemini 4 Hydrogen, disponível gratuitamente no Free Tier da API Gemini
// (o Gemini 4 Argon NÃO está disponível no Free Tier). Pode ser sobrescrito via GEMINI_MODEL.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';

// Fallback automático para outros modelos gratuitos caso a cota do modelo principal se esgote (erro 429)
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
];

let activeResolvedModel: string = GEMINI_MODEL;

export async function generateContentSmart(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'> & { model?: string }
): Promise<GenerateContentResponse> {
  const candidates = Array.from(
    new Set([params.model || activeResolvedModel, GEMINI_MODEL, ...FALLBACK_MODELS])
  );

  let lastError: unknown = null;

  for (const modelName of candidates) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      activeResolvedModel = modelName;
      return response;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = String((err as Error)?.message || '');
      const status = (err as { status?: number })?.status;
      const isQuotaOrModelError =
        status === 429 ||
        status === 404 ||
        status === 503 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('NOT_FOUND');

      if (isQuotaOrModelError) {
        console.warn(
          `[Gemini Fallback] Modelo "${modelName}" indisponível na cota atual (${status || '429'}). Tentando próximo modelo compatível...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Não foi possível obter resposta dos modelos Gemini.');
}

export const TIMEZONE = 'America/Sao_Paulo';

export const DEDICATED_CALENDAR_SUMMARY = 'Agente Acadêmico ADS';
export const DEDICATED_CALENDAR_DESCRIPTION =
  'Calendário acadêmico criado automaticamente pelo Agente Acadêmico ADS - FSG (aulas, provas, entregas e blocos de estudo).';
