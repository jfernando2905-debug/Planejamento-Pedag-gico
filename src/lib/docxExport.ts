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
  ImageRun,
  UnderlineType,
  BorderStyle,
  ShadingType,
  Footer,
  PageNumber,
  ExternalHyperlink
} from 'docx';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { formatIsoToBrDate } from './dateUtils';
import { parseHtmlToBlocks, parseColorToHex } from './richTextExportUtils';

interface ImageBufferInfo {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  type: 'png' | 'jpg';
}

async function getImageArrayBufferAndSize(src: string): Promise<ImageBufferInfo | null> {
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
        console.warn('Erro ao processar imagem para DOCX:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Converts rich HTML or legacy plain text into native Word Paragraphs with complete formatting
 */
function convertHtmlToDocxParagraphs(
  htmlContent: string,
  options?: {
    defaultSize?: number; // half-points: 18 = 9pt, 20 = 10pt
    defaultColor?: string; // Hex color string, e.g. '334155'
    indent?: number; // dxa indentation
    spacingBefore?: number;
    spacingAfter?: number;
  }
): Paragraph[] {
  if (!htmlContent || !htmlContent.trim()) return [];
  const blocks = parseHtmlToBlocks(htmlContent);
  const paragraphs: Paragraph[] = [];
  const defaultSize = options?.defaultSize || 18;
  const defaultColor = options?.defaultColor || '334155';
  const baseIndent = options?.indent || 0;

  for (const block of blocks) {
    const children: (TextRun | ExternalHyperlink)[] = [];

    for (const run of block.runs) {
      if (!run.text) continue;

      const hexColor = parseColorToHex(run.color, defaultColor);
      let runSize = defaultSize;
      if (run.fontSize) {
        runSize = Math.round(run.fontSize * 2);
      }

      const textRun = new TextRun({
        text: run.text,
        bold: !!run.bold,
        italics: !!run.italic,
        underline: run.underline ? { type: UnderlineType.SINGLE } : undefined,
        strike: !!run.strike,
        color: hexColor,
        highlight: run.highlight ? 'yellow' : undefined,
        size: runSize,
        font: 'Calibri',
      });

      if (run.link) {
        children.push(
          new ExternalHyperlink({
            children: [textRun],
            link: run.link,
          })
        );
      } else {
        children.push(textRun);
      }
    }

    if (children.length === 0) continue;

    let align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
    if (block.align === 'center') align = AlignmentType.CENTER;
    else if (block.align === 'right') align = AlignmentType.RIGHT;
    else if (block.align === 'justify') align = AlignmentType.JUSTIFIED;

    if (block.type === 'list-item') {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          alignment: align,
          indent: baseIndent > 0 ? { left: baseIndent + 200 } : undefined,
          spacing: {
            before: options?.spacingBefore ?? 30,
            after: options?.spacingAfter ?? 30,
            line: 260,
          },
          children,
        })
      );
    } else if (block.type === 'heading') {
      paragraphs.push(
        new Paragraph({
          heading:
            block.headingLevel === 1
              ? HeadingLevel.HEADING_1
              : block.headingLevel === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          alignment: align,
          indent: baseIndent > 0 ? { left: baseIndent } : undefined,
          spacing: {
            before: 80,
            after: 40,
            line: 260,
          },
          children,
        })
      );
    } else if (block.type === 'blockquote') {
      paragraphs.push(
        new Paragraph({
          indent: { left: baseIndent + 360 },
          alignment: align,
          spacing: {
            before: 40,
            after: 40,
            line: 260,
          },
          children,
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: align,
          indent: baseIndent > 0 ? { left: baseIndent } : undefined,
          spacing: {
            before: options?.spacingBefore ?? 40,
            after: options?.spacingAfter ?? 40,
            line: 260,
          },
          children,
        })
      );
    }
  }

  return paragraphs;
}

export async function generatePlanningDOCX(planning: WeeklyPlanning, settings?: SchoolSettings) {
  const schoolName = settings?.schoolName || 'ESCOLA DE EDUCAÇÃO INFANTIL';
  const teacherName = planning.teacher || settings?.teacherName || 'Professor(a)';
  const cityState = settings?.city && settings?.state ? `${settings.city} - ${settings.state}` : '';

  const docChildren: any[] = [];
  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };

  // Pre-load logo if available
  let logoImageRun: ImageRun | null = null;
  if (settings?.logoUrl) {
    const logoInfo = await getImageArrayBufferAndSize(settings.logoUrl);
    if (logoInfo) {
      const maxW = 90;
      const maxH = 65;
      const scale = Math.min(maxW / logoInfo.width, maxH / logoInfo.height, 1);
      const width = Math.round(logoInfo.width * scale);
      const height = Math.round(logoInfo.height * scale);

      logoImageRun = new ImageRun({
        data: logoInfo.buffer,
        transformation: { width, height },
        type: logoInfo.type,
      });
    }
  }

  // 1. TOP HEADER CARD (Matching PDF Header Box)
  const headerLeftParagraphs: Paragraph[] = [];
  if (logoImageRun) {
    headerLeftParagraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [logoImageRun],
      })
    );
  }

  headerLeftParagraphs.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: schoolName.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          color: '1E3A8A', // Dark Navy Blue
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: `${planning.className} – ${planning.year} | Turno: ${
            planning.period || settings?.defaultPeriod || 'Vespertino'
          }`,
          bold: true,
          size: 21, // 10.5pt
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `Planejamento: ${planning.week} (${formatIsoToBrDate(
            planning.startDate || ''
          )} a ${formatIsoToBrDate(planning.endDate || '')})`,
          size: 19, // 9.5pt
          color: '475569',
          font: 'Calibri',
        }),
      ],
    })
  );

  const headerRightParagraphs: Paragraph[] = [];
  if (cityState) {
    headerRightParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: cityState,
            size: 19, // 9.5pt
            color: '475569',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  headerRightParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `Profe: ${teacherName}`,
          bold: true,
          size: 21, // 10.5pt
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    })
  );

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'C8D2E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C8D2E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'C8D2E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'C8D2E1' },
      insideHorizontal: borderNone,
      insideVertical: borderNone,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            borders: {
              top: borderNone,
              bottom: borderNone,
              left: borderNone,
              right: borderNone,
            },
            children: headerLeftParagraphs,
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            borders: {
              top: borderNone,
              bottom: borderNone,
              left: borderNone,
              right: borderNone,
            },
            children: headerRightParagraphs,
          }),
        ],
      }),
    ],
  });

  docChildren.push(headerTable);
  docChildren.push(new Paragraph({ spacing: { before: 80, after: 80 }, text: '' }));

  // 2. GENERAL SUMMARY CARD (Tema Geral / Projeto / Livro Trabalhado)
  if (planning.generalTheme || planning.project || planning.bookWorked) {
    const summaryParagraphs: Paragraph[] = [];

    if (planning.generalTheme) {
      summaryParagraphs.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: 'TEMA GERAL: ', bold: true, size: 18, color: '1E3A8A', font: 'Calibri' }),
            new TextRun({ text: planning.generalTheme, size: 18, color: '334155', font: 'Calibri' }),
          ],
        })
      );
    }

    if (planning.project) {
      summaryParagraphs.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: 'PROJETO: ', bold: true, size: 18, color: '1E3A8A', font: 'Calibri' }),
            new TextRun({ text: planning.project, size: 18, color: '334155', font: 'Calibri' }),
          ],
        })
      );
    }

    if (planning.bookWorked) {
      summaryParagraphs.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: 'LIVRO TRABALHADO: ', bold: true, size: 18, color: '1E3A8A', font: 'Calibri' }),
            new TextRun({ text: planning.bookWorked, size: 18, color: '334155', font: 'Calibri' }),
          ],
        })
      );
    }

    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        insideHorizontal: borderNone,
        insideVertical: borderNone,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              borders: {
                top: borderNone,
                bottom: borderNone,
                left: borderNone,
                right: borderNone,
              },
              children: summaryParagraphs,
            }),
          ],
        }),
      ],
    });

    docChildren.push(summaryTable);
    docChildren.push(new Paragraph({ spacing: { before: 60, after: 60 }, text: '' }));
  }

  // 3. DAYS SECTIONS
  const daysList = [
    planning.days.segunda,
    planning.days.terca,
    planning.days.quarta,
    planning.days.quinta,
    planning.days.sexta,
  ];

  for (const day of daysList) {
    if (!day) continue;

    const dayTitleStr = `${day.dayName.toUpperCase()} ${day.dateStr ? `- ${day.dateStr}` : ''} ${
      day.subHeader ? `(${day.subHeader})` : ''
    }`;

    // Day Header Banner (Blue 600 Bar)
    const dayBannerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: borderNone,
        bottom: borderNone,
        left: borderNone,
        right: borderNone,
        insideHorizontal: borderNone,
        insideVertical: borderNone,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: '2563EB', type: ShadingType.CLEAR }, // Blue 600
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              borders: {
                top: borderNone,
                bottom: borderNone,
                left: borderNone,
                right: borderNone,
              },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: dayTitleStr,
                      bold: true,
                      size: 22, // 11pt
                      color: 'FFFFFF',
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(dayBannerTable);
    docChildren.push(new Paragraph({ spacing: { before: 40, after: 40 }, text: '' }));

    // Routine Items
    if (day.routine && day.routine.length > 0) {
      for (const r of day.routine) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 80, after: 30 },
            children: [
              new TextRun({
                text: `• ${r.title} (${r.time})`,
                bold: true,
                size: 20, // 10pt
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
          })
        );

        if (r.description) {
          const descParagraphs = convertHtmlToDocxParagraphs(r.description, {
            defaultSize: 18,
            defaultColor: '334155',
            indent: 240,
          });
          docChildren.push(...descParagraphs);
        }

        // Routine Images
        if (r.images && r.images.length > 0) {
          for (const imgSrc of r.images) {
            const imgInfo = await getImageArrayBufferAndSize(imgSrc);
            if (imgInfo) {
              const maxW = 380;
              const maxH = 240;
              const scale = Math.min(maxW / imgInfo.width, maxH / imgInfo.height, 1);
              const width = Math.round(imgInfo.width * scale);
              const height = Math.round(imgInfo.height * scale);

              docChildren.push(
                new Paragraph({
                  indent: { left: 240 },
                  spacing: { before: 60, after: 60 },
                  children: [
                    new ImageRun({
                      data: imgInfo.buffer,
                      transformation: { width, height },
                      type: imgInfo.type,
                    }),
                  ],
                })
              );
            }
          }
        }

        docChildren.push(new Paragraph({ spacing: { before: 20, after: 20 }, text: '' }));
      }
    }

    // Lesson Items
    if (day.lessons && day.lessons.length > 0) {
      for (const l of day.lessons) {
        const lessonTitleStr = `${l.subject}: ${l.time}${l.theme ? ` – ${l.theme}` : ''}`;

        // Lesson Title Bar (Blue 50 Box)
        const lessonTitleTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE' },
            insideHorizontal: borderNone,
            insideVertical: borderNone,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { fill: 'EFF6FF', type: ShadingType.CLEAR }, // Blue 50
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  borders: {
                    top: borderNone,
                    bottom: borderNone,
                    left: borderNone,
                    right: borderNone,
                  },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: lessonTitleStr,
                          bold: true,
                          size: 20, // 10pt
                          color: '1D4ED8', // Blue 700
                          font: 'Calibri',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        docChildren.push(lessonTitleTable);
        docChildren.push(new Paragraph({ spacing: { before: 30, after: 30 }, text: '' }));

        // BNCC Codes
        if (l.bnccCodes && l.bnccCodes.length > 0) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 60, after: 20 },
              children: [
                new TextRun({
                  text: 'Objetivos (BNCC):',
                  bold: true,
                  size: 18,
                  color: '0F172A',
                  font: 'Calibri',
                }),
              ],
            })
          );

          l.bnccCodes.forEach((code) => {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                indent: { left: 240 },
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: `Code BNCC: ${code}`,
                    size: 17,
                    color: '475569',
                    font: 'Calibri',
                  }),
                ],
              })
            );
          });
        }

        // Lesson Objectives
        if (l.objectives) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 60, after: 20 },
              children: [
                new TextRun({
                  text: 'Objetivos da Aula:',
                  bold: true,
                  size: 18,
                  color: '0F172A',
                  font: 'Calibri',
                }),
              ],
            })
          );

          const objParagraphs = convertHtmlToDocxParagraphs(l.objectives, {
            defaultSize: 17,
            defaultColor: '334155',
            indent: 240,
          });
          docChildren.push(...objParagraphs);
        }

        // Lesson Development
        if (l.development) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 60, after: 20 },
              children: [
                new TextRun({
                  text: 'Desenvolvimento da Aula:',
                  bold: true,
                  size: 18,
                  color: '1E3A8A',
                  font: 'Calibri',
                }),
              ],
            })
          );

          const devParagraphs = convertHtmlToDocxParagraphs(l.development, {
            defaultSize: 17,
            defaultColor: '1E293B',
            indent: 240,
          });
          docChildren.push(...devParagraphs);
        }

        // Materials
        if (l.materials && l.materials.length > 0) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 60, after: 30 },
              children: [
                new TextRun({
                  text: 'Materiais: ',
                  bold: true,
                  size: 17,
                  color: '475569',
                  font: 'Calibri',
                }),
                new TextRun({
                  text: l.materials.join(', '),
                  size: 17,
                  color: '334155',
                  font: 'Calibri',
                }),
              ],
            })
          );
        }

        // Lesson Images
        if (l.images && l.images.length > 0) {
          for (const imgSrc of l.images) {
            const imgInfo = await getImageArrayBufferAndSize(imgSrc);
            if (imgInfo) {
              const maxW = 420;
              const maxH = 280;
              const scale = Math.min(maxW / imgInfo.width, maxH / imgInfo.height, 1);
              const width = Math.round(imgInfo.width * scale);
              const height = Math.round(imgInfo.height * scale);

              docChildren.push(
                new Paragraph({
                  indent: { left: 240 },
                  spacing: { before: 60, after: 60 },
                  children: [
                    new ImageRun({
                      data: imgInfo.buffer,
                      transformation: { width, height },
                      type: imgInfo.type,
                    }),
                  ],
                })
              );
            }
          }
        }

        docChildren.push(new Paragraph({ spacing: { before: 40, after: 40 }, text: '' }));
      }
    }

    docChildren.push(new Paragraph({ spacing: { before: 60, after: 60 }, text: '' }));
  }

  // 4. DOCUMENT CREATION WITH SECTION PROPERTIES & FOOTER
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 850, // ~15mm
              bottom: 850,
              left: 850,
              right: 850,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Página ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' – Gerado por Planejamento Pedagógico Infantil',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
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
