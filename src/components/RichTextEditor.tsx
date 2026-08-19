import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Undo,
  Redo,
  Eraser,
  Link as LinkIcon,
  Unlink,
  Palette,
  Highlighter,
  ChevronDown
} from 'lucide-react';
import { convertPlainTextToHtml } from '../lib/richTextUtils';

const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

export interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

const COMMON_EMOJIS = ['😊', '⭐', '🎨', '🎵', '⚽', '📚', '🧩', '🌱', '☀️', '❤️', '👏', '✏️'];

const TEXT_COLORS = [
  { label: 'Padrão', value: '' },
  { label: 'Escuro', value: '#1e293b' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Roxo', value: '#9333ea' },
  { label: 'Laranja', value: '#ea580c' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Sem destaque', value: '' },
  { label: 'Amarelo', value: '#fef08a' },
  { label: 'Verde', value: '#bbf7d0' },
  { label: 'Azul', value: '#bfdbfe' },
  { label: 'Rosa', value: '#fbcfe8' },
  { label: 'Laranja', value: '#fed7aa' },
];

const FONT_SIZES = [
  { label: 'Normal', value: '' },
  { label: 'Pequena (12px)', value: '12px' },
  { label: 'Média (14px)', value: '14px' },
  { label: 'Grande (16px)', value: '16px' },
  { label: 'Título P (18px)', value: '18px' },
  { label: 'Título M (20px)', value: '20px' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Digite aqui...',
  rows = 3,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      CustomTextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
    ],
    content: convertPlainTextToHtml(value || ''),
    editorProps: {
      attributes: {
        class: `p-3 outline-none text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-sans min-h-[${
          rows * 24
        }px]`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
  });

  // Sync value when modified externally (e.g. preset selection, clear, AI content)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const targetHtml = convertPlainTextToHtml(value || '');

    if (value === '' && currentHtml !== '<p></p>') {
      editor.commands.setContent('', { emitUpdate: false });
      return;
    }

    if (!editor.isFocused && currentHtml !== targetHtml && currentHtml !== value) {
      editor.commands.setContent(targetHtml, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Insira a URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: val }).run();
    }
  };

  return (
    <div className="space-y-1.5" id={`rich-editor-wrapper-${label?.toLowerCase().replace(/\s+/g, '-') || 'default'}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-xs">
        {/* Compact Word-like Formatting Toolbar */}
        <div className="flex items-center flex-wrap gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs select-none">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Negrito"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Itálico"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Sublinhado"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          {/* Strike */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('strike')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Font Size Select */}
          <select
            onChange={handleFontSizeChange}
            value={editor.getAttributes('textStyle').fontSize || ''}
            className="h-7 px-1.5 text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded focus:outline-none"
            title="Tamanho da fonte"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>

          {/* Text Color Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-0.5"
              title="Cor do texto"
            >
              <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Cor do texto
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value || 'default'}
                      type="button"
                      onClick={() => {
                        if (!c.value) {
                          editor.chain().focus().unsetColor().run();
                        } else {
                          editor.chain().focus().setColor(c.value).run();
                        }
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-[10px] hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value || '#000000' }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-0.5"
              title="Cor de destaque (Marca-texto)"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Destaque
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.value || 'none'}
                      type="button"
                      onClick={() => {
                        if (!h.value) {
                          editor.chain().focus().unsetHighlight().run();
                        } else {
                          editor.chain().focus().setHighlight({ color: h.value }).run();
                        }
                        setShowHighlightPicker(false);
                      }}
                      className="h-6 rounded border border-slate-300 flex items-center justify-center text-[9px] hover:scale-105 transition-transform"
                      style={{ backgroundColor: h.value || '#ffffff' }}
                      title={h.label}
                    >
                      {!h.value ? '❌' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Align Left */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Align Center */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Centralizar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          {/* Align Right */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Alinhar à direita"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Lista com marcadores"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Lista numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Blockquote / Recuo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Citação / Recuo"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={handleSetLink}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Inserir / Editar Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded hover:bg-red-100 text-red-600 dark:hover:bg-red-950/40"
              title="Remover Link"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
            title="Desfazer"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
            title="Refazer"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded hover:bg-amber-100 text-amber-700 dark:hover:bg-amber-950/40"
            title="Limpar formatação"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {/* Emojis Palette */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[160px] sm:max-w-none ml-auto">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => editor.chain().focus().insertContent(emoji).run()}
                className="hover:scale-125 transition-transform text-xs p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="relative cursor-text">
          <EditorContent editor={editor} />
          {editor.isEmpty && placeholder && (
            <div className="absolute top-3 left-3 text-slate-400 dark:text-slate-500 text-sm pointer-events-none italic">
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
