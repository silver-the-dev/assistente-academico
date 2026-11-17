import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderSafeMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  const rawHtml = marked.parse(markdownText, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
  });
}
