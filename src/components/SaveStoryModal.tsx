import React, { useState, useEffect } from 'react';
import { X, BookMarked, Save, AlertTriangle, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Story } from '../types';
import { ImageUploader } from './ImageUploader';
import { RichTextEditor } from './RichTextEditor';
import { findDuplicateStory } from '../lib/storyUtils';

interface SaveStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    id?: string;
    title: string;
    author?: string;
    description: string;
    objectives?: string;
    ageRange?: string;
    imageUrl?: string;
  };
  stories: Story[];
  onSave: (story: Story) => void;
  isUpdateMode?: boolean;
}

export const SaveStoryModal: React.FC<SaveStoryModalProps> = ({
  isOpen,
  onClose,
  initialData,
  stories = [],
  onSave,
  isUpdateMode = false
}) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [author, setAuthor] = useState(initialData.author || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [objectives, setObjectives] = useState(initialData.objectives || '');
  const [ageRange, setAgeRange] = useState(initialData.ageRange || '3 a 5 anos');
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || '');
  const [targetExistingStoryId, setTargetExistingStoryId] = useState<string | null>(initialData.id || null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title || '');
      setAuthor(initialData.author || '');
      setDescription(initialData.description || '');
      setObjectives(initialData.objectives || '');
      setAgeRange(initialData.ageRange || '3 a 5 anos');
      setImageUrl(initialData.imageUrl || '');
      setTargetExistingStoryId(initialData.id || null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Duplicate check
  const duplicateStory = findDuplicateStory(stories, title, targetExistingStoryId || undefined);

  const handleSubmit = (overrideExistingId?: string) => {
    if (!title.trim()) {
      alert('Por favor, informe o título da história.');
      return;
    }

    const storyIdToUse = overrideExistingId || targetExistingStoryId || `story-${Date.now()}`;
    const existingObj = stories.find(s => s.id === storyIdToUse);

    const savedStory: Story = {
      id: storyIdToUse,
      userId: existingObj?.userId || 'current-user',
      title: title.trim(),
      author: author.trim(),
      description,
      objectives: objectives.trim(),
      ageRange: ageRange.trim() || '3 a 5 anos',
      imageUrl: imageUrl.trim() || undefined,
      isFavorite: existingObj?.isFavorite || false,
      createdAt: existingObj?.createdAt || new Date().toISOString()
    };

    onSave(savedStory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isUpdateMode || targetExistingStoryId ? 'Atualizar História no Banco' : 'Salvar no Banco de Histórias'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre ou atualize a história infantil com formatação rica e objetivos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Duplicate Story Notice */}
          {duplicateStory && !targetExistingStoryId && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p>
                  <strong>História já existente:</strong> Foi encontrada uma história com o título <em>"{duplicateStory.title}"</em> no Banco.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetExistingStoryId(duplicateStory.id);
                      setAuthor(duplicateStory.author || author);
                      setObjectives(duplicateStory.objectives || objectives);
                      setImageUrl(duplicateStory.imageUrl || imageUrl);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Substituir / Atualizar esta existente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetExistingStoryId(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] transition-colors"
                  >
                    Salvar como nova mesmo assim
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título da História / Livro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Menina e o Barquinho"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Autor(a) do Livro / Obra
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Ruth Rocha / Adaptação Folclórica"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faixa Etária Recomendada
              </label>
              <input
                type="text"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                placeholder="Ex: 3 a 5 anos (Educação Infantil)"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Rich Text Editor for Synopsis / Description */}
            <div className="space-y-1">
              <RichTextEditor
                label="Sinopse / Conteúdo da História (com Formatação Rica)"
                value={description}
                onChange={setDescription}
                placeholder="Escreva a sinopse ou o roteiro da história com negrito, itálico, listas, etc..."
                rows={4}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Objetivos Pedagógicos (opcional)
              </label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Ex: Estimular a escuta atenta, imaginação e vocabulário..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Capa / Ilustração */}
            <div className="pt-2">
              <ImageUploader
                imageUrl={imageUrl}
                onImageUrlChange={setImageUrl}
                multiple={false}
                label="Capa da História / Ilustração"
                hint="Envie a foto da capa do livro ou ilustração da atividade"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>
                {targetExistingStoryId ? 'Salvar Alterações no Banco' : 'Salvar no Banco de Histórias'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
