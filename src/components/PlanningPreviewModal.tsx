import React, { useRef } from 'react';
import { X, Printer, FileDown, FileText, School, User, Calendar, MapPin, Eye } from 'lucide-react';
import { WeeklyPlanning, SchoolSettings } from '../types';
import { formatIsoToBrDate } from '../lib/dateUtils';

interface PlanningPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planning: WeeklyPlanning;
  settings?: SchoolSettings | null;
  onExportPdf: () => void;
  onExportDocx: () => void;
  isGeneratingPdf?: boolean;
  isGeneratingDocx?: boolean;
}

export const PlanningPreviewModal: React.FC<PlanningPreviewModalProps> = ({
  isOpen,
  onClose,
  planning,
  settings,
  onExportPdf,
  onExportDocx,
  isGeneratingPdf = false,
  isGeneratingDocx = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const schoolName = settings?.schoolName || 'Escola de Educação Infantil';
  const teacherName = planning?.teacher || settings?.teacherName || 'Professor(a)';
  const cityState = (settings?.city && settings?.state) ? `${settings.city} - ${settings.state}` : '';

  const daysList = planning?.days ? [
    planning.days.segunda,
    planning.days.terca,
    planning.days.quarta,
    planning.days.quinta,
    planning.days.sexta,
  ].filter(Boolean) : [];

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Permita popups para imprimir o documento.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão - ${planning.className} (${planning.week})</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { font-family: sans-serif; padding: 0; margin: 0; background: white; color: black; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body class="bg-white p-6">
          ${printContent}
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Controls Bar */}
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Pré-visualização da Impressão / Documento
              </h2>
              <p className="text-[11px] text-slate-400">
                Verifique o cabeçalho, fotos e rotinas antes de exportar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={onExportPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Gerando...' : 'PDF'}</span>
            </button>

            {/* Export DOCX */}
            <button
              onClick={onExportDocx}
              disabled={isGeneratingDocx}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isGeneratingDocx ? 'Gerando...' : 'DOCX'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
          
          {/* A4 Document Simulation Canvas */}
          <div
            ref={printRef}
            className="bg-white text-slate-900 w-full max-w-3xl min-h-[1050px] p-8 sm:p-10 rounded-xl shadow-2xl space-y-6 font-sans text-sm border border-slate-200"
          >
            {/* School Header */}
            <div className="border-2 border-blue-900 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo da Escola"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl">
                    <School className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-base font-extrabold text-blue-900 uppercase tracking-tight">
                    {schoolName}
                  </h1>
                  <h2 className="text-sm font-bold text-slate-800">
                    Turma: {planning.className} ({planning.year}) – Turno: {planning.period || settings?.defaultPeriod || 'Vespertino'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Semana: <span className="font-semibold text-blue-800">{planning.week}</span> ({formatIsoToBrDate(planning.startDate)} a {formatIsoToBrDate(planning.endDate)})
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Profe: {teacherName}</p>
                {cityState && <p>{cityState}</p>}
                {settings?.phone && <p>Contato: {settings.phone}</p>}
              </div>
            </div>

            {/* General Theme Banner */}
            {planning.generalTheme && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r-xl">
                <span className="text-xs font-bold text-blue-900 uppercase block mb-0.5">
                  Tema Geral da Semana:
                </span>
                <p className="text-sm font-semibold text-blue-950">
                  {planning.generalTheme}
                </p>
              </div>
            )}

            {/* Days Breakdown */}
            <div className="space-y-6">
              {daysList.map((day, idx) => (
                <div key={idx} className="border border-slate-300 rounded-xl overflow-hidden">
                  
                  {/* Day Bar */}
                  <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                    <span className="font-bold text-sm uppercase tracking-wide">
                      {day.dayName}
                    </span>
                    {day.dateStr && (
                      <span className="text-xs text-slate-300 font-medium">
                        {day.dateStr}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* Routine */}
                    {day.routine && day.routine.length > 0 && (
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                          Acolhida & Rotina
                        </h4>
                        <div className="space-y-3">
                          {day.routine.map((r) => (
                            <div key={r.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                              <div className="flex items-center gap-2 font-bold text-blue-950">
                                {r.time && <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-mono">{r.time}</span>}
                                <span>{r.title}</span>
                              </div>
                              {r.description && (
                                <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                                  {r.description}
                                </p>
                              )}
                              {r.images && r.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200">
                                  {r.images.map((img, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={img}
                                      alt={`Foto rotina ${imgIdx + 1}`}
                                      className="w-24 h-24 object-cover rounded-lg border border-slate-300 shadow-sm"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lessons */}
                    {day.lessons && day.lessons.length > 0 && (
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                          Aulas & Atividades Dirigidas
                        </h4>
                        <div className="space-y-4">
                          {day.lessons.map((lesson) => (
                            <div key={lesson.id} className="border border-slate-300 rounded-xl p-3 bg-white space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <h5 className="font-bold text-sm text-slate-900">
                                  {lesson.title || 'Atividade sem título'}
                                </h5>
                                {lesson.estimatedTime && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                                    ⏱️ {lesson.estimatedTime}
                                  </span>
                                )}
                              </div>

                              {lesson.fieldOfExperience && (
                                <p className="text-blue-900 font-semibold">
                                  Campo de Experiência: <span className="text-slate-800 font-normal">{lesson.fieldOfExperience}</span>
                                </p>
                              )}

                              {lesson.bnccCodes && lesson.bnccCodes.length > 0 && (
                                <div>
                                  <span className="font-semibold text-slate-900 block mb-1">Códigos BNCC:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {lesson.bnccCodes.map((code, cIdx) => (
                                      <span key={cIdx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono text-[11px] rounded font-bold">
                                        {code}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {lesson.bnccObjectives && (
                                <div>
                                  <span className="font-semibold text-slate-900">Objetivos BNCC: </span>
                                  <span className="text-slate-700">{lesson.bnccObjectives}</span>
                                </div>
                              )}

                              {lesson.development && (
                                <div>
                                  <span className="font-semibold text-slate-900 block mb-0.5">Desenvolvimento / Metodologia:</span>
                                  <div
                                    className="text-slate-800 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-200/80"
                                    dangerouslySetInnerHTML={{ __html: lesson.development }}
                                  />
                                </div>
                              )}

                              {lesson.resources && (
                                <div>
                                  <span className="font-semibold text-slate-900">Materiais & Recurso: </span>
                                  <span className="text-slate-700">{lesson.resources}</span>
                                </div>
                              )}

                              {lesson.evaluation && (
                                <div>
                                  <span className="font-semibold text-slate-900">Avaliação: </span>
                                  <span className="text-slate-700">{lesson.evaluation}</span>
                                </div>
                              )}

                              {/* Lesson Attached Images */}
                              {lesson.images && lesson.images.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-200">
                                  <span className="font-semibold text-slate-900 block mb-1.5">Fotos & Anexos Ilustrativos:</span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {lesson.images.map((img, imgIdx) => (
                                      <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-300 shadow-sm bg-slate-100">
                                        <img
                                          src={img}
                                          alt={`Foto aula ${imgIdx + 1}`}
                                          className="w-full h-32 object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="pt-6 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500">
              <p>Gerado por Planejamento Pedagógico BNCC</p>
              <p>Assinatura do(a) Professor(a): ___________________________</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
