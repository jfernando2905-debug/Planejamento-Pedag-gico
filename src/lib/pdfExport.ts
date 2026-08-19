import jsPDF from 'jspdf';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { formatIsoToBrDate } from './dateUtils';
import { parseHtmlToBlocks, parseColorToRgb } from './richTextExportUtils';

interface ImageDetails {
  dataUrl: string;
  width: number;
  height: number;
  format: 'JPEG' | 'PNG';
}

async function loadImageDetails(src: string): Promise<ImageDetails | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const isPng = src.startsWith('data:image/png');
          const format: 'JPEG' | 'PNG' = isPng ? 'PNG' : 'JPEG';
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
          resolve({
            dataUrl,
            width: img.width,
            height: img.height,
            format,
          });
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Erro ao processar imagem para PDF:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generatePlanningPDF(planning: WeeklyPlanning, settings?: SchoolSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const schoolName = settings?.schoolName || 'ESCOLA DE EDUCAÇÃO INFANTIL';
  const teacherName = planning.teacher || settings?.teacherName || 'Professor(a)';
  const cityState = (settings?.city && settings?.state) ? `${settings.city} - ${settings.state}` : '';

  // Pre-load logo if present
  const logoDetails = settings?.logoUrl ? await loadImageDetails(settings.logoUrl) : null;

  const addHeader = () => {
    // Top border box / Header styling
    doc.setDrawColor(200, 210, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, margin, contentWidth, 24, 'FD');

    let textXOffset = margin + 5;

    // Draw school logo if available
    if (logoDetails) {
      const maxLogoDim = 18; // 18mm max
      const scale = Math.min(maxLogoDim / logoDetails.width, maxLogoDim / logoDetails.height, 1);
      const logoW = logoDetails.width * scale;
      const logoH = logoDetails.height * scale;
      const logoX = margin + 3;
      const logoY = margin + (24 - logoH) / 2;

      try {
        doc.addImage(logoDetails.dataUrl, logoDetails.format, logoX, logoY, logoW, logoH);
        textXOffset = logoX + logoW + 4;
      } catch (e) {
        console.warn('Erro ao renderizar logo no PDF:', e);
      }
    }

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138); // Dark Navy Blue
    doc.text(schoolName.toUpperCase(), textXOffset, margin + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${planning.className} – ${planning.year} | Turno: ${planning.period || settings?.defaultPeriod || 'Vespertino'}`, textXOffset, margin + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Planejamento: ${planning.week} (${formatIsoToBrDate(planning.startDate || '')} a ${formatIsoToBrDate(planning.endDate || '')})`, textXOffset, margin + 19);

    if (cityState) {
      doc.text(cityState, pageWidth - margin - 5, margin + 7, { align: 'right' });
    }
    doc.text(`Profe: ${teacherName}`, pageWidth - margin - 5, margin + 13, { align: 'right' });

    y = margin + 30;
  };

  const addPageIfNeeded = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addHeader();
    }
  };

  addHeader();

  // Helper to render rich text blocks with full formatting into PDF
  const renderRichText = (
    htmlOrText: string,
    indentX: number,
    maxWidth: number,
    defaultFontSize = 8.5,
    defaultRgb: [number, number, number] = [51, 65, 85]
  ) => {
    if (!htmlOrText || !htmlOrText.trim()) return;
    const blocks = parseHtmlToBlocks(htmlOrText);

    for (const block of blocks) {
      addPageIfNeeded(6);

      const isListItem = block.type === 'list-item';
      const bulletWidth = isListItem ? 4 : 0;
      const blockIndent = indentX + bulletWidth;
      const effectiveWidth = maxWidth - bulletWidth;

      if (isListItem) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(defaultFontSize);
        doc.setTextColor(defaultRgb[0], defaultRgb[1], defaultRgb[2]);
        doc.text('•', indentX, y);
      }

      interface StyledToken {
        text: string;
        isNewline: boolean;
        isSpace: boolean;
        width: number;
        bold: boolean;
        italic: boolean;
        underline: boolean;
        strike: boolean;
        color: [number, number, number];
        highlight: [number, number, number] | null;
        fontSize: number;
      }

      const tokens: StyledToken[] = [];

      for (const run of block.runs) {
        if (!run.text) continue;

        const isBold = !!run.bold;
        const isItalic = !!run.italic;
        const fontStyle = isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';
        const fontSize = run.fontSize || defaultFontSize;
        const color = parseColorToRgb(run.color) || defaultRgb;
        const highlight = parseColorToRgb(run.highlight);

        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);

        const rawLines = run.text.split('\n');
        for (let lIdx = 0; lIdx < rawLines.length; lIdx++) {
          if (lIdx > 0) {
            tokens.push({
              text: '',
              isNewline: true,
              isSpace: false,
              width: 0,
              bold: isBold,
              italic: isItalic,
              underline: !!run.underline,
              strike: !!run.strike,
              color,
              highlight,
              fontSize,
            });
          }

          const lineSegment = rawLines[lIdx];
          if (!lineSegment) continue;

          const parts = lineSegment.split(/(\s+)/);
          for (const part of parts) {
            if (!part) continue;
            const isSpace = /^\s+$/.test(part);
            const tokenWidth = doc.getTextWidth(part);
            tokens.push({
              text: part,
              isNewline: false,
              isSpace,
              width: tokenWidth,
              bold: isBold,
              italic: isItalic,
              underline: !!run.underline,
              strike: !!run.strike,
              color,
              highlight,
              fontSize,
            });
          }
        }
      }

      if (tokens.length === 0) continue;

      const lines: StyledToken[][] = [];
      let currentLine: StyledToken[] = [];
      let currentLineWidth = 0;

      for (const token of tokens) {
        if (token.isNewline) {
          lines.push(currentLine);
          currentLine = [];
          currentLineWidth = 0;
          continue;
        }

        if (currentLine.length === 0 && token.isSpace) {
          continue;
        }

        if (currentLineWidth + token.width <= effectiveWidth || currentLine.length === 0) {
          currentLine.push(token);
          currentLineWidth += token.width;
        } else {
          lines.push(currentLine);
          if (token.isSpace) {
            currentLine = [];
            currentLineWidth = 0;
          } else {
            currentLine = [token];
            currentLineWidth = token.width;
          }
        }
      }

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      const lineHeight = defaultFontSize * 0.48;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineTokens = lines[lineIndex];
        if (lineTokens.length === 0) {
          y += lineHeight;
          addPageIfNeeded(lineHeight + 2);
          continue;
        }

        const totalLineWidth = lineTokens.reduce((sum, t) => sum + t.width, 0);

        let startX = blockIndent;
        if (block.align === 'center') {
          startX = blockIndent + Math.max(0, (effectiveWidth - totalLineWidth) / 2);
        } else if (block.align === 'right') {
          startX = blockIndent + Math.max(0, effectiveWidth - totalLineWidth);
        }

        addPageIfNeeded(lineHeight + 2);
        let curX = startX;

        for (const token of lineTokens) {
          const fontStyle = token.bold && token.italic ? 'bolditalic' : token.bold ? 'bold' : token.italic ? 'italic' : 'normal';
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(token.fontSize);
          doc.setTextColor(token.color[0], token.color[1], token.color[2]);

          if (token.highlight) {
            doc.setFillColor(token.highlight[0], token.highlight[1], token.highlight[2]);
            doc.rect(curX, y - (token.fontSize * 0.35), token.width, token.fontSize * 0.45, 'F');
          }

          if (token.text) {
            doc.text(token.text, curX, y);
          }

          if (token.underline) {
            doc.setDrawColor(token.color[0], token.color[1], token.color[2]);
            doc.setLineWidth(0.2);
            doc.line(curX, y + 0.5, curX + token.width, y + 0.5);
          }

          if (token.strike) {
            doc.setDrawColor(token.color[0], token.color[1], token.color[2]);
            doc.setLineWidth(0.2);
            doc.line(curX, y - (token.fontSize * 0.15), curX + token.width, y - (token.fontSize * 0.15));
          }

          curX += token.width;
        }

        y += lineHeight;
      }

      y += 1.5;
    }
  };

  // General Summary Box if exists
  if (planning.generalTheme || planning.project || planning.bookWorked) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);

    let infoY = y + 5;
    if (planning.generalTheme) {
      doc.text(`TEMA GERAL: ${planning.generalTheme}`, margin + 4, infoY);
      infoY += 5;
    }
    if (planning.project) {
      doc.text(`PROJETO: ${planning.project}`, margin + 4, infoY);
      infoY += 5;
    }
    if (planning.bookWorked) {
      doc.text(`LIVRO TRABALHADO: ${planning.bookWorked}`, margin + 4, infoY);
    }
    y += 25;
  }

  const daysList = [
    planning.days.segunda,
    planning.days.terca,
    planning.days.quarta,
    planning.days.quinta,
    planning.days.sexta
  ];

  for (const day of daysList) {
    if (!day) continue;

    addPageIfNeeded(18);

    // Day Section Header
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(margin, y, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    const dayTitle = `${day.dayName.toUpperCase()} ${day.dateStr ? `- ${day.dateStr}` : ''} ${day.subHeader ? `(${day.subHeader})` : ''}`;
    doc.text(dayTitle, margin + 4, y + 5.5);
    y += 12;

    // Routine Items
    if (day.routine && day.routine.length > 0) {
      for (const r of day.routine) {
        addPageIfNeeded(10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${r.title} (${r.time})`, margin + 4, y);
        y += 5;

        if (r.description) {
          renderRichText(r.description, margin + 6, contentWidth - 8, 9, [51, 65, 85]);
        }

        // Routine Images
        if (r.images && r.images.length > 0) {
          for (const imgSrc of r.images) {
            const imgDetails = await loadImageDetails(imgSrc);
            if (imgDetails) {
              const maxW = 100; // 100mm
              const maxH = 65;  // 65mm
              const scale = Math.min(maxW / imgDetails.width, maxH / imgDetails.height, 1);
              const finalW = imgDetails.width * scale;
              const finalH = imgDetails.height * scale;

              addPageIfNeeded(finalH + 6);
              try {
                doc.addImage(imgDetails.dataUrl, imgDetails.format, margin + 8, y, finalW, finalH);
                y += finalH + 4;
              } catch (e) {
                console.warn('Erro ao inserir imagem da rotina no PDF:', e);
              }
            }
          }
        }

        y += 2;
      }
    }

    // Lesson Items
    if (day.lessons && day.lessons.length > 0) {
      for (const l of day.lessons) {
        addPageIfNeeded(25);

        // Lesson Title Bar
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(191, 219, 254);
        doc.rect(margin, y, contentWidth, 7, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(29, 78, 216);
        const subjectText = `${l.subject}: ${l.time}${l.theme ? ` – ${l.theme}` : ''}`;
        doc.text(subjectText, margin + 4, y + 5);
        y += 10;

        // Objectives & BNCC
        if (l.bnccCodes && l.bnccCodes.length > 0) {
          addPageIfNeeded(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text('Objetivos (BNCC):', margin + 4, y);
          y += 4.5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          l.bnccCodes.forEach((code) => {
            doc.text(`• Code BNCC: ${code}`, margin + 8, y);
            y += 4;
          });
        }

        if (l.objectives) {
          addPageIfNeeded(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text('Objetivos da Aula:', margin + 4, y);
          y += 4.5;

          renderRichText(l.objectives, margin + 8, contentWidth - 10, 8.5, [51, 65, 85]);
          y += 2;
        }

        // Development
        if (l.development) {
          addPageIfNeeded(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 58, 138);
          doc.text('Desenvolvimento da Aula:', margin + 4, y);
          y += 4.5;

          renderRichText(l.development, margin + 8, contentWidth - 10, 8.5, [30, 41, 59]);
          y += 2;
        }

        // Materials
        if (l.materials && l.materials.length > 0) {
          addPageIfNeeded(8);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Materiais: ${l.materials.join(', ')}`, margin + 4, y);
          y += 5;
        }

        // Lesson Images
        if (l.images && l.images.length > 0) {
          for (const imgSrc of l.images) {
            const imgDetails = await loadImageDetails(imgSrc);
            if (imgDetails) {
              const maxW = 120; // 120mm
              const maxH = 75;  // 75mm
              const scale = Math.min(maxW / imgDetails.width, maxH / imgDetails.height, 1);
              const finalW = imgDetails.width * scale;
              const finalH = imgDetails.height * scale;

              addPageIfNeeded(finalH + 6);
              try {
                doc.addImage(imgDetails.dataUrl, imgDetails.format, margin + 8, y, finalW, finalH);
                y += finalH + 4;
              } catch (e) {
                console.warn('Erro ao inserir imagem da aula no PDF:', e);
              }
            }
          }
        }

        y += 4;
      }
    }

    y += 6;
  }

  // Footer Page Numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} – Gerado por Planejamento Pedagógico Infantil`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const fileName = `Planejamento_${planning.className}_${planning.week}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
