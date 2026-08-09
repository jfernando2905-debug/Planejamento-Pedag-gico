import jsPDF from 'jspdf';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { formatIsoToBrDate } from './dateUtils';

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
        const descLines = r.description ? doc.splitTextToSize(r.description, contentWidth - 8) : [];
        const itemHeight = 6 + (descLines.length * 4.5);
        addPageIfNeeded(itemHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${r.title} (${r.time})`, margin + 4, y);
        y += 5;

        if (descLines.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          descLines.forEach((line: string) => {
            doc.text(`  ${line}`, margin + 6, y);
            y += 4.5;
          });
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

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          const objLines = doc.splitTextToSize(l.objectives, contentWidth - 10);
          objLines.forEach((line: string) => {
            addPageIfNeeded(5);
            doc.text(line, margin + 8, y);
            y += 4;
          });
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

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);

          const devLines = doc.splitTextToSize(l.development, contentWidth - 10);
          devLines.forEach((line: string) => {
            addPageIfNeeded(5);
            doc.text(line, margin + 8, y);
            y += 4.2;
          });
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

