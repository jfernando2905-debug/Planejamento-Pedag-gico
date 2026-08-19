import { convertPlainTextToHtml } from './richTextUtils';

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string; // e.g. '#2563eb' or 'rgb(37, 99, 235)'
  highlight?: string; // e.g. '#fef08a'
  fontSize?: number; // pt size e.g. 9, 10, 12
  link?: string;
}

export interface BlockNode {
  type: 'paragraph' | 'heading' | 'list-item' | 'blockquote';
  headingLevel?: 1 | 2 | 3;
  align?: 'left' | 'center' | 'right' | 'justify';
  runs: InlineRun[];
}

/**
 * Helper to parse color strings into RGB tuples [R, G, B]
 */
export function parseColorToRgb(colorStr?: string): [number, number, number] | null {
  if (!colorStr) return null;
  const str = colorStr.trim().toLowerCase();

  if (str.startsWith('#')) {
    const hex = str.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    }
  }

  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }

  return null;
}

/**
 * Helper to parse color strings into 6-character uppercase hex strings for DOCX (e.g. '2563EB')
 */
export function parseColorToHex(colorStr?: string, defaultHex = '334155'): string {
  if (!colorStr) return defaultHex;
  const rgb = parseColorToRgb(colorStr);
  if (!rgb) return defaultHex;
  return ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
    .toString(16)
    .slice(1)
    .toUpperCase();
}

/**
 * Parses HTML or plain text into structured blocks and inline runs.
 */
export function parseHtmlToBlocks(htmlOrText: string): BlockNode[] {
  if (!htmlOrText || !htmlOrText.trim()) return [];

  const html = convertPlainTextToHtml(htmlOrText);

  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return [{
      type: 'paragraph',
      runs: [{ text: htmlOrText.replace(/<[^>]+>/g, '') }]
    }];
  }

  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(html, 'text/html');
  const blocks: BlockNode[] = [];

  function parseStyleString(styleStr: string): Partial<InlineRun> {
    const res: Partial<InlineRun> = {};
    if (!styleStr) return res;

    const pairs = styleStr.split(';');
    for (const pair of pairs) {
      const parts = pair.split(':');
      if (parts.length < 2) continue;
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim().toLowerCase();

      if (key === 'color') {
        res.color = val;
      } else if (key === 'background-color' || key === 'background') {
        res.highlight = val;
      } else if (key === 'font-size') {
        const num = parseFloat(val);
        if (!isNaN(num)) res.fontSize = num;
      } else if (key === 'font-weight' && (val === 'bold' || parseInt(val, 10) >= 600)) {
        res.bold = true;
      } else if (key === 'font-style' && val === 'italic') {
        res.italic = true;
      } else if (key === 'text-decoration' || key === 'text-decoration-line') {
        if (val.includes('underline')) res.underline = true;
        if (val.includes('line-through')) res.strike = true;
      }
    }
    return res;
  }

  function extractRuns(node: Node, currentRun: InlineRun): InlineRun[] {
    const runs: InlineRun[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').replace(/\u00a0/g, ' ');
      if (text) {
        runs.push({ ...currentRun, text });
      }
      return runs;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toUpperCase();

      if (tag === 'BR') {
        runs.push({ ...currentRun, text: '\n' });
        return runs;
      }

      const styleAttr = el.getAttribute('style') || '';
      const parsedStyle = parseStyleString(styleAttr);

      const isLink = tag === 'A';
      const linkHref = isLink ? (el.getAttribute('href') || undefined) : currentRun.link;
      const isBold = currentRun.bold || tag === 'STRONG' || tag === 'B' || !!parsedStyle.bold;
      const isItalic = currentRun.italic || tag === 'EM' || tag === 'I' || !!parsedStyle.italic;
      const isUnderline = currentRun.underline || tag === 'U' || isLink || !!parsedStyle.underline;
      const isStrike = currentRun.strike || tag === 'S' || tag === 'DEL' || tag === 'STRIKE' || !!parsedStyle.strike;
      const color = parsedStyle.color || el.getAttribute('color') || (isLink ? '#2563eb' : currentRun.color);
      const highlight = parsedStyle.highlight || el.getAttribute('data-color') || (tag === 'MARK' ? '#fef08a' : currentRun.highlight);
      const fontSize = parsedStyle.fontSize || currentRun.fontSize;

      const nextRun: InlineRun = {
        ...currentRun,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike,
        color,
        highlight,
        fontSize,
        link: linkHref,
      };

      for (let i = 0; i < el.childNodes.length; i++) {
        runs.push(...extractRuns(el.childNodes[i], nextRun));
      }
    }

    return runs;
  }

  function getAlignmentFromEl(el: HTMLElement): BlockNode['align'] {
    const styleAttr = el.getAttribute('style') || '';
    if (styleAttr.includes('text-align: center') || styleAttr.includes('text-align:center')) return 'center';
    if (styleAttr.includes('text-align: right') || styleAttr.includes('text-align:right')) return 'right';
    if (styleAttr.includes('text-align: justify') || styleAttr.includes('text-align:justify')) return 'justify';
    if (styleAttr.includes('text-align: left') || styleAttr.includes('text-align:left')) return 'left';
    return undefined;
  }

  function processElementNode(el: HTMLElement) {
    const tag = el.tagName.toUpperCase();
    const align = getAlignmentFromEl(el);

    // Check if it's a wrapper container with block children
    const hasBlockChildren = Array.from(el.children).some(c => 
      ['P', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'DIV', 'SECTION'].includes(c.tagName.toUpperCase())
    );

    if (hasBlockChildren && (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE')) {
      el.childNodes.forEach(c => {
        if (c.nodeType === Node.ELEMENT_NODE) {
          processElementNode(c as HTMLElement);
        } else if (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()) {
          blocks.push({
            type: 'paragraph',
            align,
            runs: [{ text: c.textContent.replace(/\u00a0/g, ' ') }]
          });
        }
      });
      return;
    }

    if (tag === 'UL' || tag === 'OL') {
      const items = el.querySelectorAll(':scope > li');
      if (items.length > 0) {
        items.forEach((li) => {
          const liAlign = getAlignmentFromEl(li as HTMLElement) || align;
          const runs = extractRuns(li, { text: '' });
          if (runs.length > 0) {
            blocks.push({ type: 'list-item', align: liAlign, runs });
          }
        });
      } else {
        const runs = extractRuns(el, { text: '' });
        if (runs.length > 0) blocks.push({ type: 'paragraph', align, runs });
      }
    } else if (tag === 'LI') {
      const runs = extractRuns(el, { text: '' });
      if (runs.length > 0) blocks.push({ type: 'list-item', align, runs });
    } else if (tag === 'H1') {
      const runs = extractRuns(el, { text: '', bold: true, fontSize: 14 });
      if (runs.length > 0) blocks.push({ type: 'heading', headingLevel: 1, align, runs });
    } else if (tag === 'H2') {
      const runs = extractRuns(el, { text: '', bold: true, fontSize: 12 });
      if (runs.length > 0) blocks.push({ type: 'heading', headingLevel: 2, align, runs });
    } else if (tag === 'H3') {
      const runs = extractRuns(el, { text: '', bold: true, fontSize: 10 });
      if (runs.length > 0) blocks.push({ type: 'heading', headingLevel: 3, align, runs });
    } else if (tag === 'BLOCKQUOTE') {
      const runs = extractRuns(el, { text: '', italic: true });
      if (runs.length > 0) blocks.push({ type: 'blockquote', align, runs });
    } else {
      const runs = extractRuns(el, { text: '' });
      if (runs.length > 0) blocks.push({ type: 'paragraph', align, runs });
    }
  }

  parsedDoc.body.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      processElementNode(child as HTMLElement);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      blocks.push({
        type: 'paragraph',
        runs: [{ text: child.textContent.replace(/\u00a0/g, ' ') }]
      });
    }
  });

  return blocks;
}
