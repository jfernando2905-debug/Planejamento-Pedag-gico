import DOMPurify from 'dompurify';

/**
 * Checks if a string contains HTML tags.
 */
export function isHtmlString(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Sanitizes HTML content using DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'style', 'class', 'href', 'color'],
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts plain text into HTML paragraphs/lists or ensures string is valid HTML for Tiptap / preview.
 * If input is already HTML, sanitizes it.
 * If input is plain text, converts newlines into <p> or <li>.
 */
export function convertPlainTextToHtml(text: string): string {
  if (!text) return '';
  if (isHtmlString(text)) {
    return sanitizeHtml(text);
  }

  const lines = text.split('\n');
  const paragraphs: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        paragraphs.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      if (!inList) {
        paragraphs.push('<ul>');
        inList = true;
      }
      const itemText = trimmed.replace(/^[-•*]\s*/, '');
      paragraphs.push(`<li>${escapeHtml(itemText)}</li>`);
    } else {
      if (inList) {
        paragraphs.push('</ul>');
        inList = false;
      }
      paragraphs.push(`<p>${escapeHtml(trimmed)}</p>`);
    }
  }

  if (inList) {
    paragraphs.push('</ul>');
  }

  return paragraphs.join('');
}

/**
 * Converts HTML content or plain text into clean plain text for PDF / DOCX export.
 */
export function stripHtmlToPlainText(content: string): string {
  if (!content) return '';
  if (!isHtmlString(content)) {
    return content;
  }

  try {
    const formatted = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ');
    
    if (typeof document !== 'undefined') {
      const tempEl = document.createElement('div');
      tempEl.innerHTML = formatted;
      const text = tempEl.textContent || tempEl.innerText || '';
      return text.replace(/\n{3,}/g, '\n\n').trim();
    }

    return formatted
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (e) {
    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
