import React, { useState, useEffect } from 'react';
import { X, Settings, School, User, MapPin, Phone, Image, Save } from 'lucide-react';
import { SchoolSettings } from '../types';
import { ImageUploader } from './ImageUploader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings | null;
  onSaveSettings: (newSettings: SchoolSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [schoolName, setSchoolName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultClass, setDefaultClass] = useState('');
  const [defaultPeriod, setDefaultPeriod] = useState('Vespertino');

  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || '');
      setLogoUrl(settings.logoUrl || '');
      setTeacherName(settings.teacherName || '');
      setCity(settings.city || '');
      setState(settings.state || '');
      setPhone(settings.phone || '');
      setDefaultClass(settings.defaultClass || '');
      setDefaultPeriod(settings.defaultPeriod || 'Vespertino');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      userId: settings?.userId || 'current-user',
      schoolName,
      logoUrl,
      teacherName,
      city,
      state,
      phone,
      defaultClass,
      defaultPeriod
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        id="settings-modal-container"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Configurações da Escola e Professor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Essas informações aparecerão no cabeçalho dos documentos PDF/DOCX.
              </p>
            </div>
          </div>
          <button
            id="settings-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Escola / Instituição
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="settings-school-name"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ex: Escola de Educação Infantil Cristão de Curitiba"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <ImageUploader
              imageUrl={logoUrl}
              onImageUrlChange={setLogoUrl}
              multiple={false}
              label="Logo da Escola / Instituição"
              hint="Faça upload da imagem da logo para o cabeçalho dos impressos"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do(a) Professor(a)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="settings-teacher-name"
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Profe Camila"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Turma Padrão
              </label>
              <input
                id="settings-default-class"
                type="text"
                value={defaultClass}
                onChange={(e) => setDefaultClass(e.target.value)}
                placeholder="KINDER 3"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Turno / Período
              </label>
              <select
                id="settings-default-period"
                value={defaultPeriod}
                onChange={(e) => setDefaultPeriod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="Vespertino">Vespertino (Tarde)</option>
                <option value="Matutino">Matutino (Manhã)</option>
                <option value="Integral">Integral</option>
                <option value="Noturno">Noturno</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
              <input
                id="settings-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Curitiba"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
              <input
                id="settings-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="PR"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
              <input
                id="settings-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(41) 99999-9999"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="settings-save-btn"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
