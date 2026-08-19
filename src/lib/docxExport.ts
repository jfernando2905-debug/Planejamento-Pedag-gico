import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun
} from 'docx';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { formatIsoToBrDate } from './dateUtils';
import { stripHtmlToPlainText } from './richTextUtils';

async function getImageArrayBufferAndSize(src: string): Promise<{ buffer: ArrayBuffer; width: number; height: number; type: 'png' | 'jpg' } | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);

        const isPng = src.startsWith('data:image/png');
        const mime = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.85);

        const res = await fetch(dataUrl);
        const buffer = await res.arrayBuffer();

        resolve({
          buffer,
          width: img.width,
          height: img.height,
          type: isPng ? 'png' : 'jpg',
        });
      } catch (err) {
        console.warn('Error processing image for DOCX:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generatePlanningDOCX(planning: WeeklyPlanning, settings?: SchoolSettings) {
  const schoolName = settings?.schoolName || 'ESCOLA DE EDUCAÇÃO INFANTIL';
  const teacherName = planning.teacher || settings?.teacherName || 'Professor(a)';

  const children: any[] = [];

  // School Logo Header if available
  if (settings?.logoUrl) {
    const logoInfo = await getImageArrayBufferAndSize(settings.logoUrl);
    if (logoInfo) {
      const maxW = 120;
      const maxH = 90;
      const scale = Math.min(maxW / logoInfo.width, maxH / logoInfo.height, 1);
      const width = Math.round(logoInfo.width * scale);
      const height = Math.round(logoInfo.height * scale);

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: logoInfo.buffer,
              transformation: { width, height },
              type: logoInfo.type,
            })
          ]
        })
      );
    }
  }

  // Title Header
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: schoolName.toUpperCase(),
          bold: true,
          size: 28,
          color: '1E3A8A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${planning.className} – ${planning.year} | Turno: ${planning.period || settings?.defaultPeriod || 'Vespertino'}`,
          bold: true,
          size: 24,
          color: '0F172A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Planejamento: ${planning.week} (${formatIsoToBrDate(planning.startDate || '')} a ${formatIsoToBrDate(planning.endDate || '')}) | Professor(a): ${teacherName}`,
          italics: true,
          size: 20,
          color: '475569'
        })
      ]
    }),
    new Paragraph({ text: '' })
  );

  // General Theme Table
  if (planning.generalTheme || planning.project || planning.bookWorked) {
    const infoRows: TableRow[] = [];
    if (planning.generalTheme) {
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'TEMA GERAL: ', bold: true, size: 20, color: '1E3A8A' }),
                    new TextRun({ text: planning.generalTheme, size: 20 })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          ]
        })
      );
    }
    if (planning.project) {
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'PROJETO: ', bold: true, size: 20, color: '1E3A8A' }),
                    new TextRun({ text: planning.project, size: 20 })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          ]
        })
      );
    }
    if (planning.bookWorked) {
      infoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'LIVRO TRABALHADO: ', bold: true, size: 20, color: '1E3A8A' }),
                    new TextRun({ text: planning.bookWorked, size: 20 })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          ]
        })
      );
    }

    children.push(
      new Table({
        rows: infoRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }),
      new Paragraph({ text: '' })
    );
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

    // Day Heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `${day.dayName.toUpperCase()} ${day.dateStr ? `- ${day.dateStr}` : ''} ${day.subHeader ? `(${day.subHeader})` : ''}`,
            bold: true,
            size: 22,
            color: '2563EB'
          })
        ]
      })
    );

    // Routine
    if (day.routine && day.routine.length > 0) {
      for (const r of day.routine) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: `${r.title} (${r.time})`, bold: true, size: 20 }),
              new TextRun({ text: r.description ? `\n${stripHtmlToPlainText(r.description)}` : '', size: 18, color: '334155' })
            ]
          })
        );

        if (r.images && r.images.length > 0) {
          for (const imgSrc of r.images) {
            const imgInfo = await getImageArrayBufferAndSize(imgSrc);
            if (imgInfo) {
              const maxW = 400;
              const maxH = 260;
              const scale = Math.min(maxW / imgInfo.width, maxH / imgInfo.height, 1);
              const width = Math.round(imgInfo.width * scale);
              const height = Math.round(imgInfo.height * scale);

              children.push(
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new ImageRun({
                      data: imgInfo.buffer,
                      transformation: { width, height },
                      type: imgInfo.type,
                    })
                  ]
                })
              );
            }
          }
        }
      }
    }

    // Lessons
    if (day.lessons && day.lessons.length > 0) {
      for (const l of day.lessons) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: `${l.subject}: ${l.time}${l.theme ? ` – ${l.theme}` : ''}`,
                bold: true,
                size: 20,
                color: '1D4ED8'
              })
            ]
          })
        );

        if (l.bnccCodes && l.bnccCodes.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Objetivos BNCC: ', bold: true, size: 18 }),
                new TextRun({ text: l.bnccCodes.join(', '), italics: true, size: 18 })
              ]
            })
          );
        }

        if (l.objectives) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Objetivos: ', bold: true, size: 18 }),
                new TextRun({ text: stripHtmlToPlainText(l.objectives), size: 18 })
              ]
            })
          );
        }

        if (l.development) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Desenvolvimento: ', bold: true, size: 18, color: '1E3A8A' })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: stripHtmlToPlainText(l.development), size: 18 })
              ]
            })
          );
        }

        if (l.materials && l.materials.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Materiais: ', bold: true, size: 18, color: '475569' }),
                new TextRun({ text: l.materials.join(', '), size: 18 })
              ]
            })
          );
        }

        if (l.images && l.images.length > 0) {
          for (const imgSrc of l.images) {
            const imgInfo = await getImageArrayBufferAndSize(imgSrc);
            if (imgInfo) {
              const maxW = 450;
              const maxH = 300;
              const scale = Math.min(maxW / imgInfo.width, maxH / imgInfo.height, 1);
              const width = Math.round(imgInfo.width * scale);
              const height = Math.round(imgInfo.height * scale);

              children.push(
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new ImageRun({
                      data: imgInfo.buffer,
                      transformation: { width, height },
                      type: imgInfo.type,
                    })
                  ]
                })
              );
            }
          }
        }

        children.push(new Paragraph({ text: '' }));
      }
    }

    children.push(new Paragraph({ text: '' }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Planejamento_${planning.className}_${planning.week}.docx`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

